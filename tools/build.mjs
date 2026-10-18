/**
 * M7.3 web export: assembles a GitHub Pages-ready site in dist/.
 *
 * Layout on the branch (gh-pages):
 *   /              landing page (pages/index.html) + promo screenshots/GIF
 *   /juego/        the game itself — index.html + src/ + assets/,
 *                  all relative paths so it runs from any subdirectory
 *
 *   node tools/build.mjs
 */
import { rmSync, mkdirSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url)) + '/..';
const dist = join(root, 'dist');

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

// game subfolder: index.html + src + assets (all relative-path based)
const juego = join(dist, 'juego');
mkdirSync(juego, { recursive: true });
cpSync(join(root, 'index.html'), join(juego, 'index.html'));
cpSync(join(root, 'src'), join(juego, 'src'), { recursive: true });
cpSync(join(root, 'assets'), join(juego, 'assets'), { recursive: true });

// promo media for the landing page
cpSync(join(root, 'promo'), join(dist, 'promo'), { recursive: true });

// landing page
cpSync(join(root, 'pages', 'index.html'), join(dist, 'index.html'));

const listing = (dir, prefix = '') => {
  let out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) out = out.concat(listing(p, prefix + e + '/'));
    else out.push(prefix + e + '  (' + Math.round(st.size / 1024) + ' KB)');
  }
  return out;
};
console.log('dist/ built:');
for (const line of listing(dist)) console.log('  ' + line);
if (!existsSync(join(dist, 'index.html'))) throw new Error('landing page missing');
console.log('OK — deploy dist/ to gh-pages');
