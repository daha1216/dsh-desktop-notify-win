import {
  BUILD,
  DEFAULTS,
  EVENTS,
  FONTS,
  LIMITS,
  PRESETS,
  SEMANTIC_ACCENTS,
  VERSION,
  sanitize,
} from './lib/schema.js'
import { resolvePaths } from './lib/paths.js'
import { SettingsStore } from './lib/config.js'
import { HistoryStore } from './lib/history.js'
import { createLogger, serializeError } from './lib/log.js'
import { getRendererHost, resetRendererHost } from './lib/renderer-host.js'
import { NotificationService } from './lib/service.js'

export const name = 'desktop-notify'
export const inject = ['webServer', 'connection']

const API_PREFIX = '/dsh-desktop-notify/api'
const MAX_BODY = 64 * 1024
const WATCHER_KEY = Symbol.for('dsh-desktop-notify.approval-watcher')

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-dsh-notify-build': String(BUILD),
  })
  res.end(JSON.stringify(payload))
}

function rejectionOf(ctx, req) {
  const connection = ctx.get('connection')
  if (connection && typeof connection.requestRejection === 'function') {
    return connection.requestRejection(req)
  }
  return 401
}

async function readBody(req) {
  let size = 0
  const chunks = []
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY) throw new Error('body-too-large')
    chunks.push(chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  const parsed = JSON.parse(raw)
  return parsed && typeof parsed === 'object' ? parsed : {}
}

function sessionTitleOf(ctx, agent) {
  try {
    const id = agent?.id
    if (!id) return ''
    const sessions = ctx.get('sessions')
    const titles = ctx.get('sessionTitle')
    if (!sessions || !titles) return ''
    const session = sessions.get(id)
    if (!session) return ''
    const title = titles.get(session)?.title
    if (typeof title !== 'string') return ''
    const text = title.replace(/\s+/g, ' ').trim()
    return text.length > 120 ? text.slice(0, 119) + '…' : text
  } catch (error) {
    return ''
  }
}

function withTitle(ctx, agent) {
  return { id: agent?.id, sessionTitle: sessionTitleOf(ctx, agent) }
}

function isRootAgent(ctx, agent) {
  try {
    const roots = ctx.get('agents')?.roots?.()
    if (Array.isArray(roots)) {
      const id = agent?.id
      return Boolean(id) && roots.some((root) => root?.id === id)
    }
  } catch {
    // Fall through to permissive behaviour when the agent registry is absent.
  }
  return true
}

function errorMessage(payload) {
  const value = payload?.error?.message ?? payload?.message ?? payload?.error
  if (typeof value !== 'string') return ''
  const text = value.replace(/\s+/g, ' ').trim()
  return text.length > 160 ? text.slice(0, 159) + '…' : text
}

// A plugin reload removes this fiber and can happen while an approval prompt is
// still pending. Keep the audit listener on the root context for the lifetime of
// the Host process; apply() only refreshes the dispatch target and its settings.
function ensureApprovalWatcher(root) {
  const existing = globalThis[WATCHER_KEY]
  if (existing) {
    existing.root = root
    return existing
  }
  const watcher = { root, dispatch: null, recentAt: 0 }
  globalThis[WATCHER_KEY] = watcher
  root.on('session/event', (session, event) => {
    try {
      if (!watcher.dispatch) return
      if (event?.type !== 'approval/asked') return
      const now = Date.now()
      if (now - watcher.recentAt < 1500) return
      watcher.recentAt = now
      const toolName = event?.data?.toolName ?? event?.toolName
      const tool = typeof toolName === 'string' ? toolName : ''
      watcher.dispatch({
        id: session?.id,
        sessionTitle: sessionTitleOf(watcher.root, session),
        tool: tool.slice(0, 80),
      })
    } catch {
      // A notification failure must never affect the approval itself.
    }
  })
  return watcher
}

