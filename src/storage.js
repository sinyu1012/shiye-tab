import { cloneDefaults, validateConfig, sourceUrl } from './model.js';
export const extension = Boolean(globalThis.chrome?.storage?.local);
export async function read(key) {
  if (extension) return (await chrome.storage.local.get(key))[key];
  try { return JSON.parse(localStorage.getItem(key)); } catch { return undefined; }
}
export async function write(key, value) {
  if (extension) await chrome.storage.local.set({ [key]: value });
  else localStorage.setItem(key, JSON.stringify(value));
}
export async function remove(key) {
  if (extension) await chrome.storage.local.remove(key); else localStorage.removeItem(key);
}
export async function getConfig() {
  const saved = await read('config');
  return saved ? validateConfig(saved) : cloneDefaults();
}
export const saveConfig = config => write('config', validateConfig(config));
export function permission(url, request = false) {
  const u = new URL(sourceUrl(url));
  if (!extension) return Promise.resolve(true);
  const options = { origins: [`${u.origin}/*`] };
  return request ? chrome.permissions.request(options) : chrome.permissions.contains(options);
}
