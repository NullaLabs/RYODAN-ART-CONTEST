/**
 * ETHERNIUM SOVEREIGN WEB - BOOTSTRAP MODULE
 * Lifecycle management, responsive resize & 60 FPS animation loop
 */
import { StudioConfig } from '../config/studio_config.js';
import { AudioEngine } from '../api/audio_engine.js';
import { VisualizerRenderer } from '../render/visualizer_renderer.js';
import { HudController } from '../ui/hud_controller.js';
import { WebMarginWavesController } from '../ui/web_margin_waves.js';

class RyodanStudioApp {
  constructor() {
    this.canvas = document.getElementById('webgl-canvas');
    this.audio = new AudioEngine();
    this.renderer = new VisualizerRenderer(this.canvas);
    this.hud = new HudController(this.audio, this.renderer);
    this.marginWaves = new WebMarginWavesController('margin-waves-left', 'margin-waves-right');

    this.lastTime = performance.now();
    this.totalTime = 0.0;
  }

  async boot() {
    console.log("⚡ Booting Ryodan 4K Sovereign Visualizer Studio...");

    // 1. Initialize Audio
    await this.audio.init();

    // 2. Setup Responsive Canvas Resize
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // 3. Load Layers and Shaders
    await this.renderer.loadAssets((progress) => {
      this.hud.setLoadingProgress(progress);
    });

    console.log("🚀 Assets and Shaders Loaded. Commencing GPU Loop at 60 FPS.");

    // 4. Start Render Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  handleResize() {
    const container = document.getElementById('canvas-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Reserve lateral margin space on desktop so 3D crystal margins are visible without overlapping artwork
    const reserveMargin = (width >= 1200) ? 260 : 0;
    const availableW = Math.max(400, width - reserveMargin);

    // Preserve 16:9 / native artwork aspect ratio cleanly
    const nativeRatio = StudioConfig.canvas.aspectRatio;
    let renderW = availableW;
    let renderH = availableW / nativeRatio;

    if (renderH > height) {
      renderH = height;
      renderW = height * nativeRatio;
    }

    this.canvas.style.width = `${Math.floor(renderW)}px`;
    this.canvas.style.height = `${Math.floor(renderH)}px`;

    // Internal buffer size for 4K crisp fidelity
    // When in high-DPI or 4K screen, render target can scale up to 3840x2160
    const dpr = Math.min(window.devicePixelRatio || 1.0, 2.0);
    this.renderer.resize(renderW * dpr, renderH * dpr);

    // Update margin canvas geometry to align exactly with new canvas bounds
    if (this.marginWaves) {
      this.marginWaves.resize();
    }
  }

  tick(currentTimeMs) {
    if (this.offlineMode) return;
    const delta = Math.min((currentTimeMs - this.lastTime) / 1000.0, 0.1);
    this.lastTime = currentTimeMs;
    this.totalTime += delta;

    // 1. Update Audio Energy & FFT Bands
    const energy = this.audio.update(delta);

    // 2. Render WebGL Scene
    this.renderer.render(this.totalTime, delta, energy, this.audio.currentTime);

    // 3. Update HUD Telemetry
    this.hud.update(currentTimeMs, energy);

    // 4. Update Web Margin Plasma Waves (Outside artwork)
    if (this.marginWaves) {
      this.marginWaves.update(this.totalTime, energy);
    }

    requestAnimationFrame((t) => this.tick(t));
  }
}

// Auto-boot on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  const app = new RyodanStudioApp();
  window.ryodanApp = app;
  app.boot().catch((err) => {
    console.error("Critical Studio Boot Error:", err);
  });
});
