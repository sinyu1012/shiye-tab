import { cloneDefaults, validateConfig, sourceUrl, validateBookmarkItem, normalizeBookmarkUrl, BOOKMARKS_KEY, BOOKMARKS_MAX } from './model.js';
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
  // Introduce the card once; removing it afterwards remains a persistent choice.
  if (!await read('weather-card-introduced')) {
    if (!config.sources.some(s => s.type === 'weather') && config.sources.length < 40) {
      const weather = cloneDefaults().sources.find(s => s.type === 'weather');
      if (config.sources.some(s => s.id === weather.id)) weather.id = crypto.randomUUID();
      config.sources.unshift(weather);
    }
    await saveConfig(config);
    await write('weather-card-introduced', true);
  }
  // Upgrade the previous default once; later manual column choices stay intact.
  if (!await read('compact-layout-introduced')) {
    if (config.columns === 3) config.columns = 4;
    await saveConfig(config);
    await write('compact-layout-introduced', true);
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
function unique(items) {
  const seen = new Set();
  return items.filter(item => { if (seen.has(item.url)) return false; seen.add(item.url); return true; });
}
export async function getBookmarks() {
  const saved = await read(BOOKMARKS_KEY);
  if (!Array.isArray(saved)) return [];
  return unique(saved.map(validateBookmarkItem).filter(Boolean)).slice(0, BOOKMARKS_MAX);
}
export async function saveBookmarks(items) {
  const clean = unique(items.map(validateBookmarkItem).filter(Boolean)).slice(0, BOOKMARKS_MAX);
  await write(BOOKMARKS_KEY, clean);
  return clean;
}
export async function addBookmark(input) {
  const list = await getBookmarks();
  if (list.length >= BOOKMARKS_MAX) throw new Error(`网址书签最多 ${BOOKMARKS_MAX} 条，请先删除一些。`);
  const item = validateBookmarkItem({ ...input, id: input?.id || crypto.randomUUID() });
  if (!item) throw new Error('请输入有效的网址（仅支持 http / https）。');
  if (list.some(b => b.url === item.url)) throw new Error('这个网址已经在书签里了。');
  return saveBookmarks([item, ...list]);
}
export async function updateBookmark(id, input) {
  const list = await getBookmarks();
  const index = list.findIndex(b => b.id === id);
  if (index < 0) throw new Error('找不到这条网址，可能已被删除。');
  const url = normalizeBookmarkUrl(input?.url);
  if (!url) throw new Error('请输入有效的网址（仅支持 http / https）。');
  if (list.some((b, i) => i !== index && b.url === url)) throw new Error('这个网址已经在书签里了。');
  list[index] = validateBookmarkItem({ ...list[index], ...input, id, url,
    createdAt: list[index].createdAt, updatedAt: Date.now() });
  return saveBookmarks(list);
}
export async function removeBookmark(id) {
  return saveBookmarks((await getBookmarks()).filter(b => b.id !== id));
}
