const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const a = process.argv.slice(2), si = a.indexOf('--stills'); const stills = si >= 0 ? a[si + 1].split(',').map(Number) : null;
const N = 840, dir = path.join(__dirname, 'out', stills ? 'stills' : 'frames'); fs.mkdirSync(dir, { recursive: true });
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.error('PAGEERROR', e.message));
  await p.goto('file://' + path.join(__dirname, 'ad.html')); await p.waitForFunction(() => window.__ready); await p.evaluate(() => document.fonts.ready);
  const list = stills || [...Array(N).keys()], t0 = Date.now();
  for (const f of list) {
    await p.evaluate(n => window.__render(n), f);
    await p.screenshot({ path: path.join(dir, `f${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
    if (f % 120 === 0) console.log('cuadro', f, ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  }
  await b.close();
})();
