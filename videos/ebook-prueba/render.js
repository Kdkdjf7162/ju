const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('file://' + __dirname + '/ebook.html'); await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: __dirname + '/ebook-prueba.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
  await b.close();
})();
