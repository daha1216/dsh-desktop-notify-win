import { spawn } from 'node:child_process'
import { StringDecoder } from 'node:string_decoder'
import { fileURLToPath } from 'node:url'
import { serializeError } from './log.js'

const SCRIPT = fileURLToPath(new URL('../notify.ps1', import.meta.url))
const HOST_KEY = Symbol.for('dsh-desktop-notify.renderer-host')
const READY_TIMEOUT = 15000
const SHOW_TIMEOUT = 12000
const MAX_RESTARTS = 2

export class RendererHost {
  constructor(options = {}) {
    this.log = options.log || (() => {})
    this.script = options.script || SCRIPT
    this.spawnImpl = options.spawnImpl || spawn
    this.platform = options.platform || process.platform
    this.child = null
    this.buffer = ''
    this.decoder = new StringDecoder('utf8')
    this.pending = new Map()
    this.readyPromise = null
    this.restarts = 0
    this.shows = 0
    this.available = true
    this.onEvent = options.onEvent || (() => {})
    this.clickLog = options.clickLog || ''
  }

  get running() {
    return Boolean(this.child && this.child.stdin && !this.child.stdin.destroyed)
  }

  ensure() {
    if (this.platform !== 'win32') return Promise.reject(new Error('windows only'))
    if (!this.available) return Promise.reject(new Error('renderer host unavailable'))
    if (this.running) return this.readyPromise || Promise.resolve()
    if (this.readyPromise) return this.readyPromise
    if (this.restarts > MAX_RESTARTS) {
      this.available = false
      return Promise.reject(new Error('renderer host unavailable'))
    }
    this.restarts += 1
    this.readyPromise = new Promise((resolve, reject) => {
      let settled = false
      let child
      try {
        child = this.spawnImpl('powershell.exe', [
          '-NoProfile',
          '-NonInteractive',
          '-ExecutionPolicy', 'Bypass',
          '-WindowStyle', 'Hidden',
          '-File', this.script,
          '-Serve',
        ], {
          env: this.clickLog ? { ...process.env, DSH_NOTIFY_LOG: this.clickLog } : process.env,
          stdio: ['pipe', 'pipe', 'pipe'],
          windowsHide: true,
        })
      } catch (error) {
        this.readyPromise = null
        reject(error)
        return
      }
      this.child = child
      const timer = setTimeout(() => {
        if (settled) return
        settled = true
        this.log({ evt: 'host-ready-timeout' })
        try { child.kill() } catch {}
        this.child = null
        this.readyPromise = null
        reject(new Error('renderer host ready timeout'))
      }, READY_TIMEOUT)

      child.stdout.on('data', (chunk) => this.consume(chunk))
      child.stderr.on('data', (chunk) => {
        const text = String(chunk).trim()
        if (text) this.log({ evt: 'host-stderr', text: text.slice(0, 500) })
      })
      child.on('error', (error) => {
        this.log({ evt: 'host-error', message: serializeError(error) })
        if (!settled) {
          settled = true
          clearTimeout(timer)
          this.readyPromise = null
          reject(error)
        }
        this.failPending('host-error')
      })
      child.on('exit', (code, signal) => {
        if (!settled) {
          settled = true
          clearTimeout(timer)
          this.readyPromise = null
          reject(new Error('renderer host exited ' + code + ' ' + signal))
        }
        this.log({ evt: 'host-exit', code, signal })
        this.child = null
        this.readyPromise = null
        this.failPending('host-exit')
      })
      this.once = { resolve, reject, timer, settled: () => settled, mark: () => { settled = true; clearTimeout(timer) } }
    })
    return this.readyPromise
  }

  handle(message) {
    if (!message || typeof message !== 'object') return
    const event = message.evt
    if (event === 'ready') {
      if (this.once && !this.once.settled()) {
        this.once.mark()
        this.once.resolve()
      }
      this.once = null
      this.restarts = 0
      this.log({ evt: 'host-ready', pid: this.child && this.child.pid })
      return
    }
    if (event === 'shown' || event === 'skipped' || event === 'error') {
      const item = this.pending.get(message.id)
      if (item) {
        this.pending.delete(message.id)
        clearTimeout(item.timer)
        item.resolve({
          ok: event === 'shown',
          shown: event === 'shown',
          skipped: event === 'skipped',
          reason: message.reason || (event === 'error' ? 'error' : ''),
          message: message.message,
          mode: 'host',
        })
      }
    }
    if (event === 'dismissed' || event === 'clicked' || event === 'shown' || event === 'skipped') {
      try { this.onEvent(message) } catch {}
    }
    if (event === 'bye') this.log({ evt: 'host-bye' })
  }

