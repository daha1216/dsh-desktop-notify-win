const DEFAULT_MAX = 120
const SCAN_LIMIT = 600

function messageText(message) {
  if (!message || !Array.isArray(message.content)) return ''
  const parts = []
  for (const block of message.content) {
    if (!block || block.type !== 'text' || typeof block.text !== 'string') continue
    const text = cleanInline(block.text)
    if (text) parts.push(text)
  }
  return parts.join(' ')
}

export function cleanInline(value) {
  if (typeof value !== 'string') return ''
  return value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>\n]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+.*$/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function clip(value, max = DEFAULT_MAX) {
  const text = cleanInline(value)
  if (!text) return ''
  if (text.length <= max) return text
  const cut = text.slice(0, Math.max(1, max - 1)).replace(/[\s，,、；;：:（(【\[]+$/g, '')
  return cut + '…'
}

export function firstSentence(value, max = DEFAULT_MAX) {
  const text = cleanInline(value)
  if (!text) return ''
  const match = text.match(/^.{8,}?[。！？!?]/)
  return clip(match ? match[0] : text, max)
}

export function assistantSummary(session, max = DEFAULT_MAX) {
  if (!session || typeof session.eventAt !== 'function') return ''
  const end = Number(session.seq)
  if (!Number.isFinite(end)) return ''
  const floor = Math.max(0, end - SCAN_LIMIT)
  let turn = 0
  let fallback = ''
  for (let seq = end - 1; seq >= floor; seq -= 1) {
    let event
    try {
      event = session.eventAt(seq)
    } catch {
      continue
    }
    if (!event) continue
    if (event.type === 'turn/end') {
      if (!turn) turn = Number(event.data && event.data.turn) || 0
      continue
    }
    if (event.type !== 'assistant/message') continue
    const text = messageText(event.data && event.data.message)
    if (!text) continue
    if (turn && Number(event.data && event.data.turn) !== turn) {
      if (!fallback) fallback = text
      continue
    }
    return firstSentence(text, max)
  }
  return fallback ? firstSentence(fallback, max) : ''
}

export function questionSummary(request, max = 140) {
  const questions = Array.isArray(request && request.questions) ? request.questions : []
  const first = questions.find((item) => item && (typeof item.question === 'string' || typeof item.header === 'string'))
  if (!first) return ''
  const header = cleanInline(first.header)
  const question = cleanInline(first.question)
  const text = header && question ? header + '：' + question : question || header
  return clip(text, max)
}
