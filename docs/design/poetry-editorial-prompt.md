# 简体诗词卡片设计稿

使用内置 image_gen 生成。接口未提供模型选择参数，无法确认 image2.5 型号。
范围仅为诗词卡片；生成稿中的诗句是排版示例，实际仍从本地诗集随机选择。
设计稿：`poetry-editorial-imagegen.png`。本次无 Figma 节点，以下为依据生成稿制定的实现规格。

| 项目 | 原实现 | 新版实现规格 |
|---|---|---|
| 卡片 | 520px 高，14px 圆角 | 保留 520px 高，16px 圆角 |
| 表面 | 白色头尾 + 米色正文 | 统一暖白 #faf9f5；深色 #222b27 |
| 文字 | 居中文楷 | 左对齐 Noto Serif SC Medium 本地子集 |
| 正文 | 22–28px / 1.9 | 22–32px 随卡宽调整 / 1.9，字重 500 |
| 留白 | 正文左右 24px | 正文左右 32px，窄卡缩至 24px |
| 装饰 | 印章、填色山形 | 小标题、短分隔线、细线山景 |
| 操作 | 顶部换一句、底部刷新 | 底部单一换一句按钮，保留诗集来源链接 |
| 诗集 | 繁体 | 诗句、作者与篇名均转换为简体 |

## 验证记录

- `npm run check`、`npm test`（4/4）、`npm run build`、`npm run test:extension`、`git diff --check` 通过。
- 实际 Manifest V3 扩展验证：简体诗集不受旧繁体缓存影响、离线字体加载、换句不连续重复、来源链接、深浅色主题与系统深色。
- 额外检查 1920 / 1440 / 1280 / 1101 / 768 / 390 / 320px 视口，四列布局下最长篇名与七言诗共 14 组；无水平或垂直溢出，诗句保持两行，出处与页脚提示不重叠。
- 本地字体覆盖所有诗句、作者与篇名，2,453 个码位，无缺字；打包大小 462,488 bytes。
- 实际截图：`artifacts/poetry-editorial-light.png`、`artifacts/poetry-editorial-dark.png`、`artifacts/poetry-editorial-1101.png`、`artifacts/poetry-editorial-390.png`。布局测量见 `artifacts/poetry-layout-results.json`。这些验证产物按仓库规则不提交。

## 最终提示词

+Use case: ui-mockup.
Asset type: production interface concept for a Chinese Chrome new-tab poetry card, redesigned in a contemporary literary editorial style.
Create a very high fidelity flat UI design image showing exactly TWO versions of the SAME narrow vertical poetry card side by side, light mode and dark mode. Neutral warm light gray presentation canvas, small unobtrusive labels 浅色 and 深色 outside the cards. Each card proportion about 400 pixels wide x 520 high. Do not redesign the whole dashboard. No perspective and no device frames.
Style: contemporary Chinese book design, quiet, beautifully composed, sophisticated but friendly. A refined freely licensed Noto Serif SC / Source Han Serif style for the poem, NOT handwriting, NOT traditional calligraphy. All Chinese text in SIMPLIFIED Chinese.
Light mode: warm nearly-white paper #faf9f5, ink #293b35, muted green-gray secondary text #7b8279, very soft hairline border, small restrained burnt orange #b25e42 accent. Dark mode: ink green-charcoal #222b27, warm cream letters #e4e7db, soft muted green secondary text and restrained amber accent. 16 px rounded corners. One continuous card surface including header and footer, no white header/footer bands, no drop-shadow drama or gradients.
Header top at 24px inset: tiny minimal leaf-like outline icon inside a small subtle pale green square then title 拾一句诗 in clean modern sans-serif 16px, beneath title tiny 唐诗 · 随机一句. Top right quiet more menu. Below header a thin hairline.
Card body about 400px high, left aligned 32px inset. At upper left understated tiny uppercase POETRY and a short orange hairline. Main text in attractive Noto Serif SC Medium, 29px with deliberate generous 1.9 line height, displayed in TWO horizontal lines, exactly:
行到水穷处，
坐看云起时。
Below with 26px vertical gap: a short horizontal line and small sans-serif 唐 · 王维 on one line, then 《终南别业》 in smaller green gray below.
Lower right body very subtle elegant fine-line illustration of a small sun above two softly curved terrain contour lines, compact and airy with near-transparent sage gray strokes. Pure decorative linework, not filled mountains. Lower left small caption 此刻，与诗相逢.
At bottom above footer a thin line, left small green status dot and 简体诗选; right rounded unobtrusive pale green button with refresh outline icon and text 换一句. Keep all elements visually balanced, functional and restrained.
Do not include red square stamps, oversized quotation marks, paper noise, handwritten lettering, traditional Chinese characters, landscape photos, emoji, fake extra controls, watermarks or headings. Strong text contrast, convincing real app UI polish. Both themes identical geometry.
