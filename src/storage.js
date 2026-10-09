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
  const config = saved ? validateConfig(saved) : cloneDefaults();
  // Remove the retired default placeholder; keep any connected or user-added source.
  const sources = config.sources.filter(s => !(s.id === 'qimai' && s.type === 'qimai' && !s.url));
  if (sources.length !== config.sources.length) {
    config.sources = sources;
    await write('config', config);
  }
  return config;
}
export const saveConfig = config => write('config', validateConfig(config));
export function permission(url, request = false) {
  const u = new URL(sourceUrl(url));
  if (!extension) return Promise.resolve(true);
  const options = { origins: [`${u.protocol}//${u.hostname}/*`] };
  return request ? chrome.permissions.request(options) : chrome.permissions.contains(options);
}
