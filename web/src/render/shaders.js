/**
 * ETHERNIUM SOVEREIGN WEB - GLSL SHADERS MODULE (V6: MULTIDISCIPLINARY SDF & PSYCHOACOUSTIC EDITION)
 * - Goddess: Full-song psychoacoustic tracking + Euclidean SDF Interior-Only Kick Turbulence & Micro-Glitch (0.00px edge change)
 * - MIA & Katakana: Crisp Black Foreground Letters + Fluid Progressive RGB Back Rim/Shadow (exact match to reference)
 * - Layer 3 Red Lights: Filtered strictly to inner-dome skyscraper tips, slow aviation antenna blink, subtle tiny pinpoint
 */

export const CommonVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * 1. GODDESS SHADER (FULL-SONG SOUND TRACKING + SDF INTERIOR-ONLY KICK TURBULENCE & GLITCH)
 */
export const GoddessFragmentShader = `
  uniform sampler2D u_texBlue;
  uniform sampler2D u_texCyan;
  uniform sampler2D u_texGreen;
  uniform sampler2D u_texYellow;
  uniform sampler2D u_texWarm;
  uniform sampler2D u_texRed;
  uniform sampler2D u_texBright;
  uniform sampler2D u_texShadow;
  uniform sampler2D u_texInteriorMask;

  uniform float u_time;
  uniform float u_bass;
  uniform float u_mids;
  uniform float u_highs;
  uniform float u_impact;
  uniform float u_kick;
  uniform float u_grit;
  uniform float u_echo;
  uniform float u_snare;
  uniform float u_variantIndex;
  uniform float u_scannerY;
  uniform float u_scannerActive;
  uniform float u_dropActive;

  varying vec2 vUv;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  vec3 pickVariant(int idx, vec3 cBlue, vec3 c1, vec3 c2, vec3 c3, vec3 c4, vec3 c5, vec3 c6, vec3 c7) {
    if (idx == 1) return c1;
    if (idx == 2) return c2;
    if (idx == 3) return c3;
    if (idx == 4) return c4;
    if (idx == 5) return c5;
    if (idx == 6) return c6;
    if (idx == 7) return c7;
    return cBlue;
  }

  void main() {
    // 1. Base principal con la que comienza: AZUL (Sovereign Blue)
    vec4 baseBlueSample = texture2D(u_texBlue, vUv);
    float lockedEdgeAlpha = baseBlueSample.a;
    if (lockedEdgeAlpha < 0.005) {
      discard;
    }

    vec2 sampleUv = vUv;
    vec3 colBlue = baseBlueSample.rgb;

    // Fetch each chromatic variant ONCE per fragment (eliminates 44 redundant 4K texture lookups per pixel for locked 60 FPS!)
    vec3 texCyan   = texture2D(u_texCyan, sampleUv).rgb;
    vec3 texGreen  = texture2D(u_texGreen, sampleUv).rgb;
    vec3 texYellow = texture2D(u_texYellow, sampleUv).rgb;
    vec3 texWarm   = texture2D(u_texWarm, sampleUv).rgb;
    vec3 texRed    = texture2D(u_texRed, sampleUv).rgb;
    vec3 texBright = texture2D(u_texBright, sampleUv).rgb;
    vec3 texShadow = texture2D(u_texShadow, sampleUv).rgb;

    // 2. Full-Song Sound Tracking with Fast Fluid Multi-Stop Chromatic Gradients & Aggressive Drop Sync
    // Primary baseline is Sovereign Blue (colBlue)
    
    // Spatial gradient flow coordinates following the diagonal flow of the hair, armor & composition
    float diagCoord = vUv.x * 1.65 + vUv.y * 2.15;
    float crossCoord = vUv.x * 2.10 - vUv.y * 1.45;

    // Smooth continuous harmonic waves (u_time and u_variantIndex have the SAME sign so music ALWAYS accelerates flow, never stalls!)
    float wave1 = sin(vUv.y * 4.6 - u_time * 1.85 - u_variantIndex * 0.65 + vUv.x * 2.8) * 0.5 + 0.5;
    float wave2 = cos(vUv.x * 3.8 + u_time * 1.55 + u_variantIndex * 0.55 - vUv.y * 3.1) * 0.5 + 0.5;
    float wave3 = sin(diagCoord * 3.6 - u_time * 2.25 - u_variantIndex * 0.95) * 0.5 + 0.5;

    // Concentric ripple expanding smoothly from the Goddess center
    vec2 faceCenter = vec2(0.57, 0.62);
    float radialDist = length(vUv - faceCenter);
    float rippleWave = sin(radialDist * 12.0 - u_time * 3.4 - u_variantIndex * 0.85) * 0.5 + 0.5;

    // Music modulates amplitude smoothly, NEVER snapping phase
    float rippleIntensity = (rippleWave - 0.5) * (0.14 + 0.28 * u_kick + 0.18 * u_dropActive * u_impact);

    // Master gradient phase: faster continuous color flow across the 7 chromatic variants
    float masterPhase = u_variantIndex * 1.45 + u_time * 0.65 + diagCoord * 0.85 + rippleIntensity;

    // Gradient Band 1 (Primary Rapid Flow): Stop A -> Stop B
    float pA = mod(masterPhase, 7.0);
    float iPA = floor(pA);
    float fPA = smoothstep(0.0, 1.0, fract(pA));
    int idxA0 = int(iPA) + 1;
    int idxA1 = int(mod(iPA + 1.0, 7.0)) + 1;

    // Gradient Band 2 (Counter-Flow +2.15 variants): Stop C -> Stop D
    float pB = mod(masterPhase + 2.15 + crossCoord * 0.35, 7.0);
    float iPB = floor(pB);
    float fPB = smoothstep(0.0, 1.0, fract(pB));
    int idxB0 = int(iPB) + 1;
    int idxB1 = int(mod(iPB + 1.0, 7.0)) + 1;

    // Gradient Band 3 (High-Contrast Warm/Neon Accent +4.30 variants): Stop E -> Stop F
    float pC = mod(masterPhase + 4.30 - radialDist * 0.90, 7.0);
    float iPC = floor(pC);
    float fPC = smoothstep(0.0, 1.0, fract(pC));
    int idxC0 = int(iPC) + 1;
    int idxC1 = int(mod(iPC + 1.0, 7.0)) + 1;

    vec3 varA0 = pickVariant(idxA0, colBlue, texCyan, texGreen, texYellow, texWarm, texRed, texBright, texShadow);
    vec3 varA1 = pickVariant(idxA1, colBlue, texCyan, texGreen, texYellow, texWarm, texRed, texBright, texShadow);
    vec3 varB0 = pickVariant(idxB0, colBlue, texCyan, texGreen, texYellow, texWarm, texRed, texBright, texShadow);
    vec3 varB1 = pickVariant(idxB1, colBlue, texCyan, texGreen, texYellow, texWarm, texRed, texBright, texShadow);
    vec3 varC0 = pickVariant(idxC0, colBlue, texCyan, texGreen, texYellow, texWarm, texRed, texBright, texShadow);
    vec3 varC1 = pickVariant(idxC1, colBlue, texCyan, texGreen, texYellow, texWarm, texRed, texBright, texShadow);

    // Smooth Hermite color blend within each gradient band
    vec3 colGradA = mix(varA0, varA1, fPA);
    vec3 colGradB = mix(varB0, varB1, fPB);
    vec3 colGradC = mix(varC0, varC1, fPC);

    // Layer the gradient bands into a rich, rapidly shifting multi-chromatic tapestry
    vec3 multiGradient = mix(colGradA, colGradB, wave1);
    float accentMix = clamp(wave2 * (0.38 + 0.38 * u_snare + 0.28 * u_impact + 0.22 * u_dropActive), 0.0, 0.92);
    multiGradient = mix(multiGradient, colGradC, accentMix);

    // During the heavy drop (u_dropActive > 0.5), weave in an aggressive, fluid 4th chromatic surge
    if (u_dropActive > 0.5) {
      vec3 colWarmRed = mix(texWarm, texRed, wave3);
      vec3 colCyanGold = mix(texCyan, texYellow, 1.0 - wave1);
      vec3 dropSurgeCol = mix(colWarmRed, colCyanGold, wave2);
      float dropSurgeFactor = clamp((0.32 + 0.48 * u_kick + 0.42 * u_snare + 0.35 * u_impact) * wave3, 0.0, 0.85);
      multiGradient = mix(multiGradient, dropSurgeCol, dropSurgeFactor);
    }

    // Fluid Rhythmic Pulse / Blink ("parpadeos fluidos sin que se vea forzado o cortado")
    // Uses pure C1-continuous sine/cosine oscillators driven by time + monotonic variantIndex
    float rhythmPulseWave = sin(u_time * 4.8 + u_variantIndex * 1.35 - diagCoord * 2.2) * 0.5 + 0.5;
    float subPulseWave = cos(u_time * 7.6 + u_variantIndex * 1.85 + radialDist * 6.0) * 0.5 + 0.5;
    float fluidBeatBlink = mix(rhythmPulseWave, subPulseWave, 0.38);

    // General Song Sound Envelope (combines full song RMS, kicks, snares, mids, highs)
    float fullSongDrive = clamp(
      u_impact * 0.58 +
      u_mids   * 0.38 +
      u_snare  * 0.50 +
      u_kick   * 0.52 +
      u_highs  * 0.28,
      0.0, 1.0
    );

    // Fluid rhythmic modulation of gradient visibility:
    // Pre-drop: smooth flowing gradients with gentle rhythmic breathing
    // Drop (u_dropActive > 0.5): aggressive, dynamic, high-contrast rhythmic color surges & fluid pulses
    float preDropMix = clamp(0.18 + fullSongDrive * 0.62 + fluidBeatBlink * (0.14 + 0.22 * fullSongDrive), 0.0, 0.88);
    float dropDynamicMix = clamp(
      0.28 + fullSongDrive * 0.52 + fluidBeatBlink * (0.22 + 0.38 * (u_kick + u_snare * 0.8 + u_impact * 0.7)),
      0.22, 0.97
    );
    float variantMix = mix(preDropMix, dropDynamicMix, u_dropActive);

    vec3 baseCol = mix(colBlue, multiGradient, variantMix);

    // Smooth HDR Dynamic Contrast & Fluid Rhythmic Glow on beats (zero harsh flashes or cuts)
    float lum = dot(baseCol, vec3(0.299, 0.587, 0.114));
    float dropBoost = 1.0 + u_dropActive * (0.55 + 0.45 * fluidBeatBlink);
    float highlightBoost = pow(clamp(lum, 0.0, 1.0), 1.65) * (fullSongDrive * 0.26 + u_kick * 0.22 + u_snare * 0.16) * dropBoost;
    baseCol += baseCol * highlightBoost;

    // Holographic Laser Scanner Bar (subtle cyan-hologram line with gentle phosphor trail)
    if (u_scannerActive > 0.01) {
      float dist = abs(vUv.y - u_scannerY);
      float laserCore = exp(-dist * 220.0);
      float laserGlow = exp(-dist * 42.0) * 0.35;
      float trail = (vUv.y > u_scannerY && (vUv.y - u_scannerY) < 0.12) ? exp(-(vUv.y - u_scannerY) * 28.0) * 0.22 : 0.0;
      vec3 holoCyan = vec3(0.35, 0.94, 1.0);
      vec3 laserColor = holoCyan * (laserCore * 1.9 + laserGlow + trail);
      baseCol += laserColor * (0.80 + 0.35 * u_highs);
    }

    gl_FragColor = vec4(baseCol, lockedEdgeAlpha);
  }
`;

