import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
const browser=await chromium.launch({channel:'chromium',headless:true});
const assetPage=await browser.newPage({viewport:{width:128,height:128},deviceScaleFactor:1});
for(const size of [16,48,128]){
  const art=size*.75;
  await assetPage.setViewportSize({width:size,height:size});
  await assetPage.setContent(`<html><body style="margin:0;background:transparent;display:grid;place-items:center;width:${size}px;height:${size}px"><div style="display:grid;place-items:center;background:#202530;color:#fff;width:${art}px;height:${art}px;border-radius:${art*9/34}px;font: ${art*25/34}px serif"><span style="line-height:1;transform:translateY(-.07em)">拾</span></div></body></html>`);
  await assetPage.screenshot({path:`icons/${size}.png`,omitBackground:true});
}
await assetPage.setViewportSize({width:440,height:280});
await assetPage.setContent(`<html lang="zh-CN"><body style="margin:0;width:440px;height:280px;background:#f5f6f8;color:#202530;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;box-sizing:border-box;padding:34px"><div style="display:flex;align-items:center;gap:12px"><span style="display:grid;place-items:center;background:#202530;color:white;width:44px;height:44px;border-radius:12px;font:32px serif;line-height:1"><span style="transform:translateY(-.07em)">拾</span></span><strong style="font-size:26px">拾页</strong><span style="font-size:10px;letter-spacing:2px;color:#748091">SHIYE TAB</span></div><h1 style="font-size:24px;font-weight:600;line-height:1.5;margin:26px 0 12px">你关心的内容，<br>打开新标签页就看见。</h1><p style="font-size:12px;color:#636c7d;margin:0">RSS 订阅 · GitHub 周榜 · 自定义数据</p><div style="display:flex;gap:8px;margin-top:20px"><span style="background:#ebefff;color:#3555cb;font-size:11px;padding:6px 10px;border-radius:6px">本地优先</span><span style="background:white;color:#636c7d;font-size:11px;padding:6px 10px;border:1px solid #e2e5eb;border-radius:6px">你的专属信息看板</span></div></body></html>`);
await assetPage.screenshot({path:'store/assets/promo-440x280.png'});
await browser.close();
console.log('Brand icons and 440x280 promotional tile rendered from local UI.');
