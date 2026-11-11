export const VERSION = '0.5.0'
export const BUILD = 20

export const DEFAULTS = {
  // 事件开关
  onTurnEnd: true,
  onQuestion: true,
  onApproval: true,
  onError: true,
  onStartup: false,
  // 行为
  quietEnabled: false,
  quietStart: '22:00',
  quietEnd: '08:00',
  suppressForeground: true,
  suppressFullscreen: true,
  respectFocusAssist: true,
  maxVisible: 3,
  monitor: 'cursor',
  clickAction: 'focus',
  // 外观
  layout: 'dsh',
  accent: '#7c8ff0',
  background: '#ffffff',
  text: '#111418',
  width: 620,
  durationMs: 20000,
  sound: false,
  corner: 'br',
  marginX: 16,
  marginY: 16,
  opacity: 1,
  radius: 18,
  padX: 40,
  padY: 20,
  accentWidth: 0,
  titleSize: 15,
  bodySize: 15,
  progress: false,
  icon: true,
  fade: true,
  shadow: 0,
  shine: 0.02,
  font: 'Microsoft YaHei UI',
  status: '',
  eyebrow: '',
  scale: 1,
  // 无障碍与语义
  reduceMotion: false,
  highContrast: false,
  semanticColor: true,
}

export const LIMITS = {
  width: [240, 720, 10],
  durationMs: [3000, 120000, 1000],
  marginX: [0, 400, 1],
  marginY: [0, 400, 1],
  opacity: [0.5, 1, 0.01],
  radius: [0, 28, 1],
  padX: [12, 40, 1],
  padY: [10, 32, 1],
  accentWidth: [0, 14, 1],
  titleSize: [11, 22, 0.5],
  bodySize: [10, 20, 0.5],
  shadow: [0, 1, 0.01],
  shine: [0, 0.3, 0.01],
  scale: [0.5, 1.5, 0.05],
  maxVisible: [1, 5, 1],
}

export const FONTS = [
  { value: 'Microsoft YaHei UI', label: '微软雅黑 UI（默认）' },
  { value: 'Microsoft YaHei', label: '微软雅黑' },
  { value: 'Segoe UI', label: 'Segoe UI' },
  { value: 'DengXian', label: '等线' },
  { value: 'SimSun', label: '宋体' },
]

export const EVENTS = [
  { key: 'onTurnEnd', event: 'turnEnd', label: '本轮完成', desc: '主会话空闲时提醒，可先切去别的窗口' },
  { key: 'onQuestion', event: 'question', label: '需要回答', desc: 'Agent 向你提问时提醒' },
  { key: 'onApproval', event: 'approval', label: '需要授权', desc: '工具调用等你确认时提醒' },
  { key: 'onError', event: 'error', label: '执行出错', desc: 'Agent 步骤失败时提醒' },
  { key: 'onStartup', event: 'startup', label: '插件启动', desc: 'DSH 启动或插件重载后弹一条' },
]

export const SEMANTIC_ACCENTS = {
  turnEnd: '#7c8ff0',
  question: '#d99a2b',
  approval: '#d97b2b',
  error: '#d9534f',
  startup: '#3ba55d',
  test: '#7c8ff0',
  replay: '#7c8ff0',
}

