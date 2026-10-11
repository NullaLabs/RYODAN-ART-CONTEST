const puppeteer = require('C:/Users/esenc/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');

async function testComparison() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-webgl', '--ignore-gpu-blocklist', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.ryodanApp && window.ryodanApp.renderer && window.ryodanApp.renderer.isLoaded);

  const capturePath = path.join('E:', 'RYODAN_STUDIO', 'web', 'test_fix_capture.png');

  await page.evaluate(() => {
    const app = window.ryodanApp;
    app.offlineMode = true;
    app.renderer.scanner.active = false;
    const energy = {
      subBass: 0.15,
      mids: 0.12,
      highs: 0.10,
      impact: 0.05,
      kick: 0.0,
      echo: 0.0,
      snare: 0.0,
      variantIndex: 0.0,
      dropActive: false
    };
    app.renderer.render(2.0, 0.033, energy, 2.0);
    app.hud.update(performance.now(), energy);
  });

  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: capturePath, type: 'png' });
  await browser.close();
  console.log('Capture saved to', capturePath);
}

testComparison().catch(console.error);
