import { appendFileSync, existsSync, statSync, truncateSync } from 'node:fs'

const MAX_BYTES = 256 * 1024

export function createLogger(file) {
  let writes = 0
  return function log(event) {
    try {
      if (writes % 64 === 0 && existsSync(file) && statSync(file).size > MAX_BYTES) truncateSync(file)
      writes += 1
      appendFileSync(file, JSON.stringify({ t: new Date().toISOString(), ...event }) + '\n')
    } catch {
      // Logging must never break the host.
    }
  }
}

export function serializeError(error) {
  if (error instanceof Error) return error.stack || error.message
  try {
    return typeof error === 'string' ? error : JSON.stringify(error)
  } catch {
    return String(error)
  }
}
