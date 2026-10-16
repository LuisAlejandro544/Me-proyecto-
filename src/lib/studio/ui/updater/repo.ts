// @ts-nocheck
// Updater: repo y versión (extraído de ui/updater.ts — barrel en ui/updater.ts).
import { showToast } from '../toast';
import { isTauri, isCapacitor } from '../../../platform';
import { escapeHtml } from '../../domain/geometry';
const REPO_KEY = 'vn_update_repo_v1';
const SKIP_KEY = 'vn_update_skipped_tag_v1';
const LAST_CHECK_KEY = 'vn_update_last_check_v1';
const AUTO_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function getUpdateRepo(): string {
  try {
    const saved = (localStorage.getItem(REPO_KEY) || '').trim();
    if (saved) return saved.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  } catch {}
  const envRepo = (import.meta as any)?.env?.VITE_UPDATE_REPO;
  if (envRepo) return String(envRepo);
  return 'LuisAlejandro544/Me-proyecto-';
}

export function setUpdateRepo(repo: string): void {
  try {
    localStorage.setItem(REPO_KEY, (repo || '').trim());
  } catch {}
}

export function getCurrentVersion(): string {
  try {
    const v = (globalThis as any).__APP_VERSION__;
    if (v) return String(v);
  } catch {}
  try {
    const env = (import.meta as any)?.env?.VITE_APP_VERSION;
    if (env) return String(env);
  } catch {}
  return '0.1.0';
}

