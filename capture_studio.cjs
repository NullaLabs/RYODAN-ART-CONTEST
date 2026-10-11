const puppeteer = require('C:/Users/esenc/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const path = require('path');

async function testWebStudio() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const url = 'http://127.0.0.1:8080/index.html';
  const outPath = path.join('E:', 'RYODAN_STUDIO', 'web', 'studio_live_capture.png');

  console.log('[1/4] Launching Headless Chrome with GPU WebGL...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setCacheEnabled(false);
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err));

  console.log('[2/4] Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 25000 });

  await page.waitForFunction(() => window.ryodanApp && window.ryodanApp.renderer && window.ryodanApp.renderer.isLoaded, { timeout: 20000 });

  console.log('[3/4] Rendering deterministic V4 25-layer showcase frame...');
  await page.evaluate(() => {
    const app = window.ryodanApp;
    app.offlineMode = true;
    app.renderer.scanner.active = true;
    app.renderer.scanner.y = 0.55;
    const energy = {
      subBass: 0.82,
      mids: 0.74,
      highs: 0.78,
      impact: 0.80,
      kick: 0.75,
      echo: 0.72,
      snare: 0.85,
      variantIndex: 1.45,
      dropActive: false
    };
    if (app.audio && app.audio.audioElement) {
      app.audio.audioElement.currentTime = 18.2;
    }
    app.renderer.render(22.5, 0.033, energy, 24.8);
    app.hud.update(performance.now(), energy);
    if (app.hud.dom.timelineFill) {
      app.hud.dom.timelineFill.style.width = '45%';
    }
    if (app.hud.dom.scrubBar) {
      app.hud.dom.scrubBar.value = 45;
    }
    if (app.marginWaves) {
      app.marginWaves.update(22.5, energy);
    }
  });

  await new Promise(r => setTimeout(r, 400));

  console.log('[4/4] Capturing 4K retina screenshot...');
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();

  console.log('✅ Screenshot captured at:', outPath);
}

testWebStudio().catch(err => {
  console.error('❌ Web Studio Test failed:', err);
  process.exit(1);
});
