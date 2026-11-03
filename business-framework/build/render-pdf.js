// Renders the e-book HTML to an A4 PDF with page numbers.
// Usage: node build/render-pdf.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const src = path.resolve(__dirname, '..', 'Pancha-Khosha-Business-Framework.html');
  const out = path.resolve(__dirname, '..', 'Pancha-Khosha-Business-Framework.pdf');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + src, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({
    path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: '<div style="width:100%;font:7.5pt Inter,Arial,sans-serif;color:#8a90a0;padding:0 16mm;display:flex;justify-content:space-between"><span>Pancha Khosha Business Framework · Khosha Systems</span><span class="pageNumber"></span></div>',
  });
  await browser.close();
  console.log('Wrote', out);
})();
