// Render cuadro a cuadro de scene.html (modo captura del voxel-kit) → out/frames/f0000.jpg
// uso: node render.js [desde] [hasta] [--stills 0,100,200]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2);
const stillsArg = args.indexOf('--stills');
const stills = stillsArg >= 0 ? args[stillsArg + 1].split(',').map(Number) : null;
const N = 540;
const outDir = path.join(__dirname, 'out', stills ? 'stills' : 'frames');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.error('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'scene.html') + '?capture&clean&fps=30');
  await page.waitForFunction(() => window.__vk && window.__vk.ready);
  await page.evaluate(() => document.fonts.ready);
  const last = stills ? Math.max(...stills) : N - 1;
  const want = stills ? new Set(stills) : null;
  const t0 = Date.now();
  for (let f = 0; f <= last; f++) {
    if (f > 0) await page.evaluate(() => { window.__vk.frame(1); });
    if (want && !want.has(f)) continue;
    const url = await page.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.94));
    fs.writeFileSync(path.join(outDir, `f${String(f).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    if (f % 30 === 0) console.log(`cuadro ${f}/${last}  ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  }
  await browser.close();
})();
