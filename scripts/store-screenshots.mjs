import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const profile = await mkdtemp(resolve(tmpdir(), 'shiye-store-'));
const extension = resolve('dist');
const context = await chromium.launchPersistentContext(profile, {channel:'chromium',headless:true,viewport:{width:1280,height:800},deviceScaleFactor:1,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`]});
try {
 const page = await context.newPage();
 await page.goto('chrome://newtab/');
 await page.waitForSelector('#board .card');
 await page.waitForFunction(() => !document.querySelector('.skeleton') && ![...document.querySelectorAll('.update-status')].some(n=>n.textContent.includes('正在更新')), {timeout:45000});
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