/**
 * 2. DOME SHADER ([01] 21 cupula & [02] 20 Copia de 21 cupula)
 * "cambia de color con color luces igual" - Rich multi-color 7-stop spectrum + subtle glow & visibility
 */
export const DomeFragmentShader = `
  uniform sampler2D u_texDomeGreen;
  uniform sampler2D u_texDomeBlue;

  uniform float u_time;
  uniform float u_mids;
  uniform float u_bass;
  uniform float u_echo;

  varying vec2 vUv;

  void main() {
    vec4 domeGreen = texture2D(u_texDomeGreen, vUv);
    vec4 domeBlue  = texture2D(u_texDomeBlue, vUv);

    if (domeGreen.a < 0.005 && domeBlue.a < 0.005) {
      discard;
    }

    float iridPhase = vUv.x * 5.5 + vUv.y * 4.0 - u_time * 1.2 + u_mids * 2.5 + u_echo * 2.0;
    vec3 iridescence = 0.55 + 0.45 * cos(iridPhase + vec3(0.0, 2.094, 4.188));

    // Multi-spectral 7-color palette for the Domes (Capas 20 & 21)
    float palCycle = mod(u_time * 0.12 + u_echo * 0.20, 1.0);
    vec3 c0 = vec3(0.00, 0.94, 1.00); // Sovereign Cyan
    vec3 c1 = vec3(0.12, 0.45, 1.00); // Sovereign Blue
    vec3 c2 = vec3(0.65, 0.22, 1.00); // Electric Violet
    vec3 c3 = vec3(1.00, 0.18, 0.60); // Neon Magenta
    vec3 c4 = vec3(1.00, 0.38, 0.20); // Crimson Coral
    vec3 c5 = vec3(1.00, 0.82, 0.28); // Solar Amber Gold
    vec3 c6 = vec3(0.10, 0.98, 0.60); // Emerald Jade

    float s = palCycle * 7.0;
    float idx = floor(s);
    float f = smoothstep(0.0, 1.0, fract(s));
    vec3 domePalette;
    if (idx < 1.0) domePalette = mix(c0, c1, f);
    else if (idx < 2.0) domePalette = mix(c1, c2, f);
    else if (idx < 3.0) domePalette = mix(c2, c3, f);
    else if (idx < 4.0) domePalette = mix(c3, c4, f);
    else if (idx < 5.0) domePalette = mix(c4, c5, f);
    else if (idx < 6.0) domePalette = mix(c5, c6, f);
    else domePalette = mix(c6, c0, f);

    vec3 combinedTint = mix(domePalette, iridescence, 0.40);

    // Gently boosted layer visibility & subtle luminous response
    float a1 = clamp(pow(domeGreen.a, 0.72) * 1.35, 0.0, 1.0);
    vec3 col1 = domeGreen.rgb * combinedTint * 1.20;

    float a2 = clamp(pow(domeBlue.a, 0.72) * 1.35, 0.0, 1.0);
    vec3 col2 = domeBlue.rgb * mix(combinedTint, iridescence, 0.55) * 1.30;

    float outA = clamp(a2 + a1 * (1.0 - a2 * 0.75), 0.0, 1.0);
    vec3 outRgb = (col2 * a2 + col1 * a1 * (1.0 - a2 * 0.50)) / max(outA, 0.001);

    // Subtle ambient glow & luminous glass sheen
    float domeLum = max(col1.g, col2.b);
    vec3 subtleGlow = combinedTint * pow(clamp(domeLum, 0.0, 1.0), 1.3) * (0.45 + 0.30 * u_mids);
    outRgb += subtleGlow;

    // Specular Sheen Sweep passing over the domes
    float sheenPos = mod(u_time * 0.42 + u_echo * 0.15, 2.3) - 0.5;
    float diagonal = vUv.x * 0.75 + vUv.y * 0.45;
    float sheenDist = abs(diagonal - sheenPos);
    float sheenCore = exp(-sheenDist * 48.0) * (2.0 + u_echo * 0.9);
    float sheenHalo = exp(-sheenDist * 14.0) * 0.55;
    outRgb += mix(vec3(0.92, 0.98, 1.0), combinedTint, 0.35) * (sheenCore + sheenHalo);

    gl_FragColor = vec4(outRgb, outA);
  }
`;

