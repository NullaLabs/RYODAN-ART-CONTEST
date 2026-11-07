/**
 * ETHERNIUM SOVEREIGN WEB - AUDIO ENGINE API (V4: REAL-TIME ONSET & SIDECHAIN SYNERGY)
 */
import { StudioConfig } from '../config/studio_config.js';

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.preload = 'auto';
    this.analyser = null;
    this.sourceNode = null;
    this.isInitialized = false;
    this.isPlaying = false;

    this.frequencyData = null;
    this.telemetry = null;
    this.telemetryLoaded = false;

    this.energy = {
      subBass: 0.0,
      mids: 0.0,
      highs: 0.0,
      rms: 0.0,
      impact: 0.0,
      kick: 0.0,
      echo: 0.0,
      snare: 0.0,
      grit: 0.0,
      variantIndex: 0,
      dropActive: false
    };

    this.smoothed = {
      subBass: 0.0,
      mids: 0.0,
      highs: 0.0
    };

    this.prevBass = 0.0;
    this.prevKick = 0.0;
    this.prevHighs = 0.0;
    this.lastOnsetTime = 0.0;
    this.lastKickTime = 0.0;
    this.realtimeKick = 0.0;
    this.echoHistory = [0, 0, 0, 0, 0, 0, 0, 0];

    this.onEndedCallback = null;
    this.onTimeUpdateCallback = null;
  }

  async init() {
    if (this.isInitialized) return;

    this.audioElement.crossOrigin = 'anonymous';
    this.audioElement.src = StudioConfig.audio.src;
    this.audioElement.onerror = () => {
      this.audioElement.src = StudioConfig.audio.fallbackSrc;
    };

    // Load precomputed 4K Master Telemetry for bit-for-bit parity with the official video render
    try {
      const res = await fetch('./assets/audio/telemetry_30fps.json');
      if (res.ok) {
        this.telemetry = await res.json();
        this.telemetryLoaded = true;
        console.log(`💎 Loaded 4K Master Psychoacoustic Telemetry (${this.telemetry.frames.length} frames at ${this.telemetry.fps} FPS)`);
      }
    } catch (err) {
      console.warn("Telemetry fetch fallback to real-time FFT:", err);
    }

    this.audioElement.addEventListener('ended', () => {
      this.isPlaying = false;
      if (this.onEndedCallback) this.onEndedCallback();
    });

    this.audioElement.addEventListener('timeupdate', () => {
      if (this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(this.currentTime, this.duration);
      }
    });

    this.isInitialized = true;
  }

  ensureAudioContext() {
    if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = StudioConfig.audio.fftSize;
      this.analyser.smoothingTimeConstant = StudioConfig.audio.smoothingTimeConstant;

      this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);

      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  async play() {
    this.ensureAudioContext();
    try {
      await this.audioElement.play();
      this.isPlaying = true;
    } catch (err) {
      console.error("Audio playback error:", err);
    }
  }

  pause() {
    this.audioElement.pause();
    this.isPlaying = false;
  }

  toggle() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
    return this.isPlaying;
  }

  seek(seconds) {
    if (this.audioElement) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.duration || 40.17));
    }
  }

  get currentTime() {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  get duration() {
    return (this.audioElement && !isNaN(this.audioElement.duration)) ? this.audioElement.duration : 40.17;
  }

  update(delta) {
    if (!this.isPlaying) {
      this.smoothed.subBass *= 0.90;
      this.smoothed.mids *= 0.90;
      this.smoothed.highs *= 0.90;
      this.energy.subBass = this.smoothed.subBass;
      this.energy.mids = this.smoothed.mids;
      this.energy.highs = this.smoothed.highs;
      this.energy.impact *= 0.88;
      this.energy.kick *= 0.85;
      this.energy.echo *= 0.88;
      this.energy.snare *= 0.85;
      this.energy.grit = (this.energy.grit || 0) * 0.82;
      this.energy.dropActive = this.currentTime >= StudioConfig.audio.dropTimestamp;
      return this.energy;
    }

    const dtScale = Math.min(2.5, Math.max(0.25, (delta || 0.01667) * 60.0));

    // PRIMARY PATH: High-Precision 4K Master Telemetry Synchronization
    // Replicates 100% bit-for-bit parity with the official video render on GPU
    if (this.telemetryLoaded && this.telemetry && this.telemetry.frames && this.telemetry.frames.length > 0) {
      const t = Math.max(0, Math.min(this.currentTime, this.duration));
      const fps = this.telemetry.fps || 30;
      const idx = t * fps;
      const f0 = Math.min(this.telemetry.frames.length - 1, Math.floor(idx));
      const f1 = Math.min(this.telemetry.frames.length - 1, f0 + 1);
      const frac = Math.max(0.0, Math.min(1.0, idx - f0));

      const e0 = this.telemetry.frames[f0].energy;
      const e1 = this.telemetry.frames[f1].energy;

      this.energy.subBass = e0.subBass * (1.0 - frac) + e1.subBass * frac;
      this.energy.mids = e0.mids * (1.0 - frac) + e1.mids * frac;
      this.energy.highs = e0.highs * (1.0 - frac) + e1.highs * frac;
      this.energy.rms = (this.energy.subBass + this.energy.mids + this.energy.highs) / 3.0;

      // Punchy transient interpolation: preserve instant beat spikes
      this.energy.impact = Math.max(e0.impact, e1.impact * frac);
      this.energy.kick = Math.max(e0.kick, e1.kick * frac);
      this.energy.snare = Math.max(e0.snare, e1.snare * frac);
      this.energy.echo = e0.echo * (1.0 - frac) + e1.echo * frac;
      this.energy.variantIndex = e0.variantIndex * (1.0 - frac) + e1.variantIndex * frac;
      this.energy.dropActive = t >= StudioConfig.audio.dropTimestamp;

      // High-frequency grit detection for chromatic glitch interference
      const highFlux = Math.max(0.0, e1.highs - e0.highs);
      if (highFlux > 0.08) {
        this.energy.grit = Math.min(1.0, highFlux * 7.5 + this.energy.highs * 0.35);
      } else {
        this.energy.grit = (this.energy.grit || 0) * Math.pow(0.80, dtScale);
      }

      return this.energy;
    }

    // FALLBACK PATH: Real-Time Web Audio FFT Analysis (Dynamic, Un-saturated)
    if (!this.analyser) {
      return this.energy;
    }

    this.analyser.getByteFrequencyData(this.frequencyData);

    const nyquist = this.audioContext.sampleRate / 2;
    const binCount = this.analyser.frequencyBinCount;
    const binWidth = nyquist / binCount;

    const getAverageInRange = (minFreq, maxFreq) => {
      const minBin = Math.max(0, Math.floor(minFreq / binWidth));
      const maxBin = Math.min(binCount - 1, Math.ceil(maxFreq / binWidth));
      if (minBin >= maxBin) return 0;
      let sum = 0;
      for (let i = minBin; i <= maxBin; i++) {
        sum += this.frequencyData[i];
      }
      return (sum / (maxBin - minBin + 1)) / 255.0;
    };

    const rawBass = getAverageInRange(StudioConfig.audio.bands.subBass.min, StudioConfig.audio.bands.subBass.max);
    const rawKick = getAverageInRange(35, 110);
    const rawMids = getAverageInRange(StudioConfig.audio.bands.mids.min, StudioConfig.audio.bands.mids.max);
    const rawHighs = getAverageInRange(StudioConfig.audio.bands.highs.min, StudioConfig.audio.bands.highs.max);

    const smoothBand = (current, target, attack = 0.88, decay = 0.16) => {
      const k = (target > current)
        ? 1.0 - Math.pow(1.0 - attack, dtScale)
        : 1.0 - Math.pow(1.0 - decay, dtScale);
      return current + (target - current) * k;
    };

    this.smoothed.subBass = smoothBand(this.smoothed.subBass, rawBass, 0.90, 0.18);
    this.smoothed.mids = smoothBand(this.smoothed.mids, rawMids, 0.80, 0.18);
    this.smoothed.highs = smoothBand(this.smoothed.highs, rawHighs, 0.95, 0.25);

    // Dynamic Headroom: Avoid 1.0 clipping saturation on continuous drone bass
    this.energy.subBass = Math.min(1.0, this.smoothed.subBass * 1.20);
    this.energy.mids = Math.min(1.0, this.smoothed.mids * 1.30);
    this.energy.highs = Math.min(1.0, this.smoothed.highs * 1.90);
    this.energy.rms = (this.energy.subBass + this.energy.mids + this.energy.highs) / 3.0;
    this.energy.dropActive = this.currentTime >= StudioConfig.audio.dropTimestamp;

    // Transient Onset Detection for Kick & Impact (Computed BEFORE clamping to preserve dynamic flux)
    const nowSec = performance.now() / 1000.0;
    const bassFlux = Math.max(0.0, this.smoothed.subBass - this.prevBass);
    const kickFlux = Math.max(0.0, rawKick - this.prevKick);
    const highFlux = Math.max(0.0, this.smoothed.highs - this.prevHighs);
    this.prevBass = this.smoothed.subBass;
    this.prevKick = rawKick;
    this.prevHighs = this.smoothed.highs;

    // Bass Kick Beat Detection
    if (kickFlux > 0.055 && (nowSec - this.lastKickTime) > (this.energy.dropActive ? 0.15 : 0.20)) {
      this.lastKickTime = nowSec;
      this.realtimeKick = 1.0;
    } else {
      this.realtimeKick *= Math.pow(this.energy.dropActive ? 0.82 : 0.78, dtScale);
    }
    this.energy.kick = this.realtimeKick;

    // Continuous smooth color progression driven by song tempo, RMS energy and impacts
    const dropMult = this.energy.dropActive ? 2.15 : 1.0;
    const beatPush = (this.energy.impact * 0.85 + this.energy.snare * 0.55) * dropMult;
    const baseSpeed = this.energy.dropActive ? 1.15 : 0.58;
    this.energy.variantIndex = (this.energy.variantIndex || 0) + delta * (baseSpeed + this.energy.rms * 0.95 * dropMult + beatPush);

    if (bassFlux > 0.045 && (nowSec - this.lastOnsetTime) > (this.energy.dropActive ? 0.16 : 0.22)) {
      this.lastOnsetTime = nowSec;
      this.energy.impact = 1.0;
    } else {
      this.energy.impact *= Math.pow(this.energy.dropActive ? 0.91 : 0.89, dtScale);
    }

    if (highFlux > 0.065) {
      this.energy.snare = Math.min(1.0, 0.78 + this.energy.highs * 0.22);
    } else {
      this.energy.snare *= Math.pow(this.energy.dropActive ? 0.86 : 0.82, dtScale);
    }

    // Grit detection (noisy/broken high-transient burst for signal interference)
    if (highFlux > 0.075) {
      this.energy.grit = Math.min(1.0, (highFlux - 0.075) * 8.0 + this.energy.highs * 0.4);
    } else {
      this.energy.grit = (this.energy.grit || 0) * Math.pow(0.80, dtScale);
    }

    // Zero-allocation circular ring buffer for Delayed Wave Echo
    this.echoIdx = ((this.echoIdx || 0) + 1) & 7;
    this.energy.echo = this.echoHistory[this.echoIdx];
    this.echoHistory[this.echoIdx] = this.energy.impact;

    return this.energy;
  }
}
