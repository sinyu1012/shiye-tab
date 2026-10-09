# 石墨与钴蓝配色

方式：内置 image_gen 工具。调用接口没有模型版本参数，无法指定或核实 image2.5。
设计稿：`graphite-cobalt-imagegen.png`。
范围：替换配色，沿用 64px 顶栏、88px 卡片起点及现有布局。设计稿中的示例文字和排名不写入数据源。

## 最终提示词

Use case: ui-mockup / precise color redesign.
Input image: reference screenshot of the existing Shiye Tab Chrome new-tab dashboard. This is a color redesign of that exact application. Keep all layout, geometry, component sizes, toolbar arrangement, three equal columns, typography hierarchy, and Chinese labels unchanged. Generate only the application viewport, no browser chrome.
Primary request: replace the existing dull green/sage/olive palette with a sophisticated, crisp, contemporary graphite-and-cobalt visual system. Premium editorial productivity interface, calm neutral surfaces, selective small saturated accents, high readability. This should look materially different from the green reference and visually polished.
Exact palette guidance:
- page background cool porcelain #F5F6F8
- white top toolbar and cards #FFFFFF, refined neutral border #E2E5EB
- primary text graphite #202530, secondary slate #636C7D
- small brand logo square graphite #202530 with white Chinese 拾, brand text graphite
- primary Add Source button cobalt #355DF5 with white text
- active category tab very pale blue #EBEFFF with cobalt text
- all regular toolbar labels and icons neutral slate, not blue
- life advice card body almost-white #F8F9FC, NO large colored green or blue block, elegant graphite Chinese serif headline
- life card small icon pale periwinkle #EDEFFF and muted blue #5369B0
- GitHub icon near black with white GitHub mark; App Store original blue icon; Qimai small subdued purple icon
- rank colors restrained charcoal for most, a single subtle terracotta first rank; numeric weekly gains neutral slate, not green
- green allowed ONLY tiny fresh status dots in card footers, no other green
- add-source tile very subtle light gray dashed outline; large plus icon light neutral gray circle; text graphite instead of colorful text.
Keep compact single 64px toolbar: 拾页, 全部 4, 生活, 开发, 应用, search, refresh, 管理订阅, + 添加数据源, settings. First row starts around y=88px. Three main cards 好好生活 / GitHub / App Store roughly520px tall; second row 七麦数据 unconfigured and add-source tile roughly340px tall.
Use neutral short illustrative life text if needed: title "把注意力，留给真正重要的事。" body "给自己留一段不被打断的时间，专注做好眼前的一件事。" No new feature, sidebar, hero, charts, gradients, glows, oversize whitespace, pastel rainbow colors, illustrations, decoration, or device frames. No green tint anywhere in the page surface. Straight-on pixel-clean production design, one coherent light-theme screenshot, similar aspect ratio to reference.

## 实现

浅色：页面 #F5F6F8、白卡 #FFFFFF、文字与品牌 #202530、主按钮 #355DF5、生活卡片 #F8F9FC。
深色：页面 #13161C、卡片 #1D2129、文字 #E7EAF2、按钮 #87A3FF。
颜色通过语义变量管理；绿色仅用于更新成功的小圆点。