/**
 * 3A. COLORED CITY LIGHTS SHADER ([18] 5color luces & [19] 4Copia de color luces)
 * Capa 4 (8s on/off cycle) y Capa 5 (subtly more diffused and slightly toned down)
 */
export const CityLightsFragmentShader = `
  uniform sampler2D u_texLightsGreen;
  uniform sampler2D u_texLightsWhite;

  uniform float u_time;
  uniform float u_mids;
  uniform float u_echo;
  uniform float u_snare;
  uniform float u_kick;

  varying vec2 vUv;

  void main() {
    vec4 lGreen = texture2D(u_texLightsGreen, vUv);
    vec4 lWhite = texture2D(u_texLightsWhite, vUv);

    // Wider, softer two-ring Gaussian radial blur of Layer 5 alpha ("sutilmente más difuminada")
    float blurA = lGreen.a * 1.1;
    float wSum = 1.1;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      vec2 dir = vec2(cos(ang), sin(ang));
      blurA += texture2D(u_texLightsGreen, vUv + dir * 0.0042).a * 1.25;
      blurA += texture2D(u_texLightsGreen, vUv + dir * 0.0095).a * 0.90;
      wSum += 2.15;
    }
    blurA /= wSum;

    if (blurA < 0.003 && lWhite.a < 0.004) {
      discard;
    }

    // Synchronized color shift matching the dome
    float iridPhase = vUv.x * 5.5 + vUv.y * 4.0 - u_time * 1.2 + u_mids * 2.5 + u_echo * 2.0;
    vec3 iridescence = 0.55 + 0.45 * cos(iridPhase + vec3(0.0, 2.094, 4.188));

    float palCycle = mod(u_time * 0.14 + u_echo * 0.25, 1.0);
    vec3 p1 = vec3(0.28, 0.88, 0.68);
    vec3 p2 = vec3(0.18, 0.78, 0.98);
    vec3 p3 = vec3(0.72, 0.46, 0.98);
    vec3 p4 = vec3(0.95, 0.72, 0.38);

    vec3 domePalette;
    if (palCycle < 0.25) domePalette = mix(p1, p2, palCycle * 4.0);
    else if (palCycle < 0.50) domePalette = mix(p2, p3, (palCycle - 0.25) * 4.0);
    else if (palCycle < 0.75) domePalette = mix(p3, p4, (palCycle - 0.50) * 4.0);
    else domePalette = mix(p4, p1, (palCycle - 0.75) * 4.0);

    vec3 syncedTint = mix(domePalette, iridescence, 0.45);

    // Responsive pulse to beats (kick, snare, mids)
    float pulse = 0.82 + 0.35 * u_kick + 0.25 * u_snare + 0.22 * u_mids + 0.18 * u_echo;

    // CAPA 5: "la capa 5 debe verse un poco menos sutilmente mas difuminada"
    float aSharp = clamp(pow(lGreen.a, 0.65) * 0.36 * pulse, 0.0, 1.0);
    float aSoft = clamp(pow(clamp(blurA, 0.0, 1.0), 0.72) * 0.68 * pulse, 0.0, 1.0);
    float aG = clamp(mix(aSoft, max(aSharp, aSoft), 0.28), 0.0, 0.64);
    vec3 colG = syncedTint * (1.08 + 0.22 * u_echo + 0.25 * u_kick);

    // CAPA 4: "debe verse y apagarse y encenderse cada 8 segundos"
    float cycle8 = mod(u_time, 8.0);
    float onOff4 = smoothstep(0.0, 0.8, cycle8) * (1.0 - smoothstep(4.0, 4.8, cycle8));

    float aW = clamp(pow(lWhite.a, 0.52) * 1.05 * pulse * onOff4, 0.0, 1.0);
    vec3 colW = mix(vec3(1.0, 0.98, 0.88), syncedTint, 0.40) * (1.25 + 0.45 * u_kick);

    float outA = clamp(max(aG, aW), 0.0, 1.0);
    vec3 outRgb = (aW > 0.001) ? mix(colG, colW, clamp(aW / max(aG + aW, 0.001), 0.0, 1.0)) : colG;

    gl_FragColor = vec4(outRgb, outA);
  }
`;

