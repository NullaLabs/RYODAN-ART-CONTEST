/**
 * ETHERNIUM SOVEREIGN WEB - STUDIO CONFIGURATION (V4: COMPLETE 25-LAYER PSD STACK)
 */
export const StudioConfig = {
  canvas: {
    nativeWidth: 3840,
    nativeHeight: 2160,
    aspectRatio: 2668 / 1500,
    targetFps: 60
  },
  audio: {
    src: './assets/audio/space_maeve.m4a',
    fallbackSrc: './assets/audio/space_maeve.wav',
    dropTimestamp: 23.53,
    fftSize: 2048,
    smoothingTimeConstant: 0.75,
    bands: {
      subBass: { min: 20, max: 145 },
      mids: { min: 220, max: 2200 },
      highs: { min: 3800, max: 14500 }
    }
  },
  layers: {
    base22: './assets/layers/base_22.png',
    overlay20: './assets/layers/overlay_20.png',
    goddess: {
      blue: './assets/layers/goddess_blue.png',
      cyan: './assets/layers/goddess_cyan.png',
      green: './assets/layers/goddess_green.png',
      yellow: './assets/layers/goddess_yellow.png',
      warm: './assets/layers/goddess_warm.png',
      red: './assets/layers/goddess_red.png',
      bright: './assets/layers/goddess_bright.png',
      shadow: './assets/layers/goddess_shadow.png',
      interiorMask: './assets/layers/goddess_interior_mask.png'
    },
    dome: {
      green: './assets/layers/cupula_green.png',
      blue: './assets/layers/cupula_blue.png',
      lightsGreen: './assets/layers/city_lights_green.png',
      lightsWhite: './assets/layers/city_lights_white.png',
      lightsRed: './assets/layers/city_lights_red.png'
    },
    hud: {
      base: './assets/layers/hud_base.png',
      flicker: './assets/layers/hud_flicker.png'
    },
    logos: {
      neomarsFront: './assets/layers/neomars_front.png',
      neomarsBack: './assets/layers/neomars_back_glow.png',
      miaFront: './assets/layers/mia_front.png',
      miaShadow: './assets/layers/mia_shadow.png',
      katakanaFront: './assets/layers/katakana_front.png',
      katakanaStroke: './assets/layers/katakana_stroke.png',
      katakanaShadow: './assets/layers/katakana_shadow.png',
      mave: './assets/layers/mave_logo.png',
      maveCopy: './assets/layers/mave_copy.png',
      ryodan: './assets/layers/ryodan_logo.png',
      ryodanCopy: './assets/layers/ryodan_copy.png'
    },
    dropReveal: {
      cartel: './assets/layers/cartel.png',
      handle1: './assets/layers/handle_1.png',
      handle2: './assets/layers/handle_2.png',
      emblem: './assets/layers/emblem.png'
    }
  }
};
