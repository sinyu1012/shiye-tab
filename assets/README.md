# 诗词资源与许可

## 字体

`fonts/ShiyePoetry.woff2` 是 Noto Serif SC Medium（500）的网页子集，使用独立字体名 **Shiye Poetry**。仅包含 `src/poems.js` 与诗词卡片所需字符，不适合作为通用中文字体。

- 上游：[Google Fonts / Noto Serif SC](https://github.com/google/fonts/tree/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/notoserifsc)，固定版本 `45e3d5269e4a17d823f6d84470bc084dc5ae46f6`。
- 原文件：[NotoSerifSC\[wght\].ttf](https://github.com/google/fonts/blob/45e3d5269e4a17d823f6d84470bc084dc5ae46f6/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf)。
- 许可：SIL Open Font License 1.1，随包保留 [版权及完整许可](licenses/NotoSerifSC-OFL.txt)。支持免费商用、修改及随软件嵌入分发；字体本身不可单独出售。
- 修改：将可变字体固定为 500 字重、裁剪字符集、转换 WOFF2、重命名字体；保留版权和许可元数据。

更新诗集后需重新生成子集。生成工具仅供维护资源，无需加入应用依赖：

```sh
python3 -m venv /tmp/shiye-font-tools
/tmp/shiye-font-tools/bin/pip install 'fonttools[woff]'
/tmp/shiye-font-tools/bin/python scripts/subset-poetry-font.py '/path/to/NotoSerifSC[wght].ttf'
```

## 诗集

`src/poems.js` 节选自 [chinese-poetry 唐诗三百首](https://github.com/chinese-poetry/chinese-poetry/blob/b8594f81a89752241442f2ce267d6f66f96704ee/蒙学/tangshisanbaishou.json)，固定版本 `b8594f81a89752241442f2ce267d6f66f96704ee`。数据集使用 [MIT 许可](licenses/chinese-poetry-MIT.txt)。

按原文顺序遍历 `content[].content[].paragraphs[]`，仅选取由两个五字或七字分句组成、逗号连接、以 `。？！` 结束的完整段落，排除带注释或缺少终止标点的条目，按正文去重；共 1,317 句。各项保存 `[诗句, 作者, 篇名]`，在维护资源时通过 macOS Foundation 的 ICU `Traditional-Simplified` 将三项统一转为简体字；保持顺序、完整对句与标点，运行时无转换依赖。筛选格式为：

```regex
^[\u3400-\u9fff]{5}，[\u3400-\u9fff]{5}[。？！]$|^[\u3400-\u9fff]{7}，[\u3400-\u9fff]{7}[。？！]$
```

诗集与字体均从扩展本地读取，不产生外部请求。`scripts/build.mjs` 会把本目录及许可一起复制到 `dist/`。

## 视觉参考

诗词卡片采用现代书页风格，卡片布局与交互为本项目实现。

## 时间天气卡片字体与图标

- `fonts/BarlowCondensed-Bold.ttf`：Google Fonts 的 Barlow Condensed Bold 原始字体，未修改。用于时间、温度和气象数字；[上游固定版本](https://github.com/google/fonts/tree/bd8f81ddb5c74d5c8897b36ad88b440266245103/ofl/barlowcondensed)，[SIL OFL 1.1 许可](licenses/BarlowCondensed-OFL.txt)。
- `icons/weather.svg`：从 [Lucide 固定版本](https://github.com/lucide-icons/lucide/tree/70562c1ee1c4fdcf736fe97bc893fb8511927934/icons) 提取 17 个图标组成 SVG symbol 文件；保留原始路径，cloud-sun 的太阳路径使用主题强调色。完整 [Lucide 许可](licenses/Lucide-LICENSE.txt) 随扩展分发。
- 字体和图标均从扩展本地加载，无需字体 CDN 或运行时图标库。
