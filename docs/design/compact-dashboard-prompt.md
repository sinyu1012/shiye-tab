# 紧凑看板设计稿

生成方式：内置 image_gen 工具。接口不提供模型版本选择，无法核实用户指定的 2.5 版本。
参考：用户提供的现有 Chrome 新标签页截图。仅参考应用界面，不复用浏览器标签和书签。
输出：`compact-dashboard-imagegen.png`。图中的内容和排名是排版示例，不用于实际数据。

## 最终提示词

Use case: ui-mockup
Asset type: High fidelity production UI design for an existing Chrome new-tab extension, Shiye Tab 拾页.
Input image: the provided screenshot is the current app and visual reference. Ignore and DO NOT reproduce the entire browser chrome, tabs, bookmarks, user-specific browser information. Generate ONLY the web app viewport.
Primary request: redesign into a beautiful highly compact, content-first personal information dashboard. The current enormous top navigation plus welcome slogan plus separate toolbar wastes space. Remove the welcome hero entirely, remove the separate "我的看板 / 管理订阅" navigation strip, consolidate functions into ONE slim 64px top toolbar. No large page heading, no greeting, no slogan, no giant date. Desktop mockup 1440x1000 proportions.
Top toolbar: small tasteful forest-green logo mark and Chinese word "拾页" left; thin vertical divider; filter tabs "全部 4" "生活" "开发" "应用"; on the right a compact search input "搜索内容…" with slash shortcut, refresh icon button, text action "管理订阅", solid green "+ 添加数据源" button, settings gear icon. Fits a single horizontal row at 1440px.
Content: start the first row of cards at y=84px, 24px horizontal page padding, 18px gutters, equal three columns. White rounded cards on soft warm gray off-white #f6f7f5 background. Card radius 14px, subtle green-gray borders, polished readable typography, no dramatic shadows, no gradients. Restrained sage and forest green palette #37705e. Refined editorial, functional, premium personal reading workspace.
First row consists of three equally sized cards ~520px high:
1 "好好生活" small muted subtitle "HowToLiveBetter", shuffle control "换一条", overflow dots. Body pale sage with a small uppercase-like Chinese eyebrow, tiny chapter label, prominent but not oversized Chinese serif headline "把注意力，留给真正重要的事。" with 3 lines of small readable Chinese explanatory text. A small cost detail, evidence pill, read original link and subtle attribution. This content is illustrative mockup copy only.
2 "GitHub" / "本周趋势", 10 compact readable repository rows, e.g. "mattpocock / skills", "heygen-com / hyperframes", "cursor / plugins", "theDotmack / claude-mem", "openai / codex". Numeric ranks in subtle colors and small green weekly gain stats right. Rows precisely aligned.
3 "App Store" / "中国 · iPhone 免费榜", 10 compact app rows. Names e.g. 微信, 抖音, 小红书, 支付宝, 豆包, 高德地图, 淘宝, 哔哩哔哩, 美团, 京东. No large app artwork.
All card footers have a tiny green dot, "刚刚更新" and original source link.
Second row visible starting around y=620px: first card "七麦数据" with honest unconfigured state "等待接入" and button "配置数据接口", second a quiet dashed-outline add-source tile "+ 添加你关心的内容", RSS · Newsletter · JSON. Do not fabricate live Qimai rankings. Third area remains blank background. Do not add extra sources, sidebar, charts, greeting or new functionality.
Overall emphasize impeccable alignment, readable Chinese, elegant restrained spacing, sophisticated lightweight typography, information density without clutter. All cards and buttons look buildable in HTML/CSS. Single coherent screenshot, no device frame, no annotations, no floating decorative objects.

## 实现规格

| 项目 | 原实现 | 还原设计值 |
|---|---|---|
| 顶栏 | 84px 导航 + 欢迎区 + 筛选区 | 64px 单行工具栏 |
| 首排卡片起点 | 1440px 视口约 316px | 88px |
| 页面边距 | 36px | 24px |
| 卡片间距 | 20px | 18px |
| 常规卡片高度 | 540px | 520px |
| 空状态卡片 | 同常规卡片 | 340px，减少空白 |
| 文字 | 欢迎语与品牌多层重复 | 仅品牌、分类及必要操作 |

窄屏将操作与分类折为两行，保留搜索和所有操作入口。既有数据获取、缓存、授权及配置格式不变。
