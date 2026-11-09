import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cloneDefaults, validateConfig, safeUrl, atPath, randomOther } from '../src/model.js';
test('导入拒绝危险链接、重复 ID 和不支持的版本', () => {
  const c = cloneDefaults();
  c.sources.push({ id: 'custom', type: 'rss', name: 'x', url: 'javascript:alert(1)' });
  assert.throws(() => validateConfig(c));
  const duplicate = cloneDefaults(); duplicate.sources.push(duplicate.sources[0]);
  assert.throws(() => validateConfig(duplicate));
  assert.throws(() => validateConfig({ ...cloneDefaults(), version: 2 }));
  assert.equal(safeUrl('data:text/html,test'), '');
  assert.equal(safeUrl('https://user:password@example.org'), '');
  assert.equal(atPath({}, '__proto__.constructor'), undefined);
});
test('随机抽样避开上一次条目，单条数据仍可用', () => {
  const items = [{ url: 'a' }, { url: 'b' }];
  assert.equal(randomOther(items, 'a', () => 0).url, 'b');
  assert.equal(randomOther([items[0]], 'a', () => 0).url, 'a');
  const chapters = [{ url: 'child-1', meta: '孩子' }, { url: 'child-2', meta: '孩子' }, { url: 'time', meta: '时间' }, { url: 'money', meta: '省钱' }];
  assert.equal(randomOther(chapters, 'child-1', () => 0).url, 'time');
  assert.equal(randomOther(chapters, 'child-1', () => 0.99).url, 'money');
  assert.equal(randomOther(chapters.slice(0, 2), 'child-1', () => 0).url, 'child-2');
});

test('离线诗集保留完整对句并统一简体诗句、作者与篇名', async () => {
  const { loadSource } = await import('../src/sources.js');
  const { items } = await loadSource(cloneDefaults().sources.find(s => s.type === 'poetry'));
  assert.equal(items.length, 1317);
  assert.equal(new Set(items.map(item => item.id)).size, items.length);
  for (const item of items) {
    assert.match(item.title, /^(?:[\u3400-\u9fff]{5}，[\u3400-\u9fff]{5}|[\u3400-\u9fff]{7}，[\u3400-\u9fff]{7})[。？！]$/);
    assert.equal(item.description, `${item.author} ${item.poemTitle}`);
    assert.doesNotMatch(`${item.title}${item.author}${item.poemTitle}`, /[獨彈復長嘯維裏館黃鸛樓詩雲風後國無愛]/);
  }
  assert.deepEqual(items.find(item => item.title === '独坐幽篁里，弹琴复长啸。'), {
    id: '12', title: '独坐幽篁里，弹琴复长啸。', author: '王维', poemTitle: '竹里馆', description: '王维 竹里馆',
  });
  assert.ok(items.some(item => item.title === '白日依山尽，黄河入海流。' && item.author === '王之涣' && item.poemTitle === '登鹳雀楼'));
});

test('天气城市配置校验、缓存隔离与数据解析', async () => {
  const { configKey } = await import('../src/model.js');
  const { parseWeather, weatherCondition, clockParts } = await import('../src/weather.js');
  const config = cloneDefaults();
  const source = config.sources.find(s => s.type === 'weather');
  source.location = { name: '杭州', latitude: 30.27, longitude: 120.15, timezone: 'Asia/Shanghai' };
  assert.deepEqual(validateConfig(config).sources[0].location, source.location);
  assert.notEqual(configKey(source), configKey({ ...source, location: { ...source.location, latitude: 31 } }));
  for (const patch of [{ latitude: 91 }, { longitude: '120' }, { timezone: 'invalid' }, { timezone: '' }]) {
    assert.throws(() => validateConfig({ ...config, sources: [{ ...source, location: { ...source.location, ...patch } }] }));
  }
  const data = parseWeather({ current: { time: 1791601200, temperature_2m: 0, weather_code: 0, is_day: 0, relative_humidity_2m: 0, wind_speed_10m: 0 } });
  assert.equal(data.temperature, 0); assert.equal(data.humidity, 0); assert.equal(data.wind, 0); assert.equal(data.high, null);
  assert.throws(() => parseWeather({ current: { temperature_2m: null } }));
  assert.equal(weatherCondition(0, false).kind, 'moon');
  assert.equal(weatherCondition(99).kind, 'storm');
  assert.equal(weatherCondition(123).kind, 'unknown');
  const date = new Date('2026-01-01T16:00:00Z');
  assert.equal(clockParts('Asia/Shanghai', date).hour, '00');
  assert.match(clockParts('Asia/Shanghai', date).date, /1月2日/);
});


