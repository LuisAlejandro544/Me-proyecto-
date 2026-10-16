// @ts-nocheck
// Updater: chequeo al arranque (extraído de ui/updater.ts — barrel en ui/updater.ts).
import { checkForUpdates, reloadAppHard } from './check';
import { fetchLatestRelease } from './assets';
import { compareVersions, isUpdateAvailable } from './version';
import { getCurrentVersion, getUpdateRepo } from './repo';
import { resolveInstallTarget } from './assets';
export function checkForUpdatesOnBoot(delayMs = 3500): void {
  window.setTimeout(() => {
    checkForUpdates({ silent: true }).catch(() => {});
  }, delayMs);
}

if (typeof window !== 'undefined') {
  (window as any).__updater = {
    checkForUpdates,
    fetchLatestRelease,
    compareVersions,
    getCurrentVersion,
    getUpdateRepo,
    isUpdateAvailable,
    resolveInstallTarget,
    reloadAppHard
  };
}
