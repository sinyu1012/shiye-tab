> 以下文案已随 0.1.1 提交 Chrome Web Store 审核（2026-10-09），当前状态 Pending review。

# Chrome Web Store listing

名称：拾页 · Shiye Tab
默认语言：简体中文
分类：Productivity / Workflow & Planning（以后台可选项为准）
定价：免费
分发：公开，所有可选地区

## 详细介绍

让每次打开新标签页，都能看到你真正关心的内容。

拾页是一个轻量、可自定义的 Chrome 新标签页看板。把公开榜单、阅读订阅和结构化信息集中在一页，用卡片排列出自己的信息空间。

【内容随你选择】
• 好好生活：从 HowToLiveBetter 各章节随机阅读原文条目，优先避开上次章节，保留章节、证据标签和原文链接。
• GitHub 周榜：查看 GitHub Trending 本周热门项目及本周新增星标。
• App Store：查看 Apple 官方中国区 iPhone 免费应用 Top 10。
• 自定义 RSS / Atom / JSON Feed：订阅支持 feed 的博客和 Newsletter。
• 自定义 JSON：通过列表、标题、链接、摘要等字段映射接入自己的结构化接口。
• 七麦为可选接入类型：需自行配置有权访问的 JSON 接口，不默认添加占位卡片。

【整理成自己的看板】
• 添加、编辑、移除数据源，拖动或使用按钮调整顺序。
• 分类筛选、页内搜索、独立刷新和本地缓存。
• 2 / 3 / 4 列布局，浅色、深色及跟随系统。
• 导入、导出看板配置。
• 显示条数为 1 时使用阅读卡片，摘要保留换行与段落。

【本地优先】
无需注册账号，没有广告和统计追踪。配置与缓存保存在本机；数据直接从所选来源读取。自定义订阅按站点请求访问权限，不读取浏览历史或邮箱。

安装后，本扩展会替换 Chrome 新标签页。Newsletter 需提供 RSS / Atom / JSON Feed 地址；不是邮箱客户端。第三方来源受网络、服务可用性和接口规则影响，刷新失败时会明确提示并保留已有缓存。生活指南内容仅为第三方资料节选，完整条件与来源请查看原文。

## Single purpose

Replace the Chrome new-tab page with one customizable dashboard that displays the user's chosen public feeds, rankings, and structured content. Source management, filtering, themes, layout and local caching all support this single dashboard purpose.

## storage permission justification

Store dashboard source configuration, card order, display preferences, cached feed content and the last random suggestion locally so the dashboard persists across new tabs and can reuse cached results. No data is sent to a developer server.

## Host permission justification

The built-in dashboard fetches GitHub Trending from github.com, HowToLiveBetter Markdown from raw.githubusercontent.com, and the China App Store chart from itunes.apple.com. Optional https://*/* is required because users may add RSS/Atom/JSON feeds on arbitrary HTTPS domains; the extension requests access only to the selected source's origin when the user adds or reconnects it. Explicitly allowlisted local HTTP hosts are also optional and require per-site authorization. No content scripts are injected and browsing history is not read.

## Remote code

No remote code. JavaScript and CSS are packaged locally. Downloaded Markdown, HTML, XML and JSON are parsed as content, never evaluated as JavaScript.

## Reviewer test instructions

No login required. Open a new tab for life advice, GitHub weekly and Apple China charts. Life advice caches all chapters; Shuffle and reopening a tab avoid the last chapter. Qimai is optional. Add an HTTPS RSS/JSON feed and approve its origin; limit 1 shows a reading card with line breaks. Allowlisted local HTTP feeds are optional, not needed for testing. Settings control themes, columns and import/export. Data stays local; no remote executable code.
