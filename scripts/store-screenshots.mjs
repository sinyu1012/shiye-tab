import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { mkdtemp, rm, cp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const profile = await mkdtemp(resolve(tmpdir(), 'shiye-store-'));
const extension = resolve(profile, 'extension');
await cp(resolve('dist'), extension, { recursive: true });
// Only this isolated screenshot copy pregrants weather hosts; dist stays unchanged.
const manifest = JSON.parse(await readFile(resolve(extension, 'manifest.json'), 'utf8'));
manifest.host_permissions.push('https://geocoding-api.open-meteo.com/*', 'https://api.open-meteo.com/*');
await writeFile(resolve(extension, 'manifest.json'), JSON.stringify(manifest));
const context = await chromium.launchPersistentContext(profile, {channel:'chromium',headless:true,viewport:{width:1280,height:800},deviceScaleFactor:1,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
try {
 const page = await context.newPage();
 await page.goto('chrome://newtab/');
 await page.waitForSelector('#board .card');
 await page.waitForFunction(() => !document.querySelector('.skeleton') && ![...document.querySelectorAll('.update-status')].some(n=>n.textContent.includes('正在更新')), {timeout:45000});
 await page.locator('.weather-location').click();
 await page.locator('#weather-city').fill('Shanghai');
 await page.locator('#weather-search').click();
 await page.locator('[data-city="0"]').click();
 await page.getByRole('button', { name: '保存设置', exact: true }).click();
 await page.waitForFunction(() => !document.querySelector('.weather-temperature').textContent.includes('等待天气'), { timeout: 45000 });
 await page.getByRole('button', { name: '管理订阅', exact: true }).click();
 await page.getByRole('button', { name: '上移 拾一句诗', exact: true }).click();
 await page.locator('#manage-dialog .close').click();
 await page.getByRole('button',{name:'外观与设置'}).click();
 await page.locator('#theme').selectOption('light');
 await page.locator('#settings-dialog .close').click();
 // Pick a concise everyday-life entry using the shipped shuffle interaction.
 for (let attempt = 0; attempt < 60; attempt++) {
   const chapter = await page.locator('.life-content .chapter').innerText();
   const title = await page.locator('.life-content h3').innerText();
   if (/睡眠|精力|运动|饮食/.test(chapter) && title.length <= 45) break;
   if (attempt === 59) throw new Error('No suitable everyday-life entry found for screenshots.');
   await page.getByRole('button', { name: '换一条' }).click();
   await page.waitForFunction(previous => document.querySelector('.life-content h3')?.innerText !== previous, title);
 }
 await page.evaluate(() => document.fonts.ready);
 await page.locator('#toast').waitFor({ state: 'hidden' });
 if (await page.locator('.empty-card, .stale-note').count()) throw new Error('Live sources failed; do not publish incomplete store screenshots.');
 console.log(await page.locator('.card').evaluateAll(cards=>cards.map(c=>({name:c.getAttribute('aria-label'),items:c.querySelectorAll('.item-list li').length,status:c.querySelector('.update-status')?.textContent}))));
 await page.screenshot({path:'store/assets/screenshot-light-1280x800.png'});
 await page.getByRole('button',{name:'外观与设置'}).click();
 await page.locator('#theme').selectOption('dark');
 await page.locator('#settings-dialog .close').click();
 await page.screenshot({path:'store/assets/screenshot-dark-1280x800.png'});
 await page.getByRole('button',{name:'外观与设置'}).click();
 await page.locator('#theme').selectOption('light');
 await page.locator('#settings-dialog .close').click();
 await page.getByRole('button',{name:'＋ 添加数据源',exact:true}).first().click();
 await page.screenshot({path:'store/assets/screenshot-source-1280x800.png'});
} finally {await context.close();await rm(profile,{recursive:true,force:true});}
