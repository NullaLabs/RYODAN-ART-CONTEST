/**
 * ETHERNIUM SOVEREIGN WEB - AUDIO ENGINE API (V4: REAL-TIME ONSET & SIDECHAIN SYNERGY)
 */
import { StudioConfig } from '../config/studio_config.js';

export class AudioEngine {
  constructor() {
    this.audioContext = null;
    this.audioElement = new Audio();
    this.audioElement.preload = 'auto';
    this.analyser = null;
    this.sourceNode = null;
    this.isInitialized = false;
    this.isPlaying = false;

    this.frequencyData = null;

    this.energy = {
      subBass: 0.0,
      mids: 0.0,
      highs: 0.0,
      rms: 0.0,
      impact: 0.0,
      echo: 0.0,
      snare: 0.0,
      variantIndex: 0,
      dropActive: false
    };

    this.smoothed = {
      subBass: 0.0,
      mids: 0.0,
      highs: 0.0
    };

    this.prevBass = 0.0;
    this.prevHighs = 0.0;
    this.lastOnsetTime = 0.0;
    this.echoHistory = [0, 0, 0, 0, 0, 0, 0, 0];

    this.onEndedCallback = null;
    this.onTimeUpdateCallback = null;
  }

  async init() {
    if (this.isInitialized) return;

    this.audioElement.src = StudioConfig.audio.src;
    this.audioElement.onerror = () => {
      this.audioElement.src = StudioConfig.audio.fallbackSrc;
    };

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
    if (!this.analyser || !this.isPlaying) {
      this.smoothed.subBass *= 0.90;
      this.smoothed.mids *= 0.90;
      this.smoothed.highs *= 0.90;
      this.energy.subBass = this.smoothed.subBass;
      this.energy.mids = this.smoothed.mids;
      this.energy.highs = this.smoothed.highs;
      this.energy.impact *= 0.88;
      this.energy.echo *= 0.88;
      this.energy.snare *= 0.85;
      this.energy.grit *= 0.82;
      this.energy.dropActive = this.currentTime >= StudioConfig.audio.dropTimestamp;
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
    const rawMids = getAverageInRange(StudioConfig.audio.bands.mids.min, StudioConfig.audio.bands.mids.max);
    const rawHighs = getAverageInRange(StudioConfig.audio.bands.highs.min, StudioConfig.audio.bands.highs.max);

    const smoothBand = (current, target, attack = 0.88, decay = 0.16) => {
      return (target > current)
        ? current * (1.0 - attack) + target * attack
        : current * (1.0 - decay) + target * decay;
    };

    this.smoothed.subBass = smoothBand(this.smoothed.subBass, rawBass, 0.92, 0.15);
    this.smoothed.mids = smoothBand(this.smoothed.mids, rawMids, 0.80, 0.18);
    this.smoothed.highs = smoothBand(this.smoothed.highs, rawHighs, 0.95, 0.25);

    this.energy.subBass = Math.min(1.0, this.smoothed.subBass * 1.65);
    this.energy.mids = Math.min(1.0, this.smoothed.mids * 1.45);
    this.energy.highs = Math.min(1.0, this.smoothed.highs * 2.1);
    this.energy.rms = (this.energy.subBass + this.energy.mids + this.energy.highs) / 3.0;
    this.energy.dropActive = this.currentTime >= StudioConfig.audio.dropTimestamp;

    // Spectral Flux Onset Detection for Bass Transients
    const nowSec = performance.now() / 1000.0;
    const bassFlux = Math.max(0.0, this.energy.subBass - this.prevBass);
    const highFlux = Math.max(0.0, this.energy.highs - this.prevHighs);
    this.prevBass = this.energy.subBass;
    this.prevHighs = this.energy.highs;

    // Continuous smooth color progression driven by song tempo, RMS energy and impacts
    const beatPush = (this.energy.impact > 0.3) ? (this.energy.impact * 0.45) : 0.0;
    this.energy.variantIndex = (this.energy.variantIndex || 0) + delta * (0.32 + this.energy.rms * 0.45 + beatPush);

    if (bassFlux > 0.085 && (nowSec - this.lastOnsetTime) > 0.22) {
      this.lastOnsetTime = nowSec;
      this.energy.impact = 1.0;
    } else {
      this.energy.impact *= this.energy.dropActive ? 0.92 : 0.89;
    }

    if (highFlux > 0.09) {
      this.energy.snare = Math.min(1.0, 0.75 + this.energy.highs * 0.25);
    } else {
      this.energy.snare *= 0.82;
    }

    // Grit detection (noisy/broken high-transient burst for signal interference)
    if (highFlux > 0.075) {
      this.energy.grit = Math.min(1.0, (highFlux - 0.075) * 8.0 + this.energy.highs * 0.4);
    } else {
      this.energy.grit = (this.energy.grit || 0) * 0.80;
    }

    // Delayed Wave Echo for Dome & City Lights (Call-and-Response)
    this.echoHistory.push(this.energy.impact);
    this.energy.echo = this.echoHistory.shift();

    return this.energy;
  }
}
