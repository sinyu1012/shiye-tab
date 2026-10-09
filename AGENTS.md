# Repository Guidelines

## 项目结构与模块职责

拾页是基于 Chrome Manifest V3 的新标签页扩展，使用原生 JavaScript ES Modules 和 CSS，无生产依赖。

- `src/app.js`：看板渲染、卡片与用户交互。
- `src/model.js`：默认配置、输入校验、URL 规则与随机选择。
- `src/sources.js`：数据请求、解析与来源适配；`src/storage.js`：存储、缓存与站点授权。
- `index.html`、`styles.css`、`icons/`：页面结构、主题与图标；`manifest.json`：扩展入口与权限。
- `tests/`：模型与扩展回归；`scripts/`：构建、预览及商店素材工具。
- `docs/`：产品与技术设计、验收记录；`store/`：商店文案、截图和隐私政策。

## 开发、构建与检查

使用 Node.js 22+，先执行 `npm ci` 安装开发依赖。

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 `http://127.0.0.1:5173` 网页预览 |
| `npm run check` | 检查四个应用模块的 JavaScript 语法 |
| `npm test` | 运行模型单元测试 |
| `npm run build` | 重建 `dist/`，按白名单复制扩展运行文件 |
| `npx playwright install chromium` | 安装扩展测试所需浏览器 |
| `npm run test:extension` | 加载 `dist/`，使用固定响应验证扩展交互 |

网页预览受 CORS 限制；权限与新标签页行为应在扩展环境验证。可在 `chrome://extensions` 加载仓库根目录或构建后的 `dist/`。

## 编码风格与命名

JavaScript 使用两空格缩进、单引号、分号和显式 `.js` 导入路径。函数与变量使用 `camelCase`，模块常量使用 `UPPER_SNAKE_CASE`，CSS 类名使用短横线。沿用邻近代码风格与主题变量，避免无关格式化。当前未配置 ESLint 或 Prettier；`npm run check` 仅检查语法。

## 测试要求

模型测试使用 `node:test` 与 `node:assert/strict`，文件命名为 `tests/*.test.mjs`，测试名称用中文描述行为。优先扩展现有用例，简单逻辑不额外创建测试文件；解析器修改需提供最小输入样例。

扩展回归使用 Playwright，运行前先构建。UI 改动需实际扩展页面和截图证据，不能以语法检查代替。`npm run test:extension -- --live` 可选验证真实上游，结果受网络影响。截图与日志写入 `artifacts/`；当前无覆盖率门槛。

## 提交与 Pull Request

沿用历史中的中文 Conventional Commits，例如 `fix: 修复生活建议跨章节随机`，类型使用 `feat:`、`fix:`、`docs:` 等。分支使用 `sinyu/` 前缀；同步主分支使用 merge，禁止 rebase；提交和 PR 不添加 AI 署名。

PR 应说明问题、改动范围、复现步骤和实际验证结果，关联相关 issue；UI 修改附截图。代码改动按范围运行上述检查，提交前执行 `git diff --check`，明确未验证项。保持窄范围修改，相邻问题另行报告。

## 安全与配置

不要提交私有订阅地址、令牌、个人配置或被忽略的 `dist/`、`artifacts/`、压缩包。远端内容仅作为数据处理；保留 URL 校验与最小站点授权。新增 HTTP 主机须同步 `src/model.js` 的 `httpHosts` 与 `manifest.json` 的具体权限，禁止放宽为所有 HTTP 站点。
