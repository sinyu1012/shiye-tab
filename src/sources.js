import { LIFE_REPO, atPath, safeUrl, sourceUrl } from './model.js';
import { permission } from './storage.js';
const RAW = 'https://raw.githubusercontent.com/eternity4719/HowToLiveBetter/main/';
export async function fetchText(url) {
  url = sourceUrl(url);
  if (!await permission(url)) throw new Error('需要授权此站点，请点击「连接数据源」。');
  const response = await fetch(url, { credentials: 'omit', signal: AbortSignal.timeout(15000), cache: 'no-cache', referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error(`数据源返回 HTTP ${response.status}。`);
  if (response.url) {
    sourceUrl(response.url);
    if (url.startsWith('https://') && !response.url.startsWith('https://')) throw new Error('HTTPS 数据源不能重定向到 HTTP。');
  }
  const reader = response.body.getReader();
  const chunks = []; let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 3 * 1024 * 1024) { await reader.cancel(); throw new Error('响应超过 3 MiB，请缩小数据源。'); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return new TextDecoder().decode(bytes);
}
function inertHtml(value) {
  const template = document.createElement('template');
  template.innerHTML = String(value ?? '');
  return template.content;
}
export function plain(value, multiline = false) {
  const doc = inertHtml(value);
  doc.querySelectorAll('script,style,iframe,object').forEach(n => n.remove());
  if (multiline) {
    doc.querySelectorAll('br').forEach(n => n.replaceWith('\n'));
    doc.querySelectorAll('p,div,li,blockquote,pre,h1,h2,h3,h4,h5,h6,tr').forEach(n => {
      n.before('\n'); n.after('\n');
    });
    return (doc.textContent || '').replace(/\r\n?/g, '\n')
      .replace(/[^\S\n]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  return (doc.textContent || '').replace(/\s+/g, ' ').trim();
}
const markdownText = value => plain(value.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/<https?:[^>]+>/g, '').replace(/\*\*|__/g, '').replace(/`/g, ''));
export function parseLife(md, path) {
  const chapter = md.match(/^# (.+)$/m)?.[1] || '高性价比人生指南';
  return [...md.matchAll(/^### (.+)\n([\s\S]*?)(?=^### |$(?![\s\S]))/gm)].map(m => {
    const field = name => markdownText(m[2].match(new RegExp(`^- ${name}[：:]\\s*(.+)$`, 'm'))?.[1] || '');
    const title = markdownText(m[1]);
    const anchor = title.toLowerCase().replace(/[\p{P}\p{S}]/gu, '').replace(/\s/g, '-');
    return { title, description: field('说人话') || field('收益'), cost: field('成本'), evidence: field('证据等级'), note: field('备注'),
      meta: chapter, url: `${LIFE_REPO}/blob/main/${path}#${encodeURIComponent(anchor)}` };
  }).filter(i => i.description);
}
export function parseTrending(html) {
  const doc = inertHtml(html);
  const items = [...doc.querySelectorAll('article.Box-row')].map(row => {
    const a = row.querySelector('h2 a');
    const weekly = row.textContent.match(/([\d,]+)\s+stars this week/);
    return { title: a?.textContent.replace(/\s+/g, ' ').trim(), url: safeUrl(a?.getAttribute('href'), 'https://github.com'),
      description: row.querySelector('p')?.textContent.trim() || '', meta: weekly ? `+${weekly[1]} 本周` : '本周趋势' };
  }).filter(i => i.title && i.url);
  if (!items.length) throw new Error('GitHub 周榜页面结构发生变化或暂时不可用。');
  return items;
}
export function parseFeed(text, base) {
  if (text.trim().startsWith('{')) {
    const feed = JSON.parse(text);
    if (!Array.isArray(feed.items)) throw new Error('JSON Feed 缺少 items 数组。');
    return feed.items.slice(0, 100).map(i => ({ title: plain(i.title || '无标题'), url: safeUrl(i.url || i.external_url, base), description: plain(i.summary || i.content_text || i.content_html, true).slice(0, 500), meta: dateLabel(i.date_published) }));
  }
  const doc = new DOMParser().parseFromString(text, 'text/xml');
  if (doc.querySelector('parsererror') || !['rss', 'feed', 'RDF'].includes(doc.documentElement.localName)) throw new Error('不是有效的 RSS / Atom / JSON Feed，请填写订阅地址。');
  const nodes = [...doc.getElementsByTagName('item'), ...doc.getElementsByTagName('entry')].slice(0, 100);
  return nodes.map(n => {
    const field = name => n.getElementsByTagName(name)[0]?.textContent || '';
    const links = [...n.getElementsByTagName('link')];
    const link = links.find(l => l.getAttribute('rel') === 'alternate') || links.find(l => !l.getAttribute('rel'));
    const rawUrl = link?.getAttribute('href') || link?.textContent || (/^https?:/.test(field('guid')) ? field('guid') : '');
    return { title: plain(field('title') || '无标题'), url: safeUrl(rawUrl, base), description: plain(field('description') || field('summary') || field('content'), true).slice(0, 500), meta: dateLabel(field('pubDate') || field('published') || field('updated')) };
  });
}
function dateLabel(value) {
  if (!value || Number.isNaN(Date.parse(value))) return '';
  return new Date(value).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
}
export function parseJson(text, source) {
  const data = JSON.parse(text);
  const m = source.mapping || {};
  const rows = atPath(data, m.items ?? 'items');
  if (!Array.isArray(rows)) throw new Error('列表路径没有指向数组，请检查字段映射。');
  return rows.slice(0, 100).map(row => ({
    title: plain(atPath(row, m.title || 'title') ?? ''),
    url: safeUrl(atPath(row, m.url || 'url'), source.url),
    description: plain(atPath(row, m.description || 'description') ?? '', true).slice(0, 500),
    meta: plain(atPath(row, m.meta || 'meta') ?? '').slice(0, 60),
  })).filter(i => i.title);
}
export async function loadSource(source) {
  let items, sourceUrlValue;
  if (source.type === 'life') {
    const readme = await fetchText(`${RAW}README.md`);
    const paths = [...new Set([...readme.matchAll(/\]\((book\/[^)#]+\.md)\)/g)].map(m => m[1]))];
    if (!paths.length) throw new Error('未找到生活指南目录，上游结构可能发生变化。');
    const path = paths[Math.floor(Math.random() * paths.length)];
    items = parseLife(await fetchText(RAW + path), path);
    if (!items.length) throw new Error('当前章节无法解析，点击刷新换一个章节。');
    sourceUrlValue = LIFE_REPO;
  } else if (source.type === 'github') {
    sourceUrlValue = 'https://github.com/trending?since=weekly';
    items = parseTrending(await fetchText(sourceUrlValue));
  } else if (source.type === 'apple') {
    sourceUrlValue = 'https://itunes.apple.com/cn/rss/topfreeapplications/limit=10/json';
    const data = JSON.parse(await fetchText(sourceUrlValue));
    if (!data.feed || !Array.isArray(data.feed.entry)) throw new Error('Apple 榜单数据格式已变化。');
    items = data.feed.entry.map((i, index) => ({ title: i['im:name']?.label || '未命名应用', url: safeUrl(i.link?.attributes?.href), description: i.category?.attributes?.label || '', meta: `#${index + 1}` }));
  } else {
    if (!source.url) throw new Error('请先配置有权访问的七麦 JSON 数据接口。');
    sourceUrlValue = source.url;
    const text = await fetchText(source.url);
    items = source.type === 'rss' ? parseFeed(text, source.url) : parseJson(text, source);
  }
  return { items: source.type === 'life' ? items : items.slice(0, source.limit), sourceUrl: sourceUrlValue, fetchedAt: Date.now() };
}
