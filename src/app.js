import { DEFAULTS, cloneDefaults, esc, safeUrl, sourceUrl, validateConfig, randomOther, configKey, validateBookmarkItem, buildExportPayload, parseImportPayload, BOOKMARKS_MAX, BOOKMARKS_TWO_COL_AFTER } from './model.js';
import { read, write, remove, getConfig, saveConfig, permission, extension, getBookmarks, saveBookmarks, addBookmark, updateBookmark, removeBookmark } from './storage.js';
import { loadSource } from './sources.js';
import { weatherCard, updateClocks, weatherPermission, searchCities } from './weather.js';
const $ = s => document.querySelector(s);
let weatherLocation = null, weatherResults = [], citySearchVersion = 0;
const states = new Map(); const inFlight = new Map();
let config, category = '全部', query = '', editing = null, dragId = null, toastTimer;
let bookmarkTotal = 0, bookmarkEditingId = null, readerSource = null, bookmarkDragId = null;
const icons = {
  life: '✳', poetry: '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4C10 3 4 7 4 13a7 7 0 0 0 7 7c6 0 9-6 9-16Z"/><path d="M4 22 17 7M8 17V10m0 7h7"/></svg>', weather: '◷',
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.81a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
  apple: '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 3 12 18M15 3 3 21M4 15h16"/></svg>',
  qimai: '七', rss: '◔', json: '{ }', bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4h10v16l-5-3.4L7 20Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
};
const subtitles = { weather: '时间与天气', poetry: '唐诗 · 随机一句', life: 'HowToLiveBetter', github: '本周趋势', apple: '中国 · iPhone 免费榜', qimai: '中国 · iPhone 免费总榜', rss: '订阅更新', json: '结构化数据', bookmark: '书签 · 快速访问' };
const link = (url, label, cls = '') => safeUrl(url) ? `<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<span class="${cls}">${label}</span>`;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 3800); }
function errorMessage(err) { return ['TimeoutError', 'AbortError'].includes(err.name) ? '连接超时，请稍后重试。' : err.message === 'Failed to fetch' ? '网络连接失败，请检查网络与站点访问权限。' : err.message; }
function bookmarkActions(item) {
  return `<span class="bookmark-actions"><button type="button" class="icon-button" data-action="bookmark-edit" data-bookmark-id="${esc(item.id)}" aria-label="编辑 ${esc(item.title)}" title="编辑网址">✎</button><button type="button" class="icon-button danger" data-action="bookmark-delete" data-bookmark-id="${esc(item.id)}" aria-label="删除 ${esc(item.title)}" title="删除网址">×</button></span>`;
}
const BOOKMARK_ACTIONS = ['bookmark-add', 'bookmark-edit', 'bookmark-delete'];
async function openBookmarkDialog(id = null) {
  const item = id ? (await getBookmarks()).find(b => b.id === id) : null;
  if (id && !item) { toast('找不到这条网址，可能已被删除'); return; }
  bookmarkEditingId = item?.id ?? null;
  const form = $('#bookmark-form'); form.reset();
  $('#bookmark-error').textContent = '';
  $('#bookmark-title').textContent = item ? '编辑网址' : '添加网址';
  $('#save-bookmark').textContent = item ? '保存修改' : '添加网址';
  if (item) {
    form.elements.title.value = item.title;
    form.elements.url.value = item.url;
    form.elements.note.value = item.description;
  }
  $('#bookmark-dialog').showModal();
}
async function refreshBookmarkCards() {
  for (const source of config.sources.filter(s => s.type === 'bookmark')) {
    if (inFlight.has(source.id)) await inFlight.get(source.id);
    states.delete(source.id); await refresh(source, true);
  }
  bookmarkTotal = (await getBookmarks()).length;
  if (readerSource?.type === 'bookmark' && $('#reader-dialog').open) {
    const state = states.get(readerSource.id);
    const items = state ? shownItems(readerSource, state) : [];
    if (!items.length) $('#reader-dialog').close();
    else $('#reader-content').innerHTML = readerMarkup(readerSource, items);
  }
  render();
}
async function handleBookmarkAction(button) {
  const action = button.dataset.action;
  if (!BOOKMARK_ACTIONS.includes(action)) return false;
  if (action === 'bookmark-add') { await openBookmarkDialog(); return true; }
  const id = button.dataset.bookmarkId;
  if (action === 'bookmark-edit') { await openBookmarkDialog(id); return true; }
  const target = (await getBookmarks()).find(b => b.id === id);
  if (!target) { toast('找不到这条网址，可能已被删除'); return true; }
  await removeBookmark(id);
  await refreshBookmarkCards();
  toast(`已删除「${target.title}」`);
  return true;
}
async function persist() { await saveConfig(config); }
function applyAppearance() { document.documentElement.dataset.theme = config.theme; $('#board').dataset.columns = config.columns; }
function age(time) {
  if (!time) return '尚未更新';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  return minutes < 1 ? '刚刚更新' : minutes < 60 ? `${minutes} 分钟前更新` : minutes < 1440 ? `${Math.floor(minutes / 60)} 小时前更新` : `${Math.floor(minutes / 1440)} 天前更新`;
}
function drawFilters() {
  const all = ['全部', ...new Set(config.sources.map(s => s.category))];
  if (!all.includes(category)) category = '全部';
  $('#filters').innerHTML = all.map(c => `<button class="filter ${category === c ? 'selected' : ''}" data-category="${esc(c)}">${esc(c)}${c === '全部' ? `<span>${config.sources.length}</span>` : ''}</button>`).join('');
  $('#source-count').textContent = `${config.sources.length} 个数据源 · 本地保存`;
}
function shownItems(source, state) {
  const items = ['life', 'poetry'].includes(source.type) ? (state.selected ? [state.selected] : []) : state.data?.items || [];
  return query ? items.filter(i => `${i.title} ${i.description}`.toLowerCase().includes(query)) : items;
}
function lifeContent(i, expanded = false) {
  return `<div class="life-content"><p class="chapter">${esc(i.meta)}</p><h3>${link(i.url, esc(i.title.replace(/^\d+\.\s*/, '')))}</h3><p class="life-description">${esc(i.description)}</p>${expanded && i.cost ? `<div class="life-cost"><span>投入</span><p>${esc(i.cost)}</p></div>` : ''}<div class="life-bottom"><span class="evidence">证据等级 ${esc(i.evidence || '未标注')}</span>${expanded ? link(i.url, '读完整原文 ↗') : '<button class="content-more" data-action="read">展开阅读 →</button>'}</div>${expanded && i.note ? `<details class="life-note" open><summary>原文备注与限制</summary><p>${esc(i.note)}</p></details>` : ''}<div class="attribution">摘自 eternity4719 / HowToLiveBetter · ${link('https://creativecommons.org/licenses/by/4.0/deed.zh-hans', 'CC BY 4.0')}${expanded ? '<br>节选原文，未改写；更多条件及来源见完整条目。' : ''}</div></div>`;
}
function readingContent(i, expanded = false) {
  return `<div class="reading-content">${i.meta ? `<p class="reading-meta">${esc(i.meta)}</p>` : ''}<h3>${link(i.url, esc(i.title))}</h3>${i.description ? `<p class="reading-description">${esc(i.description)}</p>` : ''}<div class="reading-bottom">${expanded ? link(i.url, safeUrl(i.url) ? '打开原文 ↗' : '以上为订阅提供的内容') : '<button class="content-more" data-action="read">展开阅读 →</button>'}</div></div>`;
}
function bookmarkMonogram(title) {
  const name = String(title ?? '').trim();
  const letter = name ? [...name][0].toUpperCase() : '◆';
  return `<span class="bookmark-glyph" aria-hidden="true">${esc(letter)}</span>`;
}
function itemList(source, items, { className = '', actions = false, sortable = false, rules = false } = {}) {
  const listClass = ['item-list', className].filter(Boolean).join(' ');
  const lead = (i, index) => source.type === 'bookmark' ? bookmarkMonogram(i.title) : `<span class="rank rank-${index + 1}">${String(index + 1).padStart(2, '0')}</span>`;
  return `<ol class="${listClass}"${sortable ? ' data-bookmark-sortable' : ''}>${items.map((i, index) => `<li${sortable ? ` draggable="true" data-bookmark-id="${esc(i.id)}"` : ''}>${lead(i, index)}${rules ? '<span class="bookmark-rule" aria-hidden="true"></span>' : ''}<div class="item-body">${link(i.url, esc(i.title), 'item-title')}${i.description ? `<p>${esc(i.description)}</p>` : ''}</div>${i.meta && source.type !== 'apple' ? `<span class="item-meta">${esc(i.meta)}</span>` : ''}${actions && source.type === 'bookmark' ? bookmarkActions(i) : ''}</li>`).join('')}</ol>`;
}
function readerMarkup(source, items) {
  const content = source.type === 'life' ? lifeContent(items[0], true) : source.limit === 1 && source.type !== 'bookmark' ? readingContent(items[0], true)
    : source.type === 'bookmark' ? itemList(source, items, { className: 'bookmark-manage-list', actions: true, sortable: true }) : itemList(source, items);
  return content + (source.type === 'bookmark' ? '<div class="bookmark-reader-actions"><p class="bookmark-manage-hint">拖动条目可调整顺序，顺序保存在本机。</p><button class="button secondary" data-action="bookmark-add">＋ 添加网址</button></div>' : '');
}
function openReader(source) {
  const state = states.get(source.id);
  const items = state ? shownItems(source, state) : [];
  if (!items.length && source.type !== 'bookmark') return;
  readerSource = source;
  $('#reader-title').textContent = source.name;
  $('#reader-subtitle').textContent = source.type === 'bookmark' ? '书签管理 · 拖动排序' : source.type === 'life' || (source.limit === 1 && source.type !== 'bookmark') ? subtitles[source.type] : `${query ? '搜索结果 · ' : ''}共 ${items.length} 条`;
  $('#reader-status').textContent = state.status === 'stale' ? `更新失败，显示旧缓存 · ${state.error}` : '';
  $('#reader-status').hidden = state.status !== 'stale';
  $('#reader-content').innerHTML = readerMarkup(source, items);
  $('#reader-dialog').showModal();
  $('#reader-content').scrollTop = 0;
}
function card(source) {
  const state = states.get(source.id) || { status: 'loading' };
  if (source.type === 'weather') return weatherCard(source, state);
  const data = state.data;
  const shown = shownItems(source, state);
  let content = '';
  if (source.type === 'qimai' && !source.url) content = `<div class="empty-card"><span class="empty-glyph">↗</span><h3>接入你的七麦榜单</h3><p>连接有权访问的 JSON 接口，<br>让国内今日 Top 10 来到新标签页。</p><button class="button secondary" data-action="edit">配置数据接口</button><small>当前公开接口限制直接访问</small></div>`;
  else if (state.status === 'loading' && !data) content = `<div class="skeleton" aria-label="正在读取"><i></i><i></i><i></i><i></i><i></i><p>正在读取好内容…</p></div>`;
  else if (state.status === 'error' && !data) content = `<div class="empty-card"><span class="empty-glyph">☁</span><h3>暂时没有连上</h3><p>${esc(state.error)}</p><div class="empty-actions"><button class="button secondary" data-action="refresh">重新读取</button>${source.url ? '<button class="button secondary" data-action="connect">连接数据源</button>' : ''}</div></div>`;
  else if (!shown.length && source.type === 'bookmark') content = `<div class="empty-card"><span class="empty-glyph">☆</span><h3>还没有网址</h3><p>把常用的网站收进这张卡片，<br>点开就能直达。</p><div class="empty-actions"><button class="button secondary" data-action="bookmark-add">＋ 添加网址</button></div><small>只保存在本机 · 不联网</small></div>`;
  else if (!shown.length) content = `<div class="empty-card"><span class="empty-glyph">○</span><h3>${query ? '没有匹配的内容' : '暂时没有新内容'}</h3><p>${query ? '试试其他关键词。' : '数据源已连接，等待下一次更新。'}</p></div>`;
  else if (source.type === 'life') {
    content = lifeContent(shown[0]);
  } else if (source.type === 'poetry') {
    const i = shown[0];
    const comma = i.title.indexOf('，') + 1;
    content = `<div class="poetry-content" lang="zh-Hans"><div class="poetry-eyebrow" aria-hidden="true">POETRY<span></span></div><figure><blockquote class="poetry-verse"><span>${esc(i.title.slice(0, comma))}</span><span>${esc(i.title.slice(comma))}</span></blockquote><figcaption><span>唐 · ${esc(i.author)}</span><cite>《${esc(i.poemTitle)}》</cite></figcaption></figure><svg class="poetry-landscape" viewBox="0 0 280 110" fill="none" aria-hidden="true"><circle cx="204" cy="20" r="10"/><path d="M1 108c38-8 59-27 85-30s37-24 62-14 46-12 72-27 41-4 60 13M79 108c34-6 51-29 78-29s54 23 104 27M125 68l29 10"/></svg></div>`;
  } else if (source.limit === 1 && source.type !== 'bookmark') {
    content = readingContent(shown[0]);
  } else if (source.type === 'bookmark') {
    const items = shown.slice(0, source.limit);
    const twoCol = items.length > BOOKMARKS_TWO_COL_AFTER;
    content = `<div class="list-preview">${itemList(source, items, { className: twoCol ? 'two-col' : '', rules: true })}</div>`;
  } else content = `<div class="list-preview">${itemList(source, shown.slice(0, 5))}<button class="content-more" data-action="read">查看全部 ${shown.length} 条 →</button></div>`;
  const stale = state.status === 'stale';
  const isBookmark = source.type === 'bookmark';
  const refreshButton = `<button class="icon-button refresh-icon" data-action="refresh" aria-label="刷新 ${esc(source.name)}" ${state.status === 'loading' ? 'disabled' : ''}>↻</button>`;
  const homeLink = isBookmark ? '' : link(source.home || data?.sourceUrl || source.url, '原站 ↗');
  const updateStatus = isBookmark ? `<button class="update-status bookmark-manage-link" data-action="read" title="打开书签管理">书签管理</button>`
    : `<span class="update-status ${stale ? 'stale' : ''}" title="${data ? new Date(data.fetchedAt).toLocaleString('zh-CN') : ''}"><i></i>${source.type === 'poetry' ? link(source.home, '简体诗选', 'poetry-source') : source.type === 'qimai' && !source.url ? '等待接入' : state.status === 'loading' ? '正在更新…' : `${stale ? '旧缓存 · ' : ''}${age(data?.fetchedAt)}`}</span>`;
  const footerLeft = updateStatus;
  const footerRight = isBookmark ? `<button class="bookmark-add-link" data-action="bookmark-add">＋ 添加网址</button><span class="bookmark-total">${bookmarkTotal} 条</span>${refreshButton}`
    : source.type === 'poetry' ? '<button class="poetry-shuffle" data-action="shuffle" title="换一句"><svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5M5.1 7a8 8 0 0 1 13.2-1.1L20 8M4 16l1.7 2.1A8 8 0 0 0 18.9 17"/></svg><span>换一句</span></button>'
    : `${homeLink}${refreshButton}`;
  return `<article data-type="${source.type}" class="card ${state.status === 'unconfigured' ? 'unconfigured-card' : ''} ${source.type === 'bookmark' ? 'bookmark-card' : source.type === 'poetry' ? 'poetry-card' : source.type === 'life' ? 'life-card' : source.limit === 1 && source.type !== 'bookmark' ? 'reading-card' : ''}" data-id="${esc(source.id)}" aria-label="${esc(source.name)}"><header class="card-header" draggable="true"><span class="source-icon ${source.type}">${icons[source.type]}</span><div class="card-heading"><h2>${esc(source.name)}</h2><span>${subtitles[source.type]}</span></div><div class="card-tools">${source.type === 'life' ? '<button class="shuffle" data-action="shuffle" title="换一条">换一条 ↻</button>' : ''}<button class="icon-button card-menu" data-action="edit" title="编辑数据源" aria-label="编辑 ${esc(source.name)}">⋯</button></div></header><div class="card-content">${content}</div>${stale ? `<div class="stale-note" role="status">更新失败，显示旧缓存 · ${esc(state.error)}</div>` : ''}<footer class="card-footer">${footerLeft}<div>${footerRight}</div></footer></article>`;
}
function render() {
  const scrollY = window.scrollY;
  drawFilters();
  const sources = config.sources.filter(s => category === '全部' || s.category === category);
  $('#board').innerHTML = sources.map(card).join('') + (!query ? `<button class="add-card" id="board-add"><span>＋</span><strong>添加你关心的内容</strong><p>RSS · Newsletter · JSON</p><b>把你关心的世界，收进这一页 ↗</b></button>` : '');
  applyAppearance();
  if (scrollY) window.scrollTo(0, scrollY);
}
async function selectRandom(source, state) {
  if (source.type === 'poetry') {
    const previous = await read(`last:${source.id}`);
    const candidates = state.data.items.filter(item => item.id !== previous);
    const pool = candidates.length ? candidates : state.data.items;
    state.selected = pool[Math.floor(Math.random() * pool.length)];
    if (state.selected) await write(`last:${source.id}`, state.selected.id);
    return;
  }
  const previous = await read(`last:${source.id}`);
  state.selected = randomOther(state.data.items, previous);
  if (state.selected) await write(`last:${source.id}`, state.selected.url);
}
async function refresh(source, force = false) {
  if (inFlight.has(source.id)) return inFlight.get(source.id);
  const promise = doRefresh(source, force).finally(() => inFlight.delete(source.id));
  inFlight.set(source.id, promise); return promise;
}
async function doRefresh(source, force) {
  if (source.type === 'weather' && !source.location) { states.set(source.id, { status: 'unconfigured' }); render(); return; }
  if (source.type === 'qimai' && !source.url) { states.set(source.id, { status: 'unconfigured' }); render(); return; }
  const key = configKey(source);
  const current = () => config.sources.some(s => s.id === source.id && configKey(s) === key);
  if (source.type === 'bookmark') {
    const state = { status: 'ready', data: await loadSource(source) };
    if (current()) { states.set(source.id, state); render(); }
    return;
  }
  if (source.type === 'poetry') {
    const state = { status: 'ready', data: await loadSource(source) };
    await selectRandom(source, state);
    if (current()) { states.set(source.id, state); render(); }
    return;
  }
  let cached;
  try { cached = await read(`cache:${source.id}`); } catch { /* Network can still succeed if cache cannot be read. */ }
  if (cached?.key !== key) cached = null;
  const state = { status: 'loading', data: cached?.data };
  if (state.data && source.type === 'life') await selectRandom(source, state);
  if (!current()) return;
  states.set(source.id, state); render();
  if (!force && cached && Date.now() - cached.data.fetchedAt < source.refreshMinutes * 60000) { state.status = 'ready'; render(); return; }
  try {
    const data = await loadSource(source);
    if (!current()) return;
    state.data = data; state.status = 'ready';
    if (source.type === 'life') await selectRandom(source, state);
    await write(`cache:${source.id}`, { key, data });
  } catch (err) { state.status = state.data ? 'stale' : 'error'; state.error = errorMessage(err); }
  if (current()) render();
}
function openSource(source) {
  editing = source?.id || null; const form = $('#source-form'); form.reset();
  weatherLocation = source?.type === 'weather' ? source.location : null;
  weatherResults = []; citySearchVersion++;
  $('#weather-results').innerHTML = '';
  $('#weather-selection').textContent = weatherLocation ? `已选择：${weatherLocation.name}` : '尚未选择城市。时钟默认显示设备时间。';
  $('#source-error').textContent = '';
  $('#source-title').textContent = source ? '编辑数据源' : '添加数据源';
  $('#save-source').textContent = source ? '保存设置' : '添加到看板';
  for (const key of ['type','name','category','url','home','limit','refreshMinutes']) if (source?.[key] !== undefined) form.elements[key].value = source[key];
  for (const key of ['items','title','url','description','meta']) form.elements[`${key}Path`].value = source?.mapping?.[key] ?? key;
  sourceFields(); $('#source-dialog').showModal();
}
function sourceFields() {
  const form = $('#source-form'); const type = form.elements.type.value;
  const custom = ['rss','json','qimai'].includes(type);
  $('#weather-fields').hidden = type !== 'weather';
  $('#url-fields').hidden = !custom; $('#mapping-fields').hidden = !['json','qimai'].includes(type);
  form.elements.url.required = ['rss','json'].includes(type);
  form.elements.limit.max = type === 'bookmark' ? String(BOOKMARKS_MAX) : '30';
  form.elements.limit.disabled = ['weather','life','poetry','apple','qimai'].includes(type);
  if (type === 'bookmark' && !editing) form.elements.limit.value = String(BOOKMARKS_MAX);
  if (form.elements.limit.disabled) form.elements.limit.value = ['weather', 'life', 'poetry'].includes(type) ? 1 : 10;
  form.elements.refreshMinutes.disabled = ['poetry', 'bookmark'].includes(type);
  $('#source-hint').textContent = type === 'bookmark' ? '网址书签最多 12 条，保存在本机、不联网；单列最多 6 条，超过后卡片自动两列。显示条数只限制卡片预览，用「书签管理」可访问全部网址并增删改、拖动排序。' : type === 'qimai' ? '需使用你有权访问的七麦数据接口。可留空稍后配置，不会以其他来源冒充七麦。' : type === 'rss' ? '支持 RSS、Atom 与 JSON Feed。Newsletter 请粘贴发布者的 RSS 地址（常见为网站地址 + /feed）。' : '返回 JSON 的接口；使用下面的字段映射匹配你的结构。';
  if (custom) $('#source-hint').textContent += ' 支持 HTTPS；HTTP 支持 10.0.20.141、localhost 和 127.0.0.1。';
  if (!editing && !custom) { const preset = DEFAULTS.sources.find(s => s.type === type); form.elements.name.value = preset?.name ?? (type === 'bookmark' ? '我的书签' : ''); form.elements.category.value = preset?.category ?? (type === 'bookmark' ? '导航' : '订阅'); if (type === 'weather') form.elements.refreshMinutes.value = 30; }
}
function showManager() {
  $('#source-list').innerHTML = config.sources.map((s, index) => `<div class="manage-row" data-id="${esc(s.id)}"><span class="source-icon ${s.type}">${icons[s.type]}</span><div><strong>${esc(s.name)}</strong><small>${esc(s.category)} · ${subtitles[s.type]}</small></div><button class="icon-button" data-manage="up" aria-label="上移 ${esc(s.name)}" ${index === 0 ? 'disabled' : ''}>↑</button><button class="icon-button" data-manage="down" aria-label="下移 ${esc(s.name)}" ${index === config.sources.length - 1 ? 'disabled' : ''}>↓</button><button class="icon-button" data-manage="edit" aria-label="编辑 ${esc(s.name)}">✎</button><button class="icon-button danger" data-manage="remove" aria-label="移除 ${esc(s.name)}">×</button></div>`).join('') || '<p class="field-hint">还没有订阅，添加第一个吧。</p>';
  if (!$('#manage-dialog').open) $('#manage-dialog').showModal();
}
async function moveSource(id, target) {
  const from = config.sources.findIndex(s => s.id === id);
  if (from < 0 || target < 0 || target >= config.sources.length || target === from) return;
  const [source] = config.sources.splice(from, 1); config.sources.splice(target, 0, source);
  await persist(); render();
}
function registerEvents() {
  document.querySelectorAll('.close').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
  $('#reader-dialog').addEventListener('close', () => { $('#reader-content').replaceChildren(); readerSource = null; });
  $('#reader-content').onclick = e => {
    const button = e.target.closest('[data-action]');
    if (button) void handleBookmarkAction(button);
  };
  $('#reader-content').addEventListener('dragstart', e => {
    const row = e.target.closest('[data-bookmark-sortable] li[data-bookmark-id]');
    if (!row) return;
    bookmarkDragId = row.dataset.bookmarkId;
    e.dataTransfer.setData('text/plain', bookmarkDragId);
    e.dataTransfer.effectAllowed = 'move';
    row.classList.add('dragging');
  });
  $('#reader-content').addEventListener('dragover', e => {
    if (bookmarkDragId && e.target.closest('[data-bookmark-sortable] li[data-bookmark-id]')) e.preventDefault();
  });
  $('#reader-content').addEventListener('drop', async e => {
    if (!bookmarkDragId) return;
    const row = e.target.closest('[data-bookmark-sortable] li[data-bookmark-id]');
    if (!row) return;
    e.preventDefault();
    const from = bookmarkDragId, to = row.dataset.bookmarkId; bookmarkDragId = null;
    if (from === to) return;
    const list = await getBookmarks();
    const fromIndex = list.findIndex(b => b.id === from), toIndex = list.findIndex(b => b.id === to);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = list.splice(fromIndex, 1); list.splice(toIndex, 0, moved);
    await saveBookmarks(list);
    await refreshBookmarkCards();
    toast('书签顺序已保存');
  });
  $('#reader-content').addEventListener('dragend', () => {
    bookmarkDragId = null;
    document.querySelectorAll('#reader-content .dragging').forEach(el => el.classList.remove('dragging'));
  });
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }));
  $('#add-source').onclick = () => openSource(); $('#manage').onclick = showManager;
  $('#manage-add').onclick = () => { $('#manage-dialog').close(); openSource(); };
  $('#home').onclick = e => { e.preventDefault(); category = '全部'; query = ''; $('#search').value = ''; render(); };
  $('#source-type').onchange = () => { citySearchVersion++; sourceFields(); };
  $('#weather-city').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#weather-search').click(); } };
  $('#weather-search').onclick = async () => {
    const name = $('#weather-city').value.trim();
    if (name.length < 2) { $('#weather-selection').textContent = '请输入至少两个字的城市名。'; return; }
    const version = ++citySearchVersion;
    $('#weather-results').innerHTML = '';
    $('#weather-selection').textContent = '正在搜索城市…';
    try {
      if (!await weatherPermission()) throw new Error('尚未授权天气服务，请再次搜索并允许访问。');
      const results = await searchCities(name);
      if (version !== citySearchVersion) return;
      weatherResults = results;
      $('#weather-selection').textContent = results.length ? '请选择具体城市：' : '没有找到城市，试试拼音或英文名称。';
      $('#weather-results').innerHTML = results.map((city, index) => `<button type="button" data-city="${index}">${esc(city.name)}<small>${esc(city.timezone)}</small></button>`).join('');
    } catch (err) { if (version === citySearchVersion) $('#weather-selection').textContent = errorMessage(err); }
  };
  $('#weather-results').onclick = e => {
    const button = e.target.closest('[data-city]'); if (!button) return;
    weatherLocation = weatherResults[Number(button.dataset.city)];
    $('#weather-selection').textContent = `已选择：${weatherLocation.name}`;
    $('#weather-results').innerHTML = '';
  };
  $('#filters').onclick = e => { const button = e.target.closest('[data-category]'); if (button) { category = button.dataset.category; render(); } };
  $('#search').oninput = e => { query = e.target.value.trim().toLowerCase(); render(); };
  document.addEventListener('keydown', e => { if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName) && !document.querySelector('dialog[open]')) { e.preventDefault(); $('#search').focus(); } });
  $('#refresh-all').onclick = async () => {
    $('#refresh-all').disabled = true;
    await Promise.allSettled(config.sources.map(s => refresh(s, true)));
    $('#refresh-all').disabled = false;
    toast('刷新完成，连接状态见各卡片');
  };
  $('#board').onclick = async e => {
    if (e.target.closest('#board-add')) return openSource();
    const button = e.target.closest('[data-action]'); if (!button) return;
    if (await handleBookmarkAction(button)) return;
    const source = config.sources.find(s => s.id === button.closest('[data-id]').dataset.id);
    if (button.dataset.action === 'weather-connect') { try { if (await weatherPermission()) await refresh(source, true); else toast('尚未授权天气服务'); } catch (err) { toast(errorMessage(err)); } return; }
    if (button.dataset.action === 'edit') return openSource(source);
    if (button.dataset.action === 'read') return openReader(source);
    if (button.dataset.action === 'shuffle' && source.type === 'poetry') return refresh(source, true);
    if (button.dataset.action === 'connect') { try { if (await permission(source.url, true)) await refresh(source, true); else toast('未授权，订阅未连接'); } catch (err) { toast(errorMessage(err)); } return; }
    const state = states.get(source.id);
    if (button.dataset.action === 'shuffle' && state?.data?.items.length) { await selectRandom(source, state); render(); } else await refresh(source, true);
  };
  $('#board').addEventListener('dragstart', e => { const header = e.target.closest('.card-header'); if (!header) return; dragId = header.closest('[data-id]').dataset.id; e.dataTransfer.setData('text/plain', dragId); e.dataTransfer.effectAllowed = 'move'; header.closest('.card').classList.add('dragging'); });
  $('#board').addEventListener('dragover', e => { if (dragId && e.target.closest('.card')) e.preventDefault(); });
  $('#board').addEventListener('drop', async e => { if (!dragId) return; e.preventDefault(); const target = e.target.closest('[data-id]')?.dataset.id; const id = dragId; dragId = null; if (target) await moveSource(id, config.sources.findIndex(s => s.id === target)); });
  $('#board').addEventListener('dragend', () => { dragId = null; document.querySelectorAll('.dragging').forEach(c => c.classList.remove('dragging')); });
  $('#source-form').onsubmit = async e => {
    e.preventDefault(); const form = e.target; const fields = Object.fromEntries(new FormData(form));
    try {
      const type = fields.type, preset = DEFAULTS.sources.find(s => s.type === type);
      const s = { id: editing || crypto.randomUUID(), type, name: fields.name, category: fields.category, url: ['rss','json','qimai'].includes(type) ? fields.url.trim() : '', home: fields.home || preset?.home || '', limit: Number(fields.limit) || (type === 'life' ? 1 : 10), refreshMinutes: Number(fields.refreshMinutes), mapping: {} };
      if (type === 'weather') s.location = weatherLocation || null;
      for (const key of ['items','title','url','description','meta']) s.mapping[key] = fields[`${key}Path`];
      const next = validateConfig({ ...config, sources: editing ? config.sources.map(old => old.id === editing ? s : old) : [...config.sources, s] });
      // Request directly in the submit gesture before any unrelated await.
      if (s.url && !await permission(sourceUrl(s.url), true)) throw new Error('站点访问未获授权，尚未保存。');
      $('#save-source').disabled = true;
      if (inFlight.has(s.id)) await inFlight.get(s.id);
      config = next; await persist();
      states.delete(s.id); await remove(`cache:${s.id}`);
      $('#source-dialog').close(); category = '全部'; render();
      void refresh(config.sources.find(i => i.id === s.id), true); toast(editing ? '数据源已更新' : '已添加到你的看板');
    } catch (err) { $('#source-error').textContent = errorMessage(err); }
    finally { $('#save-source').disabled = false; }
  };
  $('#bookmark-form').onsubmit = async e => {
    e.preventDefault();
    const fields = Object.fromEntries(new FormData(e.target));
    const item = validateBookmarkItem({ title: fields.title, url: fields.url, description: fields.note });
    const error = $('#bookmark-error'); error.textContent = '';
    if (!item) { error.textContent = '请输入有效的网址（仅支持 http / https）。'; return; }
    try {
      if (bookmarkEditingId) await updateBookmark(bookmarkEditingId, item);
      else await addBookmark({ title: item.title, url: item.url, description: item.description });
      const edited = Boolean(bookmarkEditingId);
      $('#bookmark-dialog').close();
      await refreshBookmarkCards();
      toast(edited ? '网址已更新' : '已添加网址');
    } catch (err) { error.textContent = errorMessage(err); }
  };
  $('#source-list').onclick = async e => {
    const button = e.target.closest('[data-manage]'); if (!button) return;
    const id = button.closest('[data-id]').dataset.id; const index = config.sources.findIndex(s => s.id === id); const source = config.sources[index];
    if (button.dataset.manage === 'edit') { $('#manage-dialog').close(); return openSource(source); }
    if (button.dataset.manage === 'remove') { config.sources.splice(index, 1); await persist(); states.delete(id); await remove(`cache:${id}`); await remove(`last:${id}`); render(); toast(`已移除「${source.name}」`); }
    else await moveSource(id, index + (button.dataset.manage === 'up' ? -1 : 1));
    showManager();
  };
  $('#settings').onclick = () => { $('#theme').value = config.theme; $('#columns').value = config.columns; $('#settings-dialog').showModal(); };
  $('#theme').onchange = async e => { config.theme = e.target.value; await persist(); applyAppearance(); };
  $('#columns').onchange = async e => { config.columns = Number(e.target.value); await persist(); applyAppearance(); };
  $('#export').onclick = async () => {
    try {
      const payload = buildExportPayload(config, await getBookmarks());
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'shiye-tab-config.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(`已导出配置与 ${payload.bookmarks.length} 条网址书签，请妥善保管私有订阅地址`);
    } catch (err) { toast(`导出失败：${errorMessage(err)}`); }
  };
  $('#import').onclick = () => $('#import-file').click();
  $('#import-file').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('配置文件不能超过 1 MiB。');
      const { config: next, bookmarks } = parseImportPayload(JSON.parse(await file.text()));
      await Promise.allSettled([...inFlight.values()]);
      // Write bookmarks before swapping config: a storage error must not leave a half-imported board.
      if (bookmarks) await saveBookmarks(bookmarks);
      const oldIds = config.sources.map(s => s.id); config = next; await persist();
      bookmarkTotal = (await getBookmarks()).length;
      for (const id of oldIds) { await remove(`cache:${id}`); await remove(`last:${id}`); }
      states.clear(); category = '全部'; query = ''; $('#search').value = ''; render(); $('#settings-dialog').close();
      void Promise.allSettled(config.sources.map(s => refresh(s)));
      toast(bookmarks ? `配置已导入，恢复 ${bookmarks.length} 条网址书签；新站点请在卡片上授权`
        : '配置已导入，现有书签保持不变；新站点请在卡片上授权');
    } catch (err) { toast(`导入失败：${errorMessage(err)}`); } finally { e.target.value = ''; }
  };
}
try {
  config = await getConfig();
} catch { config = cloneDefaults(); toast('已保存的配置无法读取，暂时显示默认看板。'); }
try { bookmarkTotal = (await getBookmarks()).length; } catch { bookmarkTotal = 0; }
$('#preview-note').hidden = extension;
registerEvents(); render();
setInterval(() => { if (!document.hidden) updateClocks(); }, 1000);
let lastWeatherCheck = 0;
function refreshWeatherIfNeeded() {
  updateClocks();
  if (document.hidden || Date.now() - lastWeatherCheck < 60000) return;
  lastWeatherCheck = Date.now();
  for (const source of config.sources.filter(s => s.type === 'weather' && s.location)) {
    const state = states.get(source.id);
    if (!state?.data || Date.now() - state.data.fetchedAt >= source.refreshMinutes * 60000) void refresh(source);
  }
}
setInterval(refreshWeatherIfNeeded, 60000);
document.addEventListener('visibilitychange', refreshWeatherIfNeeded);
void Promise.allSettled(config.sources.map(s => refresh(s)));
window.addEventListener('unhandledrejection', e => { e.preventDefault(); toast(`操作失败：${errorMessage(e.reason)}`); });
