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
