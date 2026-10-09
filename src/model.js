export const LIFE_REPO = 'https://github.com/eternity4719/HowToLiveBetter';
export const QIMAI_HOME = 'https://www.qimai.cn/rank/index/brand/free/country/cn/genre/36/device/iphone';
export const TYPES = ['life', 'github', 'apple', 'qimai', 'rss', 'json'];
export const DEFAULTS = {
  version: 1, theme: 'system', columns: 3,
  sources: [
    { id: 'life', type: 'life', name: '好好生活', category: '生活', home: LIFE_REPO, limit: 1, refreshMinutes: 1440 },
    { id: 'github', type: 'github', name: 'GitHub', category: '开发', home: 'https://github.com/trending?since=weekly', limit: 10, refreshMinutes: 60 },
    { id: 'apple', type: 'apple', name: 'App Store', category: '应用', home: 'https://apps.apple.com/cn/charts/iphone', limit: 10, refreshMinutes: 60 },
  ],
};
export const cloneDefaults = () => structuredClone(DEFAULTS);
export const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function safeUrl(value, base) {
  if (typeof value !== 'string' || !value.trim()) return '';
  try {
    const u = new URL(value, base);
    return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password ? u.href : '';
  } catch { return ''; }
}
export function sourceUrl(value) {
  const url = safeUrl(value);
  if (!url) throw new Error('请输入有效的数据源地址（不含用户名和密码）。');
  const { protocol, hostname } = new URL(url);
  // Keep HTTP support aligned with the narrowly scoped optional host permissions.
  const httpHosts = ['10.0.20.141', 'localhost', '127.0.0.1'];
  if (protocol !== 'https:' && !httpHosts.includes(hostname)) {
    throw new Error('请使用 HTTPS；HTTP 目前支持 10.0.20.141、localhost 和 127.0.0.1（不含用户名和密码）。');
  }
  return url;
}
export function atPath(value, path = '') {
  if (!path.trim()) return value;
  return path.split('.').reduce((item, key) => {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) return undefined;
    return item && Object.hasOwn(item, key) ? item[key] : undefined;
  }, value);
}
const string = (value, fallback = '', max = 300) => typeof value === 'string' ? value.trim().slice(0, max) : fallback;
export function validateConfig(input) {
  if (!input || input.version !== 1 || !Array.isArray(input.sources) || input.sources.length > 40) throw new Error('配置格式无效，或超过 40 个数据源。');
  const ids = new Set();
  const sources = input.sources.map(s => {
    if (!s || !TYPES.includes(s.type) || !/^[a-zA-Z0-9_-]{1,80}$/.test(s.id) || ids.has(s.id)) throw new Error('数据源类型或 ID 无效 / 重复。');
    ids.add(s.id);
    const name = string(s.name, '', 60);
    if (!name) throw new Error('数据源名称不能为空。');
    const url = string(s.url, '', 3000);
    if (['rss', 'json'].includes(s.type) || url) sourceUrl(url);
    const mapping = {};
    for (const key of ['items', 'title', 'url', 'description', 'meta']) mapping[key] = string(s.mapping?.[key], key, 200);
    return { id: s.id, type: s.type, name, category: string(s.category, '订阅', 20) || '订阅', url,
      home: safeUrl(string(s.home, '', 3000)), limit: s.type === 'life' ? 1 : s.type === 'qimai' || s.type === 'apple' ? 10 : Math.min(30, Math.max(1, Number(s.limit) || 10)),
      refreshMinutes: Math.min(10080, Math.max(5, Number(s.refreshMinutes) || 60)), mapping };
  });
  return { version: 1, theme: ['light', 'dark', 'system'].includes(input.theme) ? input.theme : 'system', columns: [2,3,4].includes(input.columns) ? input.columns : 3, sources };
}
export function randomOther(items, previous, rng = Math.random) {
  const choices = items.filter(i => i.url !== previous);
  const pool = choices.length ? choices : items;
  return pool[Math.floor(rng() * pool.length)];
}
export function configKey(source) {
  const key = [source.type, source.url, source.limit, source.mapping];
  // Old feed caches flattened line breaks; refetch once with the new parser.
  if (['rss', 'json', 'qimai'].includes(source.type)) key.push('multiline-description-v1');
  return JSON.stringify(key);
}
