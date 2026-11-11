import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { DEFAULTS, EVENTS, sanitize } from './schema.js'
import { resolvePaths } from './paths.js'

const LEGACY_KEYS = EVENTS.map((entry) => entry.key)

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return undefined
  }
}

function atomicWrite(file, value) {
  mkdirSync(dirname(file), { recursive: true })
  const temporary = file + '.tmp-' + process.pid
  writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', 'utf8')
  renameSync(temporary, file)
}

export class SettingsStore {
  constructor(options = {}) {
    this.paths = options.paths || resolvePaths(options.env)
    this.log = options.log || (() => {})
    this.loadedFrom = 'defaults'
  }

  load(seed = {}) {
    const legacy = {}
    for (const key of LEGACY_KEYS) {
      if (seed[key] !== undefined) legacy[key] = Boolean(seed[key])
    }

    const saved = readJson(this.paths.settings)
    if (saved && typeof saved === 'object') {
      this.loadedFrom = 'data'
      return sanitize({ ...DEFAULTS, ...legacy, ...saved }, DEFAULTS)
    }

    const packaged = readJson(this.paths.packageSettings)
    if (packaged && typeof packaged === 'object') {
      const migrated = sanitize({ ...DEFAULTS, ...legacy, ...packaged }, DEFAULTS)
      try {
        atomicWrite(this.paths.settings, migrated)
        this.loadedFrom = 'migrated'
        this.log({ evt: 'settings-migrated', from: this.paths.packageSettings, to: this.paths.settings })
      } catch (error) {
        this.loadedFrom = 'package'
        this.log({ evt: 'settings-migrate-error', message: String(error) })
      }
      return migrated
    }

    this.loadedFrom = 'defaults'
    return sanitize({ ...DEFAULTS, ...legacy }, DEFAULTS)
  }

  save(settings) {
    const next = sanitize(settings, DEFAULTS)
    atomicWrite(this.paths.settings, next)
    this.loadedFrom = 'data'
    return next
  }
}

export { atomicWrite, readJson }