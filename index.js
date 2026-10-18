import { spawn } from 'node:child_process'
import { appendFileSync, existsSync, readFileSync, statSync, truncateSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

export const name = 'desktop-notify'
export const inject = ['webServer']

const SCRIPT = fileURLToPath(new URL('./notify.ps1', import.meta.url))
const SETTINGS_FILE = fileURLToPath(new URL('./settings.json', import.meta.url))
const LOG = fileURLToPath(new URL('./notify-debug.log', import.meta.url))
const CLICK_LOG = fileURLToPath(new URL('./notify-click.log', import.meta.url))
const ROUTE = '/dsh-desktop-notify/api/config'
const BUILD = 14

const DEFAULTS = {
  accent: '#1f6beb',
  background: '#202020',
  text: '#ffffff',
  width: 400,
  durationMs: 20000,
  sound: true,
  corner: 'br',
  marginX: 16,
  marginY: 16,
  opacity: 0.97,
}

function log(event) {
  try {
    const line = JSON.stringify({ t: new Date().toISOString(), ...event }) + '\n'
    try {
      if (statSync(LOG).size > 256 * 1024) truncateSync(LOG)
    } catch {
      // first write
    }
    appendFileSync(LOG, line)
  } catch {
    // never break the host
  }
}

function clamp(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function color(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback
}

function sanitize(input, base) {
  const source = input && typeof input === 'object' ? input : {}
  const next = { ...base }
  next.accent = color(source.accent, base.accent)
  next.background = color(source.background, base.background)
  next.text = color(source.text, base.text)
  next.width = clamp(source.width, 240, 720, base.width)
  next.durationMs = clamp(source.durationMs, 3000, 120000, base.durationMs)
  next.marginX = clamp(source.marginX, 0, 400, base.marginX)
  next.marginY = clamp(source.marginY, 0, 400, base.marginY)
  next.opacity = clamp(source.opacity, 0.5, 1, base.opacity)
  next.sound = source.sound === undefined ? base.sound : Boolean(source.sound)
  next.corner = ['br', 'bl', 'tr', 'tl'].includes(source.corner) ? source.corner : base.corner
  return next
}

function loadSettings(config) {
  let stored = {}
  try {
    if (existsSync(SETTINGS_FILE)) stored = JSON.parse(readFileSync(SETTINGS_FILE, 'utf8'))
  } catch {
    stored = {}
  }
  return sanitize({ ...config, ...stored }, { ...DEFAULTS })
}

function saveSettings(settings) {
  try {
    writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2) + '\n')
  } catch (error) {
    log({ evt: 'save-error', message: String(error) })
  }
}

function sessionTitleOf(context, agent) {
  try {
    const id = agent?.id
    if (!id) return ''
    const sessions = context.get('sessions')
    const titles = context.get('sessionTitle')
    if (!sessions || !titles) {
      log({ evt: 'title-miss', reason: !sessions ? 'no-sessions' : 'no-session-title', id })
      return ''
    }
    const session = sessions.get(id)
    if (!session) {
      log({ evt: 'title-miss', reason: 'no-session', id })
      return ''
    }
    const title = titles.get(session)?.title
    if (typeof title !== 'string') {
      log({ evt: 'title-miss', reason: 'no-snapshot', id })
      return ''
    }
    const text = title.replace(/\s+/g, ' ').trim()
    if (!text) {
      log({ evt: 'title-miss', reason: 'empty', id })
      return ''
    }
    return text.length > 60 ? text.slice(0, 59) + '…' : text
  } catch (error) {
    log({ evt: 'session-title-error', message: String(error) })
    return ''
  }
}

function showCard(settings, key, title, body, agentId, sessionTitle) {
  const detail = sessionTitle ? '会话：' + sessionTitle + '\n' + body : body
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden', '-File', SCRIPT],
    {
      windowsHide: true,
      stdio: 'ignore',
      env: {
        ...process.env,
        DSH_NOTIFY_TITLE: title,
        DSH_NOTIFY_BODY: detail,
        DSH_NOTIFY_MS: String(settings.durationMs),
        DSH_NOTIFY_LOG: CLICK_LOG,
        DSH_NOTIFY_ACCENT: settings.accent,
        DSH_NOTIFY_BG: settings.background,
        DSH_NOTIFY_TEXT: settings.text,
        DSH_NOTIFY_WIDTH: String(settings.width),
        DSH_NOTIFY_CORNER: settings.corner,
        DSH_NOTIFY_MX: String(settings.marginX),
        DSH_NOTIFY_MY: String(settings.marginY),
        DSH_NOTIFY_OPACITY: String(settings.opacity),
        DSH_NOTIFY_SOUND: settings.sound ? '1' : '0',
      },
    },
  )
  child.on('error', (error) => log({ evt: 'spawn-error', message: String(error) }))
  child.on('exit', (code) => log({ evt: 'exit', key, code }))
  child.unref()
  log({ evt: 'shown', key, agentId, sessionTitle: sessionTitle || undefined })
}

const WATCHER_KEY = Symbol.for('dsh-desktop-notify.approval-watcher')

