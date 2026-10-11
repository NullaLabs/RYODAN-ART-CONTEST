/**
 * ETHERNIUM SOVEREIGN WEB - WEB MARGIN CYBER CHRONO GLASS CONTROLLER
 * Renders outer web margins (outside the 16:9 artwork) as pristine 3D Glassmorphic panels
 * with dynamic color-shifting ambience and reflections reacting to the rhythm of the music.
 * Completely free of digits for an ultra-clean, luxurious iOS / iMac glass aesthetic.
 */

// Rich cyberpunk color palette matching the goddess artwork
const COLOR_PALETTE = [
  { r: 0,   g: 240, b: 255 }, // Sovereign Cyan
  { r: 25,  g: 100, b: 255 }, // Sovereign Blue
  { r: 220, g: 30,  b: 140 }, // Neon Magenta
  { r: 160, g: 40,  b: 255 }, // Cyber Violet
  { r: 0,   g: 255, b: 157 }, // Emerald Green
  { r: 255, g: 190, b: 40  }, // Solar Gold
  { r: 255, g: 45,  b: 65  }  // Crimson Red
];

function getPaletteColor(phase, brightness = 1.0) {
  const len = COLOR_PALETTE.length;
  const p = Math.abs(phase) % len;
  const idx1 = Math.floor(p);
  const idx2 = (idx1 + 1) % len;
  const frac = p - idx1;

  const c1 = COLOR_PALETTE[idx1];
  const c2 = COLOR_PALETTE[idx2];

  const r = Math.round(Math.min(255, (c1.r + (c2.r - c1.r) * frac) * brightness));
  const g = Math.round(Math.min(255, (c1.g + (c2.g - c1.g) * frac) * brightness));
  const b = Math.round(Math.min(255, (c1.b + (c2.b - c1.b) * frac) * brightness));

  return `rgb(${r}, ${g}, ${b})`;
}

export class WebMarginWavesController {
  constructor(canvasLeftId, canvasRightId) {
    this.canvasL = document.getElementById(canvasLeftId);
    this.canvasR = document.getElementById(canvasRightId);
    this.ctxL = this.canvasL ? this.canvasL.getContext('2d') : null;
    this.ctxR = this.canvasR ? this.canvasR.getContext('2d') : null;

    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.widthL = 0;
    this.widthR = 0;
    this.height = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const canvas = document.getElementById('webgl-canvas');
    if (!canvas || !this.canvasL || !this.canvasR) return;

    const rect = canvas.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const leftW = Math.max(0, Math.floor(rect.left));
    const rightW = Math.max(0, Math.floor(winW - rect.right));
    this.height = Math.floor(winH);

    this.widthL = leftW;
    this.widthR = rightW;

    // Left canvas: strictly outside 16:9 canvas from 0 to rect.left
    if (leftW > 2) {
      this.canvasL.style.display = 'block';
      this.canvasL.style.position = 'absolute';
      this.canvasL.style.left = '0px';
      this.canvasL.style.top = '0px';
      this.canvasL.style.width = `${leftW}px`;
      this.canvasL.style.height = `${this.height}px`;
      this.canvasL.width = Math.floor(leftW * this.dpr);
      this.canvasL.height = Math.floor(this.height * this.dpr);
      if (this.ctxL) this.ctxL.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    } else {
      this.canvasL.style.display = 'none';
    }

    // Right canvas: strictly outside 16:9 canvas from rect.right to winW
    if (rightW > 2) {
      this.canvasR.style.display = 'block';
      this.canvasR.style.position = 'absolute';
      this.canvasR.style.left = `${Math.floor(rect.right)}px`;
      this.canvasR.style.top = '0px';
      this.canvasR.style.width = `${rightW}px`;
      this.canvasR.style.height = `${this.height}px`;
      this.canvasR.width = Math.floor(rightW * this.dpr);
      this.canvasR.height = Math.floor(this.height * this.dpr);
      if (this.ctxR) this.ctxR.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    } else {
      this.canvasR.style.display = 'none';
    }
  }

  renderMargin(ctx, time, delta, energy, isRight) {
    if (!ctx) return;
    const w = isRight ? this.widthR : this.widthL;
    const h = this.height;
    if (w <= 2 || h <= 2) return;

    ctx.clearRect(0, 0, w, h);

    const bass = energy.subBass || 0;
    const mids = energy.mids || 0;
    const highs = energy.highs || 0;
    const kick = energy.kick || 0;
    const snare = energy.snare || 0;
    const impact = energy.impact || 0;
    const fullSongDrive = Math.min(1.0, bass * 0.6 + mids * 0.4 + highs * 0.3 + impact * 0.4);

    // 1. 3D Glassmorphic Ambient Background (shifting colors matching artwork)
    const colorCycle = time * 0.35 + (energy.variantIndex || 0) * 0.8 + mids * 0.5;
    const ambientColor1 = getPaletteColor(colorCycle, 0.45 + fullSongDrive * 0.35);
    const ambientColor2 = getPaletteColor(colorCycle + 2.5, 0.35 + bass * 0.40);

    ctx.save();

    // Dark cyber navy translucent glass base
    const gradGlass = ctx.createLinearGradient(0, 0, isRight ? 0 : w, 0);
    gradGlass.addColorStop(0, 'rgba(4, 8, 16, 0.90)');
    gradGlass.addColorStop(1, 'rgba(8, 16, 32, 0.75)');
    ctx.fillStyle = gradGlass;
    ctx.fillRect(0, 0, w, h);

    // Music-driven shifting ambient radial aura
    const auraCenterY = h * (0.35 + 0.30 * Math.sin(time * 0.8 + mids));
    const auraCenterX = isRight ? 20 : w - 20;
    const auraRad = Math.max(w * 2.0, 240);
    const auraGrad = ctx.createRadialGradient(auraCenterX, auraCenterY, 10, auraCenterX, auraCenterY, auraRad);
    auraGrad.addColorStop(0, ambientColor1.replace('rgb', 'rgba').replace(')', `, ${0.25 + fullSongDrive * 0.30})`));
    auraGrad.addColorStop(0.65, ambientColor2.replace('rgb', 'rgba').replace(')', `, ${0.10 + bass * 0.18})`));
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = auraGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle rhythmic specular diagonal light sweep across the crystal glass
    const sweepProgress = (time * 0.25 + fullSongDrive * 0.20) % 2.0 - 0.5;
    const sweepY = h * sweepProgress;
    const sweepGrad = ctx.createLinearGradient(0, sweepY - 120, 0, sweepY + 120);
    sweepGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    sweepGrad.addColorStop(0.5, ambientColor1.replace('rgb', 'rgba').replace(')', `, ${0.12 + highs * 0.15})`));
    sweepGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sweepGrad;
    ctx.fillRect(0, 0, w, h);

    // Luminous glass accent seam border adjacent to the 16:9 canvas
    const borderX = isRight ? 0.5 : w - 0.5;
    ctx.beginPath();
    ctx.moveTo(borderX, 0);
    ctx.lineTo(borderX, h);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = ambientColor1.replace('rgb', 'rgba').replace(')', `, ${0.45 + highs * 0.40})`);
    ctx.shadowColor = ambientColor1;
    ctx.shadowBlur = 12 + highs * 14;
    ctx.stroke();

    ctx.restore();
  }

  update(time, energy) {
    if (!this.ctxL || !this.ctxR) return;

    const delta = 0.016;
    this.renderMargin(this.ctxL, time, delta, energy, false);
    this.renderMargin(this.ctxR, time, delta, energy, true);
  }
}