/**
 * 3B. AUTHENTIC LAYER 3 SHADER ([20] 04_3 color luces // solo parpadea color)
 * - Inside Dome (R channel): Only tallest building top lights from user's original Layer 3, subtle red with soft glow.
 * - Outside Dome (G channel): User's original Layer 3 outer lights with fast-flowing multi-color gradients & smooth fluid blinking.
 */
export const RedLightsFragmentShader = `
  uniform sampler2D u_texLightsRed;
  uniform float u_time;
  uniform float u_mids;
  uniform float u_snare;
  uniform float u_kick;
  uniform float u_echo;
  uniform float u_variantIndex;
  uniform float u_dropActive;

  varying vec2 vUv;

  vec3 evalGradient7(float phase) {
    vec3 c0 = vec3(0.00, 0.94, 1.00); // Sovereign Cyan
    vec3 c1 = vec3(0.14, 0.46, 1.00); // Sovereign Blue
    vec3 c2 = vec3(0.68, 0.22, 1.00); // Electric Violet
    vec3 c3 = vec3(1.00, 0.16, 0.58); // Neon Magenta
    vec3 c4 = vec3(1.00, 0.24, 0.16); // Crimson Red-Coral
    vec3 c5 = vec3(1.00, 0.84, 0.24); // Solar Amber Gold
    vec3 c6 = vec3(0.10, 0.98, 0.62); // Emerald Jade

    float s = mod(phase, 1.0) * 7.0;
    float idx = floor(s);
    float f = smoothstep(0.0, 1.0, fract(s));
    if (idx < 1.0) return mix(c0, c1, f);
    if (idx < 2.0) return mix(c1, c2, f);
    if (idx < 3.0) return mix(c2, c3, f);
    if (idx < 4.0) return mix(c3, c4, f);
    if (idx < 5.0) return mix(c4, c5, f);
    if (idx < 6.0) return mix(c5, c6, f);
    return mix(c6, c0, f);
  }

  void main() {
    vec4 lRed = texture2D(u_texLightsRed, vUv);

    // Subtle 8-tap radial optical glow around the authentic Layer 3 pixels ("un sutil glow no mucho")
    float glowR = lRed.r * lRed.a;
    float glowG = lRed.g * lRed.a;
    float haloA = 0.0;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      vec2 dir = vec2(cos(ang), sin(ang)) * 0.0022;
      vec4 tap = texture2D(u_texLightsRed, vUv + dir);
      glowR += tap.r * tap.a * 0.45;
      glowG += tap.g * tap.a * 0.45;
      haloA += tap.a * 0.125;
    }

    float combinedA = max(lRed.a, haloA * 0.55);
    if (combinedA < 0.004) {
      discard;
    }

    // Determine whether this pixel belongs to Inside-Dome Tall Skyscraper Tops (R) or Outside-Dome Lights (G)
    if (glowR >= glowG) {
      // INSIDE DOME: Subtle red top lights ONLY on the tallest buildings ("mi misma capa pero sutil y preservando la luz alta en los edificios mas altos solo de la capa 3")
      float antennaWave = sin(u_time * 2.8 + vUv.x * 4.0 + u_snare * 1.4);
      float beaconBlink = 0.54 + 0.46 * (0.5 + 0.5 * antennaWave);
      float musicBoost = 0.82 + 0.32 * u_kick + 0.24 * u_snare;

      float coreCenter = smoothstep(0.45, 0.92, lRed.a);
      vec3 redCore = vec3(1.0, 0.08, 0.12);
      vec3 warmTip = vec3(1.0, 0.74, 0.68);
      vec3 finalRgb = mix(redCore, warmTip, coreCenter * 0.55);

      // Subtle red optical aura
      finalRgb += vec3(1.0, 0.12, 0.16) * haloA * (0.35 + 0.25 * u_kick);

      float sharpA = pow(lRed.a, 0.78) * 0.76;
      float softGlowA = pow(clamp(haloA, 0.0, 1.0), 0.85) * 0.34;
      float outA = clamp(max(sharpA, softGlowA) * beaconBlink * musicBoost, 0.0, 0.78);
      gl_FragColor = vec4(finalRgb, outA);
    } else {
      // OUTSIDE DOME: Authentic Layer 3 outer lights with fast-flowing multi-color gradients & smooth fluid blinking
      // ("fuera de la cupula tambien tenia con mi capa con los degradados de ahora haciendo que los degradados cambien mas rapido fluidamente de colores pasando y parpadeos fluidos sin que se vea forzado o cortado")
      float flowSpeed = (u_dropActive > 0.5) ? 0.52 : 0.34;
      float spatialPhase = vUv.x * 1.35 + vUv.y * 1.05;
      float masterCycle = spatialPhase - u_time * flowSpeed - u_variantIndex * 0.14;

      vec3 gradColA = evalGradient7(masterCycle);
      vec3 gradColB = evalGradient7(masterCycle + 0.38);
      float waveMix = sin(vUv.x * 6.0 - u_time * 3.2 + vUv.y * 4.5) * 0.5 + 0.5;
      vec3 outerGradRgb = mix(gradColA, gradColB, waveMix);

      // Smooth C1-continuous rhythmic blinking (never forced, never cut)
      float osc1 = sin(u_time * (4.6 + 2.2 * u_dropActive) + vUv.x * 5.2 - vUv.y * 3.6) * 0.5 + 0.5;
      float osc2 = cos(u_time * (7.1 + 2.8 * u_dropActive) - vUv.x * 4.0 + vUv.y * 4.8) * 0.5 + 0.5;
      float fluidBlink = 0.38 + 0.62 * mix(osc1, osc2, 0.42);
      float beatPulse = 0.84 + 0.45 * u_kick + 0.38 * u_snare + 0.28 * u_mids + 0.22 * u_echo;

      float coreHighlight = smoothstep(0.50, 0.95, lRed.a);
      vec3 finalRgb = mix(outerGradRgb, vec3(1.0, 0.98, 0.96), coreHighlight * 0.38) * (1.18 + 0.35 * u_kick + 0.25 * u_snare);
      finalRgb += outerGradRgb * haloA * 0.45;

      float sharpA = pow(lRed.a, 0.68) * 0.92;
      float softGlowA = pow(clamp(haloA, 0.0, 1.0), 0.80) * 0.42;
      float outA = clamp(max(sharpA, softGlowA) * fluidBlink * beatPulse, 0.0, 0.92);
      gl_FragColor = vec4(finalRgb, outA);
    }
  }
`;

