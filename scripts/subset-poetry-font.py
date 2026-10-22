"""Optional asset tool: python subset-poetry-font.py '/path/to/NotoSerifSC[wght].ttf'."""
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent.parent
text = (root / 'src/poems.js').read_text() + '诗唐唐诗拾一句诗随机诗选简体诗选此刻与诗相逢换一句《》·'
font = TTFont(sys.argv[1])
missing = {char for char in text if '\u3400' <= char <= '\u9fff' and ord(char) not in font.getBestCmap()}
if missing:
    raise ValueError(f'Missing glyphs: {sorted(missing)}')
# Pin the upstream variable font to Medium before building the local subset.
font = instantiateVariableFont(font, {'wght': 500}, inplace=True)
# Give the web-only subset its own family name, retaining copyright and license.
names = {1: 'Shiye Poetry', 2: 'Medium', 3: 'Shiye Poetry Medium ' + font['name'].getDebugName(5),
         4: 'Shiye Poetry Medium', 6: 'ShiyePoetry-Medium',
         16: 'Shiye Poetry', 17: 'Medium'}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
options = subset.Options()
options.name_IDs = ['*']
options.name_languages = ['*']
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
font.flavor = 'woff2'
font.save(root / 'assets/fonts/ShiyePoetry.woff2')