export const PRESETS = [
  {
    id: 'classic',
    name: '经典深色',
    desc: '蓝条深底，默认外观',
    values: {
      accent: '#1f6beb', background: '#202020', text: '#ffffff', opacity: 0.97,
      width: 400, corner: 'br', marginX: 16, marginY: 16, radius: 12,
      padX: 20, padY: 16, accentWidth: 4, titleSize: 15, bodySize: 13,
      shadow: 0.45, shine: 0.05, progress: true, icon: true, fade: true,
      font: 'Microsoft YaHei UI', layout: 'bar',
    },
  },
  {
    id: 'light',
    name: '系统浅色',
    desc: '浅底深字，白天更清爽',
    values: {
      accent: '#1f6beb', background: '#f7f7f8', text: '#1a1a1a', opacity: 0.98,
      width: 400, corner: 'br', marginX: 16, marginY: 16, radius: 12,
      padX: 20, padY: 16, accentWidth: 4, titleSize: 15, bodySize: 13,
      shadow: 0.22, shine: 0.02, progress: true, icon: true, fade: true,
      font: 'Microsoft YaHei UI', layout: 'bar',
    },
  },
  {
    id: 'mono',
    name: '极简灰',
    desc: '低调，不抢注意力',
    values: {
      accent: '#8a8a8a', background: '#2b2b2b', text: '#f2f2f2', opacity: 0.95,
      width: 380, corner: 'br', marginX: 16, marginY: 16, radius: 10,
      padX: 18, padY: 15, accentWidth: 3, titleSize: 14, bodySize: 13,
      shadow: 0.35, shine: 0.03, progress: false, icon: false, fade: true,
      font: 'Microsoft YaHei UI', layout: 'bar',
    },
  },
  {
    id: 'contrast',
    name: '高对比',
    desc: '黑底黄条，强提醒',
    values: {
      accent: '#ffd400', background: '#000000', text: '#ffffff', opacity: 1,
      width: 420, corner: 'br', marginX: 12, marginY: 12, radius: 6,
      padX: 18, padY: 16, accentWidth: 6, titleSize: 16, bodySize: 14,
      shadow: 0.55, shine: 0, progress: true, icon: true, fade: false,
      font: 'Microsoft YaHei UI', layout: 'bar',
    },
  },
  {
    id: 'frost',
    name: '霜白圆角',
    desc: '大圆角浅底，像系统原生',
    values: {
      accent: '#0a84ff', background: '#fbfbfd', text: '#101013', opacity: 0.98,
      width: 420, corner: 'br', marginX: 16, marginY: 16, radius: 18,
      padX: 22, padY: 18, accentWidth: 3, titleSize: 15, bodySize: 13,
      shadow: 0.18, shine: 0.04, progress: true, icon: true, fade: true,
      font: 'Microsoft YaHei UI', layout: 'bar',
    },
  },
  {
    id: 'neon',
    name: '午夜霓虹',
    desc: '紫调深空，投影更重',
    values: {
      accent: '#7c5cff', background: '#0d0d14', text: '#ecebff', opacity: 0.99,
      width: 420, corner: 'br', marginX: 16, marginY: 16, radius: 16,
      padX: 22, padY: 18, accentWidth: 3, titleSize: 16, bodySize: 13,
      shadow: 0.75, shine: 0.1, progress: true, icon: true, fade: true,
      font: 'Microsoft YaHei UI', layout: 'bar',
    },
  },
  {
    id: 'cpamc',
    name: '卡片版式',
    desc: '图标加多行文字，信息量更大',
    values: {
      accent: '#7c8ff0', background: '#ffffff', text: '#111418', opacity: 1,
      width: 528, corner: 'br', marginX: 16, marginY: 16, radius: 18,
      padX: 24, padY: 28, accentWidth: 0, titleSize: 15, bodySize: 13,
      shadow: 0.45, shine: 0.02, progress: false, icon: true, fade: true,
      font: 'Microsoft YaHei UI', layout: 'card',
    },
  },
  {
    id: 'dsh',
    name: 'DSH 白卡',
    desc: '白底大卡，鲸鱼图标加四层文字',
    values: {
      accent: '#b96060', background: '#fdfdfe', text: '#262b35', opacity: 1,
      width: 531, corner: 'br', marginX: 16, marginY: 16, radius: 15,
      padX: 28, padY: 31, accentWidth: 0, titleSize: 15, bodySize: 13,
      shadow: 0.15, shine: 0, progress: false, icon: true, fade: true,
      font: 'Microsoft YaHei UI', layout: 'dsh', durationMs: 20000,
    },
  },
]

const COLOR_KEYS = ['accent', 'background', 'text']

function clamp(value, min, max, fallback) {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.min(max, Math.max(min, number))
}

function color(value, fallback) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback
}

function bool(value, fallback) {
  return value === undefined || value === null ? fallback : Boolean(value)
}

