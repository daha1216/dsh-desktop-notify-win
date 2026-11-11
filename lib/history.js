import { readJson, atomicWrite } from './config.js'

export const MAX_HISTORY = 50

function clean(value, max) {
  if (typeof value !== 'string') return ''
  const line = value.replace(/\s+/g, ' ').trim()
  return line.length > max ? line.slice(0, Math.max(1, max - 1)) + '…' : line
}

function normalize(entry) {
  return {
    id: clean(entry.id, 48) || 'h-' + Date.now().toString(36),
    at: typeof entry.at === 'string' ? entry.at : new Date().toISOString(),
    event: clean(entry.event, 20) || 'test',
    title: clean(entry.title, 120),
    body: clean(entry.body, 400),
    status: clean(entry.status, 80),
    agentId: clean(entry.agentId, 80),
    sessionTitle: clean(entry.sessionTitle, 120),
    shown: entry.shown !== false,
    suppressed: clean(entry.suppressed, 30) || null,
  }
}

export class HistoryStore {
  constructor(file, limit = MAX_HISTORY) {
    this.file = file
    this.limit = limit
    this.entries = []
    this.load()
  }

  load() {
    const raw = readJson(this.file)
    const list = Array.isArray(raw) ? raw : raw && Array.isArray(raw.entries) ? raw.entries : []
    this.entries = list.slice(0, this.limit).map(normalize)
  }

  add(entry) {
    const next = normalize({ ...entry, at: entry.at || new Date().toISOString() })
    this.entries.unshift(next)
    if (this.entries.length > this.limit) this.entries.length = this.limit
    this.save()
    return next
  }

  update(id, patch) {
    const target = this.entries.find((entry) => entry.id === id)
    if (!target) return undefined
    Object.assign(target, patch)
    this.save()
    return target
  }

  get(id) {
    return this.entries.find((entry) => entry.id === id)
  }

  list() {
    return this.entries.slice()
  }

  clear() {
    this.entries = []
    this.save()
  }

  save() {
    try {
      atomicWrite(this.file, { version: 1, entries: this.entries })
    } catch {
      // History is best effort; a read-only profile must not break notifications.
    }
  }
}
