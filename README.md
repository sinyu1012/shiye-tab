# 拾页 · Shiye Tab

**每次打开，拾一点新知。** 一个本地优先、可自定义数据源的 Chrome 新标签页扩展。

## 安装

1. 下载或 clone 本仓库。
2. 打开 `chrome://extensions`，打开右上角「开发者模式」。
3. 点击「加载已解压的扩展程序」，选择仓库根目录（有 `manifest.json` 的目录）。**无需安装 Node 或构建即可使用。**
4. 打开一个新标签页。如 Chrome 询问是否保留新标签页变更，选择保留。

也可运行 `npm ci && npm run build`，然后加载 `dist/`。更新源码后，在扩展管理页点「重新加载」。如安装了其他新标签页扩展，请在 Chrome 中选择拾页作为生效的新标签页。

## 已实现

- **好好生活**：从 [HowToLiveBetter](https://github.com/eternity4719/HowToLiveBetter) 随机选章节读取，每次打开从缓存章节再选一条，并避开上一条；「换一条」在当前章节切换，「刷新」重新抽取章节。包含原文摘要、成本、证据等级、备注及原文链接。不是全库均匀抽样。
- **GitHub 周榜**：直接读取 [Trending weekly](https://github.com/trending?since=weekly)，保留源顺序和本周新增星标；不以历史总 stars 排名代替。
- **App Store 中国免费榜**：Apple 官方 RSS，iPhone 免费应用 Top 10。
- **七麦卡片**：提供可配置 JSON 接口和字段映射。2026-10-08 实测公开页面返回 HTTP 403，未签名接口返回 `10602 / Access Error`；没有可用的授权数据接口时显示「等待接入」。**七麦今日 Top 10 尚未完成真实接入。Apple 卡片是独立数据源，不是七麦数据。**
- **自定义订阅**：RSS 2.0、Atom、JSON Feed，以及字段可映射的 JSON 接口。支持带 RSS 的 newsletter；不读取邮箱、不自动订阅邮件。
- 卡片编辑、删除、拖动排序与按钮排序；分类、内容搜索；2/3/4 列；浅色、深色与跟随系统；配置导入导出。
- 独立刷新、TTL 缓存、错误提示、旧缓存标识。长内容在卡片内滚动。

## 接入自定义源

「添加数据源」选择 RSS 或 JSON，填写 HTTPS 地址。保存时只申请该站点的访问权限。网页预览受浏览器 CORS 限制，正式使用请加载扩展。

JSON 示例：

```json
{
  "data": {
    "articles": [
      {
        "name": "你的文章标题",
        "link": "https://example.com/article",
        "summary": "内容摘要",
        "score": "42"
      }
    ]
  }
}
```

映射填写：列表 `data.articles`、标题 `name`、链接 `link`、摘要 `summary`、辅助信息 `score`。根数组可将列表路径留空。不支持任意 JavaScript、认证请求头或 POST；需要鉴权的接口可通过你自己的授权聚合服务接入，切勿将服务密钥硬编码到扩展。

七麦配置遵循相同映射，固定展示前 10 条，调用方接口应保证中国区、iPhone、免费总榜及当天顺序。插件显示抓取时间，不保证上游内容发布于当天。

Newsletter 可使用发布者提供的 RSS / Atom，或自己的邮件转 RSS 地址。不是所有 newsletter 都提供公开 feed。

## 开发与验证

需要 Node.js 22+。

```sh
npm ci
npm run check
npm test
npm run build
npx playwright install chromium
npm run test:extension
npm run test:extension -- --live
```

`test:extension` 使用隔离的临时 Chromium profile 和测试响应，验证真正的扩展页及交互；`--live` 则使用真实上游数据。测试不会加载你的个人 Chrome profile。截图和结果在被 Git 忽略的 `artifacts/`。

`npm run dev` 开启 `http://127.0.0.1:5173` 网页预览；只有扩展环境提供跨域站点权限。

详见 [PRD](docs/PRD.md)、[技术设计](docs/TECHNICAL_DESIGN.md)、[验收记录](docs/VERIFICATION.md)。

## 隐私与权限

无账号、无遥测、无公共代理。配置与缓存保存于 `chrome.storage.local`；不申请历史记录、标签页或邮箱权限。只有打开新标签页或手动刷新才请求上游，缓存有效期内复用数据。网络请求不附带 cookies。自定义源权限按站点申请，不自动获得全部站点访问权；导入不会自动授权新站点。

导出文件可能包含私有订阅地址，分享前请自行检查。删除卡片会清掉对应缓存；已授予的站点权限可以在 Chrome 扩展详情中撤销。

## 内容署名

HowToLiveBetter 原文由 eternity4719 及其贡献者提供，以 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 授权。拾页按原文字段节选、去掉 Markdown 标记显示，并保留原文链接；未重新编写建议。其他来源内容及商标归其各自权利人所有。
