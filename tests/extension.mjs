import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { mkdir, mkdtemp, rm, writeFile, readFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
const profile = await mkdtemp(resolve(tmpdir(), 'shiye-test-'));
const path = resolve(profile, 'extension'); const live = process.argv.includes('--live');
await cp(resolve('dist'), path, { recursive: true });
// Headless Chromium cannot confirm native optional-host dialogs. Pregrant only
// the weather origins in this temporary test copy; the shipped manifest is unchanged.
const testManifest = JSON.parse(await readFile(resolve(path, 'manifest.json'), 'utf8'));
testManifest.host_permissions.push('https://geocoding-api.open-meteo.com/*', 'https://api.open-meteo.com/*');
await writeFile(resolve(path, 'manifest.json'), JSON.stringify(testManifest));
await mkdir('artifacts', { recursive: true });
const ctx = await chromium.launchPersistentContext(profile, {
  channel: 'chromium', headless: true, viewport: { width: 1440, height: 1100 },
  args: [`--disable-extensions-except=${path}`, `--load-extension=${path}`],
});
const failures = []; const log = [];
ctx.on('page', p => p.on('pageerror', e => failures.push(e.message)));
if (!live) {
  await ctx.route('https://raw.githubusercontent.com/**', route => {
    const readme = route.request().url().endsWith('README.md');
    if (route.request().url().endsWith('02-sleep.md')) return route.fulfill({ status: 200, body: '# 2. 睡眠\n\n### 1. 固定睡眠时间\n- 说人话：保持规律的作息。\n- 成本：安排好时间。\n- 证据等级：B\n' });
    route.fulfill({ status: 200, body: readme ? '[3. 精力](book/03-energy.md)\n[2. 睡眠](book/02-sleep.md)' : '# 3. 精力\n\n### 1. 关掉不必要的通知\n- 说人话：把注意力留给当前的事情。\n- 成本：几分钟设置。\n- 证据等级：B\n- 备注：测试内容\n\n### 2. 一次专注一件事\n- 说人话：给自己一段不被打断的时间。\n- 成本：不花钱。\n- 证据等级：B\n' });
  });
  await ctx.route('https://github.com/trending?since=weekly', route => route.fulfill({ status: 200, body: '<article class="Box-row"><h2><a href="/sample/repo">sample / repo</a></h2><p>A test repository</p><span>1,234 stars this week</span></article>' }));
  await ctx.route('https://itunes.apple.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ feed: { entry: Array.from({ length: 10 }, (_, i) => ({ 'im:name': { label: `测试应用 ${i+1}` }, link: { attributes: { href: 'https://apps.apple.com/cn/app/id123' } }, category: { attributes: { label: '效率' } } })) } }) }));
}
try {
  const page = await ctx.newPage();
  if (!live) await page.clock.install();
  await page.goto('chrome://newtab/');
  await page.waitForSelector('#board .card');
  const extensionUrl = page.url();
  assert.ok(extensionUrl.startsWith('chrome-extension://'), extensionUrl);
  log.push('Manifest V3 loaded; chrome://newtab redirected to extension.');
  await page.waitForFunction(() => !document.querySelector('.skeleton'), { timeout: 45000 });
  await page.waitForFunction(() => ![...document.querySelectorAll('.update-status')].some(n => n.textContent.includes('正在更新')), { timeout: 45000 });
  assert.equal(await page.locator('.card').count(), 5);
  assert.equal(await page.locator('[data-id="qimai"]').count(), 0);
  const statuses = await page.locator('.card').evaluateAll(cards => cards.map(c => ({ name: c.getAttribute('aria-label'), items: c.querySelectorAll('.item-list li').length, life: Boolean(c.querySelector('.life-description')), status: c.querySelector('.update-status').textContent, error: c.querySelector('.empty-card p')?.textContent })));
  log.push(statuses);
  if (live) {
    assert.ok(statuses.find(s => s.name === '好好生活').life, 'Live life source should succeed');
    assert.ok(statuses.find(s => s.name === 'GitHub').items > 0, 'Live GitHub should succeed');
    assert.equal(statuses.find(s => s.name === 'App Store').items, 10);
  }
  if (!live) {
    await page.locator('.weather-clock').waitFor();
    assert.match(await page.locator('.weather-clock').textContent(), /\d{2}:\d{2}/);
    assert.equal(await page.locator('.weather-temperature').innerText(), '—等待天气');
    const fixture = { current: { time: Math.floor(Date.now() / 1000), temperature_2m: 24, apparent_temperature: 25, relative_humidity_2m: 65, wind_speed_10m: 8, weather_code: 2, is_day: 1 }, daily: { temperature_2m_max: [27], temperature_2m_min: [18] } };
    await ctx.route('https://geocoding-api.open-meteo.com/**', r => r.fulfill({ json: { results: [{ name: '杭州', admin1: '浙江', country: '中国', latitude: 30.27, longitude: 120.15, timezone: 'Asia/Shanghai' }] } }));
    await ctx.route('https://api.open-meteo.com/**', r => r.fulfill({ json: fixture }));
    await page.locator('.weather-location').click();
    await page.locator('#weather-city').fill('杭州');
    await page.locator('#weather-search').click();
    await page.locator('[data-city="0"]').click();
    await page.getByRole('button', { name: '保存设置', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.weather-temperature').textContent.includes('24°'));
    assert.match(await page.locator('.weather-location').innerText(), /杭州/);
    assert.equal(await page.locator('.weather-card').getAttribute('data-timezone'), 'Asia/Shanghai');
    const weatherFont = await page.evaluate(async () => {
      await document.fonts.load('700 120px "Barlow Condensed"');
      return [...document.fonts].some(font => font.family === 'Barlow Condensed' && font.status === 'loaded');
    });
    assert.equal(weatherFont, true, 'Bundled clock font loads in the extension');
    assert.ok(await page.locator('.weather-art').evaluate(el => el.getBBox().width > 0), 'Local SVG symbol renders');
    for (const theme of ['light', 'dark']) {
      await page.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
      await page.locator('.weather-card').screenshot({ path: `artifacts/weather-${theme}.png` });
    }
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.weather-temperature').textContent.includes('24°'));
    await ctx.route('https://api.open-meteo.com/**', r => r.fulfill({ status: 503, body: 'Unavailable' }));
    await page.getByRole('button', { name: '刷新 此刻', exact: true }).click();
    await page.locator('.weather-card .stale-note').waitFor();
    assert.match(await page.locator('.weather-temperature').innerText(), /24°/);
    assert.match(await page.locator('.weather-card .update-status').innerText(), /旧天气/);
    await page.locator('.weather-card').screenshot({ path: 'artifacts/weather-stale.png' });
    assert.ok(await page.locator('.weather-card .card-content').evaluate(el => el.scrollHeight <= el.clientHeight), 'Weather metrics remain visible in stale state');
    await page.evaluate(async () => { await chrome.storage.local.remove('cache:weather'); });
    await page.reload();
    await page.locator('.weather-card .stale-note').waitFor();
    assert.match(await page.locator('.weather-clock').textContent(), /\d{2}:\d{2}/);
    assert.equal(await page.locator('.weather-temperature').innerText(), '—等待天气');
    // Exercise the denial path without an unautomatable native permission prompt.
    await page.evaluate(() => { window.originalWeatherRequest = chrome.permissions.request; chrome.permissions.request = async () => false; });
    await page.locator('.weather-retry').click();
    await page.getByText('尚未授权天气服务', { exact: true }).waitFor();
    await page.evaluate(() => { chrome.permissions.request = window.originalWeatherRequest; });
    await ctx.unroute('https://api.open-meteo.com/**');
    await ctx.route('https://api.open-meteo.com/**', r => r.fulfill({ json: fixture }));
    await page.getByRole('button', { name: '刷新 此刻', exact: true }).click();
    await page.waitForFunction(() => !document.querySelector('.weather-card .stale-note'));
    const previousTime = await page.locator('.weather-clock').textContent();
    await page.clock.fastForward(61000);
    assert.notEqual(await page.locator('.weather-clock').textContent(), previousTime, 'Open tab clock advances without a board rerender');
    log.push('Weather (pregranted test origins; native consent not automated): city search and selection, persisted timezone, data display, cached fallback and recovery verified.');
    // A still-fresh legacy single-chapter cache must be replaced on upgrade.
    await page.evaluate(async () => {
      const { getConfig, read, write } = await import('./src/storage.js');
      const source = (await getConfig()).sources.find(s => s.id === 'life');
      const cached = await read('cache:life');
      cached.key = JSON.stringify([source.type, source.url, source.limit, source.mapping]);
      cached.data.items = cached.data.items.filter(i => i.meta === '2. 睡眠');
      await write('cache:life', cached);
    });
    await page.reload();
    await page.waitForFunction(async () => {
      const { read } = await import('./src/storage.js');
      const cached = await read('cache:life');
      return new Set(cached?.data.items.map(i => i.meta)).size === 2 &&
        document.querySelector('.life-content h3') && !document.querySelector('.skeleton');
    });
    log.push('Fresh legacy life cache replaced with entries from every fixture chapter.');
  }
  const layout = await page.evaluate(() => ({
    toolbar: document.querySelector('.topbar').getBoundingClientRect().height,
    boardTop: document.querySelector('#board').getBoundingClientRect().top,
    cardHeight: document.querySelector('[data-id="github"]').getBoundingClientRect().height,
  }));
  assert.equal(layout.toolbar, 64);
  assert.equal(layout.boardTop, 88);
  assert.equal(layout.cardHeight, 520);
  log.push({ compactLayout: layout });
  await page.screenshot({ path: `artifacts/${live ? 'live' : 'tested'}-dashboard.png`, fullPage: true });
  await page.getByRole('button', { name: '开发', exact: true }).click();
  assert.equal(await page.locator('.card').count(), 1);
  await page.getByRole('link', { name: '拾页首页' }).click();
  assert.equal(await page.locator('.card').count(), 5);
  log.push('Toolbar filters and brand home shortcut verified.');
  const firstLife = await page.locator('.life-content h3').innerText();
  const firstChapter = await page.locator('.life-content .chapter').innerText();
  await page.getByRole('button', { name: '换一条' }).click();
  // Shuffle awaits chrome.storage before rendering; clicking alone does not await it.
  await page.waitForFunction(previous => {
    const title = document.querySelector('.life-content h3');
    return title && title.innerText !== previous;
  }, firstLife);
  assert.notEqual(await page.locator('.life-content h3').innerText(), firstLife);
  const secondLife = await page.locator('.life-content h3').innerText();
  const secondChapter = await page.locator('.life-content .chapter').innerText();
  assert.notEqual(secondChapter, firstChapter);
  await page.reload();
  await page.waitForSelector('.life-content h3');
  assert.notEqual(await page.locator('.life-content h3').innerText(), secondLife);
  assert.notEqual(await page.locator('.life-content .chapter').innerText(), secondChapter);
  log.push('Life suggestion changes chapters on shuffle and opening/reloading a tab.');
  const verse = page.locator('.poetry-verse');
  const firstVerse = await verse.textContent();
  assert.match(firstVerse, /^[\u3400-\u9fff]+，[\u3400-\u9fff]+[。？！]$/);
  await page.getByRole('button', { name: '换一句' }).click();
  await page.waitForFunction(previous => document.querySelector('.poetry-verse')?.textContent !== previous, firstVerse);
  const secondVerse = await verse.textContent();
  await page.getByRole('button', { name: '诗词', exact: true }).click();
  assert.equal(await verse.textContent(), secondVerse);
  await page.getByRole('link', { name: '拾页首页' }).click();
  assert.equal(await verse.textContent(), secondVerse);
  // A new tab must choose again even offline, including its bundled font.
  await page.evaluate(async () => {
    const { write } = await import('./src/storage.js');
    await write('cache:poetry', { data: { items: [{ id: '12', title: '獨坐幽篁裏，彈琴復長嘯。', author: '王維', poemTitle: '竹裏館' }], fetchedAt: Date.now() } });
  });
  await ctx.setOffline(true);
  const poetryTab = await ctx.newPage();
  await poetryTab.goto('chrome://newtab/');
  await poetryTab.locator('.poetry-verse').waitFor();
  assert.notEqual(await poetryTab.locator('.poetry-verse').textContent(), secondVerse);
  const fontLoaded = await poetryTab.evaluate(async () => {
    await document.fonts.load('500 28px "Shiye Poetry"');
    return [...document.fonts].some(font => font.family === 'Shiye Poetry' && font.weight === '500' && font.status === 'loaded');
  });
  assert.equal(fontLoaded, true);
  const offlineVerse = await poetryTab.locator('.poetry-verse').textContent();
  const { POEMS } = await import('../src/poems.js');
  assert.ok(POEMS.some(([title]) => title === offlineVerse), 'Old traditional cache does not replace the bundled simplified corpus');
  assert.equal(await poetryTab.getByRole('button', { name: '换一句', exact: true }).count(), 1);
  assert.equal(await poetryTab.getByRole('link', { name: '简体诗选' }).getAttribute('href'), 'https://github.com/chinese-poetry/chinese-poetry');
  for (const theme of ['light', 'dark']) {
    await poetryTab.evaluate(value => { document.documentElement.dataset.theme = value; }, theme);
    await poetryTab.locator('.poetry-card').screenshot({ path: `artifacts/poetry-${theme}.png` });
  }
  await poetryTab.close();
  await ctx.setOffline(false);
  log.push('Poetry: simplified corpus despite old traditional cache, complete couplets, no immediate repeat, stable filtering, offline tab, local Medium font, single shuffle action and source link verified.');
  await page.getByRole('button', { name: '外观与设置' }).click();
  await page.locator('#theme').selectOption('dark');
  await page.locator('#columns').selectOption('4');
  await page.locator('#settings-dialog .close').click();
  await page.reload();
  await page.waitForSelector('[data-theme="dark"]');
  assert.equal(await page.locator('#board').getAttribute('data-columns'), '4');
  await page.waitForSelector('.life-content h3');
  await page.waitForFunction(() => !document.querySelector('.skeleton'));
  await page.screenshot({ path: 'artifacts/dark-dashboard.png', fullPage: true });
  await page.getByRole('button', { name: '外观与设置' }).click();
  await page.locator('#theme').selectOption('light');
  await page.locator('#columns').selectOption('3');
  await page.locator('#settings-dialog .close').click();
  await page.getByRole('button', { name: '管理订阅', exact: true }).click();
  await page.getByRole('button', { name: '上移 GitHub', exact: true }).click();
  await page.getByRole('button', { name: '上移 GitHub', exact: true }).click();
  await page.locator('#manage-dialog .close').click();
  assert.equal(await page.locator('.card').first().getAttribute('data-id'), 'github');
  await page.locator('[data-id="apple"] .card-header').dragTo(page.locator('[data-id="github"] .card-header'));
  assert.equal(await page.locator('.card').first().getAttribute('data-id'), 'apple');
  log.push('Theme, column count persist; manager and drag gesture reorder cards.');
  await page.locator('#search').fill('no-such-content-12345');
  assert.equal(await page.locator('.item-list li').count(), 0);
  await page.locator('#search').fill('');
  if (!live) {
    const parsed = await page.evaluate(async () => {
      const m = await import('./src/sources.js');
      return {
        atom: m.parseFeed('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Atom item</title><link href="https://example.com/1"/><summary>&lt;img src=x onerror=alert(1)&gt;Safe</summary></entry></feed>', 'https://example.com/feed'),
        rss: m.parseFeed('<rss><channel><item><title>RSS item</title><link>javascript:alert(1)</link><description>Text</description></item></channel></rss>', 'https://example.com/feed'),
        json: m.parseJson('{"data":{"list":[{"name":"Custom","link":"https://example.com/a"}]}}', { url: 'https://example.com/data', mapping: { items: 'data.list', title: 'name', url: 'link' } }),
        jsonFeed: m.parseFeed('{"items":[{"title":"JSON Feed","url":"https://example.com/b","content_html":"<script>alert(1)</script>hello"}]}', 'https://example.com/feed'),
      };
    });
    assert.equal(parsed.atom[0].description, 'Safe'); assert.equal(parsed.rss[0].url, '');
    assert.equal(parsed.json[0].title, 'Custom'); assert.equal(parsed.jsonFeed[0].description, 'hello');
    log.push('RSS, Atom, JSON Feed, nested JSON mapping and unsafe-link stripping verified.');
    // Default GitHub host permission allows these UI submissions without a native permission prompt.
    await ctx.route('https://github.com/shiye-fixture.xml', r => r.fulfill({ contentType: 'application/xml', body: '<rss><channel><item><title>My newsletter</title><link>https://example.com/read</link></item></channel></rss>' }));
    await page.getByRole('button', { name: '＋ 添加数据源', exact: true }).first().click();
    await page.locator('#source-form [name="name"]').fill('我的 Newsletter');
    await page.locator('#source-form [name="url"]').fill('https://github.com/shiye-fixture.xml');
    await page.getByRole('button', { name: '添加到看板', exact: true }).click();
    await page.getByText('My newsletter', { exact: true }).waitFor();
    await page.reload(); await page.getByText('My newsletter', { exact: true }).waitFor();
    log.push('Custom RSS source added through UI and persisted.');
    await ctx.route('https://github.com/shiye-json', r => r.fulfill({ contentType: 'application/json', body: '{"data":{"list":[{"name":"JSON record","link":"https://example.com/json"}]}}' }));
    await page.getByRole('button', { name: '＋ 添加数据源', exact: true }).first().click();
    await page.locator('#source-type').selectOption('json');
    await page.locator('#source-form [name="name"]').fill('结构化数据');
    await page.locator('#source-form [name="url"]').fill('https://github.com/shiye-json');
    await page.locator('[name="itemsPath"]').fill('data.list');
    await page.locator('[name="titlePath"]').fill('name');
    await page.locator('[name="urlPath"]').fill('link');
    await page.getByRole('button', { name: '添加到看板', exact: true }).click();
    await page.getByText('JSON record', { exact: true }).waitFor();
    log.push('Custom JSON mapping added through UI.');
    await ctx.route('https://github.com/trending?since=weekly', r => r.fulfill({ status: 503, body: 'Unavailable' }));
    await page.getByRole('button', { name: '刷新 GitHub', exact: true }).click();
    await page.locator('[data-id="github"] .stale-note').waitFor();
    assert.equal(await page.locator('[data-id="github"] .item-title').innerText(), 'sample / repo');
    log.push('Failed refresh preserves cached content with explicit stale warning.');
    await page.getByRole('button', { name: '外观与设置' }).click();
    const downloadPromise = page.waitForEvent('download'); await page.getByRole('button', { name: '导出配置', exact: true }).click();
    const download = await downloadPromise; await download.saveAs('artifacts/config-export.json');
    await page.locator('#import-file').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"version":1,"sources":[{"id":"bad","type":"rss","name":"bad","url":"javascript:alert(1)"}]}') });
    await page.getByText(/导入失败/).waitFor(); assert.equal(await page.locator('.card').count(), 7);
    await page.locator('#import-file').setInputFiles('artifacts/config-export.json');
    await page.waitForFunction(() => !document.querySelector('#settings-dialog').open);
    assert.equal(await page.locator('.card').count(), 7);
    log.push('Export/import round trip and invalid import rejection verified.');
    await page.getByRole('button', { name: '管理订阅', exact: true }).click();
    await page.getByRole('button', { name: '移除 结构化数据', exact: true }).click();
    await page.locator('#manage-dialog .close').click();
    assert.equal(await page.locator('.card').count(), 6);
    log.push('Source removal updates the board.');
    await page.getByRole('button', { name: '管理订阅', exact: true }).click();
    await page.getByRole('button', { name: '移除 拾一句诗', exact: true }).click();
    await page.locator('#manage-dialog .close').click();
    await page.reload();
    await page.locator('.life-content h3').waitFor();
    assert.equal(await page.locator('.poetry-card').count(), 0, 'Saved configurations do not acquire unwanted cards');
    await page.getByRole('button', { name: '＋ 添加数据源', exact: true }).first().click();
    await page.locator('#source-type').selectOption('poetry');
    assert.equal(await page.locator('#source-form [name="limit"]').inputValue(), '1');
    assert.equal(await page.locator('#source-form [name="refreshMinutes"]').isDisabled(), true);
    await page.getByRole('button', { name: '添加到看板', exact: true }).click();
    await verse.waitFor();
    await page.reload();
    await verse.waitFor();
    assert.equal(await page.locator('.poetry-card').count(), 1);
    assert.ok(await page.locator('.poetry-content figcaption').textContent());
    log.push('Existing configuration retained; poetry added through UI and persisted across reload.');
  }
  for (const width of [1920, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
    assert.ok(await page.locator('.weather-card .card-content').evaluate(el => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight), `Weather metrics fit at ${width}px`);
    assert.ok(await verse.evaluate(el => el.scrollWidth <= el.clientWidth), `Poetry fits at ${width}px`);
  }
  log.push('1920, 1024, 768, 390px responsive layouts have no horizontal overflow.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'artifacts/mobile-dashboard.png', fullPage: true });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
  await page.locator('.weather-card').screenshot({ path: 'artifacts/weather-mobile.png' });
  if (!live) {
    await page.getByRole('button', { name: '管理订阅', exact: true }).click();
    await page.getByRole('button', { name: '移除 此刻', exact: true }).click();
    await page.locator('#manage-dialog .close').click();
    await page.reload();
    await page.locator('.poetry-card').waitFor();
    assert.equal(await page.locator('.weather-card').count(), 0, 'Removed weather card stays removed');
    await page.evaluate(async () => { await chrome.storage.local.remove('weather-card-introduced'); });
    await page.reload();
    await page.locator('.weather-card').waitFor();
    assert.equal(await page.locator('.weather-card').count(), 1, 'Old saved configuration receives one weather card');
    log.push('Weather clock tick, empty-cache failure, permission denial, visible metrics, one-time migration and persistent removal verified.');
  }
  assert.deepEqual(failures, []);
  log.push('390px layout has no horizontal overflow; no uncaught page errors.');
  await writeFile(`artifacts/${live ? 'live' : 'test'}-results.json`, JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log, null, 2));
} finally { await ctx.close(); await rm(profile, { recursive: true, force: true }); }