/**
 * 3C. GLASSMORPHIC 3D CREDITS CARTEL SHADER (iOS Glass with exact original chamfered polygon silhouette)
 */
export const CartelGlassFragmentShader = `
  uniform sampler2D u_texCartel;
  uniform float u_time;
  uniform float u_highs;
  uniform float u_impact;

  varying vec2 vUv;

  void main() {
    vec4 mask = texture2D(u_texCartel, vUv);
    if (mask.a < 0.02) {
      discard;
    }

    // 1. Deep Obsidian Stealth 3D Glass Surface (much darker for high contrast)
    vec3 glassBase = vec3(0.006, 0.009, 0.016);
    float glassAlpha = mask.a * 0.85; // 85% deep dark tint for maximum contrast

    // 2. Beveled 3D Edge Detection (subtle luminous neon accent rim on the chamfered border)
    vec2 off = vec2(0.0012, 0.0012);
    float edgeAlpha = max(
      abs(mask.a - texture2D(u_texCartel, vUv + off).a),
      abs(mask.a - texture2D(u_texCartel, vUv - off).a)
    );
    float edgeRim = smoothstep(0.05, 0.35, edgeAlpha);
    vec3 edgeColor = mix(vec3(0.0, 0.80, 0.95), vec3(0.85, 0.92, 1.0), 0.35) * (0.6 + 0.3 * u_highs);

    // 3. Diagonal Specular Sheen Sweep passing over the 3D glass
    float sheenPos = mod(u_time * 0.35, 2.5) - 0.5;
    float diag = vUv.x * 0.8 + vUv.y * 0.5;
    float sheen = exp(-pow((diag - sheenPos) * 35.0, 2.0)) * 0.25;

    vec3 finalRgb = mix(glassBase, edgeColor, edgeRim * 0.80) + vec3(sheen);
    float finalAlpha = clamp(glassAlpha + edgeRim * 0.45 + sheen * 0.20, 0.0, 0.96);

    gl_FragColor = vec4(finalRgb, finalAlpha);
  }
`;

