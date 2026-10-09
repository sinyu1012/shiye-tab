# 技术设计

## 架构
原生 ES Modules + CSS + Manifest V3。无需框架与生产依赖；源码就是可加载扩展，构建仅复制白名单文件。新标签页直接 fetch 数据，在扩展 origin 使用 host_permissions 跨域，不注入任意网站。

统一 Source 配置：id、type、name、category、url、home、limit、refreshMinutes、mapping。
统一结果：items（title、url、description、meta）、fetchedAt、sourceUrl；运行态区分 loading / ready / empty / error / stale / unconfigured。

## 适配器
- life：解析上游 README 中 book/*.md 目录，从随机章节的三级标题和字段列表抽取条目。缓存章节条目供每次打开重新抽样，更新时重新选章节。
- github：惰性 template 解析 Trending weekly 的 article.Box-row；结构变化时报错。
- apple：Apple 中国区 topfreeapplications JSON feed，前 10 条。
- qimai：只接受显式配置的授权 JSON 源；固定 Top 10 并保留来源与更新时间，不绕过签名或验证码。
- rss：DOMParser 读取 RSS/Atom，纯文本摘要；JSON Feed 与通用 JSON 使用可配置字段路径。

## 持久化及边界
chrome.storage.local 存配置，缓存逐源存储，避免并行刷新覆盖；普通 HTTP 预览使用 localStorage，受浏览器 CORS 限制。请求 15 秒超时、响应体大小上限 3 MiB、按配置 TTL 缓存，不后台轮询。每张卡片独立失败。默认忽略 cookies；支持 HTTPS 和明确列入白名单的本地 HTTP 数据源（校验与 manifest 权限保持一致），禁止 HTTPS 降级重定向至 HTTP；JSON 映射只做属性路径读取，禁止 eval。用户输入 HTML 转义，URL 仅 http/https。配置导入验证版本、长度、类型、源数量，导入不自动请求新域权限。

## 视觉规格与参照
初版以附件为参考；新版依据用户要求生成的 [ImageGen 配色设计稿](design/graphite-cobalt-imagegen.png) 还原，未提供 Figma。以下是明确的代码设计值。

| 项目 | 附件特征 | 拾页设计值 |
|---|---|---|
| 布局 | 桌面多列卡片 | 默认 3 列，支持 2/3/4；窄屏降为 1 列 |
| 背景 | 冷灰底、白卡 | #f5f6f8 / #ffffff |
| 卡片 | 小圆角、细分隔 | 圆角 14px，边框 1px，内边距 22px；常规卡片固定 520px，未接入卡片 340px，长内容内滚动 |
| 字体 | 中文系统无衬线 | 系统字体，内容 14px，标题 16px |
| 间距 | 紧凑信息密度 | 页面边距 24px，卡片间距 18px；64px 顶栏，卡片从 88px 开始 |
| 品牌 | 红色品牌 | 拾页采用石墨黑 #202530，主按钮钴蓝 #355df5 |

## 目录
```
manifest.json / index.html / styles.css
src/app.js             界面、交互、状态
src/sources.js         数据适配器
src/storage.js         配置、缓存、权限
src/model.js           配置验证、链接安全
icons/                本地扩展图标
scripts/build.mjs      生成 dist
tests/                解析与扩展运行验证
docs/                 PRD、技术设计、验收记录
```

## 阅读卡片与升级兼容

- 显示条数为 1 时使用阅读卡片，生活建议保留专属布局；多条数据使用列表。
- RSS / Atom / JSON Feed / JSON 摘要保留换行及 HTML 段落边界，最多 500 字符；标题仍合并空白。HTML 只提取文本，清除脚本等节点。
- 缓存键包含摘要解析版本，升级后重新获取旧版已丢失换行的缓存。
- 默认仅包含生活建议、GitHub、Apple 三个来源。读取配置时移除未连接的旧默认七麦占位卡片，保留已配置或自行添加的七麦源。

## 初版任务列表（历史）
1. 核实数据源及私人 GitHub 身份。
2. 建立扩展结构、数据适配器、存储和权限逻辑。
3. 实现响应式看板、源管理、主题、布局、备份。
4. 验证真实数据、异常路径、扩展新标签页和交互；打包。
5. 命名项目、创建私人账号下的私有仓库、提交推送并核对远端。