test('网址书签类型、URL 规范化与字段清洗', async () => {
  const { TYPES, validateConfig, validateBookmarkItem, normalizeBookmarkUrl, BOOKMARKS_MAX } = await import('../src/model.js');
  assert.ok(TYPES.includes('bookmark'));
  assert.equal(validateConfig(cloneDefaults()).sources.length, 5);
  const c = cloneDefaults();
  c.sources.push({ id: 'links', type: 'bookmark', name: '我的书签', category: '导航', limit: 12, refreshMinutes: 60 });
  const source = validateConfig(c).sources.at(-1);
  assert.equal(source.type, 'bookmark');
  assert.equal(source.limit, 12);
  assert.equal(source.url, '');
  assert.equal(normalizeBookmarkUrl('example.com'), 'https://example.com/');
  assert.equal(normalizeBookmarkUrl('localhost:3000/docs'), 'https://localhost:3000/docs');
  assert.equal(normalizeBookmarkUrl('https://example.com/a?x=1&y=2'), 'https://example.com/a?x=1&y=2');
  for (const bad of ['javascript:alert(1)', 'data:text/html,x', 'chrome://settings', 'https://user:pw@example.org', '']) {
    assert.equal(normalizeBookmarkUrl(bad), '');
  }
  assert.equal(validateBookmarkItem(null), null);
  assert.equal(validateBookmarkItem({ title: '没有网址' }), null);
  const item = validateBookmarkItem({ title: '  MDN  ', url: 'developer.mozilla.org', description: 'x'.repeat(1500), createdAt: 'bad', updatedAt: 1 });
  assert.equal(item.title, 'MDN');
  assert.equal(item.url, 'https://developer.mozilla.org/');
  assert.equal(item.description.length, 1000);
  assert.equal(item.id, 'https://developer.mozilla.org/');
  assert.equal(typeof item.createdAt, 'number');
  assert.equal(item.updatedAt, 1);
  assert.equal(validateBookmarkItem({ url: 'https://example.org' }).title, 'example.org');
  assert.equal(BOOKMARKS_MAX, 200);
});

test('书签增删改、脏数据清洗与上限，适配器保留全部条目', async () => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: k => store.has(k) ? store.get(k) : null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: k => store.delete(k),
  };
  try {
    const { getBookmarks, saveBookmarks, addBookmark, updateBookmark, removeBookmark } = await import('../src/storage.js');
    const { loadSource } = await import('../src/sources.js');
    assert.deepEqual(await getBookmarks(), []);
    const first = await addBookmark({ title: 'MDN', url: 'developer.mozilla.org', description: 'Web 文档' });
    assert.equal(first.length, 1);
    const id = first[0].id;
    assert.ok(id && id !== first[0].url, 'new bookmarks get a stable id independent of the URL');
    await assert.rejects(() => addBookmark({ title: '重复', url: 'https://developer.mozilla.org/' }), /已经/);
    assert.equal((await addBookmark({ title: '示例站', url: 'https://example.com/' })).length, 2);
    const updated = await updateBookmark(id, { title: 'MDN 中文', url: 'https://developer.mozilla.org/zh-CN/', description: '中文文档' });
    const changed = updated.find(b => b.id === id);
    assert.equal(changed.title, 'MDN 中文');
    assert.equal(changed.url, 'https://developer.mozilla.org/zh-CN/');
    assert.equal(changed.description, '中文文档');
    assert.equal(changed.createdAt, first[0].createdAt);
    assert.ok(changed.updatedAt >= first[0].updatedAt);
    await assert.rejects(() => updateBookmark(id, { url: 'https://example.com/' }), /已经/);
    await assert.rejects(() => updateBookmark(id, { url: 'javascript:alert(1)' }), /有效/);
    const removed = await removeBookmark(id);
    assert.deepEqual(removed.map(b => b.title), ['示例站']);
    store.set('bookmarks', JSON.stringify([
      { title: '脏数据', url: 'data:text/html,x' }, null, 7,
      { title: 'A', url: 'https://a.example/' }, { title: 'A2', url: 'https://a.example/' },
    ]));
    assert.deepEqual((await getBookmarks()).map(b => b.title), ['A'], 'invalid and duplicate entries are dropped on read');
    const many = Array.from({ length: 205 }, (_, i) => ({ title: `条目 ${i}`, url: `https://example.com/${i}` }));
    assert.equal((await saveBookmarks(many)).length, 200);
    assert.equal((await getBookmarks()).length, 200);
    await assert.rejects(() => addBookmark({ title: '溢出', url: 'https://overflow.example/' }), /最多/);
    await saveBookmarks([
      { title: 'A', url: 'https://a.example/' },
      { title: 'B', url: 'https://b.example/' },
      { title: 'C', url: 'https://c.example/' },
    ]);
    const data = await loadSource({ type: 'bookmark', limit: 2 });
    assert.deepEqual(data.items.map(i => i.title), ['A', 'B', 'C']);
    assert.equal(typeof data.fetchedAt, 'number');
    // IDs from external backups must stay unique and stable across repeated reads.
    store.set('bookmarks', JSON.stringify([
      { id: 'same', title: 'A', url: 'https://a.example/' },
      { id: 'same', title: 'B', url: 'https://b.example/' },
      { id: 'same-2', title: 'C', url: 'https://c.example/' },
    ]));
    const repaired = await getBookmarks();
    assert.equal(new Set(repaired.map(b => b.id)).size, 3);
    assert.deepEqual((await getBookmarks()).map(b => b.id), repaired.map(b => b.id));
    await updateBookmark(repaired[1].id, { title: 'B 修改', url: repaired[1].url });
    assert.deepEqual((await getBookmarks()).map(b => b.title), ['A', 'B 修改', 'C']);
    await removeBookmark(repaired[1].id);
    assert.deepEqual((await getBookmarks()).map(b => b.title), ['A', 'C']);
  } finally { delete globalThis.localStorage; }
});


