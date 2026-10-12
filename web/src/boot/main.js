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

    // 2. Setup Responsive Canvas Resize & Mobile/iOS Orientation Handling
    const rotateOverlay = document.getElementById('rotate-device-overlay');
    if (rotateOverlay) {
      const enableForcedLandscape = () => {
        document.body.classList.add('ios-landscape-rot');
        this.handleResize();
      };
      rotateOverlay.addEventListener('click', enableForcedLandscape);
      rotateOverlay.addEventListener('touchend', (e) => {
        e.preventDefault();
        enableForcedLandscape();
      }, { passive: false });
    }

    window.addEventListener('deviceorientation', (e) => {
      if (window.innerHeight > window.innerWidth && e && typeof e.gamma === 'number') {
        if (Math.abs(e.gamma) > 52 && Math.abs(e.beta || 0) < 45) {
          if (!document.body.classList.contains('ios-landscape-rot')) {
            document.body.classList.add('ios-landscape-rot');
            this.handleResize();
          }
        }
      }
    });

    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.handleResize());
    }
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleResize(), 80);
      setTimeout(() => this.handleResize(), 280);
    });
    document.addEventListener('fullscreenchange', () => {
      document.body.classList.toggle('fs-mode', !!document.fullscreenElement);
      this.handleResize();
    });

    // 3. Load Layers and Shaders
    await this.renderer.loadAssets((progress) => {
      this.hud.setLoadingProgress(progress);
    });

    console.log("🚀 Assets and Shaders Loaded. Commencing GPU Loop at 60 FPS.");

    // 4. Auto-start music if launched from README Play link (?autoplay=1)
    const params = new URLSearchParams(window.location.search);
    if (params.get('autoplay') === '1') {
      const dockWrap = document.getElementById('bottom-dock-wrap');
      const dockArrow = document.getElementById('dock-tab-arrow');
      if (dockWrap) dockWrap.classList.add('open');
      if (dockArrow) dockArrow.innerHTML = '&#9660;';

      const tryAutoPlay = () => {
        if (!this.audio.isPlaying) {
          const playing = this.audio.toggle();
          this.hud.updatePlayState(playing);
        }
      };
      setTimeout(tryAutoPlay, 200);
      window.addEventListener('pointerdown', tryAutoPlay, { once: true });
      window.addEventListener('keydown', tryAutoPlay, { once: true });
    }

    // 5. Start Render Loop
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.tick(t));
  }

  handleResize() {
    const container = document.getElementById('canvas-container');
    const rawW = (window.visualViewport ? window.visualViewport.width : window.innerWidth) || container.clientWidth;
    const rawH = (window.visualViewport ? window.visualViewport.height : window.innerHeight) || container.clientHeight;

    // If native browser rotated to landscape, clear forced 90deg CSS rotation
    if (rawW > rawH && document.body.classList.contains('ios-landscape-rot')) {
      document.body.classList.remove('ios-landscape-rot');
    }

    const isForcedRot = document.body.classList.contains('ios-landscape-rot') && rawH > rawW;
    const width = isForcedRot ? rawH : rawW;
    const height = isForcedRot ? rawW : rawH;

    const isFs = document.body.classList.contains('fs-mode');
    const isCompact = width <= 1024 || height <= 540;

    // Full 16:9 viewport without forced lateral margin panels; compact/mobile reserves bottom clearance
    const reserveMargin = 0;
    const padX = isFs ? (isCompact ? 20 : 56) : 0;
    const padTop = isFs ? (isCompact ? 12 : 48) : (isCompact ? 6 : 0);
    const padBottom = isFs ? (isCompact ? 50 : 120) : (isCompact ? 42 : 0);
    const availableW = Math.max(240, width - reserveMargin - padX * 2);
    const availableH = Math.max(180, height - padTop - padBottom);

    // Preserve 16:9 / native artwork aspect ratio cleanly
    const nativeRatio = StudioConfig.canvas.aspectRatio;
    let renderW = availableW;
    let renderH = availableW / nativeRatio;

    if (renderH > availableH) {
      renderH = availableH;
      renderW = availableH * nativeRatio;
    }

    this.canvas.style.width = `${Math.floor(renderW)}px`;
    this.canvas.style.height = `${Math.floor(renderH)}px`;

    // Sync interactive artwork handles overlay (@KREATOSVORTEX & @STEVEBLACKBEARD) with exact canvas bounds
    const interactiveOverlay = document.getElementById('canvas-interactive-overlay');
    if (interactiveOverlay) {
      interactiveOverlay.style.left = `${this.canvas.offsetLeft}px`;
      interactiveOverlay.style.top = `${this.canvas.offsetTop}px`;
      interactiveOverlay.style.width = `${this.canvas.offsetWidth}px`;
      interactiveOverlay.style.height = `${this.canvas.offsetHeight}px`;
    }

    // Size #right-drawer-wrap cleanly anchored to right: 0
    const rightDrawerWrap = document.getElementById('right-drawer-wrap');
    if (rightDrawerWrap) {
      rightDrawerWrap.style.width = isCompact ? '84px' : '124px';
    }

    // Internal buffer size: lock to exact native harmonic resolution (2668x1500 or 3840x2160)
    // Eliminates fractional scanline Moiré interference and provides true SSAA supersampling on 1080p/1440p screens
    const physicalW = renderW * (window.devicePixelRatio || 1.0);
    const targetInternalW = physicalW > 2800 ? 3840 : 2668;
    const targetInternalH = physicalW > 2800 ? 2160 : 1500;
    this.renderer.resize(targetInternalW, targetInternalH);

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
