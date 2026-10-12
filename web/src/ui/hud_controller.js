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
    this.lastCurStr = '';
    this.lastDurStr = '';
    this.lastDropState = null;

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
      document.documentElement.requestFullscreen().then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(() => {});
        }
      }).catch((err) => {
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
    // 1. Time & Scrub Update (diff-cached to prevent 60Hz DOM layout reflows)
    const cur = this.audio.currentTime;
    const dur = this.audio.duration;
    const curStr = this.formatTime(cur);
    const durStr = this.formatTime(dur);
    if (curStr !== this.lastCurStr) {
      this.lastCurStr = curStr;
      this.dom.timeCurrent.textContent = curStr;
    }
    if (durStr !== this.lastDurStr) {
      this.lastDurStr = durStr;
      this.dom.timeDuration.textContent = durStr;
    }

    if (!this.isDraggingScrub && dur > 0) {
      const pct = (cur / dur) * 100.0;
      this.dom.scrubBar.value = pct;
      if (this.dom.timelineFill) {
        this.dom.timelineFill.style.width = `${pct.toFixed(2)}%`;
      }
    }

    // 2. Drop Badge Status (diff-cached)
    const isDrop = Boolean(energy.dropActive);
    if (isDrop !== this.lastDropState) {
      this.lastDropState = isDrop;
      if (this.dom.dropBadge) {
        this.dom.dropBadge.textContent = isDrop ? 'DROP ACTIVE' : 'PRE-BUILD';
        this.dom.dropBadge.className = isDrop ? 'badge active' : 'badge pre-drop';
      }
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