test('导出载荷保持 v1 配置格式，并携带清洗后的网址书签', async () => {
  const { buildExportPayload, validateConfig } = await import('../src/model.js');
  const { validateConfig: validateLegacyConfig } = await import('./fixtures/model-before-bookmarks.js');
  const payload = buildExportPayload(cloneDefaults(), [
    { title: 'MDN', url: 'developer.mozilla.org' },
    { title: '危险', url: 'javascript:alert(1)' },
    { title: '重复', url: 'https://developer.mozilla.org/' },
    null,
  ]);
  assert.deepEqual(Object.keys(payload).sort(), ['bookmarks', 'columns', 'sources', 'theme', 'version']);
  assert.equal(payload.version, 1);
  assert.equal(payload.sources.length, 5);
  assert.deepEqual(payload.bookmarks.map(b => b.url), ['https://developer.mozilla.org/']);
  // The actual old validator ignores bookmarks only when every source type is supported.
  assert.doesNotThrow(() => validateLegacyConfig(payload));
  assert.equal(validateConfig(payload).sources.length, 5);
  assert.equal('bookmarks' in validateConfig(payload), false);
  assert.equal(JSON.parse(JSON.stringify(payload)).bookmarks.length, 1, 'payload survives a JSON round trip');
  const withCard = cloneDefaults();
  withCard.sources.push({ id: 'links', type: 'bookmark', name: '我的书签', limit: 1 });
  const fullPayload = buildExportPayload(withCard, payload.bookmarks);
  assert.equal(validateConfig(fullPayload).sources.at(-1).type, 'bookmark');
  assert.throws(() => validateLegacyConfig(fullPayload), /数据源类型或 ID 无效/);
});

test('导入载荷兼容旧格式、新格式与脏字段', async () => {
  const { parseImportPayload, BOOKMARKS_MAX } = await import('../src/model.js');
  const legacy = cloneDefaults();
  assert.equal(parseImportPayload(legacy).bookmarks, null, 'legacy file: leave local bookmarks alone');
  assert.equal(parseImportPayload(legacy).config.version, 1);
  assert.equal(parseImportPayload({ ...legacy, bookmarks: 'oops' }).bookmarks, null);
  assert.equal(parseImportPayload({ ...legacy, bookmarks: { 0: 'x' } }).bookmarks, null);
  const dirty = parseImportPayload({ ...legacy, bookmarks: [
    { title: '', url: '' },
    { title: 'A', url: 'example.com' },
    { title: 'B', url: 'https://example.com/' },
    { title: 'X', url: 'data:text/html,x' },
    { title: '带账密', url: 'https://u:p@example.org/' },
  ] });
  assert.deepEqual(dirty.bookmarks.map(b => b.url), ['https://example.com/'], 'invalid, unsafe and duplicate URLs are dropped');
  assert.deepEqual(parseImportPayload({ ...legacy, bookmarks: [] }).bookmarks, [], 'empty array is an explicit empty state');
  const many = Array.from({ length: 205 }, (_, i) => ({ title: `t${i}`, url: `https://e.example/${i}` }));
  assert.equal(parseImportPayload({ ...legacy, bookmarks: many }).bookmarks.length, BOOKMARKS_MAX);
  const sameId = parseImportPayload({ ...legacy, bookmarks: [
    { id: 'same', url: 'https://a.example/' }, { id: 'same', url: 'https://b.example/' },
  ] }).bookmarks;
  assert.equal(sameId.length, 2);
  assert.notEqual(sameId[0].id, sameId[1].id);
  assert.throws(() => parseImportPayload({ ...legacy, version: 2 }), /配置格式无效/);
});