export function apply(ctx, rawConfig = {}) {
  const paths = resolvePaths(process.env)
  const log = createLogger(paths.log)
  const store = new SettingsStore({ paths, log })
  let settings = store.load(rawConfig)
  const history = new HistoryStore(paths.history)
  const host = getRendererHost({ log, clickLog: paths.clickLog })

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
          if (titles.get(live[index])?.title) {
            return { id: live[index].id, sessionTitle: sessionTitleOf(ctx, live[index]) }
          }
        }
      }
      return withTitle(ctx, roots[0])
    } catch (error) {
      log({ evt: 'preview-agent-error', message: serializeError(error) })
      return undefined
    }
  }

  const service = new NotificationService({
    settings,
    host,
    history,
    log,
    previewAgent: pickPreviewAgent,
  })

  function applySettings(input) {
    const next = store.save(input)
    settings = next
    service.updateSettings(next)
    return next
  }

  ctx.on('agent/status', (payload) => {
    try {
      if (payload?.status !== 'idle') return
      if (!isRootAgent(ctx, payload?.agent)) return
      service.scheduleTurnEnd(withTitle(ctx, payload.agent))
    } catch (error) {
      log({ evt: 'status-error', message: serializeError(error) })
    }
  })

  ctx.on('agent/error', (payload) => {
    try {
      if (!isRootAgent(ctx, payload?.agent)) return
      service.notify('error', { agent: withTitle(ctx, payload.agent), message: errorMessage(payload) || undefined })
    } catch (error) {
      log({ evt: 'error-event', message: serializeError(error) })
    }
  })

  // The Web answerer is a terminal waterfall listener, so prepend and delegate.
  ctx.on(
    'user-questions/request',
    async (request, next) => {
      try {
        service.notify('question', { agent: withTitle(ctx, request?.agent) })
      } catch (error) {
        log({ evt: 'question-error', message: serializeError(error) })
      }
      return typeof next === 'function' ? next() : undefined
    },
    { prepend: true },
  )

  const watcher = ensureApprovalWatcher(ctx.root ?? ctx)
  watcher.dispatch = (info) => {
    service.notify('approval', {
      agent: { id: info.id, sessionTitle: info.sessionTitle },
      message: info.tool ? '工具「' + info.tool + '」在等授权。' : undefined,
    })
  }

  const routeEffect = ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_PREFIX,
    handler: async (req, res) => {
      const rejection = rejectionOf(ctx, req)
      if (rejection !== undefined) {
        sendJson(res, rejection, { error: 'unauthorized' })
        return
      }
      const pathname = new URL(String(req.url), 'http://localhost').pathname
      const route = pathname.slice(API_PREFIX.length).replace(/\/+$/, '') || '/'

      try {
        if (route === '/meta' && req.method === 'GET') {
          sendJson(res, 200, {
            version: VERSION,
            build: BUILD,
            defaults: DEFAULTS,
            limits: LIMITS,
            presets: PRESETS,
            events: EVENTS,
            fonts: FONTS,
            semanticAccents: SEMANTIC_ACCENTS,
          })
          return
        }
        if ((route === '/' || route === '/config') && req.method === 'GET') {
          sendJson(res, 200, {
            version: VERSION,
            build: BUILD,
            settings,
            history: history.list(),
            loadedFrom: store.loadedFrom,
            dataDir: paths.dataDir,
          })
          return
        }
        if (route === '/history' && req.method === 'GET') {
          sendJson(res, 200, { history: history.list() })
          return
        }
        if (route === '/config' && req.method === 'POST') {
          const body = await readBody(req)
          if (body.action === 'save') {
            const next = applySettings(body.settings)
            log({ evt: 'settings-saved', layout: next.layout, dataDir: paths.dataDir })
            sendJson(res, 200, { ok: true, settings: next })
            return
          }
          if (body.action === 'test') {
            const preview = sanitize(body.settings, settings)
            service.preview(preview)
            sendJson(res, 200, { ok: true })
            return
          }
          if (body.action === 'replay') {
            const entry = service.replay(String(body.id || ''))
            sendJson(res, entry ? 200 : 404, entry ? { ok: true } : { error: 'not-found' })
            return
          }
          if (body.action === 'clear') {
            history.clear()
            sendJson(res, 200, { ok: true })
            return
          }
          sendJson(res, 400, { error: 'unknown-action' })
          return
        }
        sendJson(res, 404, { error: 'not-found' })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        log({ evt: 'route-error', route, message: serializeError(error) })
        sendJson(res, message === 'body-too-large' ? 413 : 500, {
          error: message === 'body-too-large' ? 'body-too-large' : 'internal',
          message,
        })
      }
    },
  }))

  const startupTimer = settings.onStartup
    ? setTimeout(() => service.notify('startup'), 800)
    : undefined
  if (startupTimer && startupTimer.unref) startupTimer.unref()

  ctx.effect(() => () => {
    if (startupTimer) clearTimeout(startupTimer)
    watcher.dispatch = null
    service.dispose()
    resetRendererHost()
  })

  log({
    evt: 'apply',
    version: VERSION,
    build: BUILD,
    layout: settings.layout,
    loadedFrom: store.loadedFrom,
    dataDir: paths.dataDir,
  })
}