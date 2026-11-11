import { homedir } from 'node:os'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const PACKAGE_DIR = dirname(fileURLToPath(new URL('../package.json', import.meta.url)))

function absolute(value) {
  return typeof value === 'string' && value.trim() && isAbsolute(value.trim()) ? value.trim() : ''
}

export function resolveDshHome(env = process.env) {
  return absolute(env.DSH_HOME) || join(homedir(), '.dsh')
}

export function resolveDataDir(env = process.env) {
  return absolute(env.DSH_NOTIFY_DATA_DIR) || join(resolveDshHome(env), 'desktop-notify')
}

export function packageSettingsFile() {
  return join(PACKAGE_DIR, 'settings.json')
}

export function resolvePaths(env = process.env) {
  const dataDir = resolveDataDir(env)
  return {
    dataDir,
    settings: join(dataDir, 'settings.json'),
    history: join(dataDir, 'history.json'),
    log: join(dataDir, 'notify.log'),
    clickLog: join(dataDir, 'notify-click.log'),
    packageSettings: packageSettingsFile(),
  }
}

export { PACKAGE_DIR, resolve as resolvePath }
