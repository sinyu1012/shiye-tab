import { cp, mkdir, rm, readFile } from 'node:fs/promises';
const manifest = JSON.parse(await readFile('manifest.json', 'utf8'));
if (!manifest.chrome_url_overrides.newtab) throw new Error('Missing newtab override');
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const file of ['manifest.json','index.html','styles.css','src','icons']) await cp(file, `dist/${file}`, { recursive: true });
console.log('Built dist/ — load unpacked in chrome://extensions');