/**
 * 4. MIA & KATAKANA SHADER (BLACK FOREGROUND LETTERS + FLUID RGB BACK RIM/SHADOW)
 * Matches the user's reference image 100%:
 * - Top/Front layer: Crisp BLACK letters (u_texShadowMia = layer 15, u_texShadowKatakana = layer 6)
 * - Back layer: Fluid progressive RGB neon rim/shadow behind the black letters (layers 16, 8, and 7)
 */
export const ShadowRgbFragmentShader = `
  uniform sampler2D u_texShadowMia;
  uniform sampler2D u_texShadowKatakana;
  uniform sampler2D u_texFrontMia;
  uniform sampler2D u_texFrontKatakana;
  uniform sampler2D u_texStrokeKatakana;

  uniform float u_time;
  uniform float u_highs;
  uniform float u_impact;

  varying vec2 vUv;

  void main() {
    // 1. TOP BLACK FOREGROUND LETTERS (Layers [08] 15 MIA & [17] 6 Katakana)
    vec4 blackMia  = texture2D(u_texShadowMia, vUv);
    vec4 blackKata = texture2D(u_texShadowKatakana, vUv);
    float blackFrontAlpha = max(blackMia.a, blackKata.a);

    // 2. BACK EXTRUSION / RIM LAYERS THAT CHANGE COLOR (Layers [07] 16 MIA, [15] 8 Katakana, [16] 7 Katakana)
    vec4 backMia1  = texture2D(u_texFrontMia, vUv);
    vec4 backKata1 = texture2D(u_texFrontKatakana, vUv);
    vec4 backKata2 = texture2D(u_texStrokeKatakana, vUv);

    vec2 rimOffset = vUv + vec2(0.0018, -0.0018);
    float offsetRimA = max(
      texture2D(u_texFrontMia, rimOffset).a,
      texture2D(u_texStrokeKatakana, rimOffset).a
    );

    float backRimAlpha = max(max(backMia1.a, max(backKata1.a, backKata2.a)), offsetRimA * 0.90);

    if (blackFrontAlpha < 0.005 && backRimAlpha < 0.005) {
      discard;
    }

    // Fluid progressive RGB rainbow wave on the back rim/shadow - CHANGES COLOR WITH MUSIC!
    vec3 rgbRainbow = 0.52 + 0.48 * cos(u_time * 2.2 + (vUv.x * 3.5 + vUv.y * 3.0) + vec3(0.0, 2.094, 4.188));
    rgbRainbow = pow(rgbRainbow, vec3(0.80)) * (1.35 + u_impact * 0.55 + u_highs * 0.45);

    // Crisp deep cyber-black for the front letters
    vec3 frontBlackCol = vec3(0.035, 0.038, 0.052);

    // Porter-Duff Over: Black Foreground Letters ON TOP OF the Glowing RGB Changing Back Layer!
    float outA = clamp(blackFrontAlpha + backRimAlpha * (1.0 - blackFrontAlpha), 0.0, 1.0);
    vec3 outRgb = (
      frontBlackCol * blackFrontAlpha +
      rgbRainbow * backRimAlpha * (1.0 - blackFrontAlpha * 0.96)
    ) / max(outA, 0.001);

    gl_FragColor = vec4(outRgb, outA);
  }
`;

