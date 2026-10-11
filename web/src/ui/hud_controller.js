/**
 * ETHERNIUM SOVEREIGN WEB - HUD CONTROLLER
 * Cyberpunk Glassmorphic HUD, Audio Player Controls & Real-Time Telemetry
 */

export class HudController {
  constructor(audioEngine, visualizerRenderer) {
    this.audio = audioEngine;
    this.renderer = visualizerRenderer;

    this.dom = {
      playBtn: document.getElementById('btn-play'),
      playIcon: document.getElementById('play-icon'),
      scrubBar: document.getElementById('timeline-scrub'),
      timeCurrent: document.getElementById('time-current'),
      timeDuration: document.getElementById('time-duration'),
      fullscreenBtn: document.getElementById('btn-fullscreen'),
      scanBtn: document.getElementById('btn-scan'),
      fpsValue: document.getElementById('telemetry-fps'),
      bassMeter: document.getElementById('meter-bass'),
      midsMeter: document.getElementById('meter-mids'),
      highsMeter: document.getElementById('meter-highs'),
      dropBadge: document.getElementById('badge-drop'),
      loadingOverlay: document.getElementById('loading-overlay'),
      loadingProgress: document.getElementById('loading-progress-bar'),
      loadingPercent: document.getElementById('loading-percent'),
      timelineFill: document.getElementById('timeline-liquid-fill')
    };

    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.isDraggingScrub = false;

    this.bindEvents();
  }

  bindEvents() {
    this.dom.playBtn.addEventListener('click', () => {
      const playing = this.audio.toggle();
      this.updatePlayState(playing);
    });

    this.dom.scanBtn.addEventListener('click', () => {
      this.renderer.triggerHologramScan();
    });

    this.dom.fullscreenBtn.addEventListener('click', () => {
      this.toggleFullscreen();
    });

    this.dom.scrubBar.addEventListener('input', (e) => {
      this.isDraggingScrub = true;
      const pct = parseFloat(e.target.value);
      if (this.dom.timelineFill) {
        this.dom.timelineFill.style.width = `${pct}%`;
      }
      this.audio.seek((pct / 100.0) * (this.audio.duration || 40.17));
    });

    this.dom.scrubBar.addEventListener('change', () => {
      this.isDraggingScrub = false;
    });

    this.audio.onEndedCallback = () => {
      this.updatePlayState(false);
    };

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const playing = this.audio.toggle();
        this.updatePlayState(playing);
      } else if (e.code === 'KeyF') {
        this.toggleFullscreen();
      } else if (e.code === 'KeyS') {
        this.renderer.triggerHologramScan();
      }
    });
  }

  updatePlayState(isPlaying) {
    if (isPlaying) {
      this.dom.playIcon.innerHTML = '&#10074;&#10074;'; // Pause icon
      this.dom.playBtn.classList.add('playing');
    } else {
      this.dom.playIcon.innerHTML = '&#9658;'; // Play icon
      this.dom.playBtn.classList.remove('playing');
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  setLoadingProgress(fraction) {
    const pct = Math.floor(fraction * 100);
    if (this.dom.loadingProgress) this.dom.loadingProgress.style.width = `${pct}%`;
    if (this.dom.loadingPercent) this.dom.loadingPercent.textContent = `${pct}%`;
    if (fraction >= 1.0) {
      setTimeout(() => {
        if (this.dom.loadingOverlay) {
          this.dom.loadingOverlay.style.opacity = '0';
          setTimeout(() => {
            this.dom.loadingOverlay.style.display = 'none';
          }, 600);
        }
      }, 300);
    }
  }

  formatTime(secs) {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  update(now, energy) {
    // 1. Time & Scrub Update
    const cur = this.audio.currentTime;
    const dur = this.audio.duration;
    this.dom.timeCurrent.textContent = this.formatTime(cur);
    this.dom.timeDuration.textContent = this.formatTime(dur);

    if (!this.isDraggingScrub && dur > 0) {
      const pct = (cur / dur) * 100.0;
      this.dom.scrubBar.value = pct;
      if (this.dom.timelineFill) {
        this.dom.timelineFill.style.width = `${pct}%`;
      }
    }

    // 2. Drop Badge Status
    if (energy.dropActive) {
      if (this.dom.dropBadge) { this.dom.dropBadge.textContent = 'DROP ACTIVE'; this.dom.dropBadge.className = 'badge active'; }
    } else {
      if (this.dom.dropBadge) { this.dom.dropBadge.textContent = 'PRE-BUILD'; this.dom.dropBadge.className = 'badge pre-drop'; }
    }

    // 4. FPS Counter
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      if (this.dom.fpsValue) {
        this.dom.fpsValue.textContent = `${fps} FPS`;
      }
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
