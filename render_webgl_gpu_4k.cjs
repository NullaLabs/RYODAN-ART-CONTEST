const puppeteer = require('C:/Users/esenc/.gemini/antigravity/scratch/node_modules/puppeteer-core');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function renderWebGL4KVideo() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const url = 'http://127.0.0.1:8080/index.html';
  const telemetryPath = 'E:\\RYODAN_STUDIO\\audio\\telemetry_30fps.json';
  const audioWav = 'E:\\RYODAN_STUDIO\\audio\\space_maeve.wav';
  const outMp4 = 'E:\\RYODAN_STUDIO\\exports\\RYODAN_SPACE_MAEVE_4K_MASTER.mp4';
  const outGif = 'E:\\RYODAN_STUDIO\\exports\\RYODAN_SPACE_MAEVE_HIGH_QUALITY.gif';
  const ffmpegExe = JSON.parse(fs.readFileSync('E:\\RYODAN_STUDIO\\audio\\ffmpeg_path.json', 'utf8')).ffmpeg;

  const telemetry = JSON.parse(fs.readFileSync(telemetryPath, 'utf8'));
  const totalFrames = telemetry.frames.length;
  console.log(`[1/5] Loaded ${totalFrames} frames of transient telemetry (FPS=${telemetry.fps})`);

  console.log('[2/5] Launching GPU WebGL Renderer at native 2668x1500 -> 4K 3840x2160...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    protocolTimeout: 300000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--window-size=2668,1500'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 2668, height: 1500, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.waitForFunction(() => window.ryodanApp && window.ryodanApp.renderer && window.ryodanApp.renderer.isLoaded, { timeout: 60000 });

  // Hide UI overlay so only the pure 100% WebGL shader artwork is captured
  await page.evaluate(() => {
    window.ryodanApp.offlineMode = true;
    const hud = document.getElementById('hud-overlay');
    if (hud) hud.style.display = 'none';
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.style.display = 'none';
    window.ryodanApp.renderer.renderer.setPixelRatio(1.0);
    window.ryodanApp.renderer.resize(2668, 1500);
  });

  console.log('[3/5] Starting FFmpeg 4K UHD (3840x2160, CRF 15) encoder...');
  const ffArgs = [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-r', String(telemetry.fps),
    '-i', '-',
    '-i', audioWav,
    '-vf', 'scale=3840:2160:flags=lanczos',
    '-c:v', 'libx264',
    '-preset', 'fast',
    '-crf', '15',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '320k',
    '-shortest',
    outMp4
  ];

  const ffProc = spawn(ffmpegExe, ffArgs, { stdio: ['pipe', 'ignore', 'ignore'] });

  console.log('[4/5] Rendering frames on GPU via Three.js GLSL Shaders...');
  const batchSize = 5;
  for (let i = 0; i < totalFrames; i += batchSize) {
    const batch = telemetry.frames.slice(i, i + batchSize);
    const dataUrls = await page.evaluate((framesBatch) => {
      const app = window.ryodanApp;
      const canvas = app.canvas;
      const out = [];
      for (const f of framesBatch) {
        // Holographic scanner timing: sweeps during pre-drop riser (20.5-23.45s) and every 6.0s
        if (f.t >= 20.5 && f.t <= 23.45) {
          app.renderer.scanner.active = true;
          app.renderer.scanner.y = 1.0 - (f.t - 20.5) / 2.95;
        } else if ((f.t % 6.0) < 1.8) {
          app.renderer.scanner.active = true;
          app.renderer.scanner.y = 1.0 - (f.t % 6.0) / 1.8;
        } else {
          app.renderer.scanner.active = false;
        }
        app.renderer.render(f.t, 0.0, f.energy, f.t);
        out.push(canvas.toDataURL('image/jpeg', 0.97));
      }
      return out;
    }, batch);

    for (const dUrl of dataUrls) {
      const base64Data = dUrl.split(',')[1];
      const buf = Buffer.from(base64Data, 'base64');
      if (!ffProc.stdin.write(buf)) {
        await new Promise(resolve => ffProc.stdin.once('drain', resolve));
      }
    }

    if (i % 150 === 0 || (i + batch.length) === totalFrames) {
      const done = Math.min(i + batch.length, totalFrames);
      console.log(`  GPU Rendered frame ${done}/${totalFrames} (${((done / totalFrames) * 100).toFixed(1)}%)`);
    }
  }

  ffProc.stdin.end();
  await new Promise(resolve => ffProc.on('close', resolve));
  await browser.close();
  console.log(`✅ 4K GPU MASTER VIDEO COMPLETE: ${outMp4}`);

  console.log('[5/5] Generating High-Quality GIF from 4K GPU Master...');
  const palettePath = 'E:\\RYODAN_STUDIO\\exports\\palette.png';
  await new Promise(resolve => {
    const p1 = spawn(ffmpegExe, [
      '-y', '-ss', '22.0', '-t', '8.0', '-i', outMp4,
      '-vf', 'fps=15,scale=960:-1:flags=lanczos,palettegen=stats_mode=diff',
      palettePath
    ], { stdio: 'ignore' });
    p1.on('close', resolve);
  });
  await new Promise(resolve => {
    const p2 = spawn(ffmpegExe, [
      '-y', '-ss', '22.0', '-t', '8.0', '-i', outMp4, '-i', palettePath,
      '-lavfi', 'fps=15,scale=960:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3',
      outGif
    ], { stdio: 'ignore' });
    p2.on('close', resolve);
  });
  if (fs.existsSync(palettePath)) fs.unlinkSync(palettePath);
  console.log(`✅ HIGH-QUALITY GIF COMPLETE: ${outGif}`);
}

renderWebGL4KVideo().catch(err => {
  console.error('❌ GPU Render error:', err);
  process.exit(1);
});