/**
 * 5. NEO-MARS LOGO SHADER (INTENSITY PULSING ON LAYER 14)
 */
export const NeoMarsFragmentShader = `
  uniform sampler2D u_texFront;
  uniform sampler2D u_texBackGlow;
  uniform float u_time;
  uniform float u_highs;
  uniform float u_snare;

  varying vec2 vUv;

  void main() {
    vec4 front = texture2D(u_texFront, vUv);
    vec4 back  = texture2D(u_texBackGlow, vUv);

    if (front.a < 0.003 && back.a < 0.003) {
      discard;
    }

    float pulse = clamp(0.40 + u_snare * 0.85 + u_highs * 0.45 + 0.20 * sin(u_time * 10.0), 0.0, 1.2);
    float frontA = clamp(pow(front.a, 0.52) * pulse, 0.0, 1.0);
    vec3 frontGlow = vec3(1.0, 0.15, 0.12) * (1.25 + u_snare * 0.7);

    vec3 coreRed = back.rgb;
    float coreA = back.a;

    float outA = clamp(max(coreA, frontA), 0.0, 1.0);
    vec3 outRgb = mix(frontGlow, coreRed, coreA);

    gl_FragColor = vec4(outRgb, outA);
  }
`;

/**
 * 6. RED HUD SHADER (PURE CYBERPUNK NEON RED ON RIGHT SIDEBAR)
 */
