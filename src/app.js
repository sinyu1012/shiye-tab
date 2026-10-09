import { DEFAULTS, cloneDefaults, esc, safeUrl, sourceUrl, validateConfig, randomOther, configKey } from './model.js';
import { read, write, remove, getConfig, saveConfig, permission, extension } from './storage.js';
import { loadSource } from './sources.js';
const $ = s => document.querySelector(s);
const states = new Map(); const inFlight = new Map();
let config, category = '全部', query = '', editing = null, dragId = null, toastTimer;
const icons = {
  life: '✳',
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.86c-2.78.61-3.37-1.18-3.37-1.18-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02A9.6 9.6 0 0 1 12 6.81a9.6 9.6 0 0 1 2.5.34c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85v2.75c0 .27.18.58.69.48A10 10 0 0 0 12 2Z"/></svg>',
  apple: '<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m8 3 12 18M15 3 3 21M4 15h16"/></svg>',
  qimai: '七', rss: '◔', json: '{ }',
};
const subtitles = { life: 'HowToLiveBetter', github: '本周趋势', apple: '中国 · iPhone 免费榜', qimai: '中国 · iPhone 免费总榜', rss: '订阅更新', json: '结构化数据' };
const link = (url, label, cls = '') => safeUrl(url) ? `<a class="${cls}" href="${esc(safeUrl(url))}" target="_blank" rel="noopener noreferrer">${label}</a>` : `<span class="${cls}">${label}</span>`;
function toast(message) { $('#toast').textContent = message; $('#toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').hidden = true, 3800); }
function errorMessage(err) { return ['TimeoutError', 'AbortError'].includes(err.name) ? '连接超时，请稍后重试。' : err.message === 'Failed to fetch' ? '网络连接失败，请检查网络与站点访问权限。' : err.message; }
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
function card(source) {
  const state = states.get(source.id) || { status: 'loading' };
  const data = state.data;
  const items = source.type === 'life' ? (state.selected ? [state.selected] : []) : data?.items || [];
  const shown = query ? items.filter(i => `${i.title} ${i.description}`.toLowerCase().includes(query)) : items;
  let content = '';
  if (source.type === 'qimai' && !source.url) content = `<div class="empty-card"><span class="empty-glyph">↗</span><h3>接入你的七麦榜单</h3><p>连接有权访问的 JSON 接口，<br>让国内今日 Top 10 来到新标签页。</p><button class="button secondary" data-action="edit">配置数据接口</button><small>当前公开接口限制直接访问</small></div>`;
  else if (state.status === 'loading' && !data) content = `<div class="skeleton" aria-label="正在读取"><i></i><i></i><i></i><i></i><i></i><p>正在读取好内容…</p></div>`;
  else if (state.status === 'error' && !data) content = `<div class="empty-card"><span class="empty-glyph">☁</span><h3>暂时没有连上</h3><p>${esc(state.error)}</p><div class="empty-actions"><button class="button secondary" data-action="refresh">重新读取</button>${source.url ? '<button class="button secondary" data-action="connect">连接数据源</button>' : ''}</div></div>`;
  else if (!shown.length) content = `<div class="empty-card"><span class="empty-glyph">○</span><h3>${query ? '没有匹配的内容' : '暂时没有新内容'}</h3><p>${query ? '试试其他关键词。' : '数据源已连接，等待下一次更新。'}</p></div>`;
  else if (source.type === 'life') {
    const i = shown[0];
    content = `<div class="life-content"><div class="life-label"><span>给生活的一点灵感</span><span>↗</span></div><p class="chapter">${esc(i.meta)}</p><h3>${link(i.url, esc(i.title.replace(/^\d+\.\s*/, '')))}</h3><p class="life-description">${esc(i.description)}</p>${i.cost ? `<div class="life-cost"><span>投入</span><p>${esc(i.cost)}</p></div>` : ''}<div class="life-bottom"><span class="evidence">证据等级 ${esc(i.evidence || '未标注')}</span>${link(i.url, '读完整条目 ↗')}</div>${i.note ? `<details class="life-note"><summary>原文备注与限制</summary><p>${esc(i.note)}</p></details>` : ''}<div class="attribution">摘自 eternity4719 / HowToLiveBetter · ${link('https://creativecommons.org/licenses/by/4.0/deed.zh-hans', 'CC BY 4.0')}<br>节选原文，未改写；更多条件及来源见完整条目。</div></div>`;
  } else if (source.limit === 1) {
    const i = shown[0];
    content = `<div class="reading-content"><div class="reading-label"><span>${esc(subtitles[source.type])}</span>${safeUrl(i.url) ? link(i.url, '<span role="img" aria-label="打开原文">↗</span>', 'reading-arrow') : ''}</div>${i.meta ? `<p class="reading-meta">${esc(i.meta)}</p>` : ''}<h3>${link(i.url, esc(i.title))}</h3>${i.description ? `<p class="reading-description">${esc(i.description)}</p>` : ''}${safeUrl(i.url) ? `<div class="reading-bottom">${link(i.url, '阅读全文 ↗')}</div>` : ''}</div>`;
  } else content = `<ol class="item-list ${source.type === 'github' ? 'github-list' : ''}">${shown.map((i, index) => `<li><span class="rank rank-${index + 1}">${String(index + 1).padStart(2, '0')}</span><div class="item-body">${link(i.url, esc(i.title), 'item-title')}${i.description ? `<p title="${esc(i.description)}">${esc(i.description)}</p>` : ''}</div>${i.meta && source.type !== 'apple' ? `<span class="item-meta">${esc(i.meta)}</span>` : ''}</li>`).join('')}</ol>`;
  const stale = state.status === 'stale';
  return `<article data-type="${source.type}" class="card ${state.status === 'unconfigured' ? 'unconfigured-card' : ''} ${source.type === 'life' ? 'life-card' : source.limit === 1 ? 'reading-card' : ''}" data-id="${esc(source.id)}" aria-label="${esc(source.name)}"><header class="card-header" draggable="true"><span class="source-icon ${source.type}">${icons[source.type]}</span><div class="card-heading"><h2>${esc(source.name)}</h2><span>${subtitles[source.type]}</span></div><div class="card-tools">${source.type === 'life' ? '<button class="shuffle" data-action="shuffle" title="换一条">换一条 ↻</button>' : ''}<button class="icon-button card-menu" data-action="edit" title="编辑数据源" aria-label="编辑 ${esc(source.name)}">⋯</button></div></header><div class="card-content">${content}</div>${stale ? `<div class="stale-note" role="status">更新失败，显示旧缓存 · ${esc(state.error)}</div>` : ''}<footer class="card-footer"><span class="update-status ${stale ? 'stale' : ''}" title="${data ? new Date(data.fetchedAt).toLocaleString('zh-CN') : ''}"><i></i>${source.type === 'qimai' && !source.url ? '等待接入' : state.status === 'loading' ? '正在更新…' : `${stale ? '旧缓存 · ' : ''}${age(data?.fetchedAt)}`}</span><div>${link(source.home || data?.sourceUrl || source.url, '原站 ↗')}<button class="icon-button refresh-icon" data-action="refresh" aria-label="刷新 ${esc(source.name)}" ${state.status === 'loading' ? 'disabled' : ''}>↻</button></div></footer></article>`;
}
function render() {
  drawFilters();
  const sources = config.sources.filter(s => category === '全部' || s.category === category);
  $('#board').innerHTML = sources.map(card).join('') + (!query ? `<button class="add-card" id="board-add"><span>＋</span><strong>添加你关心的内容</strong><p>RSS · Newsletter · JSON</p><b>把你关心的世界，收进这一页 ↗</b></button>` : '');
  applyAppearance();
}
async function selectLife(source, state) {
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
  if (source.type === 'qimai' && !source.url) { states.set(source.id, { status: 'unconfigured' }); render(); return; }
  const key = configKey(source);
  const current = () => config.sources.some(s => s.id === source.id && configKey(s) === key);
  let cached;
  try { cached = await read(`cache:${source.id}`); } catch { /* Network can still succeed if cache cannot be read. */ }
  if (cached?.key !== key) cached = null;
  const state = { status: 'loading', data: cached?.data };
  if (state.data && source.type === 'life') await selectLife(source, state);
  if (!current()) return;
  states.set(source.id, state); render();
  if (!force && cached && Date.now() - cached.data.fetchedAt < source.refreshMinutes * 60000) { state.status = 'ready'; render(); return; }
  try {
    const data = await loadSource(source);
    if (!current()) return;
    state.data = data; state.status = 'ready';
    if (source.type === 'life') await selectLife(source, state);
    await write(`cache:${source.id}`, { key, data });
  } catch (err) { state.status = state.data ? 'stale' : 'error'; state.error = errorMessage(err); }
  if (current()) render();
}
function openSource(source) {
  editing = source?.id || null; const form = $('#source-form'); form.reset();
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
  $('#url-fields').hidden = !custom; $('#mapping-fields').hidden = !['json','qimai'].includes(type);
  form.elements.url.required = ['rss','json'].includes(type);
  form.elements.limit.disabled = ['life','apple','qimai'].includes(type);
  if (form.elements.limit.disabled) form.elements.limit.value = type === 'life' ? 1 : 10;
  $('#source-hint').textContent = type === 'qimai' ? '需使用你有权访问的七麦数据接口。可留空稍后配置，不会以其他来源冒充七麦。' : type === 'rss' ? '支持 RSS、Atom 与 JSON Feed。Newsletter 请粘贴发布者的 RSS 地址（常见为网站地址 + /feed）。' : '返回 JSON 的接口；使用下面的字段映射匹配你的结构。';
  $('#source-hint').textContent += ' 支持 HTTPS；HTTP 支持 10.0.20.141、localhost 和 127.0.0.1。';
  if (!editing && !custom) { const preset = DEFAULTS.sources.find(s => s.type === type); form.elements.name.value = preset.name; form.elements.category.value = preset.category; }
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
  document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } }));
  $('#add-source').onclick = () => openSource(); $('#manage').onclick = showManager;
  $('#manage-add').onclick = () => { $('#manage-dialog').close(); openSource(); };
  $('#home').onclick = e => { e.preventDefault(); category = '全部'; query = ''; $('#search').value = ''; render(); };
  $('#source-type').onchange = sourceFields;
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
    const source = config.sources.find(s => s.id === button.closest('[data-id]').dataset.id);
    if (button.dataset.action === 'edit') return openSource(source);
    if (button.dataset.action === 'connect') { try { if (await permission(source.url, true)) await refresh(source, true); else toast('未授权，订阅未连接'); } catch (err) { toast(errorMessage(err)); } return; }
    const state = states.get(source.id);
    if (button.dataset.action === 'shuffle' && state?.data?.items.length) { await selectLife(source, state); render(); } else await refresh(source, true);
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
  $('#export').onclick = () => { const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'shiye-tab-config.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('配置已导出，请妥善保管私有订阅地址'); };
  $('#import').onclick = () => $('#import-file').click();
  $('#import-file').onchange = async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 256 * 1024) throw new Error('配置文件不能超过 256 KiB。');
      const next = validateConfig(JSON.parse(await file.text()));
      await Promise.allSettled([...inFlight.values()]);
      const oldIds = config.sources.map(s => s.id); config = next; await persist();
      for (const id of oldIds) { await remove(`cache:${id}`); await remove(`last:${id}`); }
      states.clear(); category = '全部'; query = ''; $('#search').value = ''; render(); $('#settings-dialog').close();
      void Promise.allSettled(config.sources.map(s => refresh(s))); toast('配置已导入，新站点请在卡片上授权');
    } catch (err) { toast(`导入失败：${errorMessage(err)}`); } finally { e.target.value = ''; }
  };
}
try {
  config = await getConfig();
} catch { config = cloneDefaults(); toast('已保存的配置无法读取，暂时显示默认看板。'); }
$('#preview-note').hidden = extension;
registerEvents(); render();
void Promise.allSettled(config.sources.map(s => refresh(s)));
window.addEventListener('unhandledrejection', e => { e.preventDefault(); toast(`操作失败：${errorMessage(e.reason)}`); });
