/**
 * ETHERNIUM SOVEREIGN WEB - THREE.JS VISUALIZER RENDERER (V4: COMPLETE 25-LAYER PSD Z-STACK)
 * Supports both Live 60 FPS Interactive WebGL and Deterministic Offline 4K GPU Video Rendering
 */
import * as THREE from '../../vendor/three.module.js';
import { StudioConfig } from '../config/studio_config.js';
import {
  CommonVertexShader,
  GoddessFragmentShader,
  DomeFragmentShader,
  CityLightsFragmentShader,
  RedLightsFragmentShader,
  ShadowRgbFragmentShader,
  NeoMarsFragmentShader,
  HudFragmentShader,
  VortexEmblemFragmentShader,
  MarginWavesFragmentShader,
  CartelGlassFragmentShader
} from './shaders.js';

export class VisualizerRenderer {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    this.camera.position.z = 1;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: false
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2.0));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.materials = {};
    this.meshes = {};

    this.scanner = {
      active: false,
      y: 1.0,
      speed: 0.42,
      interval: 4.8,
      timer: 0.0
    };

    this.isLoaded = false;
  }

  async loadAssets(onProgress) {
    const list = [
      { key: 'base22', url: StudioConfig.layers.base22 },
      { key: 'overlay20', url: StudioConfig.layers.overlay20 },
      { key: 'goddessBlue', url: StudioConfig.layers.goddess.blue },
      { key: 'goddessCyan', url: StudioConfig.layers.goddess.cyan },
      { key: 'goddessGreen', url: StudioConfig.layers.goddess.green },
      { key: 'goddessYellow', url: StudioConfig.layers.goddess.yellow },
      { key: 'goddessWarm', url: StudioConfig.layers.goddess.warm },
      { key: 'goddessRed', url: StudioConfig.layers.goddess.red },
      { key: 'goddessBright', url: StudioConfig.layers.goddess.bright },
      { key: 'goddessShadow', url: StudioConfig.layers.goddess.shadow },
      { key: 'goddessInteriorMask', url: StudioConfig.layers.goddess.interiorMask },
      { key: 'domeGreen', url: StudioConfig.layers.dome.green },
      { key: 'domeBlue', url: StudioConfig.layers.dome.blue },
      { key: 'lightsGreen', url: StudioConfig.layers.dome.lightsGreen },
      { key: 'lightsWhite', url: StudioConfig.layers.dome.lightsWhite },
      { key: 'lightsRed', url: StudioConfig.layers.dome.lightsRed },
      { key: 'hudBase', url: StudioConfig.layers.hud.base },
      { key: 'hudFlicker', url: StudioConfig.layers.hud.flicker },
      { key: 'neomarsFront', url: StudioConfig.layers.logos.neomarsFront },
      { key: 'neomarsBack', url: StudioConfig.layers.logos.neomarsBack },
      { key: 'miaFront', url: StudioConfig.layers.logos.miaFront },
      { key: 'miaShadow', url: StudioConfig.layers.logos.miaShadow },
      { key: 'katakanaFront', url: StudioConfig.layers.logos.katakanaFront },
      { key: 'katakanaStroke', url: StudioConfig.layers.logos.katakanaStroke },
      { key: 'katakanaShadow', url: StudioConfig.layers.logos.katakanaShadow },
      { key: 'mave', url: StudioConfig.layers.logos.mave },
      { key: 'maveCopy', url: StudioConfig.layers.logos.maveCopy },
      { key: 'ryodan', url: StudioConfig.layers.logos.ryodan },
      { key: 'ryodanCopy', url: StudioConfig.layers.logos.ryodanCopy },
      { key: 'cartel', url: StudioConfig.layers.dropReveal.cartel },
      { key: 'handle1', url: StudioConfig.layers.dropReveal.handle1 },
      { key: 'handle2', url: StudioConfig.layers.dropReveal.handle2 },
      { key: 'emblem', url: StudioConfig.layers.dropReveal.emblem }
    ];

    let loadedCount = 0;
    const loadPromise = (item) => {
      return new Promise((resolve, reject) => {
        this.textureLoader.load(
          item.url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.generateMipmaps = false;
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            this.textures[item.key] = tex;
            loadedCount++;
            if (onProgress) onProgress(loadedCount / list.length);
            resolve();
          },
          undefined,
          (err) => reject(err)
        );
      });
    };

    await Promise.all(list.map(loadPromise));
    this.buildScene();
    this.isLoaded = true;
  }

  buildScene() {
    const quadGeom = new THREE.PlaneGeometry(2, 2);
    const addStaticPlane = (tex, z, opacity = 1.0) => {
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: opacity < 1.0 || true,
        opacity: opacity,
        depthWrite: false
      });
      const mesh = new THREE.Mesh(quadGeom, mat);
      mesh.position.z = z;
      this.scene.add(mesh);
      return mat;
    };

    // [00] 22Copia de Diosa Cibernética (True Bottom Base Layer, op=255)
    addStaticPlane(this.textures.base22, 0.010, 1.0);

    // [01] & [02] Dome Shader (21 cupula & 20 Copia de 21 cupula)
    this.materials.dome = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: DomeFragmentShader,
      uniforms: {
        u_texDomeGreen: { value: this.textures.domeGreen },
        u_texDomeBlue: { value: this.textures.domeBlue },
        u_time: { value: 0.0 },
        u_mids: { value: 0.0 },
        u_bass: { value: 0.0 },
        u_echo: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const domeMesh = new THREE.Mesh(quadGeom, this.materials.dome);
    domeMesh.position.z = 0.020;
    this.scene.add(domeMesh);

    // [03] 20 Diosa Cibernética y Ciudad Flotante (Alpha 133/255 already baked in PNG!)
    addStaticPlane(this.textures.overlay20, 0.025, 1.0);

    // [04] 19 cambia color... Diosa Cibernética (8 Cyberpunk & RGBY Variants + Hologram Scanner)
    this.materials.goddess = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: GoddessFragmentShader,
      uniforms: {
        u_texBlue: { value: this.textures.goddessBlue },
        u_texCyan: { value: this.textures.goddessCyan },
        u_texGreen: { value: this.textures.goddessGreen },
        u_texYellow: { value: this.textures.goddessYellow },
        u_texWarm: { value: this.textures.goddessWarm },
        u_texRed: { value: this.textures.goddessRed },
        u_texBright: { value: this.textures.goddessBright },
        u_texShadow: { value: this.textures.goddessShadow },
        u_texInteriorMask: { value: this.textures.goddessInteriorMask },
        u_time: { value: 0.0 },
        u_bass: { value: 0.0 },
        u_mids: { value: 0.0 },
        u_highs: { value: 0.0 },
        u_impact: { value: 0.0 },
        u_kick: { value: 0.0 },
        u_echo: { value: 0.0 },
        u_snare: { value: 0.0 },
        u_variantIndex: { value: 0.0 },
        u_scannerY: { value: 1.0 },
        u_scannerActive: { value: 1.0 },
        u_dropActive: { value: 0.0 },
        u_grit: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const goddessMesh = new THREE.Mesh(quadGeom, this.materials.goddess);
    goddessMesh.position.z = 0.030;
    this.scene.add(goddessMesh);

    // [05] & [06] Marco HUD cibernético rojo futurista + parpadea
    this.materials.hud = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: HudFragmentShader,
      uniforms: {
        u_texBase: { value: this.textures.hudBase },
        u_texFlicker: { value: this.textures.hudFlicker },
        u_time: { value: 0.0 },
        u_highs: { value: 0.0 },
        u_snare: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const hudMesh = new THREE.Mesh(quadGeom, this.materials.hud);
    hudMesh.position.z = 0.040;
    this.scene.add(hudMesh);

    // [07], [08] MIA + [15], [16], [17] Katakana (All 5 layers with progressive RGB shadow)
    this.materials.shadowRgb = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: ShadowRgbFragmentShader,
      uniforms: {
        u_texShadowMia: { value: this.textures.miaShadow },
        u_texShadowKatakana: { value: this.textures.katakanaShadow },
        u_texFrontMia: { value: this.textures.miaFront },
        u_texFrontKatakana: { value: this.textures.katakanaFront },
        u_texStrokeKatakana: { value: this.textures.katakanaStroke },
        u_time: { value: 0.0 },
        u_highs: { value: 0.0 },
        u_impact: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const shadowRgbMesh = new THREE.Mesh(quadGeom, this.materials.shadowRgb);
    shadowRgbMesh.position.z = 0.050;
    this.scene.add(shadowRgbMesh);

    // [09] & [10] NEO-MARS (14 Copia de 5 intensity pulse + 13 NEO-MARS)
    this.materials.neomars = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: NeoMarsFragmentShader,
      uniforms: {
        u_texFront: { value: this.textures.neomarsFront },
        u_texBackGlow: { value: this.textures.neomarsBack },
        u_time: { value: 0.0 },
        u_highs: { value: 0.0 },
        u_snare: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const neomarsMesh = new THREE.Mesh(quadGeom, this.materials.neomars);
    neomarsMesh.position.z = 0.055;
    this.scene.add(neomarsMesh);

    // [11], [12] MAVE + [13], [14] RYODAN (All 4 layers!)
    addStaticPlane(this.textures.mave, 0.060, 1.0);
    addStaticPlane(this.textures.maveCopy, 0.061, 1.0);
    addStaticPlane(this.textures.ryodan, 0.065, 1.0);
    addStaticPlane(this.textures.ryodanCopy, 0.066, 1.0);

    // [18] & [19] COLORED CITY LIGHTS SHADER (5color luces & 4Copia)
    this.materials.cityLights = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: CityLightsFragmentShader,
      uniforms: {
        u_texLightsGreen: { value: this.textures.lightsGreen },
        u_texLightsWhite: { value: this.textures.lightsWhite },
        u_time: { value: 0.0 },
        u_mids: { value: 0.0 },
        u_echo: { value: 0.0 },
        u_snare: { value: 0.0 },
        u_kick: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const cityLightsMesh = new THREE.Mesh(quadGeom, this.materials.cityLights);
    cityLightsMesh.position.z = 0.034;
    this.scene.add(cityLightsMesh);

    // [20] RED BLINKING LIGHTS SHADER (3 color luces // solo parpadea color)
    this.materials.redLights = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: RedLightsFragmentShader,
      uniforms: {
        u_texLightsRed: { value: this.textures.lightsRed },
        u_time: { value: 0.0 },
        u_mids: { value: 0.0 },
        u_snare: { value: 0.0 },
        u_kick: { value: 0.0 },
        u_echo: { value: 0.0 },
        u_variantIndex: { value: 0.0 },
        u_dropActive: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const redLightsMesh = new THREE.Mesh(quadGeom, this.materials.redLights);
    redLightsMesh.position.z = 0.036;
    this.scene.add(redLightsMesh);

    // [21] Cartel Panel: iOS Transparent 3D Glass with identical chamfered polygon silhouette
    this.materials.cartel = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: CartelGlassFragmentShader,
      uniforms: {
        u_texCartel: { value: this.textures.cartel },
        u_time: { value: 0.0 },
        u_highs: { value: 0.0 },
        u_impact: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const cartelMesh = new THREE.Mesh(quadGeom, this.materials.cartel);
    cartelMesh.position.z = 0.080;
    this.scene.add(cartelMesh);

    // [22], [23] Credits Handles: @KREATOSVORTEX & @STEVEBLACKBEARD (same authentic typography, crisp white)
    this.materials.handle1 = addStaticPlane(this.textures.handle1, 0.082, 1.0);
    this.materials.handle2 = addStaticPlane(this.textures.handle2, 0.084, 1.0);

    // [24] Rotating Vortex Emblem on right side of credits panel
    this.materials.emblem = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: VortexEmblemFragmentShader,
      uniforms: {
        u_texEmblem: { value: this.textures.emblem },
        u_time: { value: 0.0 },
        u_opacity: { value: 1.0 },
        u_bass: { value: 0.0 }
      },
      transparent: true,
      depthWrite: false
    });
    const emblemMesh = new THREE.Mesh(quadGeom, this.materials.emblem);
    emblemMesh.position.z = 0.088;
    this.scene.add(emblemMesh);

    // [25] MARGIN PLASMA LASER STRINGS (Bass, Mids, Highs on Left & Right Margins)
    this.materials.marginWaves = new THREE.ShaderMaterial({
      vertexShader: CommonVertexShader,
      fragmentShader: MarginWavesFragmentShader,
      uniforms: {
        u_time: { value: 0.0 },
        u_bass: { value: 0.0 },
        u_mids: { value: 0.0 },
        u_highs: { value: 0.0 },
        u_aspect: { value: 2668.0 / 1500.0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const marginWavesMesh = new THREE.Mesh(quadGeom, this.materials.marginWaves);
    marginWavesMesh.position.z = 0.095;
    // this.scene.add(marginWavesMesh); // Moved to web margins outside artwork
  }

  resize(width, height) {
    this.renderer.setSize(width, height, false);
  }

  triggerHologramScan() {
    this.scanner.y = 1.0;
    this.scanner.active = true;
    this.scanner.timer = 0.0;
  }

  render(time, delta, energy, currentTime) {
    if (!this.isLoaded) return;

    this.scanner.timer += delta;
    const isSnareHit = (energy.snare !== undefined && energy.snare > 0.76) || (energy.impact !== undefined && energy.impact > 0.82);
    if (!this.scanner.active && (this.scanner.timer >= this.scanner.interval || (isSnareHit && this.scanner.timer >= 2.2))) {
      this.triggerHologramScan();
    }

    if (this.scanner.active) {
      const scanSpeed = this.scanner.speed * (0.85 + (energy.mids || 0.0) * 0.45);
      this.scanner.y -= scanSpeed * delta;
      if (this.scanner.y < -0.1) {
        this.scanner.active = false;
        this.scanner.y = 1.0;
      }
    }

    const imp = (energy.impact !== undefined) ? energy.impact : energy.subBass;
    const kick = (energy.kick !== undefined) ? energy.kick : energy.subBass;
    const echo = (energy.echo !== undefined) ? energy.echo : energy.mids;
    const snare = (energy.snare !== undefined) ? energy.snare : energy.highs;
    const vIdx = (energy.variantIndex !== undefined && energy.variantIndex > 0.001) ? energy.variantIndex : (time * 0.95);

    if (this.materials.goddess) {
      const u = this.materials.goddess.uniforms;
      u.u_time.value = time;
      u.u_bass.value = energy.subBass;
      u.u_mids.value = energy.mids;
      u.u_highs.value = energy.highs;
      u.u_impact.value = imp;
      u.u_kick.value = kick;
      u.u_echo.value = echo;
      u.u_snare.value = snare;
      u.u_variantIndex.value = vIdx;
      u.u_scannerY.value = this.scanner.y;
      u.u_scannerActive.value = this.scanner.active ? 1.0 : 0.0;
      u.u_dropActive.value = energy.dropActive ? 1.0 : 0.0;
      u.u_grit.value = (energy.grit !== undefined) ? energy.grit : 0.0;
    }

    if (this.materials.marginWaves) {
      const u = this.materials.marginWaves.uniforms;
      u.u_time.value = time;
      u.u_bass.value = energy.subBass;
      u.u_mids.value = energy.mids;
      u.u_highs.value = energy.highs;
    }

    if (this.materials.dome) {
      const u = this.materials.dome.uniforms;
      u.u_time.value = time;
      u.u_mids.value = energy.mids;
      u.u_bass.value = energy.subBass;
      u.u_echo.value = echo;
    }

    if (this.materials.cityLights) {
      const u = this.materials.cityLights.uniforms;
      u.u_time.value = time;
      u.u_mids.value = energy.mids;
      u.u_echo.value = echo;
      u.u_snare.value = snare;
      u.u_kick.value = kick;
    }

    if (this.materials.redLights) {
      const u = this.materials.redLights.uniforms;
      u.u_time.value = time;
      u.u_mids.value = energy.mids;
      u.u_snare.value = snare;
      u.u_kick.value = kick;
      u.u_echo.value = echo;
      u.u_variantIndex.value = vIdx;
      u.u_dropActive.value = energy.dropActive ? 1.0 : 0.0;
    }

    if (this.materials.shadowRgb) {
      const u = this.materials.shadowRgb.uniforms;
      u.u_time.value = time;
      u.u_highs.value = energy.highs;
      u.u_impact.value = imp;
    }

    if (this.materials.neomars) {
      const u = this.materials.neomars.uniforms;
      u.u_time.value = time;
      u.u_highs.value = energy.highs;
      u.u_snare.value = snare;
    }

    if (this.materials.hud) {
      const u = this.materials.hud.uniforms;
      u.u_time.value = time;
      u.u_highs.value = energy.highs;
      u.u_snare.value = snare;
    }

    if (this.materials.cartel && this.materials.cartel.uniforms) {
      const u = this.materials.cartel.uniforms;
      u.u_time.value = time;
      u.u_highs.value = energy.highs;
      u.u_impact.value = imp;
    }

    if (this.materials.emblem && this.materials.emblem.uniforms) {
      const u = this.materials.emblem.uniforms;
      u.u_time.value = time;
      u.u_opacity.value = 0.85 + 0.15 * imp;
      u.u_bass.value = imp;
    }

    this.renderer.render(this.scene, this.camera);
  }
}
