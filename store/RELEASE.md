> 发布状态按下文每次核对记录区分；商店审核通过前，线上版本仍可能为旧版。

# Chrome Web Store 发布记录

## 0.1.1（2026-10-09）

- 修复生活建议仅在单个缓存章节中随机的问题：读取所有章节，优先避开上次章节，淘汰旧缓存。
- 包含源码中此前未随商店发布的改进：单条阅读卡片、摘要换行、本地 HTTP 白名单、移除默认七麦占位卡片。
- 版本号：manifest、package.json、package-lock.json 均为 0.1.1。
- 发布包：`shiye-tab-0.1.1-webstore.zip`；仅 10 个扩展运行文件，ZIP 根目录包含 manifest.json。
- SHA-256：`fef9df5f3e230eb7b4dce643faee1b1ca627c2846eb2eec72d51702b42e907b7`。
- 验证：语法检查、模型测试、构建及固定响应扩展回归通过；跨章节随机修复的真实网络回归已于同日通过。
- 上传前后台核对：0.1.0 为 Published - public；0.1.1 已打包，等待上传与提审回执。

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
