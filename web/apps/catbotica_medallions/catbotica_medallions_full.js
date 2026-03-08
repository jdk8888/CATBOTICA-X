/**
 * CATBOTICA — Catbotica Medallions (full). Control panel, 12 medallions, inner sphere video, globe screens.
 * Uses PARADE_MEDALLIONS_COINS_CONFIG and PARADE_IMAX_CONFIG; window.heroCarouselControls.
 */
import * as THREE from 'three';
import { EffectComposer } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://unpkg.com/three@0.160.0/examples/jsm/postprocessing/ShaderPass.js';

(function () {
  var container = document.getElementById('parade-canvas');
  if (!container) return;

  function getSize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w <= 0 || h <= 0) {
      var rect = container.getBoundingClientRect();
      w = rect.width || 640;
      h = rect.height || 360;
    }
    return { w: w, h: h };
  }
  var size = getSize();
  var width = size.w;
  var height = size.h;

  var config = window.PARADE_MEDALLIONS_COINS_CONFIG || {};
  var imageList = config.imageList || [];
  if (imageList.length === 0) imageList = [{ name: 'CATBOTICA', url: '' }];
  var PARADE_ENABLE_CAROUSEL = window.PARADE_ENABLE_CAROUSEL === true;
  var rearImageUrl = (config.rearUrl != null && config.rearUrl !== '') ? config.rearUrl : 'assets/rear.png';

  const scene = new THREE.Scene();
  const REF_CAMERA_DIST = 6000;
  const CAMERA_FOV = 55;
  var currentCameraDist = REF_CAMERA_DIST;
  var defaultCameraDist = REF_CAMERA_DIST;
  var zoomMin = 3000;
  var zoomMax = 10000;
  var initialCameraSet = false;
  const CAMERA_NEAR = 10;
  const CAMERA_FAR = 100000;
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, CAMERA_NEAR, CAMERA_FAR);
  camera.position.set(0, 0, currentCameraDist);
  camera.lookAt(0, 0, 0);
  var lookAtTarget = new THREE.Vector3();
  var lookAtFrontCard = new THREE.Vector3();
  var selectedCard = null;
  var mousedownHitCard = null;
  var touchStartHitCard = null;
  var paradeCardWorldPos = new THREE.Vector3();
  var paradeDirToCam = new THREE.Vector3();
  var paradeDirToCard = new THREE.Vector3();
  var paradeFrontCardPos = new THREE.Vector3();
  var mouse = new THREE.Vector2();
  var raycaster = new THREE.Raycaster();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  var pixelRatioCap = width < 768 ? 1.5 : 2;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
  renderer.setClearColor(0x0a0a12, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  renderer.domElement.setAttribute('tabindex', '0');
  renderer.domElement.style.outline = 'none';

  var composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  var bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.7, 0.45, 0.2);
  composer.addPass(bloomPass);

  var vignettePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uOffset: { value: 0.25 },
      uDarken: { value: 0.85 }
    },
    vertexShader: [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n'),
    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform float uOffset;',
      'uniform float uDarken;',
      'varying vec2 vUv;',
      'void main() {',
      '  vec4 tex = texture2D(tDiffuse, vUv);',
      '  float d = distance(vUv, vec2(0.5));',
      '  float v = 1.0 - smoothstep(uOffset, uDarken, d);',
      '  gl_FragColor = vec4(tex.rgb * v, tex.a);',
      '}'
    ].join('\n')
  });
  vignettePass.renderToScreen = true;
  composer.addPass(vignettePass);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(80, 120, 280);
  key.castShadow = true;
  key.shadow.mapSize.width = 1024;
  key.shadow.mapSize.height = 1024;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 800;
  key.shadow.camera.left = -1000;
  key.shadow.camera.right = 1000;
  key.shadow.camera.top = 1000;
  key.shadow.camera.bottom = -1000;
  key.shadow.bias = -0.0001;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xb8d4e3, 0.35);
  fill.position.set(-100, 40, 150);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x28EDED, 0.45);
  rim.position.set(0, -60, -200);
  scene.add(rim);

  var holoHighlightLight = new THREE.PointLight(0xffffff, 0.5, 1200);
  scene.add(holoHighlightLight);
  var holoAccentLight = new THREE.PointLight(0xFF6FB0, 0.25, 1200);
  scene.add(holoAccentLight);
  /** Light that turns on only when a card is in the front 1/3 facing the camera */
  var frontCardLight = new THREE.PointLight(0xffffff, 0, 600);
  frontCardLight.position.set(0, 0, 0);
  scene.add(frontCardLight);
  /** Closeup-only fill: directional from camera toward card */
  var closeupFillLight = new THREE.DirectionalLight(0xffffff, 0);
  closeupFillLight.position.set(0, 0, 0);
  scene.add(closeupFillLight);
  scene.add(closeupFillLight.target);

  function createProceduralEnvMap() {
    try {
      var size = 32;
      var colors = [0x1a4d5c, 0x0d2830, 0x0d2830, 0x0d2830, 0x163d48, 0x0a1f28];
      var canvases = [];
      for (var i = 0; i < 6; i++) {
        var c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        var ctx = c.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, size, size);
        g.addColorStop(0, '#' + new THREE.Color(colors[i]).getHexString());
        g.addColorStop(1, '#' + new THREE.Color(colors[(i + 1) % 6]).getHexString());
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        canvases.push(c);
      }
      var cubeTex = new THREE.CubeTexture(canvases);
      cubeTex.mapping = THREE.CubeReflectionMapping;
      cubeTex.needsUpdate = true;
      return cubeTex;
    } catch (e) {
      return null;
    }
  }

  function createHoloEdgeAlphaTexture() {
    var size = 64;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var ctx = canvas.getContext('2d');
    var cx = size / 2;
    var r = cx;
    var g = ctx.createRadialGradient(cx, cx, 0, cx, cx, r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#000000');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.ClampToEdge;
    tex.needsUpdate = true;
    return tex;
  }

  var holoEdgeAlphaTex = createHoloEdgeAlphaTexture();
  var holoEnvMap = createProceduralEnvMap();

  const carousel = new THREE.Group();
  carousel.frustumCulled = false;
  scene.add(carousel);

  var closeupGroup = new THREE.Group();
  closeupGroup.position.set(0, 0, 0);
  scene.add(closeupGroup);
  var closeupCenterWorld = new THREE.Vector3();

  const PARALLAX_CARD_NAMES = [];
  const edgeColor = 0x0ea5e9;
  const MAGENTA = 0xff6fb0;
  const POKEMON_ASPECT = 2.5 / 3.5;
  const contentH = 94;
  const cardW = Math.round(contentH * POKEMON_ASPECT);
  const imageSize = 72;
  const middleBarH = 2;
  const ledHeight = contentH - imageSize - middleBarH;
  const cornerRadius = 3.5;
  const bevelW = 2.1;
  const thickness = 4;
  const outerW = cardW + bevelW * 2;
  const outerH = contentH + bevelW * 2;
  const carouselRadius = 1440;
  const medallionCenterY = 0;

  // Silhouette card (outline-based, same as card-test.html)
  const REF_SIL = 512;
  const cardWSil = REF_SIL;
  const contentHSil = REF_SIL;
  const thicknessSil = 4;
  const SILHOUETTE_SCALE = 0.4;

  const REF_SIZE = 500;
  const CAROUSEL_SIZE_MULT = 2.8;
  const ORBIT_LIMIT = 0.12;
  const ORBIT_LIMIT_V = 5 * Math.PI / 180;
  const CLOSEUP_ORBIT_LIMIT_V = 5 * Math.PI / 180;
  const CLOSEUP_ORBIT_LIMIT_H = 10 * Math.PI / 180;
  const ORBIT_SMOOTH = 6;
  const DEFAULT_ORBIT_H = 0.08;
  const DEFAULT_ORBIT_V = 0.02;
  let orbitAngleH = DEFAULT_ORBIT_H;
  let orbitAngleV = DEFAULT_ORBIT_V;
  let orbitAngleHTarget = DEFAULT_ORBIT_H;
  let orbitAngleVTarget = DEFAULT_ORBIT_V;
  let isDragging = false;
  let dragStartX = 0, dragStartY = 0, dragStartOrbitH = 0, dragStartOrbitV = 0;
  var lastPinchDist = null;
  const PINCH_ZOOM_SENSITIVITY = 0.4;

  var CONTENT_TOP_Y = 326 - 200 - 300 - 300 - 350;
  var CONTENT_BOTTOM_Y = medallionCenterY - (outerH / 2) * 2;
  var CONTENT_SPAN = CONTENT_TOP_Y - CONTENT_BOTTOM_Y;
  var CONTENT_CENTER_Y = (CONTENT_TOP_Y + CONTENT_BOTTOM_Y) / 2;
  var CLEARANCE_RATIO = 0.04;

  // Dust: diffuse distribution (linear radius), gentle quadratic falloff, softer center
  (function () {
    var dustCount = 5000;
    var positions = new Float32Array(dustCount * 3);
    var colors = new Float32Array(dustCount * 3);
    var sizes = new Float32Array(dustCount);
    var phases = new Float32Array(dustCount);
    var cx = 0;
    var cy = medallionCenterY;
    var cz = 0;
    var i, r, t, x, z, n, alpha, normR;
    for (i = 0; i < dustCount; i++) {
      r = carouselRadius * Math.pow(Math.random(), 1.0);
      t = Math.random() * Math.PI * 2;
      x = cx + r * Math.cos(t);
      z = cz + r * Math.sin(t);
      positions[i * 3] = x;
      positions[i * 3 + 1] = cy + (Math.random() - 0.5) * 240;
      positions[i * 3 + 2] = z;
      sizes[i] = 1 + Math.random() * 9;
      phases[i] = Math.random() * Math.PI * 2;
      normR = r / carouselRadius;
      n = Math.pow(1 - normR, 2);
      alpha = 0.25 + 0.5 * n;
      colors[i * 3] = alpha;
      colors[i * 3 + 1] = alpha;
      colors[i * 3 + 2] = alpha + 0.1;
    }
    var dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dustGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    dustGeom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    dustGeom.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    var dustCanvas = document.createElement('canvas');
    dustCanvas.width = 64;
    dustCanvas.height = 64;
    var dctx = dustCanvas.getContext('2d');
    var dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0, 'rgba(255,255,255,0.9)');
    dg.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    dg.addColorStop(1, 'rgba(255,255,255,0)');
    dctx.fillStyle = dg;
    dctx.fillRect(0, 0, 64, 64);
    var dustTex = new THREE.CanvasTexture(dustCanvas);
    dustTex.needsUpdate = true;
    var dustVShader = [
      'attribute float size;',
      'attribute float phase;',
      'attribute vec3 color;',
      'uniform float uParticleSizeScale;',
      'varying vec3 vColor;',
      'varying float vPhase;',
      'void main() {',
      '  vColor = color;',
      '  vPhase = phase;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = 36.0 * size * uParticleSizeScale * (300.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n');
    var dustFShader = [
      'uniform float uTime;',
      'uniform float uLuminosity;',
      'uniform vec3 uColorTint;',
      'uniform sampler2D uMap;',
      'varying vec3 vColor;',
      'varying float vPhase;',
      'void main() {',
      '  vec4 tex = texture2D(uMap, gl_PointCoord);',
      '  float sparkle = 0.8 + 0.4 * sin(uTime * 4.0 + vPhase);',
      '  vec3 col = vColor * uColorTint * sparkle;',
      '  gl_FragColor = vec4(col, 0.88) * tex * uLuminosity;',
      '}'
    ].join('\n');
    var dustMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLuminosity: { value: 1 },
        uColorTint: { value: new THREE.Vector3(1, 1, 1) },
        uParticleSizeScale: { value: 1 },
        uMap: { value: dustTex }
      },
      vertexShader: dustVShader,
      fragmentShader: dustFShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var dustPoints = new THREE.Points(dustGeom, dustMat);
    dustPoints.frustumCulled = false;
    carousel.add(dustPoints);
    window.paradeDustPoints = dustPoints;
    window.paradeDustMaterial = dustMat;
    window.paradeDustMaxCount = dustCount;
  })();

  // 12 medallions at equator (three-layer parallax), MEDALLION_RING_RADIUS
  const MEDALLION_FACE_IMAGE = 'assets/2026_CATBOTICA_Lunar_New_Year_Badge_Face.png';
  const MEDALLION_CHARACTER_IMAGE = 'assets/2026_CATBOTICA_Lunar_New_Year_Badge_Character.png';
  const MEDALLION_BACKGROUND_IMAGE = 'assets/2026_CATBOTICA_Lunar_New_Year_Badge_Background.png';
  const MEDALLION_COUNT = 12;
  const MEDALLION_DISC_RADIUS = 90;
  const MEDALLION_RING_RADIUS = 900;
  const MEDALLION_SPIN_SPEED = 0.4;
  const MEDALLION_PARALLAX_Z = 22;
  (function () {
    var medLoader = new THREE.TextureLoader();
    medLoader.setCrossOrigin('anonymous');
    var circleCanvas = document.createElement('canvas');
    circleCanvas.width = 128;
    circleCanvas.height = 128;
    var cctx = circleCanvas.getContext('2d');
    var cx = 64, cy = 64, cr = 62;
    var g = cctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(1, '#000000');
    cctx.fillStyle = g;
    cctx.beginPath();
    cctx.arc(cx, cy, cr, 0, Math.PI * 2);
    cctx.fill();
    var circleAlphaTex = new THREE.CanvasTexture(circleCanvas);
    circleAlphaTex.needsUpdate = true;
    function matForTex(tex) {
      if (tex && tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshBasicMaterial({
        map: tex || null,
        color: 0x2a2a3a,
        side: THREE.FrontSide,
        transparent: false,
        alphaTest: 0.02,
        alphaMap: circleAlphaTex,
        depthWrite: true,
        depthTest: true
      });
    }
    var medGroup = new THREE.Group();
    medGroup.position.set(0, 0, 0);
    var faceTex = null, characterTex = null, backgroundTex = null;
    var loaded = 0;
    function buildMedallions() {
      if (loaded !== 3) return;
      for (var i = 0; i < MEDALLION_COUNT; i++) {
        var angle = (i / MEDALLION_COUNT) * Math.PI * 2;
        var single = new THREE.Group();
        single.userData.baseAngle = angle + Math.PI;
        var zOff = MEDALLION_PARALLAX_Z;
        if (backgroundTex) {
          var backMesh = new THREE.Mesh(
            new THREE.CircleGeometry(MEDALLION_DISC_RADIUS, 64),
            matForTex(backgroundTex)
          );
          backMesh.position.set(0, 0, -zOff);
          backMesh.rotation.y = Math.PI;
          single.add(backMesh);
        }
        if (characterTex) {
          var midMesh = new THREE.Mesh(
            new THREE.CircleGeometry(MEDALLION_DISC_RADIUS, 64),
            matForTex(characterTex)
          );
          midMesh.position.set(0, 0, 0);
          single.add(midMesh);
        }
        if (faceTex) {
          var frontMesh = new THREE.Mesh(
            new THREE.CircleGeometry(MEDALLION_DISC_RADIUS, 64),
            matForTex(faceTex)
          );
          frontMesh.position.set(0, 0, zOff);
          single.add(frontMesh);
        }
        single.position.x = MEDALLION_RING_RADIUS * Math.cos(angle);
        single.position.y = medallionCenterY;
        single.position.z = MEDALLION_RING_RADIUS * Math.sin(angle);
        single.rotation.y = single.userData.baseAngle;
        medGroup.add(single);
      }
      carousel.add(medGroup);
      window.paradeRingMedallions = medGroup;
    }
    medLoader.load(MEDALLION_BACKGROUND_IMAGE, function (t) { backgroundTex = t; backgroundTex.needsUpdate = true; loaded++; buildMedallions(); }, undefined, function () { loaded++; buildMedallions(); });
    medLoader.load(MEDALLION_CHARACTER_IMAGE, function (t) { characterTex = t; characterTex.needsUpdate = true; loaded++; buildMedallions(); }, undefined, function () { loaded++; buildMedallions(); });
    medLoader.load(MEDALLION_FACE_IMAGE, function (t) { faceTex = t; faceTex.needsUpdate = true; loaded++; buildMedallions(); }, undefined, function () { loaded++; buildMedallions(); });
  })();

  // Inner sphere video (PARADE_IMAX_CONFIG.innerSphereVideoUrl, e.g. videos/catboticavid5.mp4)
  (function () {
    var imaxConfig = window.PARADE_IMAX_CONFIG || {};
    var scriptBase = (function () {
      var s = document.currentScript || document.querySelector('script[src*="hero-card-carousel.js"]') || document.querySelector('script[src*="catbotica_medallions_full.js"]');
      return s && s.src ? s.src.replace(/\/[^/]*$/, '/') : (window.location.href.replace(/\/[^/]*$/, '/'));
    })();
    var defaultInnerVideo = 'videos/catboticavid5.mp4';
    var innerVideoUrl = (imaxConfig.innerSphereVideoUrl && imaxConfig.innerSphereVideoUrl.indexOf('http') === 0)
      ? imaxConfig.innerSphereVideoUrl
      : (scriptBase + defaultInnerVideo);
    var INNER_SPHERE_RADIUS = 2200;
    var INNER_SPHERE_OPACITY = 0.6;
    var R_eq = INNER_SPHERE_RADIUS;
    var R_polar = R_eq / 2;
    var innerSphereVideo = document.createElement('video');
    innerSphereVideo.loop = true;
    innerSphereVideo.muted = true;
    innerSphereVideo.playsInline = true;
    innerSphereVideo.crossOrigin = 'anonymous';
    innerSphereVideo.preload = 'auto';
    innerSphereVideo.src = innerVideoUrl;
    innerSphereVideo.play().catch(function () {});
    var innerSphereTex = new THREE.VideoTexture(innerSphereVideo);
    innerSphereTex.minFilter = THREE.LinearFilter;
    innerSphereTex.magFilter = THREE.LinearFilter;
    innerSphereTex.wrapS = THREE.RepeatWrapping;
    innerSphereTex.wrapT = THREE.RepeatWrapping;
    innerSphereTex.repeat.set(1, 1);
    innerSphereTex.offset.set(0, 0);
    if (innerSphereTex.flipY !== undefined) innerSphereTex.flipY = true;
    if (innerSphereTex.colorSpace !== undefined) innerSphereTex.colorSpace = THREE.SRGBColorSpace;
    var innerSphereGeo = new THREE.SphereGeometry(INNER_SPHERE_RADIUS, 32, 32);
    var innerSphereMat = new THREE.MeshBasicMaterial({
      map: innerSphereTex,
      side: THREE.BackSide,
      transparent: true,
      opacity: INNER_SPHERE_OPACITY,
      depthWrite: false,
      depthTest: true
    });
    var innerSphere = new THREE.Mesh(innerSphereGeo, innerSphereMat);
    innerSphere.scale.set(1, R_polar / R_eq, 1);
    innerSphere.position.set(0, medallionCenterY, 0);
    innerSphere.renderOrder = 990;
    innerSphere.frustumCulled = false;
    carousel.add(innerSphere);
    window.paradeInnerSphere = innerSphere;
    window.paradeInnerSphereTex = innerSphereTex;
    window.paradeInnerSphereVideo = innerSphereVideo;
  })();

  // Globe screens (5×7 grid on ellipsoid, facing outward); video textures from PARADE_IMAX_CONFIG.globeScreenVideos
  (function () {
    var imaxConfig = window.PARADE_IMAX_CONFIG || {};
    var scriptBase = (function () {
      var s = document.currentScript || document.querySelector('script[src*="hero-card-carousel.js"]') || document.querySelector('script[src*="catbotica_medallions_full.js"]');
      return s && s.src ? s.src.replace(/\/[^/]*$/, '/') : (window.location.href.replace(/\/[^/]*$/, '/'));
    })();
    var videoUrls = imaxConfig.globeScreenVideos && imaxConfig.globeScreenVideos.length
      ? imaxConfig.globeScreenVideos
      : (imaxConfig.innerSphereVideoUrl ? [imaxConfig.innerSphereVideoUrl] : ['videos/catboticavid5.mp4']);
    var globeGroup = new THREE.Group();
    globeGroup.position.set(0, medallionCenterY, 0);
    var center = new THREE.Vector3(0, 0, 0);
    var rows = 5, cols = 21;
    var GLOBE_PHI_RANGE = 0.2 * Math.PI;
    var GLOBE_THETA_SPAN = Math.PI * 1.25;
    var GLOBE_GAP_FACTOR = Math.min(1, 0.92 * 1.5);
    var screenScale = 3;
    var ELLIPSE_SIZE_MULT = 2;
    var R_eq = 3800 * 1.5 * 1.5 * ELLIPSE_SIZE_MULT;
    var R_polar = R_eq / 2;
    var R_ref = 1200 * 1.5 * 1.5 * ELLIPSE_SIZE_MULT;
    var R_polar_ref = R_ref / 2;
    var R_ref_size = 1200 * 1.5 * ELLIPSE_SIZE_MULT;
    var R_polar_ref_size = R_ref_size / 2;
    var phiRange = GLOBE_PHI_RANGE;
    var phiBandCenter = Math.PI / 2;
    var phiMin = phiBandCenter - phiRange / 2;
    var phiMax = phiBandCenter + phiRange / 2;
    var thetaSpan = GLOBE_THETA_SPAN;
    var thetaMin = 2 * Math.PI - thetaSpan;
    var thetaMax = 2 * Math.PI;
    var gapFactor = GLOBE_GAP_FACTOR;
    var cellH = (R_polar_ref_size * phiRange / rows) * gapFactor * screenScale;
    var refScreenW = (R_ref_size * thetaSpan / cols) * gapFactor * screenScale;
    var refScreenH = refScreenW / (16 / 9);

    function makeRoundedRectGeo(w, h, r) {
      r = Math.min(r, w / 2 * 0.99, h / 2 * 0.99);
      var s = new THREE.Shape();
      s.moveTo(-w / 2 + r, -h / 2);
      s.lineTo( w / 2 - r, -h / 2);
      s.absarc( w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
      s.lineTo( w / 2,  h / 2 - r);
      s.absarc( w / 2 - r,  h / 2 - r, r, 0, Math.PI / 2, false);
      s.lineTo(-w / 2 + r,  h / 2);
      s.absarc(-w / 2 + r,  h / 2 - r, r, Math.PI / 2, Math.PI, false);
      s.lineTo(-w / 2, -h / 2 + r);
      s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
      s.closePath();
      var geo = new THREE.ShapeGeometry(s, 5);
      var pos = geo.attributes.position;
      var uvArr = new Float32Array(pos.count * 2);
      for (var i = 0; i < pos.count; i++) {
        uvArr[i * 2]     = (pos.getX(i) + w / 2) / w;
        uvArr[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
      return geo;
    }

    var textures = [];
    var materials = [];
    for (var v = 0; v < videoUrls.length; v++) {
      var url = videoUrls[v];
      var fullUrl = (url.indexOf('http') === 0) ? url : (scriptBase + url);
      var vid = document.createElement('video');
      vid.loop = true;
      vid.muted = true;
      vid.playsInline = true;
      vid.crossOrigin = 'anonymous';
      vid.preload = 'auto';
      vid.src = fullUrl;
      vid.play().catch(function () {});
      var tex = new THREE.VideoTexture(vid);
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      if (tex.flipY !== undefined) tex.flipY = true;
      if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      materials.push(new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        depthWrite: true,
        depthTest: true,
        transparent: true,
        opacity: 1
      }));
    }
    if (materials.length === 0) {
      materials.push(new THREE.MeshBasicMaterial({ color: 0x1a1a2e, side: THREE.DoubleSide, transparent: true, opacity: 1 }));
    }
    var deckPos = 0;
    var screenMeshRefs = [];
    for (var r = 0; r < rows; r++) {
      var phi = phiMin + (r / Math.max(rows - 1, 1)) * (phiMax - phiMin);
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);
      var radial = R_eq * sinPhi;
      var radialRef = R_ref_size * sinPhi;
      var arcPerCol = radialRef * thetaSpan / cols;
      var maxScreenW = cellH * (16 / 9);
      var screenW = Math.min(arcPerCol * gapFactor * screenScale, maxScreenW);
      var screenH = screenW / (16 / 9);
      var cornerR = screenW * 0.08;
      for (var c = 0; c < cols; c++) {
        var theta = thetaMin + (c / cols) * (thetaMax - thetaMin);
        var x = radial * Math.cos(theta);
        var y = R_polar * cosPhi;
        var z = radial * Math.sin(theta);
        var idx = deckPos++ % materials.length;
        var mat = materials[idx];
        var screenGroup = new THREE.Group();
        screenGroup.position.set(x, y, z);
        screenGroup.lookAt(center);
        var geo = makeRoundedRectGeo(screenW, screenH, cornerR);
        var plane = new THREE.Mesh(geo, mat);
        screenGroup.add(plane);
        globeGroup.add(screenGroup);
        screenMeshRefs.push({ mesh: plane, group: screenGroup, row: r, col: c });
      }
    }
    carousel.add(globeGroup);
    window.paradeGlobeScreens = globeGroup;
    window.paradeGlobeScreenVideos = textures;
    window.paradeGlobeScreenMaterials = materials;
    window.updateGlobeScreensGap = function (gapFactor) {
      var cellH = (R_polar_ref_size * phiRange / rows) * gapFactor * screenScale;
      for (var i = 0; i < screenMeshRefs.length; i++) {
        var ref = screenMeshRefs[i];
        var r = ref.row, c = ref.col;
        var phi = phiMin + (r / Math.max(rows - 1, 1)) * (phiMax - phiMin);
        var sinPhi = Math.sin(phi);
        var radialRef = R_ref_size * sinPhi;
        var arcPerCol = radialRef * thetaSpan / cols;
        var maxScreenW = cellH * (16 / 9);
        var screenW = Math.min(arcPerCol * gapFactor * screenScale, maxScreenW);
        var screenH = screenW / (16 / 9);
        var cornerR = screenW * 0.08;
        if (ref.mesh.geometry) ref.mesh.geometry.dispose();
        ref.mesh.geometry = makeRoundedRectGeo(screenW, screenH, cornerR);
      }
    };
    window.updateGlobeScreensSeparation = function (sepFactor) {
      var bandCenter = Math.PI / 2;
      var bandSpan = phiRange;
      var bandMin = bandCenter - bandSpan / 2;
      var bandMax = bandCenter + bandSpan / 2;
      var effectivePhiRange = Math.min(bandSpan * (1 + sepFactor), bandSpan);
      var effectivePhiMin = Math.max(bandMin, bandCenter - effectivePhiRange / 2);
      var effectivePhiMax = Math.min(bandMax, bandCenter + effectivePhiRange / 2);
      var effectiveThetaSpan = thetaSpan * (1 + sepFactor);
      var thetaCenter = thetaMin + thetaSpan / 2;
      var effectiveThetaMin = thetaCenter - effectiveThetaSpan / 2;
      for (var i = 0; i < screenMeshRefs.length; i++) {
        var ref = screenMeshRefs[i];
        var r = ref.row, c = ref.col;
        var phi = effectivePhiMin + (r / Math.max(rows - 1, 1)) * (effectivePhiMax - effectivePhiMin);
        var theta = effectiveThetaMin + (c / cols) * effectiveThetaSpan;
        var sinPhi = Math.sin(phi);
        var cosPhi = Math.cos(phi);
        var radial = R_eq * sinPhi;
        var x = radial * Math.cos(theta);
        var y = R_polar * cosPhi;
        var z = radial * Math.sin(theta);
        ref.group.position.set(x, y, z);
      }
    };
  })();

  function applyOrbitCamera() {
    var r = currentCameraDist;
    var cosV = Math.cos(orbitAngleV);
    var sinV = Math.sin(orbitAngleV);
    var cosH = Math.cos(orbitAngleH);
    var sinH = Math.sin(orbitAngleH);
    camera.position.x = r * cosV * sinH;
    camera.position.y = r * sinV;
    camera.position.z = r * cosV * cosH;
    lookAtTarget.copy(lookAtFrontCard);
    camera.position.y = lookAtTarget.y;
    camera.lookAt(lookAtTarget);
  }

  function updateLayout() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (!w || !h) return;
    var size = Math.min(w, h);
    var fovRad = (CAMERA_FOV * Math.PI / 180) / 2;
    var visibleHeightRef = 2 * REF_CAMERA_DIST * Math.tan(fovRad);
    var maxScaleForFit = visibleHeightRef * (1 - 2 * CLEARANCE_RATIO) / CONTENT_SPAN;
    var scale = CAROUSEL_SIZE_MULT * size / REF_SIZE;
    scale = Math.min(scale, maxScaleForFit);
    scale = Math.max(0.6, Math.min(scale, 12));
    carousel.scale.set(scale, scale, scale);
    carousel.position.y = -CONTENT_CENTER_Y * scale;
    if (!selectedCard) lookAtFrontCard.set(0, carousel.position.y + carousel.scale.y * medallionCenterY, 0);
    var cardHeightWorld = contentHSil * scale;
    defaultCameraDist = (cardHeightWorld * 1.5) / Math.tan(fovRad);
    var ringRadiusWorld = carousel.scale.z * carouselRadius;
    defaultCameraDist = Math.max(defaultCameraDist, ringRadiusWorld * 1.15);
    defaultCameraDist *= 1.5;
    zoomMin = defaultCameraDist * 0.925;
    zoomMax = defaultCameraDist * 1.075;
    if (!initialCameraSet) {
      currentCameraDist = defaultCameraDist;
      initialCameraSet = true;
    }
    if (!selectedCard) {
      currentCameraDist = Math.max(zoomMin, Math.min(zoomMax, currentCameraDist));
    }
    applyOrbitCamera();
  }

  function matFace(tex, flipX, flipY) {
    var map = tex;
    if ((flipX || flipY) && tex.clone) {
      map = tex.clone();
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      if (flipX) { map.repeat.x = -1; map.offset.x = 1; }
      if (flipY) { map.repeat.y = -1; map.offset.y = 1; }
    }
    if (map.colorSpace !== undefined) map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshLambertMaterial({
      map: map, color: 0xffffff, side: THREE.DoubleSide,
      transparent: true, opacity: 0.78, alphaTest: 0.02, depthWrite: true, depthTest: true
    });
  }

  function matEdge() {
    return new THREE.MeshLambertMaterial({
      color: edgeColor, side: THREE.DoubleSide, depthTest: true
    });
  }

  function getDominantColorFromTexture(tex) {
    var img = tex && tex.image;
    if (!img || typeof img.width !== 'number' || img.width === 0) return edgeColor;
    var w = Math.min(img.width, 512);
    var h = Math.min(img.height, 512);
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    var data;
    try {
      data = ctx.getImageData(0, 0, w, h).data;
    } catch (e) {
      return edgeColor;
    }
    var step = 4;
    var alphaMin = 26;
    var r = 0, g = 0, b = 0, n = 0;
    for (var i = 0; i < data.length; i += step) {
      if (data[i + 3] < alphaMin) continue;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
    if (n === 0) return edgeColor;
    r = Math.round(r / n);
    g = Math.round(g / n);
    b = Math.round(b / n);
    return (r << 16) | (g << 8) | b;
  }

  function shapeFromOutline(outline) {
    if (!outline || !outline.points || outline.points.length < 3) return null;
    var w = outline.width || REF_SIL;
    var h = outline.height || REF_SIL;
    var halfW = w / 2, halfH = h / 2;
    var shape = new THREE.Shape();
    var pts = outline.points;
    var x0 = pts[0][0] - halfW;
    var y0 = -(pts[0][1] - halfH);
    shape.moveTo(x0, y0);
    for (var i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i][0] - halfW, -(pts[i][1] - halfH));
    }
    shape.closePath();
    return shape;
  }

  function matFaceSilhouette(tex) {
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshLambertMaterial({
      map: tex, color: 0xffffff, side: THREE.DoubleSide,
      transparent: true, opacity: 1, alphaTest: 0.1, depthWrite: true, depthTest: true
    });
  }

  function makeSilhouetteCard(frontTex, rearTex, outlineData) {
    var rimColor = getDominantColorFromTexture(frontTex);
    var edgeMat = new THREE.MeshBasicMaterial({
      color: rimColor, side: THREE.DoubleSide, depthTest: true, depthWrite: true
    });
    var halfT = thicknessSil / 2;
    var halfW = cardWSil / 2;
    var halfH = contentHSil / 2;
    var group = new THREE.Group();
    var frontMat = matFaceSilhouette(frontTex);
    var backMat = matFaceSilhouette(rearTex);
    var useOutline = outlineData && shapeFromOutline(outlineData);
    var shape = useOutline || (function () {
      var r = 32;
      var s = new THREE.Shape();
      var sx = -halfW + r, sy = -halfH;
      s.moveTo(sx, sy);
      s.lineTo(halfW - r, sy);
      s.quadraticCurveTo(halfW, sy, halfW, -halfH + r);
      s.lineTo(halfW, halfH - r);
      s.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
      s.lineTo(-halfW + r, halfH);
      s.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
      s.lineTo(-halfW, -halfH + r);
      s.quadraticCurveTo(-halfW, -halfH, sx, sy);
      return s;
    })();
    var extrudeSettings = { depth: thicknessSil, bevelEnabled: false };
    var geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.translate(0, 0, -halfT);
    var invisibleCap = new THREE.MeshBasicMaterial({ visible: false, depthWrite: false, side: THREE.DoubleSide });
    var edgeMesh = new THREE.Mesh(geom, [invisibleCap, edgeMat]);
    edgeMesh.renderOrder = 0;
    group.add(edgeMesh);
    var nudge = 0.5;
    var frontFace = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), frontMat);
    frontFace.position.set(0, 0, halfT + nudge);
    frontFace.renderOrder = 2;
    group.add(frontFace);
    var backFace = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), backMat);
    backFace.position.set(0, 0, -halfT - nudge);
    backFace.rotation.y = Math.PI;
    backFace.renderOrder = 1;
    group.add(backFace);
    group.scale.set(SILHOUETTE_SCALE, SILHOUETTE_SCALE, SILHOUETTE_SCALE);
    return group;
  }

  function makeParallaxCard(cardFaceTex, characterTex, rearTex, outlineData) {
    var rimColor = getDominantColorFromTexture(characterTex);
    var edgeMat = new THREE.MeshBasicMaterial({
      color: rimColor, side: THREE.DoubleSide, depthTest: true, depthWrite: true
    });
    var halfT = thicknessSil / 2;
    var halfW = cardWSil / 2;
    var halfH = contentHSil / 2;
    var group = new THREE.Group();
    var backMat = matFaceSilhouette(rearTex);
    var useOutline = outlineData && shapeFromOutline(outlineData);
    var shape = useOutline || (function () {
      var r = 32;
      var s = new THREE.Shape();
      var sx = -halfW + r, sy = -halfH;
      s.moveTo(sx, sy);
      s.lineTo(halfW - r, sy);
      s.quadraticCurveTo(halfW, sy, halfW, -halfH + r);
      s.lineTo(halfW, halfH - r);
      s.quadraticCurveTo(halfW, halfH, halfW - r, halfH);
      s.lineTo(-halfW + r, halfH);
      s.quadraticCurveTo(-halfW, halfH, -halfW, halfH - r);
      s.lineTo(-halfW, -halfH + r);
      s.quadraticCurveTo(-halfW, -halfH, sx, sy);
      return s;
    })();
    var extrudeSettings = { depth: thicknessSil, bevelEnabled: false };
    var geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.translate(0, 0, -halfT);
    var invisibleCap = new THREE.MeshBasicMaterial({ visible: false, depthWrite: false, side: THREE.DoubleSide });
    var edgeMesh = new THREE.Mesh(geom, [invisibleCap, edgeMat]);
    edgeMesh.renderOrder = 0;
    group.add(edgeMesh);
    var nudge = 0.5;
    var PARALLAX_Z_OFFSET = 2;
    var cardFaceMat = matFaceSilhouette(cardFaceTex);
    var characterMat = matFaceSilhouette(characterTex);
    var rearFace = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), backMat);
    rearFace.position.set(0, 0, -halfT - nudge);
    rearFace.rotation.y = Math.PI;
    rearFace.renderOrder = 1;
    group.add(rearFace);
    var backPlane = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), cardFaceMat);
    backPlane.position.set(0, 0, halfT + nudge);
    backPlane.renderOrder = 2;
    backPlane.userData.parallaxDepth = 0;
    group.add(backPlane);
    var midPlane = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), characterMat);
    midPlane.position.set(0, 0, halfT + nudge + PARALLAX_Z_OFFSET);
    midPlane.renderOrder = 3;
    midPlane.userData.parallaxDepth = 0.5;
    group.add(midPlane);
    var frontPlane = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), characterMat);
    frontPlane.position.set(0, 0, halfT + nudge + PARALLAX_Z_OFFSET * 2);
    frontPlane.renderOrder = 4;
    frontPlane.userData.parallaxDepth = 1;
    group.add(frontPlane);
    group.userData.parallaxLayers = [backPlane, midPlane, frontPlane];
    group.scale.set(SILHOUETTE_SCALE, SILHOUETTE_SCALE, SILHOUETTE_SCALE);
    return group;
  }

  function createCardBorderShaderMaterial() {
    var c = new THREE.Color(edgeColor);
    var BORDER_VERTEX = [
      'varying vec2 vUv;',
      'void main() {',
      '  vUv = uv;',
      '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
      '}'
    ].join('\n');
    var BORDER_FRAGMENT = [
      'uniform float uTime;',
      'uniform vec3 uColor;',
      'varying vec2 vUv;',
      'void main() {',
      '  float ca = 0.03;',
      '  float scanR = sin(vUv.y * 28.0 + uTime * 2.5 + ca);',
      '  float scanG = sin(vUv.y * 28.0 + uTime * 2.5);',
      '  float scanB = sin(vUv.y * 28.0 + uTime * 2.5 - ca);',
      '  vec3 flicker = vec3(0.75 + 0.25 * scanR, 0.75 + 0.25 * scanG, 0.75 + 0.25 * scanB);',
      '  float intensity = 2.4 * (0.85 + 0.15 * (flicker.r + flicker.g + flicker.b) / 3.0);',
      '  float shimmer = smoothstep(0.0, 0.4, sin(vUv.x * 2.5 + vUv.y * 2.0 + uTime * 1.2)) * 0.08 + 0.94;',
      '  vec3 rgb = uColor * intensity * flicker * shimmer;',
      '  gl_FragColor = vec4(rgb, 0.75);',
      '}'
    ].join('\n');
    var mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Vector3(c.r, c.g, c.b) }
      },
      vertexShader: BORDER_VERTEX,
      fragmentShader: BORDER_FRAGMENT,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
    if (window.paradeHolographicMaterials) window.paradeHolographicMaterials.push(mat);
    return mat;
  }

  window.paradeHolographicMaterials = [];

  var holoInnerMatOpt = {
    color: 0xffffff,
    emissive: new THREE.Color(edgeColor),
    emissiveIntensity: 0.35,
    transparent: true,
    opacity: 0.58,
    depthWrite: false,
    side: THREE.DoubleSide,
    depthTest: true,
    metalness: 0.4,
    roughness: 0.1,
    iridescence: 1,
    iridescenceIOR: 1.25,
    iridescenceThicknessRange: [200, 800],
    clearcoat: 0.5,
    clearcoatRoughness: 0.15,
    alphaMap: holoEdgeAlphaTex
  };
  if (holoEnvMap) {
    holoInnerMatOpt.envMap = holoEnvMap;
    holoInnerMatOpt.envMapIntensity = 0.35;
  }
  var holoInnerMat = new THREE.MeshPhysicalMaterial(holoInnerMatOpt);

  function roundRectPath(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    var pi = Math.PI;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arc(x + w - r, y + r, r, -pi / 2, 0);
    ctx.lineTo(x + w, y + h - r);
    ctx.arc(x + w - r, y + h - r, r, 0, pi / 2);
    ctx.lineTo(x + r, y + h);
    ctx.arc(x + r, y + h - r, r, pi / 2, pi);
    ctx.lineTo(x, y + r);
    ctx.arc(x + r, y + r, r, pi, -pi / 2);
  }

  function buildCardFaceTexture(imageTexture, name) {
    var scale = 10;
    var w = Math.round(cardW * scale);
    var h = Math.round(contentH * scale);
    var imgH = Math.round(imageSize * scale);
    var barH = Math.round(middleBarH * scale);
    var ledH = Math.round(ledHeight * scale);
    var r = cornerRadius * scale;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');

    if (imageTexture && imageTexture.image && imageTexture.image.complete) {
      var img = imageTexture.image;
      var iw = img.naturalWidth || img.width;
      var ih = img.naturalHeight || img.height;
      var slotW = w, slotH = imgH;
      var slotAspect = slotW / slotH;
      var srcAspect = iw / ih;
      var drawW = slotW, drawH = slotH;
      if (srcAspect > slotAspect) drawH = slotW / srcAspect;
      else drawW = slotH * srcAspect;
      var dx = (slotW - drawW) / 2, dy = (slotH - drawH) / 2;
      ctx.save();
      ctx.beginPath();
      roundRectPath(ctx, 0, 0, w, imgH, r);
      ctx.clip();
      ctx.drawImage(img, 0, 0, iw, ih, dx, dy, drawW, drawH);
      ctx.restore();
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.beginPath();
      roundRectPath(ctx, 0, 0, w, imgH, r);
      ctx.fill();
    }

    var barY = imgH;
    ctx.fillStyle = '#0d0510';
    ctx.fillRect(0, barY, w, barH);
    ctx.fillStyle = '#FF6FB0';
    ctx.globalAlpha = 0.12;
    ctx.fillRect(0, barY, w, barH);
    ctx.globalAlpha = 1;

    var ledY = imgH + barH;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, ledY, w, ledH);
    var pad = Math.round(14 * (ledH / 200));
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(pad, ledY + pad, w - pad * 2, ledH - pad * 2);
    ctx.strokeStyle = '#FF6FB0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(pad + 2, ledY + pad + 2, w - pad * 2 - 4, ledH - pad * 2 - 4);
    ctx.shadowColor = '#FF6FB0';
    ctx.shadowBlur = 14;
    ctx.font = 'bold ' + Math.round(72 * (ledHeight / 20) * scale / 10) + 'px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FF6FB0';
    ctx.fillText(String(name || '').toUpperCase(), w / 2, ledY + ledH / 2);
    ctx.shadowBlur = 0;

    var tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    if (tex.colorSpace !== undefined) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  const innerBevelInset = 0.6;
  const innerBevelScale = 0.72;

  function makeRectangularMedallion(faceTex, rimMat, innerRimMat) {
    var frontMat = matFace(faceTex, false, false);
    var backMat = matFace(faceTex, false, false);
    var edgeMat = rimMat || matEdge();
    var innerMat = innerRimMat || edgeMat;
    var group = new THREE.Group();
    var halfT = thickness / 2;
    var halfW = outerW / 2;
    var halfH = outerH / 2;

    var sideLeft = new THREE.Mesh(new THREE.PlaneGeometry(thickness, outerH), edgeMat);
    sideLeft.position.set(-halfW, 0, 0);
    sideLeft.rotation.y = -Math.PI / 2;
    sideLeft.castShadow = true;
    group.add(sideLeft);
    var sideRight = new THREE.Mesh(new THREE.PlaneGeometry(thickness, outerH), edgeMat);
    sideRight.position.set(halfW, 0, 0);
    sideRight.rotation.y = Math.PI / 2;
    sideRight.castShadow = true;
    group.add(sideRight);
    var sideTop = new THREE.Mesh(new THREE.PlaneGeometry(outerW, thickness), edgeMat);
    sideTop.position.set(0, halfH, 0);
    sideTop.rotation.x = -Math.PI / 2;
    group.add(sideTop);
    var sideBottom = new THREE.Mesh(new THREE.PlaneGeometry(outerW, thickness), edgeMat);
    sideBottom.position.set(0, -halfH, 0);
    sideBottom.rotation.x = Math.PI / 2;
    group.add(sideBottom);

    var frontFace = new THREE.Mesh(new THREE.PlaneGeometry(cardW, contentH), frontMat);
    frontFace.position.set(0, 0, halfT);
    frontFace.castShadow = true;
    group.add(frontFace);

    var bevelZ = halfT + 0.3;
    var topBevel = new THREE.Mesh(new THREE.PlaneGeometry(outerW, bevelW), edgeMat);
    topBevel.position.set(0, halfH - bevelW / 2, bevelZ);
    group.add(topBevel);
    var bottomBevel = new THREE.Mesh(new THREE.PlaneGeometry(outerW, bevelW), edgeMat);
    bottomBevel.position.set(0, -halfH + bevelW / 2, bevelZ);
    group.add(bottomBevel);
    var leftBevel = new THREE.Mesh(new THREE.PlaneGeometry(bevelW, outerH), edgeMat);
    leftBevel.position.set(-halfW + bevelW / 2, 0, bevelZ);
    group.add(leftBevel);
    var rightBevel = new THREE.Mesh(new THREE.PlaneGeometry(bevelW, outerH), edgeMat);
    rightBevel.position.set(halfW - bevelW / 2, 0, bevelZ);
    group.add(rightBevel);

    var innerW = outerW - innerBevelInset * 2;
    var innerH = outerH - innerBevelInset * 2;
    var innerBw = bevelW * innerBevelScale;
    var innerZ = bevelZ + 0.06;
    var innerTopY = halfH - bevelW / 2 - innerBevelInset;
    var innerBottomY = -halfH + bevelW / 2 + innerBevelInset;
    var innerLeftX = -halfW + bevelW / 2 + innerBevelInset;
    var innerRightX = halfW - bevelW / 2 - innerBevelInset;
    var innerTop = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerBw), innerMat);
    innerTop.position.set(0, innerTopY, innerZ);
    group.add(innerTop);
    var innerBottom = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerBw), innerMat);
    innerBottom.position.set(0, innerBottomY, innerZ);
    group.add(innerBottom);
    var innerLeft = new THREE.Mesh(new THREE.PlaneGeometry(innerBw, innerH), innerMat);
    innerLeft.position.set(innerLeftX, 0, innerZ);
    group.add(innerLeft);
    var innerRight = new THREE.Mesh(new THREE.PlaneGeometry(innerBw, innerH), innerMat);
    innerRight.position.set(innerRightX, 0, innerZ);
    group.add(innerRight);

    var backFace = new THREE.Mesh(new THREE.PlaneGeometry(cardW, contentH), backMat);
    backFace.position.set(0, 0, -halfT);
    backFace.rotation.y = Math.PI;
    backFace.castShadow = true;
    group.add(backFace);

    var backBevelZ = -halfT - 0.3;
    var topBevelBack = new THREE.Mesh(new THREE.PlaneGeometry(outerW, bevelW), edgeMat);
    topBevelBack.position.set(0, halfH - bevelW / 2, backBevelZ);
    topBevelBack.rotation.y = Math.PI;
    group.add(topBevelBack);
    var bottomBevelBack = new THREE.Mesh(new THREE.PlaneGeometry(outerW, bevelW), edgeMat);
    bottomBevelBack.position.set(0, -halfH + bevelW / 2, backBevelZ);
    bottomBevelBack.rotation.y = Math.PI;
    group.add(bottomBevelBack);
    var leftBevelBack = new THREE.Mesh(new THREE.PlaneGeometry(bevelW, outerH), edgeMat);
    leftBevelBack.position.set(-halfW + bevelW / 2, 0, backBevelZ);
    leftBevelBack.rotation.y = Math.PI;
    group.add(leftBevelBack);
    var rightBevelBack = new THREE.Mesh(new THREE.PlaneGeometry(bevelW, outerH), edgeMat);
    rightBevelBack.position.set(halfW - bevelW / 2, 0, backBevelZ);
    rightBevelBack.rotation.y = Math.PI;
    group.add(rightBevelBack);

    var backInnerZ = -halfT - 0.36;
    var innerTopBack = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerBw), innerMat);
    innerTopBack.position.set(0, innerTopY, backInnerZ);
    innerTopBack.rotation.y = Math.PI;
    group.add(innerTopBack);
    var innerBottomBack = new THREE.Mesh(new THREE.PlaneGeometry(innerW, innerBw), innerMat);
    innerBottomBack.position.set(0, innerBottomY, backInnerZ);
    innerBottomBack.rotation.y = Math.PI;
    group.add(innerBottomBack);
    var innerLeftBack = new THREE.Mesh(new THREE.PlaneGeometry(innerBw, innerH), innerMat);
    innerLeftBack.position.set(innerLeftX, 0, backInnerZ);
    innerLeftBack.rotation.y = Math.PI;
    group.add(innerLeftBack);
    var innerRightBack = new THREE.Mesh(new THREE.PlaneGeometry(innerBw, innerH), innerMat);
    innerRightBack.position.set(innerRightX, 0, backInnerZ);
    innerRightBack.rotation.y = Math.PI;
    group.add(innerRightBack);

    group.userData.rimMat = edgeMat;
    group.userData.innerMat = innerMat;
    group.scale.set(3, 3, 3);
    return group;
  }

  const COIN_SPIN_SLOW = 0.12;
  const COIN_SPIN_FAST = 1.05;
  const PARALLAX_STRENGTH = 0.2;
  const CLOSEUP_PARALLAX_STRENGTH = 0.55;

  var heroCardsGroup = new THREE.Group();
  heroCardsGroup.position.set(0, 0, 0);
  heroCardsGroup.frustumCulled = false;
  carousel.add(heroCardsGroup);
  window.paradeHeroCardsGroup = heroCardsGroup;

  var pointerNx = 0, pointerNy = 0;
  var pointerLerp = 0.12;
  var closeupRotationX = 0, closeupRotationY = 0;
  var dragStartCloseupRotX, dragStartCloseupRotY;
  var el = renderer.domElement;
  var carouselHovered = false;
  el.addEventListener('mouseenter', function () { carouselHovered = true; });
  el.addEventListener('mouseleave', function () { carouselHovered = false; });

  function returnCardToCarousel(card) {
    if (!card || !card.userData || card.userData.index === undefined) return;
    if (card.parent === closeupGroup) closeupGroup.remove(card);
    heroCardsGroup.add(card);
    var i = card.userData.index;
    var numCards = imageList.length;
    var angle = (i / Math.max(1, numCards)) * Math.PI * 2;
    card.position.set(carouselRadius * Math.sin(angle), medallionCenterY, carouselRadius * Math.cos(angle));
    card.rotation.order = 'YXZ';
    card.rotation.x = 0;
    card.rotation.y = angle;
    card.rotation.z = 0;
    card.userData.baseRotationY = angle;
    card.userData.facingCamera = false;
    card.userData.spinStartTime = undefined;
    card.scale.set(SILHOUETTE_SCALE, SILHOUETTE_SCALE, SILHOUETTE_SCALE);
  }

  var closeupBack = document.getElementById('closeup-back');
  if (closeupBack) closeupBack.addEventListener('click', function () {
    if (selectedCard) returnCardToCarousel(selectedCard);
    selectedCard = null;
    closeupRotationX = 0;
    closeupRotationY = 0;
  });

  function onPointerMove(clientX, clientY) {
    var rect = el.getBoundingClientRect();
    var nx = (clientX - rect.left) / Math.max(1, rect.width);
    var ny = (clientY - rect.top) / Math.max(1, rect.height);
    var targetNx = (nx - 0.5) * 2;
    var targetNy = -((ny - 0.5) * 2);
    pointerNx += (targetNx - pointerNx) * pointerLerp;
    pointerNy += (targetNy - pointerNy) * pointerLerp;
  }

  el.addEventListener('mousemove', function (e) { onPointerMove(e.clientX, e.clientY); });
  el.addEventListener('touchmove', function (e) {
    if (e.touches.length) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  const loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  var loaded = 0;
  var n = PARADE_ENABLE_CAROUSEL ? imageList.length : 0;

  function runAnimation() {
    var s = getSize();
    var w = s.w, h = s.h;
    if (w && h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      composer.setSize(w, h);
      composer.setPixelRatio(Math.min(window.devicePixelRatio, w < 768 ? 1.5 : 2));
      bloomPass.resolution.set(w, h);
    }
    updateLayout();

    var lastTime = performance.now();
    var globeSwingAngle = 0;
    var globeSwingDir = 1;
    var lastGlobeScreensGap = -1;
    var lastGlobeScreensSeparation = -1;
    function map1_10(v, min, max) {
      v = typeof v === 'number' ? v : 5;
      v = Math.max(1, Math.min(10, v));
      return min + (v - 1) / 9 * (max - min);
    }
    function map1_20(v, min, max) {
      v = typeof v === 'number' ? v : 10;
      v = Math.max(1, Math.min(20, v));
      return min + (v - 1) / 19 * (max - min);
    }
    function animate() {
      requestAnimationFrame(animate);
      var now = performance.now();
      var uTimeSec = now * 0.001;
      var delta = (now - lastTime) / 1000;
      lastTime = now;
      delta = Math.min(delta, 0.1);

      if (window.paradeHolographicMaterials) {
        for (var hi = 0; hi < window.paradeHolographicMaterials.length; hi++) {
          var hm = window.paradeHolographicMaterials[hi];
          if (hm.uniforms && hm.uniforms.uTime) hm.uniforms.uTime.value = uTimeSec;
          if (hm.uniforms && hm.uniforms.uColor) {
            var carouselHex = (window.heroCarouselControls || {}).carouselColorHex || (window.heroCarouselControls || {}).carouselColor;
            if (carouselHex) {
              var carouselColor = new THREE.Color(typeof carouselHex === 'number' ? carouselHex : carouselHex);
              hm.uniforms.uColor.value.set(carouselColor.r, carouselColor.g, carouselColor.b);
            }
          }
        }
      }
      if (window.paradeDustMaterial && window.paradeDustMaterial.uniforms.uTime) {
        window.paradeDustMaterial.uniforms.uTime.value = uTimeSec;
        var ctrl = window.heroCarouselControls || {};
        if (window.paradeDustMaterial.uniforms.uLuminosity) {
          var baseLum = map1_20(ctrl.particlesLum, 0, 2);
          var bloomMult = 0.5 + 0.5 * map1_10(ctrl.particlesBloom != null ? ctrl.particlesBloom : 5, 0, 2);
          window.paradeDustMaterial.uniforms.uLuminosity.value = baseLum * bloomMult;
        }
        if (window.paradeDustMaterial.uniforms.uParticleSizeScale) window.paradeDustMaterial.uniforms.uParticleSizeScale.value = map1_20(ctrl.particlesSize, 0.2, 2);
        if (window.paradeDustMaterial.uniforms.uColorTint) {
          var hexVal = ctrl.particlesColorHex || ctrl.particlesColor || '#ffffff';
          var color = new THREE.Color(typeof hexVal === 'number' ? hexVal : hexVal);
          window.paradeDustMaterial.uniforms.uColorTint.value.set(color.r, color.g, color.b);
        }
      }
      if (window.paradeDustPoints) {
        var ctrl = window.heroCarouselControls || {};
        var maxCount = window.paradeDustMaxCount != null ? window.paradeDustMaxCount : 5000;
        var mult = map1_20(ctrl.particlesMult, 0.25, 2);
        if (window.paradeDustPoints.geometry.setDrawRange) window.paradeDustPoints.geometry.setDrawRange(0, Math.round(maxCount * mult));
        window.paradeDustPoints.visible = ctrl.particlesVisible !== false;
        var spinSpeed = map1_10(ctrl.particlesSpinSpeed, 0, 0.3);
        var spinDir = (ctrl.particlesSpinDir === -1 || ctrl.particlesSpinDir === 'CCW') ? -1 : 1;
        window.paradeDustPoints.rotation.y += spinSpeed * spinDir * delta;
      }

      var orbitT = 1 - Math.exp(-ORBIT_SMOOTH * delta);
      orbitAngleH += (orbitAngleHTarget - orbitAngleH) * orbitT;
      orbitAngleV += (orbitAngleVTarget - orbitAngleV) * orbitT;
      orbitAngleH = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, orbitAngleH));
      orbitAngleV = Math.max(-ORBIT_LIMIT_V, Math.min(ORBIT_LIMIT_V, orbitAngleV));

      holoHighlightLight.position.x = 420 * Math.sin(uTimeSec * 0.22);
      holoHighlightLight.position.y = medallionCenterY;
      holoHighlightLight.position.z = 420 * Math.cos(uTimeSec * 0.22);
      holoAccentLight.position.x = 420 * Math.sin(uTimeSec * 0.22 + Math.PI);
      holoAccentLight.position.y = medallionCenterY;
      holoAccentLight.position.z = 420 * Math.cos(uTimeSec * 0.22 + Math.PI);

      updateLayout();
      var closeupDist = defaultCameraDist * 0.4;
      if (selectedCard) {
        currentCameraDist += (closeupDist - currentCameraDist) * 0.06;
      } else {
        currentCameraDist += (defaultCameraDist - currentCameraDist) * 0.06;
      }

      if (PARADE_ENABLE_CAROUSEL && window.paradeHeroCardsGroup) {
        var ctrl = window.heroCarouselControls || {};
        window.paradeHeroCardsGroup.visible = ctrl.carouselVisible !== false;
        var spinSpeed = map1_10(ctrl.spinSpeed, 0, 0.3);
        var spinDir = (ctrl.spinDir === -1 || ctrl.spinDir === 'CCW') ? -1 : 1;
        window.paradeHeroCardsGroup.rotation.y += spinSpeed * spinDir * delta;
        if (selectedCard && selectedCard.parent !== closeupGroup) {
          heroCardsGroup.remove(selectedCard);
          closeupGroup.add(selectedCard);
          selectedCard.position.set(0, 0, 0);
          selectedCard.rotation.set(0, 0, 0);
          var closeupScale = SILHOUETTE_SCALE * 20;
          selectedCard.scale.set(closeupScale, closeupScale, closeupScale);
        }
        var cards = window.paradeHeroCardsGroup.children;
        var cardWorldPos = paradeCardWorldPos;
        var dirToCam = paradeDirToCam;
        var dirToCard = paradeDirToCard;
        var frontCardPos = paradeFrontCardPos;
        var SPIN_DUR = 0.6;
        var bestDot = 0;
        for (var i = 0; i < cards.length; i++) {
          var card = cards[i];
          if (card.userData && card.userData.index === undefined) continue;
          card.rotation.order = 'YXZ';
          var faceOn = Math.abs(Math.cos(card.rotation.y));
          var t2 = 1 - faceOn;
          var speed = COIN_SPIN_SLOW + (COIN_SPIN_FAST - COIN_SPIN_SLOW) * t2;
          var baseY = (card.userData.baseRotationY !== undefined ? card.userData.baseRotationY : card.rotation.y) + speed * delta;
          card.userData.baseRotationY = baseY;
          card.getWorldPosition(cardWorldPos);
          dirToCard.copy(cardWorldPos).normalize();
          dirToCam.copy(camera.position).normalize();
          var dot = dirToCard.dot(dirToCam);
          if (dot > 0.5 && dot > bestDot) {
            bestDot = dot;
            frontCardPos.copy(cardWorldPos);
          }
          if (dot > 0.5) {
            if (!card.userData.facingCamera) {
              if (card.userData.spinStartTime === undefined) {
                card.userData.spinStartTime = now;
                card.userData.spinStartY = card.rotation.y;
              }
              var t = (now - card.userData.spinStartTime) / 1000 / SPIN_DUR;
              if (t >= 1) {
                card.userData.facingCamera = true;
                card.userData.spinStartTime = undefined;
                card.lookAt(camera.position);
              } else {
                card.rotation.y = card.userData.spinStartY + Math.PI * 2 * t;
                card.rotation.x = pointerNy * PARALLAX_STRENGTH;
              }
              // Parallax layers: only in closeup; carousel view keeps layers flat
              if (card.userData.parallaxLayers) {
                var layers = card.userData.parallaxLayers;
                for (var li = 0; li < layers.length; li++) {
                  layers[li].rotation.x = 0;
                  layers[li].rotation.y = 0;
                }
              }
            } else {
              card.lookAt(camera.position);
              card.rotation.x += Math.sin(uTimeSec * 8) * 0.02;
              card.rotation.z += Math.sin(uTimeSec * 6 + 1) * 0.015;
            }
            // Parallax layers: only in closeup
            if (card.userData.parallaxLayers) {
              var layers = card.userData.parallaxLayers;
              for (var li = 0; li < layers.length; li++) {
                layers[li].rotation.x = 0;
                layers[li].rotation.y = 0;
              }
            }
          } else {
            card.userData.facingCamera = false;
            card.userData.spinStartTime = undefined;
            card.rotation.x = pointerNy * PARALLAX_STRENGTH;
            card.rotation.y = baseY + pointerNx * PARALLAX_STRENGTH;
          }
          // Parallax layers: only in closeup; carousel view keeps layers flat
          if (card.userData.parallaxLayers) {
            var layers = card.userData.parallaxLayers;
            for (var li = 0; li < layers.length; li++) {
              layers[li].rotation.x = 0;
              layers[li].rotation.y = 0;
            }
          }
        }
        if (selectedCard) {
          closeupCenterWorld.set(0, medallionCenterY, 0);
          carousel.localToWorld(closeupCenterWorld);
          closeupGroup.position.copy(closeupCenterWorld);
          lookAtFrontCard.copy(closeupGroup.position);
          frontCardLight.position.copy(closeupGroup.position);
          frontCardLight.intensity = 3;
          closeupFillLight.position.copy(camera.position);
          closeupFillLight.target.position.copy(closeupGroup.position);
          closeupFillLight.intensity = 1;
          if (selectedCard.parent === closeupGroup) {
            selectedCard.lookAt(camera.position);
            selectedCard.rotation.x += closeupRotationX + pointerNy * CLOSEUP_PARALLAX_STRENGTH;
            selectedCard.rotation.y += closeupRotationY + pointerNx * CLOSEUP_PARALLAX_STRENGTH;
            selectedCard.rotation.z = Math.sin(uTimeSec * 6) * 0.012;
            if (selectedCard.userData.parallaxLayers) {
              var layers = selectedCard.userData.parallaxLayers;
              var closeupDepthFactor = 0.4;
              for (var li = 0; li < layers.length; li++) {
                var layer = layers[li];
                var d = (layer.userData && layer.userData.parallaxDepth !== undefined) ? layer.userData.parallaxDepth : 0.5;
                var f = closeupDepthFactor + d * (1 - closeupDepthFactor);
                layer.rotation.x = pointerNy * CLOSEUP_PARALLAX_STRENGTH * f;
                layer.rotation.y = pointerNx * CLOSEUP_PARALLAX_STRENGTH * f;
              }
            }
          }
        } else {
          frontCardLight.intensity = 0;
          closeupFillLight.intensity = 0;
        }
      } else {
        frontCardLight.intensity = 0;
        closeupFillLight.intensity = 0;
      }

      var ctrlUI = window.heroCarouselControls || {};
      var cz = ctrlUI.cameraZoom != null ? ctrlUI.cameraZoom : 5;
      currentCameraDist = zoomMin + (10 - Math.max(1, Math.min(10, cz))) / 9 * (zoomMax - zoomMin);
      if (window.paradeRingMedallions) {
        window.paradeRingMedallions.visible = ctrlUI.medallionsVisible !== false;
        var ms = map1_10(ctrlUI.medallionsScale, 0.5, 2);
        var children = window.paradeRingMedallions.children;
        for (var c = 0; c < children.length; c++) children[c].scale.setScalar(ms);
        var mspin = map1_10(ctrlUI.medallionsSpinSpeed, 0, 0.6);
        window.paradeRingMedallions.rotation.y += mspin * delta;
        var medColorHex = ctrlUI.medallionsColorHex || ctrlUI.medallionsColor;
        if (medColorHex && window.paradeRingMedallions.traverse) {
          var medColor = new THREE.Color(typeof medColorHex === 'number' ? medColorHex : medColorHex);
          var bloomMult = 1 + map1_10(ctrlUI.medallionsBloom != null ? ctrlUI.medallionsBloom : 5, 0, 0.6);
          window.paradeRingMedallions.traverse(function (o) {
            if (o.material && o.material.color) {
              o.material.color.copy(medColor).multiplyScalar(bloomMult);
            }
          });
        }
      }
      if (window.paradeInnerSphere) {
        window.paradeInnerSphere.visible = (ctrlUI.innerSphereVisible !== false);
        var isColorHex = ctrlUI.innerSphereColorHex || ctrlUI.innerSphereColor;
        if (isColorHex && window.paradeInnerSphere.material && window.paradeInnerSphere.material.color) {
          window.paradeInnerSphere.material.color.set(typeof isColorHex === 'number' ? isColorHex : isColorHex);
          var innerBloomMult = 1 + map1_10(ctrlUI.innerSphereBloom != null ? ctrlUI.innerSphereBloom : 5, 0, 0.5);
          window.paradeInnerSphere.material.color.multiplyScalar(innerBloomMult);
        }
      }
      if (window.paradeGlobeScreens) {
        window.paradeGlobeScreens.visible = (ctrlUI.globeScreensVisible === true);
        var gsGap = map1_10(ctrlUI.globeScreensScreenSize != null ? ctrlUI.globeScreensScreenSize : 10, 0.3, 1.8);
        if (window.updateGlobeScreensGap && gsGap !== lastGlobeScreensGap) {
          lastGlobeScreensGap = gsGap;
          window.updateGlobeScreensGap(gsGap);
        }
        var gsSep = map1_10(ctrlUI.globeScreensSeparation != null ? ctrlUI.globeScreensSeparation : 5, 0, 0.2);
        if (window.updateGlobeScreensSeparation && gsSep !== lastGlobeScreensSeparation) {
          lastGlobeScreensSeparation = gsSep;
          window.updateGlobeScreensSeparation(gsSep);
        }
        var gsSize = map1_10(ctrlUI.globeScreensDiameter != null ? ctrlUI.globeScreensDiameter : 3, 0.5, 4);
        window.paradeGlobeScreens.scale.setScalar(gsSize);
        var gsLum = map1_10(ctrlUI.globeScreensLum, 0, 1);
        if (window.paradeGlobeScreenMaterials) {
          for (var mi = 0; mi < window.paradeGlobeScreenMaterials.length; mi++) {
            window.paradeGlobeScreenMaterials[mi].opacity = gsLum;
            var gsColorHex = ctrlUI.globeScreensColorHex || ctrlUI.globeScreensColor;
            if (gsColorHex && window.paradeGlobeScreenMaterials[mi].color) {
              window.paradeGlobeScreenMaterials[mi].color.set(typeof gsColorHex === 'number' ? gsColorHex : gsColorHex);
              var globeBloomMult = 1 + map1_10(ctrlUI.globeScreensBloom != null ? ctrlUI.globeScreensBloom : 5, 0, 0.5);
              window.paradeGlobeScreenMaterials[mi].color.multiplyScalar(globeBloomMult);
            }
          }
        }
        var gsSpin = map1_10(ctrlUI.globeScreensSpin, 0, 0.02);
        var limitRad = 20 * Math.PI / 180;
        var step = gsSpin * delta * globeSwingDir;
        var maxStep = 0.5 * Math.PI / 180;
        if (Math.abs(step) > maxStep) step = step > 0 ? maxStep : -maxStep;
        globeSwingAngle += step;
        if (globeSwingAngle >= limitRad) { globeSwingAngle = limitRad; globeSwingDir = -1; }
        if (globeSwingAngle <= -limitRad) { globeSwingAngle = -limitRad; globeSwingDir = 1; }
        window.paradeGlobeScreens.rotation.y = globeSwingAngle;
      }

      var closeupOverlay = document.getElementById('closeup-overlay');
      var closeupNameEl = document.getElementById('closeup-card-name');
      if (closeupOverlay && closeupNameEl) {
        if (selectedCard) {
          closeupOverlay.classList.add('show');
          closeupOverlay.setAttribute('aria-hidden', 'false');
          var idx = selectedCard.userData && selectedCard.userData.index;
          closeupNameEl.textContent = (typeof idx === 'number' && imageList[idx]) ? imageList[idx].name : 'Card';
        } else {
          closeupOverlay.classList.remove('show');
          closeupOverlay.setAttribute('aria-hidden', 'true');
        }
      }

      bloomPass.enabled = (ctrlUI.bloomEnabled !== false);
      if (bloomPass.enabled) {
        var bl = map1_10(ctrlUI.bloomLevel, 0.15, 1.0);
        bloomPass.strength = selectedCard ? 0.15 : bl;
        bloomPass.radius = selectedCard ? 0.15 : map1_10(ctrlUI.bloomLevel, 0.2, 0.6);
        bloomPass.threshold = selectedCard ? 0.4 : 0.2;
      } else {
        bloomPass.strength = 0;
        bloomPass.radius = 0;
        bloomPass.threshold = 1;
      }

      applyOrbitCamera();
      composer.render();
    }
    animate();
  }

  function tryRunAnimation() {
    if (loaded === n) {
      if (PARADE_ENABLE_CAROUSEL && heroCardsGroup.children.length === 0) {
        var fallback = new THREE.Mesh(
          new THREE.PlaneGeometry(40, 40),
          new THREE.MeshBasicMaterial({ color: edgeColor })
        );
        fallback.position.set(0, medallionCenterY, 0);
        fallback.renderOrder = 1000;
        heroCardsGroup.add(fallback);
      }
      runAnimation();
    }
  }

  function addSilhouetteCard(frontTex, rearTex, outlineData, item, i) {
    try {
      var mesh = makeSilhouetteCard(frontTex, rearTex, outlineData);
      mesh.userData.name = item.name || '';
      mesh.userData.index = i;
      var angle = (i / n) * Math.PI * 2;
      var x = carouselRadius * Math.sin(angle);
      var z = carouselRadius * Math.cos(angle);
      mesh.position.set(x, medallionCenterY, z);
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = angle;
      mesh.userData.baseRotationY = angle;
      heroCardsGroup.add(mesh);
    } catch (err) {
      console.warn('Silhouette card failed:', item.name, err);
    }
    loaded++;
    tryRunAnimation();
  }

  function addParallaxCard(cardFaceTex, characterTex, rearTex, outlineData, item, i) {
    try {
      var mesh = makeParallaxCard(cardFaceTex, characterTex, rearTex, outlineData);
      mesh.userData.name = item.name || '';
      mesh.userData.index = i;
      var angle = (i / n) * Math.PI * 2;
      var x = carouselRadius * Math.sin(angle);
      var z = carouselRadius * Math.cos(angle);
      mesh.position.set(x, medallionCenterY, z);
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = angle;
      mesh.userData.baseRotationY = angle;
      heroCardsGroup.add(mesh);
    } catch (err) {
      console.warn('Parallax card failed:', item.name, err);
    }
    loaded++;
    tryRunAnimation();
  }

  if (PARADE_ENABLE_CAROUSEL) {
  loader.load(encodeURI(rearImageUrl), function (rearTex) {
    rearTex.needsUpdate = true;
    imageList.forEach(function (item, i) {
      var url = encodeURI(item.url || item.png || item.jpg);
      var name = (item.name || '').toLowerCase();
      var useParallax = PARALLAX_CARD_NAMES.indexOf(item.name) >= 0;
      var cardFaceFile = (useParallax && item.parallaxCardFace) ? item.parallaxCardFace : 'card-face.png';
      var characterFile = (useParallax && item.parallaxCharacter) ? item.parallaxCharacter : 'character.png';
      var cardFaceUrl = useParallax ? ('assets/cards/' + name + '/' + cardFaceFile) : '';
      var characterUrl = useParallax ? ('assets/cards/' + name + '/' + characterFile) : '';

      if (useParallax && cardFaceUrl && characterUrl) {
        var pending = 2;
        var cardFaceTex = null;
        var characterTex = null;
        var fallbackDone = false;
        function maybeAddParallax() {
          if (cardFaceTex && characterTex) {
            var basename = (item.url || item.png || item.jpg).split('/').pop().replace(/\.png$/i, '');
            var outlinePath = 'assets/outlines/' + basename + '.outline.json';
            fetch(encodeURI(outlinePath))
              .then(function (r) { return r.ok ? r.json() : null; })
              .then(function (outlineData) {
                addParallaxCard(cardFaceTex, characterTex, rearTex, outlineData, item, i);
              })
              .catch(function () {
                addParallaxCard(cardFaceTex, characterTex, rearTex, null, item, i);
              });
            return;
          }
          if (pending === 0 && !fallbackDone) {
            fallbackDone = true;
            if (!url) { loaded++; tryRunAnimation(); return; }
            loader.load(url, function (tex) {
              tex.needsUpdate = true;
              var basename = (item.url || item.png || item.jpg).split('/').pop().replace(/\.png$/i, '');
              fetch(encodeURI('assets/outlines/' + basename + '.outline.json'))
                .then(function (r) { return r.ok ? r.json() : null; })
                .then(function (outlineData) { addSilhouetteCard(tex, rearTex, outlineData, item, i); })
                .catch(function () { addSilhouetteCard(tex, rearTex, null, item, i); });
            }, undefined, function () { loaded++; tryRunAnimation(); });
          }
        }
        loader.load(encodeURI(cardFaceUrl), function (tex) {
          tex.needsUpdate = true;
          cardFaceTex = tex;
          maybeAddParallax();
        }, undefined, function () {
          pending--;
          maybeAddParallax();
        });
        loader.load(encodeURI(characterUrl), function (tex) {
          tex.needsUpdate = true;
          characterTex = tex;
          maybeAddParallax();
        }, undefined, function () {
          pending--;
          maybeAddParallax();
        });
        return;
      }

      if (!url) {
        loaded++;
        tryRunAnimation();
        return;
      }
      loader.load(url, function (tex) {
        tex.needsUpdate = true;
        var basename = (item.url || item.png || item.jpg).split('/').pop().replace(/\.png$/i, '');
        var outlinePath = 'assets/outlines/' + basename + '.outline.json';
        fetch(encodeURI(outlinePath))
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (outlineData) {
            addSilhouetteCard(tex, rearTex, outlineData, item, i);
          })
          .catch(function () {
            addSilhouetteCard(tex, rearTex, null, item, i);
          });
      }, undefined, function () {
        loaded++;
        tryRunAnimation();
      });
    });
  }, undefined, function () {
    console.warn('Rear texture failed, using fallback');
    var canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, 512, 512);
    var rearTex = new THREE.CanvasTexture(canvas);
    rearTex.needsUpdate = true;
    imageList.forEach(function (item, i) {
      var url = encodeURI(item.url || item.png || item.jpg);
      if (!url) { loaded++; tryRunAnimation(); return; }
      loader.load(url, function (tex) {
        tex.needsUpdate = true;
        var basename = (item.url || item.png || item.jpg).split('/').pop().replace(/\.png$/i, '');
        fetch(encodeURI('assets/outlines/' + basename + '.outline.json'))
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (outlineData) { addSilhouetteCard(tex, rearTex, outlineData, item, i); })
          .catch(function () { addSilhouetteCard(tex, rearTex, null, item, i); });
      }, undefined, function () { loaded++; tryRunAnimation(); });
    });
  });
  } else {
    tryRunAnimation();
  }

  function onWheel(e) {
    e.preventDefault();
    var dy = typeof e.deltaY !== 'undefined' ? e.deltaY : -(e.wheelDelta || 0) / 3;
    var step = dy > 0 ? 1 : -1;
    var amount = Math.abs(dy) < 100 ? 400 : Math.min(1200, Math.abs(dy) * 2);
    currentCameraDist = Math.max(zoomMin, Math.min(zoomMax, currentCameraDist + step * amount));
  }
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });

  function getCardAtScreenPos(clientX, clientY) {
    var group = window.paradeHeroCardsGroup;
    if (!group || !group.children.length) return null;
    var rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1;
    mouse.y = -((clientY - rect.top) / Math.max(1, rect.height)) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    var hits = raycaster.intersectObjects(group.children, true);
    if (!hits.length) return null;
    var obj = hits[0].object;
    while (obj) {
      if (obj.userData && obj.userData.index !== undefined) return obj;
      obj = obj.parent;
    }
    return null;
  }

  var CLICK_THRESHOLD = 8;
  renderer.domElement.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    el.focus();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    dragStartOrbitH = orbitAngleHTarget;
    dragStartOrbitV = orbitAngleVTarget;
    if (selectedCard) {
      dragStartCloseupRotX = closeupRotationX;
      dragStartCloseupRotY = closeupRotationY;
    }
    mousedownHitCard = getCardAtScreenPos(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', function (e) {
    if (!isDragging) return;
    if (selectedCard) {
      closeupRotationX = dragStartCloseupRotX - (e.clientY - dragStartY) * 0.005;
      closeupRotationY = dragStartCloseupRotY + (e.clientX - dragStartX) * 0.005;
      closeupRotationX = Math.max(-CLOSEUP_ORBIT_LIMIT_V, Math.min(CLOSEUP_ORBIT_LIMIT_V, closeupRotationX));
      closeupRotationY = Math.max(-CLOSEUP_ORBIT_LIMIT_H, Math.min(CLOSEUP_ORBIT_LIMIT_H, closeupRotationY));
      return;
    }
    orbitAngleHTarget = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, dragStartOrbitH + (e.clientX - dragStartX) * 0.002));
    orbitAngleVTarget = Math.max(-ORBIT_LIMIT_V, Math.min(ORBIT_LIMIT_V, dragStartOrbitV - (e.clientY - dragStartY) * 0.002));
  });
  window.addEventListener('mouseup', function (e) {
    if (e.button === 0) {
      var dx = e.clientX - dragStartX;
      var dy = e.clientY - dragStartY;
      if (Math.hypot(dx, dy) < CLICK_THRESHOLD) {
        if (mousedownHitCard) selectedCard = mousedownHitCard;
        else {
          if (selectedCard) returnCardToCarousel(selectedCard);
          selectedCard = null;
          closeupRotationX = 0;
          closeupRotationY = 0;
        }
      }
      mousedownHitCard = null;
    }
    isDragging = false;
  });

  function getTouchClient(e) {
    if (e.touches && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return null;
  }
  function pinchDistance(e) {
    if (e.touches && e.touches.length >= 2) {
      var dx = e.touches[1].clientX - e.touches[0].clientX;
      var dy = e.touches[1].clientY - e.touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }
    return null;
  }
  el.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      lastPinchDist = pinchDistance(e);
      isDragging = false;
      return;
    }
    if (e.touches.length !== 1) return;
    e.preventDefault();
    var t = getTouchClient(e);
    if (t) {
      isDragging = true;
      lastPinchDist = null;
      dragStartX = t.x;
      dragStartY = t.y;
      dragStartOrbitH = orbitAngleHTarget;
      dragStartOrbitV = orbitAngleVTarget;
      if (selectedCard) {
        dragStartCloseupRotX = closeupRotationX;
        dragStartCloseupRotY = closeupRotationY;
      }
      touchStartHitCard = getCardAtScreenPos(t.x, t.y);
    }
  }, { passive: false });
  el.addEventListener('touchmove', function (e) {
    if (e.touches.length === 2) {
      e.preventDefault();
      var d = pinchDistance(e);
      if (d !== null && lastPinchDist !== null) {
        currentCameraDist -= (d - lastPinchDist) * PINCH_ZOOM_SENSITIVITY;
        currentCameraDist = Math.max(zoomMin, Math.min(zoomMax, currentCameraDist));
        lastPinchDist = d;
      } else {
        lastPinchDist = d;
      }
      return;
    }
    if (!isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    var t = getTouchClient(e);
    if (t) {
      if (selectedCard) {
        closeupRotationX = dragStartCloseupRotX - (t.y - dragStartY) * 0.005;
        closeupRotationY = dragStartCloseupRotY + (t.x - dragStartX) * 0.005;
        closeupRotationX = Math.max(-CLOSEUP_ORBIT_LIMIT_V, Math.min(CLOSEUP_ORBIT_LIMIT_V, closeupRotationX));
        closeupRotationY = Math.max(-CLOSEUP_ORBIT_LIMIT_H, Math.min(CLOSEUP_ORBIT_LIMIT_H, closeupRotationY));
        return;
      }
      orbitAngleHTarget = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, dragStartOrbitH + (t.x - dragStartX) * 0.002));
      orbitAngleVTarget = Math.max(-ORBIT_LIMIT_V, Math.min(ORBIT_LIMIT_V, dragStartOrbitV - (t.y - dragStartY) * 0.002));
    }
  }, { passive: false });
  el.addEventListener('touchend', function (e) {
    if (e.touches.length === 0) {
      var ct = e.changedTouches && e.changedTouches[0];
      if (ct && Math.hypot(ct.clientX - dragStartX, ct.clientY - dragStartY) < CLICK_THRESHOLD) {
        if (touchStartHitCard) selectedCard = touchStartHitCard;
        else {
          if (selectedCard) returnCardToCarousel(selectedCard);
          selectedCard = null;
          closeupRotationX = 0;
          closeupRotationY = 0;
        }
      }
      touchStartHitCard = null;
      isDragging = false;
      lastPinchDist = null;
    } else if (e.touches.length === 1) lastPinchDist = null;
    else if (e.touches.length === 2) lastPinchDist = pinchDistance(e);
  });
  el.addEventListener('touchcancel', function () { isDragging = false; lastPinchDist = null; touchStartHitCard = null; });

  window.addEventListener('resize', function () {
    var s = getSize();
    var w = s.w, h = s.h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    var prCap = w < 768 ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, prCap));
    renderer.setSize(w, h);
    composer.setSize(w, h);
    composer.setPixelRatio(Math.min(window.devicePixelRatio, prCap));
    bloomPass.resolution.set(w, h);
    updateLayout();
  });
})();
