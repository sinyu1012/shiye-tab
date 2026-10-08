# 验收记录

验证日期：2026-10-08（Asia/Shanghai）。

## 静态与构建
+- `npm run check`：通过，全部应用模块语法检查。
+- `npm test`：通过，配置导入安全边界及随机不重复抽样。
+- `npm run build`：通过；dist 白名单仅包含扩展运行必需文件。
+- `git diff --check`：通过。

## 真正的扩展环境
+`npm run test:extension` 在 Playwright 的 Chromium 临时 profile 中加载 dist；测试响应与真实数据验证分开。
+
+通过：
+- Manifest V3 扩展加载，`chrome://newtab` 实际跳转至 `chrome-extension://.../index.html`。
+- 默认四张卡片；七麦无配置时显示「等待接入」。
+- 随机建议换条及页面重新打开后避开上一条。
+- 深浅主题、列数持久化；管理面板按钮与真实拖动操作调整顺序。
+- 搜索结果过滤；新增 RSS 订阅并重新打开后保留；移除订阅同步更新看板。
+- 自定义 JSON 嵌套字段映射、RSS / Atom / JSON Feed 解析。
+- 不执行 feed HTML 脚本，过滤 javascript URL。
+- HTTP 503 时保留旧缓存并明确标记失败。
+- 配置导出与导入往返；非法配置拒绝导入且保留现有卡片。
+- 390px 视口无横向溢出；无未捕获页面异常。
+
+测试未自动验证用户个人 Chrome profile 的安装和原生新站点授权弹窗；新增源测试使用已授权的 GitHub 域名测试响应。
+
+## 真实网络验证
+`npm run test:extension -- --live`：通过。
+- HowToLiveBetter：从上游 README 和随机章节获取到真实原文条目。
+- GitHub 官方 Trending weekly：读取 10 个仓库。
+- Apple 官方中国区免费榜：读取 10 个应用。
+- 随机建议换条、刷新持久化、主题、列数、排序与窄屏检查通过。
+
+本地截图与详细结果在 `artifacts/`（不提交私人配置或瞬时上游内容）。`live-dashboard.png` 为真实数据，`tested-dashboard.png` 为固定测试数据，两者不可混用为真实源证据。
+
+## 外部未完成项
+- 七麦公开网页返回 HTTP 403，未签名 API 返回 `{"code":10602,"msg":"Access Error","is_logout":0}`。已交付授权 JSON 源接入能力，七麦今日 Top 10 的真实数据仍需可用的授权接口；未绕过访问限制。
+- 尚未安装到用户个人 Chrome，交付可加载目录和压缩包。
+- 应用、包名、仓库和当前聊天已采用「拾页 / shiye-tab」。Codex 侧栏项目仍为「New project」：当前工具无项目重命名接口，Computer Use 拒绝操作 Codex 应用，未修改应用内部配置或移动当前工作目录。
