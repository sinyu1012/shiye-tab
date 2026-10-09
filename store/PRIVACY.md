# 拾页 · Shiye Tab 隐私政策 / Privacy Policy

生效日期 / Effective date: 2026-10-09

拾页由 GitHub 用户 sinyu1012 开发，用于将 Chrome 新标签页替换为用户自定义的信息看板。

## 1. 本地处理的数据

数据源名称和地址、分类、JSON 字段映射、卡片顺序、主题、列数、内容缓存、抓取时间及上一次随机建议的链接保存在本机的 Chrome 扩展存储（chrome.storage.local）。这些信息用于呈现和恢复您的看板，不通过拾页的服务器同步。拾页没有自建服务器、用户账号、广告 SDK 或统计分析 SDK。

您在看板输入的搜索词只用于本地筛选当前内容，不发送到搜索引擎或开发者。配置导入导出由您主动发起；导出的 JSON 可能包含私有订阅地址，请妥善保管。

## 2. 网络请求与第三方

打开新标签页或手动刷新时，扩展可能直接向 GitHub、raw.githubusercontent.com、Apple iTunes RSS，以及您自行添加并授权的 HTTPS 数据源或白名单内的本地 HTTP 数据源发送请求。缓存有效期内会复用本地内容。

这些第三方服务器会接收到建立网络连接所需的信息，例如 IP 地址和您配置的请求 URL。若您添加了包含访问令牌的订阅 URL，该令牌会随请求发送给该 URL 对应的服务。开发者不会接收这些请求或订阅地址。扩展的数据请求使用 credentials: omit，不附带浏览器 cookies；使用 no-referrer 策略，不发送来源页面地址。点击原文链接后访问的网站适用各自的隐私政策，浏览器可能正常使用您在该网站的登录状态。

扩展下载内容仅用于本地展示，不执行远程 JavaScript。第三方数据源的可用性与数据处理由其服务提供者负责。

## 3. 权限用途

- storage：保存本地看板配置、内容缓存和上一次随机建议。
- GitHub、raw.githubusercontent.com、itunes.apple.com 站点访问权限：获取内置公开信息源。
- 可选 HTTPS 及白名单本地 HTTP 站点权限：仅在您添加或连接自定义数据源时申请对应站点，用于读取 RSS、Atom、JSON Feed 或 JSON 内容。不会自动获得全部站点访问权。

拾页不申请浏览历史、邮箱、通讯录、位置、摄像头或麦克风权限，不读取密码，不向普通网页注入内容脚本。

## 4. 数据共享与保留

开发者不收集或出售您的个人信息，不将其用于广告，不向数据经纪商传送信息。配置和缓存保留在本机，直至您删除对应数据源、导入替换配置或卸载扩展。删除数据源会删除其缓存及上一条随机建议记录；已授予的站点权限可以在 Chrome 扩展设置中撤销。

您主动导出的文件由您自行保管，不会因卸载扩展而删除。Chrome 和操作系统自身的数据处理受其各自政策约束。

## 5. 联系与更新

可通过 https://github.com/sinyu1012/shiye-tab/issues 联系开发者 sinyu1012。请勿在公开评论中留下私有订阅链接、访问令牌或其他敏感信息。政策变更将更新本页面及生效日期。

---

## English summary

Shiye Tab is a customizable new-tab dashboard developed by GitHub user sinyu1012. It stores dashboard preferences, source URLs, cached content, fetch timestamps, and the last displayed suggestion locally in chrome.storage.local. Search queries are processed locally. There is no developer-operated backend, account system, analytics SDK, advertising SDK, or developer collection/sale of personal data.

The extension connects directly to its built-in public sources and to HTTPS feeds or allowlisted local HTTP feeds explicitly configured and authorized by the user. Those source servers receive normal connection information, including IP address and the requested URL. Tokens embedded in a feed URL are sent only as part of that request to the corresponding service. Fetch requests omit cookies and use a no-referrer policy. Following an original-content link opens the source website under its own privacy policy and normal browser login behavior.

Optional host access is requested per site when adding or reconnecting a custom source. Remote content is parsed as data, not executed as JavaScript. The extension does not request browsing-history, email, contacts, location, camera, or microphone access, and does not inject content scripts into ordinary websites.

Removing a source deletes its cache and last-suggestion record. Chrome extension settings can revoke site access. Uninstalling removes extension-local data; files deliberately exported by the user remain under the user's control. Contact the developer through https://github.com/sinyu1012/shiye-tab/issues, without posting private feed URLs or tokens.
