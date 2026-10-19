// Gera os ícones PNG a partir de icones/molde.html. Rodar: node icones/gerar.js
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
(async () => {
  const b = await chromium.launch();
  const molde = 'file://' + path.join(__dirname, 'molde.html');
  for (const [nome, tam, tipo] of [['icone-512', 512, ''], ['icone-192', 192, ''], ['icone-180', 180, 'maskable'], ['icone-maskable-512', 512, 'maskable']]) {
    const p = await b.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: tam / 512 });
    await p.goto(molde + (tipo ? '?tipo=' + tipo : ''));
    await p.waitForTimeout(300);
    await p.locator('#icone').screenshot({ path: path.join(__dirname, nome + '.png'), omitBackground: true, animations: 'disabled' });
    await p.close();
  }
  await b.close();
})();
