// Render cuadro a cuadro de public/film.html con varios navegadores en paralelo (cada cuadro es función de t).
// uso: node render.js [--q 'n=12&dia=1&handle=@x'] [--stills 0,30,...] [--workers 3] [--dir frames]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const a = process.argv.slice(2), arg = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const Q = '?' + (arg('--q', 'n=12&dia=1'));
const stills = arg('--stills') ? arg('--stills').split(',').map(Number) : null, NW = +arg('--workers', 3);
const ranges = arg('--ranges') ? arg('--ranges').split(',').flatMap(r => { const [x, y] = r.split('-').map(Number); return [...Array(y - x + 1)].map((_, i) => x + i); }) : null;
const dir = path.join(__dirname, 'out', arg('--dir', stills && !ranges ? 'stills' : 'frames')); fs.mkdirSync(dir, { recursive: true });
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const first = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await first.goto('file://' + path.join(__dirname, 'public', 'film.html') + Q); await first.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  const N = await first.evaluate(() => window.__N);
  fs.writeFileSync(path.join(__dirname, 'out', 'tl.json'), JSON.stringify(await first.evaluate(() => window.TL), null, 1)); await first.close();
  const all = ranges || stills || [...Array(N).keys()], t0 = Date.now(); let done = 0;
  const chunks = [...Array(NW)].map((_, k) => all.filter((_, i) => Math.floor(i * NW / all.length) === k));
  await Promise.all(chunks.map(async (list) => {
    const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
    p.on('pageerror', e => console.error('PAGEERROR', e.message));
    await p.goto('file://' + path.join(__dirname, 'public', 'film.html') + Q); await p.waitForFunction(() => window.__ready, null, { timeout: 180000 });
    for (const f of list) {
      await p.evaluate(n => window.__render(n), f);
      await p.screenshot({ path: path.join(dir, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 90 });
      if (++done % 100 === 0) console.log(`cuadros ${done}/${all.length}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    }
    await p.close();
  }));
  console.log(`listo ${all.length} cuadros en ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await b.close();
})();