function text(value, fallback, max) {
  if (typeof value !== 'string') return fallback
  const line = value.replace(/\s+/g, ' ').trim()
  if (!line) return ''
  return line.length > max ? line.slice(0, Math.max(1, max - 1)) + '…' : line
}

function clock(value, fallback) {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : fallback
}

function font(value, fallback) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > 64) return fallback
  return /^[A-Za-z0-9 ,-]+$/.test(trimmed) ? trimmed : fallback
}

export function sanitize(input, base = DEFAULTS) {
  const source = input && typeof input === 'object' ? input : {}
  const next = { ...base }
  for (const key of COLOR_KEYS) next[key] = color(source[key], base[key])
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    next[key] = clamp(source[key], min, max, base[key])
  }
  next.width = Math.round(next.width)
  next.marginX = Math.round(next.marginX)
  next.marginY = Math.round(next.marginY)
  next.radius = Math.round(next.radius)
  next.padX = Math.round(next.padX)
  next.padY = Math.round(next.padY)
  next.accentWidth = Math.round(next.accentWidth)
  next.maxVisible = Math.round(next.maxVisible)
  next.durationMs = Math.round(next.durationMs / 1000) * 1000
  next.titleSize = Math.round(next.titleSize * 2) / 2
  next.bodySize = Math.round(next.bodySize * 2) / 2
  next.opacity = Math.round(next.opacity * 100) / 100
  next.shadow = Math.round(next.shadow * 100) / 100
  next.shine = Math.round(next.shine * 100) / 100
  next.scale = Math.round(next.scale * 100) / 100

  for (const event of EVENTS) next[event.key] = bool(source[event.key], base[event.key])
  next.quietEnabled = bool(source.quietEnabled, base.quietEnabled)
  next.quietStart = clock(source.quietStart, base.quietStart)
  next.quietEnd = clock(source.quietEnd, base.quietEnd)
  next.suppressForeground = bool(source.suppressForeground, base.suppressForeground)
  next.suppressFullscreen = bool(source.suppressFullscreen, base.suppressFullscreen)
  next.respectFocusAssist = bool(source.respectFocusAssist, base.respectFocusAssist)
  next.monitor = source.monitor === 'primary' ? 'primary' : 'cursor'
  next.clickAction = source.clickAction === 'none' ? 'none' : 'focus'
  next.layout = source.layout === 'bar' || source.layout === 'card' || source.layout === 'dsh'
    ? source.layout
    : base.layout
  next.progress = bool(source.progress, base.progress)
  next.icon = bool(source.icon, base.icon)
  next.fade = bool(source.fade, base.fade)
  next.sound = bool(source.sound, base.sound)
  next.reduceMotion = bool(source.reduceMotion, base.reduceMotion)
  next.highContrast = bool(source.highContrast, base.highContrast)
  next.semanticColor = bool(source.semanticColor, base.semanticColor)
  next.font = font(source.font, base.font)
  next.status = text(source.status, base.status, 40)
  next.eyebrow = text(source.eyebrow, base.eyebrow, 16)
  return next
}

export function isQuietHours(settings, date = new Date()) {
  if (!settings || settings.quietEnabled !== true) return false
  const start = clock(settings.quietStart, DEFAULTS.quietStart)
  const end = clock(settings.quietEnd, DEFAULTS.quietEnd)
  if (start === end) return false
  const minutes = date.getHours() * 60 + date.getMinutes()
  const startMinutes = Number(start.slice(0, 2)) * 60 + Number(start.slice(3))
  const endMinutes = Number(end.slice(0, 2)) * 60 + Number(end.slice(3))
  return startMinutes < endMinutes
    ? minutes >= startMinutes && minutes < endMinutes
    : minutes >= startMinutes || minutes < endMinutes
}

export function eventEnabled(settings, event) {
  const item = EVENTS.find((entry) => entry.event === event)
  return item ? settings[item.key] !== false : true
}

export function accentForEvent(settings, event) {
  if (!settings.semanticColor) return settings.accent
  return SEMANTIC_ACCENTS[event] || settings.accent
}
