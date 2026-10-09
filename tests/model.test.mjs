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
