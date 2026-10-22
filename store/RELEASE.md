> 发布状态按下文每次核对记录区分；商店审核通过前，线上版本仍可能为旧版。

# Chrome Web Store 发布记录

## 0.1.3（2026-10-22，已提交审核）

- 上传前在后台 Package 页核对：Published 与 Draft 均为 0.1.2，当前状态 Published - public。
- 诗集 1,317 联及作者、篇名统一简体，诗词卡片更新为宋体书页风格，适配深浅色；采用随包分发的 Noto Serif SC Medium 500 免费字体子集并保留 SIL OFL 1.1。
- manifest.json、package.json、package-lock.json 版本均为 0.1.3；相对上一商店版本没有新增权限或数据处理用途。
- 发布包：`shiye-tab-0.1.3-webstore.zip`；21 个运行及许可文件，601,272 字节，ZIP 根目录包含 manifest.json。
- SHA-256：`1de9ca060fea4b530625021ef4269ca4da097cfcfe98059edfd69089cb5c7f9c`。
- 发布验证：语法检查、4 项模型测试、构建、实际扩展固定响应回归、ZIP 完整性及 `git diff --check` 通过；天气原生权限弹窗仍采用隔离测试副本预授权，不修改发布包权限。
- 三张 1280×800 商店截图已重新生成，均为无 alpha 的 24-bit RGB PNG：浅色、深色、添加数据源。上海天气、生活建议、GitHub 与 App Store 使用真实网络结果，无失败或过期提示；未包含个人订阅。
- 已替换并保存三张商店截图，同步简体诗集与本地宋体说明；既有隐私政策与数据使用声明仍适用。
- 上传后后台 Package 页核对 Draft 为 0.1.3、Published 为 0.1.2。
- 提审成功回执：`Your extension was submitted for review`；最终后台状态 **Pending review**。
- 已保持审核通过后自动发布；提交审核不等于已经上线，提审时线上仍为 0.1.2。
- 本地证据：`../artifacts/webstore-0.1.3-screenshots.png`、`../artifacts/webstore-0.1.3-submitted.png`。

## 0.1.2（2026-10-16，已提交审核）

- 包含当前工作区的天气时钟、城市搜索、天气缓存及离线诗词卡片，随包提供字体、图标及许可。
- manifest.json、package.json、package-lock.json 版本均为 0.1.2。
- 发布包：`shiye-tab-0.1.2-webstore.zip`；20 个运行及许可文件，808,990 字节，ZIP 根目录包含 manifest.json。
- SHA-256：`cd85dcad1acd5df83d1782a1d052cb122999c2f1f77472dabf880419bfd86950`。
- 语法检查、3 项模型测试、构建、固定响应扩展回归及 ZIP 完整性检查通过。天气原生授权弹窗未自动化，测试临时副本预授予天气域名，发布包仍使用可选授权。
- 三张 1280×800 商店截图已按当前扩展重新生成：浅色、深色、添加数据源。天气、生活建议、GitHub 和 App Store 使用真实网络数据；上海为截图示例城市，未包含个人订阅。
- 已同步三张截图、商店介绍、天气/诗词的单一用途和存储/主机权限说明，以及 465 字符审核测试步骤。
- 数据使用声明已勾选 Location，对应用户选择的城市及城市中心经纬度；不读取设备定位。
- 公开隐私政策 Gist 已同步当前 `PRIVACY.md`，匿名 HTTP 200，正文与本地逐字一致。
- 上传后后台核对 Draft 为 0.1.2、Published 为 0.1.1。
- 提审成功回执：`Your extension was submitted for review` / `Item submitted.`；最终后台状态 **Pending review**。
- 已保持审核通过后自动发布；提交审核不等于已经上线，提审时线上仍为 0.1.1。
- 本地证据：`../artifacts/webstore-0.1.2-screenshots.png`、`../artifacts/webstore-0.1.2-submitted.png`。

## 0.1.1（2026-10-09）

- 修复生活建议仅在单个缓存章节中随机的问题：读取所有章节，优先避开上次章节，淘汰旧缓存。
- 包含源码中此前未随商店发布的改进：单条阅读卡片、摘要换行、本地 HTTP 白名单、移除默认七麦占位卡片。
- 版本号：manifest、package.json、package-lock.json 均为 0.1.1。
- 发布包：`shiye-tab-0.1.1-webstore.zip`；仅 10 个扩展运行文件，ZIP 根目录包含 manifest.json。
- SHA-256：`fef9df5f3e230eb7b4dce643faee1b1ca627c2846eb2eec72d51702b42e907b7`。
- 验证：语法检查、模型测试、构建及固定响应扩展回归通过；跨章节随机修复的真实网络回归已于同日通过。
- 上传前后台核对：0.1.0 为 Published - public；上传后 Draft 版本为 0.1.1。
- 已提交审核，后台状态：**Pending review**；回执：`Your extension was submitted for review` / `Item submitted.`。
- 已选择审核通过后自动发布；提审时线上仍为 0.1.0。
- 已同步三张当前界面截图、商店介绍、GitHub 主页与 Issues 支持地址、HTTP 白名单权限说明和审核测试步骤。
- 公开隐私政策 Gist 已同步当前仓库版本，匿名访问 HTTP 200。

## 0.1.0（首次提交历史）

- 发布包：`shiye-tab-0.1.0-webstore.zip`（manifest.json 位于 ZIP 根目录）
- 公开隐私政策：https://gist.github.com/sinyu1012/e93fe0a63b0860bb08349864492a0ce5
- 隐私政策匿名访问验证：2026-10-08，HTTP 200。
- 详情、权限用途和审核测试步骤：`LISTING.md`
- 商店图标：`../icons/128.png`
- 小宣传图：`assets/promo-440x280.png`
- 实际扩展截图：`assets/screenshot-light-1280x800.png`、`assets/screenshot-dark-1280x800.png`、`assets/screenshot-source-1280x800.png`
- 截图来自隔离 Chromium 配置的真实扩展页面；GitHub、Apple 榜单为真实网络结果。七麦尚未接入，界面和文案如实标明。
- 源码仓库：https://github.com/sinyu1012/shiye-tab

状态：2026-10-08 已提交 Chrome Web Store 审核，后台确认 Pending review。审核通过后自动公开发布。

- 扩展 ID：`fkkcecjdalionkdjbpdhgigpcimopfmg`
- 版本：0.1.0
- 分发：免费、公开、所有地区
- 分类：Workflow & Planning；语言：Chinese (China)
- 已上传：128px 图标、三张 1280×800 截图、440×280 宣传图。
- 已保存：商店介绍、隐私 URL、单一用途、storage 和 host 权限解释、无远程代码声明、审核测试步骤。
- UI 最终回执：Your extension was submitted for review；Status: Pending review。
- 发布包 SHA-256：`d4c812f3013cfdba2fe8375ebc4bcd4fa7986669550dc65871166334d88ef19b`
- 当时尚未审核通过，尚未确认商店公开可安装。
- 商店页面：https://chromewebstore.google.com/detail/fkkcecjdalionkdjbpdhgigpcimopfmg?hl=zh