// Approvals must stay notifiable while this plugin itself is uninstalled during
// an update: the install step asks for escalation only after remove_bundle has
// unloaded this fiber. Register the audit listener on the root context, so it
// lives for the whole Host process; a later apply only refreshes its config.
function ensureApprovalWatcher(ctx, config) {
  const existing = globalThis[WATCHER_KEY]
  if (existing) {
    existing.config = config
    return
  }
  const root = ctx.root ?? ctx
  const watcher = { config, recentAt: 0 }
  globalThis[WATCHER_KEY] = watcher
  root.on('session/event', (session, event) => {
    try {
      if (!watcher.config?.onApproval || event?.type !== 'approval/asked') return
      if (root.get('approval')?.overrideOf?.(session) === 'never') return
      const now = Date.now()
      if (now - watcher.recentAt < 1500) return
      watcher.recentAt = now
      const tool = typeof event.data?.toolName === 'string' ? event.data.toolName : ''
      const agentId = session?.id
      const sessionTitle = sessionTitleOf(root, { id: agentId })
      log({ evt: 'approval-asked', agentId, tool })
      showCard(
        loadSettings(watcher.config),
        'approval',
        'DSH · 需要你确认',
        tool ? `「${tool}」在等授权。` : '有个操作在等授权。',
        agentId,
        sessionTitle,
      )
    } catch (error) {
      log({ evt: 'approval-error', message: String(error) })
    }
  })
}

export function apply(ctx, rawConfig = {}) {
  const config = {
    onTurnEnd: true,
    onQuestion: true,
    onApproval: true,
    onError: true,
    onStartup: false,
    ...rawConfig,
  }
  let settings = loadSettings(config)

  let recentKey = ''
  let recentAt = 0

  // A settings preview has no agent of its own, so pick the newest live root
  // session that already has a title; fall back to the first live root.
  function pickPreviewAgent() {
    try {
      const roots = ctx.get('agents')?.roots?.()
      const sessions = ctx.get('sessions')
      const titles = ctx.get('sessionTitle')
      if (!Array.isArray(roots) || roots.length === 0) return undefined
      if (sessions?.list && titles?.get) {
        const rootIds = new Set(roots.map((root) => root?.id).filter(Boolean))
        const live = sessions.list().filter((session) => rootIds.has(session.id))
        for (let index = live.length - 1; index >= 0; index -= 1) {
          if (titles.get(live[index])?.title) return { id: live[index].id }
        }
      }
      return roots[0]
    } catch (error) {
      log({ evt: 'preview-agent-error', message: String(error) })
      return undefined
    }
  }

  function show(key, title, body, agent, activeSettings = settings) {
    const now = Date.now()
    if (key === recentKey && now - recentAt < 1500) return
    recentKey = key
    recentAt = now
    try {
      showCard(activeSettings, key, title, body, agent?.id, sessionTitleOf(ctx, agent))
    } catch (error) {
      log({ evt: 'show-error', message: String(error) })
    }
  }

  function isRootAgent(agent) {
    try {
      const roots = ctx.get('agents')?.roots?.()
      if (Array.isArray(roots)) {
        const id = agent?.id
        return Boolean(id) && roots.some((root) => root?.id === id)
      }
    } catch {
      // fall through
    }
    return true
  }

  ctx.on('agent/status', (payload) => {
    try {
      if (payload?.status !== 'idle' || !config.onTurnEnd || !isRootAgent(payload?.agent)) return
      show('idle', 'DSH · 本轮完成', '会话已空闲，切回去看看。', payload.agent)
    } catch {
      // ignore
    }
  })

  ctx.on('agent/error', (payload) => {
    try {
      if (!config.onError || !isRootAgent(payload?.agent)) return
      show('error', 'DSH · 出错了', '有一个 agent 步骤失败。', payload.agent)
    } catch {
      // ignore
    }
  })

  // The Web question answerer is a terminal waterfall listener. Registered in
  // normal order this plugin would never run, so prepend and delegate with next().
  ctx.on(
    'user-questions/request',
    async (request, next) => {
      try {
        if (config.onQuestion) show('question', 'DSH · 需要你回答', '有个问题在等你。', request?.agent)
      } catch {
        // ignore
      }
      return typeof next === 'function' ? next() : undefined
    },
    { prepend: true },
  )

  // Approvals are observed by a process-lifetime watcher (see
  // ensureApprovalWatcher): it must survive this plugin's own remove/install
  // window, which is exactly when the second escalation prompt arrives.
  ensureApprovalWatcher(ctx, config)

  try {
    ctx.effect(() => ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler: async (req, res) => {
        const headers = {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'x-dsh-notify-build': String(BUILD),
        }
        try {
          if (req.method === 'GET') {
            res.writeHead(200, headers)
            res.end(JSON.stringify(settings))
            return
          }
          if (req.method === 'POST') {
            let raw = ''
            for await (const chunk of req) raw += chunk
            let body = {}
            try {
              body = JSON.parse(raw || '{}')
            } catch {
              body = {}
            }
            if (body.action === 'test') {
              const agent = pickPreviewAgent()
              const preview = sanitize(body.settings, settings)
              log({ evt: 'test-preview', settings: preview })
              show('test', 'DSH · 测试通知', '这是当前设置的效果预览。', agent, preview)
              res.writeHead(200, headers)
              res.end(JSON.stringify({ ok: true }))
              return
            }
            settings = sanitize(body.settings, settings)
            saveSettings(settings)
            log({ evt: 'settings-saved', settings })
            res.writeHead(200, headers)
            res.end(JSON.stringify(settings))
            return
          }
          res.writeHead(405, headers)
          res.end(JSON.stringify({ error: 'method' }))
        } catch (error) {
          log({ evt: 'route-error', message: String(error) })
          res.writeHead(500, headers)
          res.end(JSON.stringify({ error: 'internal' }))
        }
      },
    }))
  } catch (error) {
    log({ evt: 'route-register-error', message: String(error) })
  }

  log({ evt: 'apply', version: 5, build: BUILD, route: ROUTE })
  if (config.onStartup) show('startup', 'DSH · 通知已就绪', '插件已加载，点击可以切回会话。')
}