  consume(chunk) {
    this.buffer += typeof chunk === 'string' ? chunk : this.decoder.write(chunk)
    if (this.buffer.length > 65536) this.buffer = this.buffer.slice(-32768)
    let index = this.buffer.indexOf('\n')
    while (index !== -1) {
      const line = this.buffer.slice(0, index).trim()
      this.buffer = this.buffer.slice(index + 1)
      if (line) {
        try {
          this.handle(JSON.parse(line))
        } catch {
          this.log({ evt: 'host-noise', line: line.slice(0, 200) })
        }
      }
      index = this.buffer.indexOf('\n')
    }
  }

  send(payload) {
    return this.ensure().then(() => new Promise((resolve, reject) => {
      const child = this.child
      if (!child || !child.stdin || child.stdin.destroyed) {
        reject(new Error('renderer host is not writable'))
        return
      }
      const id = String(payload.id || '')
      const timer = setTimeout(() => {
        this.pending.delete(id)
        resolve({ ok: false, shown: false, reason: 'timeout', mode: 'host' })
      }, Number(payload.timeoutMs) > 0 ? Number(payload.timeoutMs) : SHOW_TIMEOUT)
      if (id) this.pending.set(id, { resolve, reject, timer })
      try {
        child.stdin.write(JSON.stringify(payload) + '\n')
      } catch (error) {
        clearTimeout(timer)
        this.pending.delete(id)
        reject(error)
        return
      }
      if (!id) {
        clearTimeout(timer)
        resolve({ ok: true, mode: 'host' })
      }
    }))
  }

  show(payload) {
    if (this.platform !== 'win32') {
      return Promise.resolve({ ok: false, shown: false, reason: 'unsupported-platform' })
    }
    this.shows += 1
    return this.send(payload).catch((error) => {
      this.log({ evt: 'host-show-failed', message: serializeError(error) })
      return this.showOneShot(payload, error)
    })
  }

  showOneShot(payload, cause) {
    try {
      const env = { ...process.env }
      const mapping = {
        TITLE: payload.title,
        BODY: payload.body,
        STATUS: payload.status,
        EYEBROW: payload.eyebrow,
        LAYOUT: payload.layout,
        ACCENT: payload.accent,
        BG: payload.background,
        TEXT: payload.text,
        WIDTH: payload.width,
        DURATION: payload.durationMs,
        MS: payload.durationMs,
        CORNER: payload.corner,
        MONITOR: payload.monitor,
        MX: payload.marginX,
        MY: payload.marginY,
        OPACITY: payload.opacity,
        SOUND: payload.sound ? '1' : '0',
        RADIUS: payload.radius,
        PADX: payload.padX,
        PADY: payload.padY,
        ACCENT_W: payload.accentWidth,
        TITLE_SIZE: payload.titleSize,
        BODY_SIZE: payload.bodySize,
        PROGRESS: payload.progress ? '1' : '0',
        ICON: payload.icon ? '1' : '0',
        FADE: payload.fade ? '1' : '0',
        SHADOW: payload.shadow,
        SHINE: payload.shine,
        FONT: payload.font,
        SCALE: payload.scale,
        CLICK_LOG: payload.clickLog || this.clickLog,
        LOG: payload.logFile || this.clickLog,
        HIGH_CONTRAST: payload.highContrast ? '1' : '0',
        REDUCE_MOTION: payload.reduceMotion ? '1' : '0',
        CLICK_ACTION: payload.clickAction,
      }
      for (const [key, value] of Object.entries(mapping)) {
        if (value === undefined || value === null || value === '') continue
        env['DSH_NOTIFY_' + key] = String(value)
      }
      const child = this.spawnImpl('powershell.exe', [
        '-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', this.script,
      ], { env, stdio: 'ignore', windowsHide: true })
      child.unref()
      this.log({ evt: 'host-oneshot', cause: cause ? serializeError(cause) : '' })
      return Promise.resolve({ ok: true, shown: true, mode: 'oneshot' })
    } catch (error) {
      this.log({ evt: 'host-oneshot-failed', message: serializeError(error) })
      return Promise.resolve({ ok: false, shown: false, reason: 'spawn-failed' })
    }
  }

  failPending(reason) {
    for (const [id, item] of this.pending) {
      clearTimeout(item.timer)
      item.resolve({ ok: false, shown: false, reason, mode: 'host' })
      this.pending.delete(id)
    }
  }

  dispose() {
    const child = this.child
    this.child = null
    this.readyPromise = null
    this.failPending('disposed')
    if (!child) return
    try {
      if (child.stdin && !child.stdin.destroyed) {
        child.stdin.write(JSON.stringify({ cmd: 'quit' }) + '\n')
        child.stdin.end()
      }
    } catch {}
    setTimeout(() => {
      try { child.kill() } catch {}
    }, 800).unref?.()
  }
}

export function getRendererHost(options) {
  const existing = globalThis[HOST_KEY]
  if (existing) return existing
  const host = new RendererHost(options)
  globalThis[HOST_KEY] = host
  return host
}

export function resetRendererHost() {
  const existing = globalThis[HOST_KEY]
  if (!existing) return
  try { existing.dispose() } catch {}
  delete globalThis[HOST_KEY]
}

export { SCRIPT as rendererScript }