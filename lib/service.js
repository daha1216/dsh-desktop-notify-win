import { accentForEvent, eventEnabled, isQuietHours } from './schema.js'
import { serializeError } from './log.js'

const EVENT_TEXT = {
  turnEnd: { label: '本轮完成', body: '会话已空闲，切回去看看。', status: '本轮完成 · 切回继续' },
  question: { label: '需要回答', body: 'Agent 在等你的回答。', status: '等待你的回答' },
  approval: { label: '需要确认', body: '有一个工具调用等你确认。', status: '等待你的确认' },
  error: { label: '执行出错', body: '有一个 agent 步骤失败了。', status: '执行出错' },
  startup: { label: '已就绪', body: '桌面通知已经接管。', status: '已就绪' },
  test: { label: '测试通知', body: '这是当前设置的效果预览。', status: '测试通知' },
  replay: { label: '历史重播', body: '这是历史记录里的一条通知。', status: '历史重播' },
}

const SUPPRESS_TEXT = {
  disabled: '事件已关闭',
  quiet: '免打扰时段',
  foreground: 'DSH 在前台',
  fullscreen: '全屏或勿扰',
  coalesced: '重复合并',
  replaced: '被新通知替换',
}

function cleanTitle(value, max = 80) {
  if (typeof value !== 'string') return ''
  const line = value
    .replace(/^[\s#>*_-]+/, '')
    .replace(/[*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
  return line.length > max ? line.slice(0, Math.max(1, max - 1)) + '…' : line
}

export class NotificationService {
  constructor(options) {
    this.settings = options.settings
    this.host = options.host
    this.history = options.history
    this.log = options.log || (() => {})
    this.previewAgent = options.previewAgent || (() => undefined)
    this.turnTimers = new Map()
    this.recent = new Map()
    this.counter = 0
  }

  updateSettings(settings) {
    this.settings = settings
  }

  context(agent) {
    const sessionTitle = cleanTitle(agent && agent.sessionTitle ? agent.sessionTitle : '')
    const agentId = agent && agent.id ? String(agent.id) : ''
    return { sessionTitle, agentId }
  }

  compose(event, message, context, settings = this.settings) {
    const meta = EVENT_TEXT[event] || EVENT_TEXT.test
    const body = message && String(message).trim() ? String(message).trim() : meta.body
    const sessionTitle = context && context.sessionTitle ? context.sessionTitle : ''
    if (settings.layout === 'dsh') {
      return {
        title: cleanTitle(sessionTitle || meta.label, 60) || meta.label,
        body,
        status: settings.status || meta.status,
        eyebrow: settings.eyebrow || 'DeepSeek Harness',
      }
    }
    return {
      title: 'DSH · ' + meta.label,
      body: sessionTitle ? '「' + sessionTitle + '」' + body : body,
      status: settings.status || '',
      eyebrow: settings.eyebrow || '',
    }
  }

  record(entry) {
    try {
      return this.history.add(entry)
    } catch (error) {
      this.log({ evt: 'history-error', message: serializeError(error) })
      return entry
    }
  }

  notify(event, options = {}) {
    const settings = options.settings || this.settings
    const context = this.context(options.agent)
    const message = options.message
    const forced = options.force === true

    const composed = this.compose(event, message, context, settings)
    const entryBase = {
      event,
      title: composed.title,
      body: composed.body,
      status: composed.status,
      ...context,
      shown: false,
    }

    if (!forced && !eventEnabled(settings, event)) {
      return this.record({ ...entryBase, suppressed: 'disabled' })
    }
    if (!forced && isQuietHours(settings)) {
      return this.record({ ...entryBase, suppressed: 'quiet' })
    }

    const key = event + ':' + (context.agentId || event)
    const now = Date.now()
    const seen = this.recent.get(key)
    if (!forced && seen && now - seen < 1500) {
      return this.record({ ...entryBase, suppressed: 'coalesced' })
    }
    this.recent.set(key, now)
    const id = 'n' + now.toString(36) + '-' + (++this.counter).toString(36)
    const payload = {
      cmd: 'show',
      id,
      title: composed.title,
      body: composed.body,
      status: composed.status,
      eyebrow: composed.eyebrow,
      layout: settings.layout,
      accent: accentForEvent(settings, event),
      background: settings.background,
      text: settings.text,
      width: settings.width,
      durationMs: settings.durationMs,
      corner: settings.corner,
      marginX: settings.marginX,
      marginY: settings.marginY,
      opacity: settings.opacity,
      sound: settings.sound,
      radius: settings.radius,
      padX: settings.padX,
      padY: settings.padY,
      accentWidth: settings.accentWidth,
      titleSize: settings.titleSize,
      bodySize: settings.bodySize,
      progress: settings.progress,
      icon: settings.icon,
      fade: settings.fade,
      shadow: settings.shadow,
      shine: settings.shine,
      font: settings.font,
      scale: settings.scale,
      monitor: settings.monitor,
      clickAction: settings.clickAction,
      maxVisible: settings.maxVisible,
      highContrast: settings.highContrast,
      reduceMotion: settings.reduceMotion,
      suppressForeground: forced ? false : settings.suppressForeground,
      suppressFullscreen: forced ? false : settings.suppressFullscreen,
      respectFocusAssist: forced ? false : settings.respectFocusAssist,
    }

    const entry = this.record({
      id,
      event,
      title: composed.title,
      body: composed.body,
      status: composed.status,
      agentId: context.agentId,
      sessionTitle: context.sessionTitle,
      shown: true,
      suppressed: null,
    })

    Promise.resolve()
      .then(() => this.host.show(payload))
      .then((result) => {
        if (result && result.shown) {
          this.log({ evt: 'notified', id, event, mode: result.mode, layout: settings.layout })
          return
        }
        const reason = result && result.reason ? result.reason : 'failed'
        this.history.update(id, { shown: false, suppressed: reason })
        this.log({ evt: 'notify-skipped', id, event, reason })
      })
      .catch((error) => {
        this.history.update(id, { shown: false, suppressed: 'error' })
        this.log({ evt: 'notify-error', id, event, message: serializeError(error) })
      })
    return entry
  }

  scheduleTurnEnd(agent) {
    const context = this.context(agent)
    const key = context.agentId || 'root'
    const previous = this.turnTimers.get(key)
    if (previous) clearTimeout(previous.timer)
    const timer = setTimeout(() => {
      this.turnTimers.delete(key)
      this.notify('turnEnd', { agent, message: undefined })
    }, 250)
    if (timer.unref) timer.unref()
    this.turnTimers.set(key, { timer, context })
  }

  preview(settings) {
    const agent = this.previewAgent()
    return this.notify('test', { agent, force: true, settings })
  }

  test() {
    return this.preview(this.settings)
  }

  replay(id) {
    const entry = this.history.get(id)
    if (!entry) return undefined
    const agent = { id: entry.agentId || 'replay', sessionTitle: entry.sessionTitle }
    return this.notify(entry.event === 'test' ? 'test' : 'replay', {
      agent,
      message: entry.body || undefined,
      force: true,
    })
  }

  dispose() {
    for (const item of this.turnTimers.values()) clearTimeout(item.timer)
    this.turnTimers.clear()
  }

  describeSuppressed(reason) {
    return SUPPRESS_TEXT[reason] || reason
  }
}

export { EVENT_TEXT, SUPPRESS_TEXT, cleanTitle }