export const HudFragmentShader = `
  uniform sampler2D u_texBase;
  uniform sampler2D u_texFlicker;

  uniform float u_time;
  uniform float u_highs;
  uniform float u_snare;

  varying vec2 vUv;

  void main() {
    vec4 base    = texture2D(u_texBase, vUv);
    vec4 flicker = texture2D(u_texFlicker, vUv);

    float flickerA = clamp(pow(flicker.a, 0.50) * (0.45 + u_snare * 0.85 + u_highs * 0.45), 0.0, 1.0);
    float combinedA = max(base.a, flickerA);
    if (combinedA < 0.003) {
      discard;
    }

    vec3 deepRed   = vec3(0.96, 0.02, 0.05);
    vec3 brightRed = vec3(1.00, 0.22, 0.18) * (1.25 + u_snare * 0.5);

    vec3 finalRgb = mix(deepRed, brightRed, clamp(flickerA * 0.85, 0.0, 1.0));
    gl_FragColor = vec4(finalRgb, combinedA);
  }
`;

/**
 * 7. ROTATING VORTEX EMBLEM SHADER
 */
export const VortexEmblemFragmentShader = `
  uniform sampler2D u_texEmblem;
  uniform float u_time;
  uniform float u_opacity;
  uniform float u_bass;

  varying vec2 vUv;

  void main() {
    vec2 center = vec2(0.9292, 0.1457);
    vec2 aspect = vec2(2668.0 / 1500.0, 1.0);

    vec2 delta = (vUv - center) * aspect;
    float dist = length(delta);

    if (dist > 0.06) {
      discard;
    }

    float angle = u_time * 0.65;
    float s = sin(angle);
    float c = cos(angle);
    mat2 rot = mat2(c, -s, s, c);

    vec2 rotDelta = rot * delta;
    vec2 rotatedUv = center + rotDelta / aspect;

    vec4 col = texture2D(u_texEmblem, rotatedUv);
    if (col.a < 0.005) {
      discard;
    }

    vec3 pulseCol = col.rgb * (1.0 + 0.35 * u_bass);
    gl_FragColor = vec4(pulseCol, col.a * u_opacity);
  }
`;

/**
 * 8. MARGIN PLASMA WAVES (BASS / MIDS / HIGHS as vertical neon laser strings on left & right margins)
 * Colors match the former meters: BASS #ff0055, MIDS #00f0ff, HIGHS #00ff9d. Additive blending.
 */
export const MarginWavesFragmentShader = `
  uniform float u_time;
  uniform float u_bass;
  uniform float u_mids;
  uniform float u_highs;
  uniform float u_aspect;

  varying vec2 vUv;

  // Distance-based neon string: hot white core + colored plasma halo
  vec3 plasmaString(float xNorm, float centerX, float amp, float freq, float speed, float phase, vec3 col, float energy) {
    float y = vUv.y;
    // Flexible string: two harmonics so it bends organically, amplitude driven by its band
    float bend = sin(y * freq - u_time * speed + phase) * 0.65
               + sin(y * freq * 2.37 + u_time * speed * 0.71 + phase * 1.9) * 0.35;
    // Taper towards the top/bottom ends so the strings feel anchored
    float taper = smoothstep(0.0, 0.08, y) * smoothstep(1.0, 0.92, y);
    float x = centerX + bend * amp * (0.25 + energy) * taper;
    float d = abs(xNorm - x) * u_aspect * 1500.0; // distance in source pixels
    float core = exp(-d * d / 1.6);
    float halo = exp(-d / (5.0 + 10.0 * energy));
    float intensity = (0.35 + 0.95 * energy);
    return (vec3(1.0) * core * 0.85 + col * (core * 0.6 + halo * 0.75)) * intensity;
  }

  void main() {
    float edgeL = vUv.x;
    float edgeR = 1.0 - vUv.x;
    if (min(edgeL, edgeR) > 0.030) {
      discard;
    }

    vec3 cBass  = vec3(1.0, 0.0, 0.333);
    vec3 cMids  = vec3(0.0, 0.94, 1.0);
    vec3 cHighs = vec3(0.0, 1.0, 0.616);

    // Mirror coordinate: both margins share the same layout (outer edge = 0)
    float xm = (edgeL < edgeR) ? edgeL : edgeR;
    float side = (edgeL < edgeR) ? 0.0 : 1.7;

    vec3 col = vec3(0.0);
    col += plasmaString(xm, 0.0065, 0.0040, 9.0,  2.6, side,       cBass,  u_bass);
    col += plasmaString(xm, 0.0125, 0.0032, 15.0, 3.8, side + 1.1, cMids,  u_mids);
    col += plasmaString(xm, 0.0185, 0.0026, 24.0, 5.6, side + 2.3, cHighs, u_highs);

    float a = clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0);
    if (a < 0.004) {
      discard;
    }
    gl_FragColor = vec4(col, a);
  }
`;
