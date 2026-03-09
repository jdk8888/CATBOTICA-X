/**
 * CATBOTICA — Hero Card Marquee (fork of Karafuru v7).
 * Cylinders, marquee screen, Welcome to / World of / CATBOTICA text, zodiac card carousel, globe.
 * Logo: all-7 deck, single init, dissolve-in. Phase 3.6: inner sphere texture/video.
 */
import * as THREE from 'three';

(function () {
  window.PARADE_VERSION = 'v7';
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
  function getDeviceTier() {
    var r = window.paradeRenderer;
    if (r && r.xr && r.xr.isPresenting) return 'xr';
    var w = (container && container.clientWidth) ? container.clientWidth : (typeof window !== 'undefined' ? window.innerWidth : 1024);
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  }
  function getPixelRatioCap() {
    var t = getDeviceTier();
    if (t === 'xr') return 1;
    if (t === 'mobile') return 1.25;
    if (t === 'tablet') return 1.5;
    return 2;
  }
  var size = getSize();
  var width = size.w;
  var height = size.h;
  var _particleMult = getDeviceTier() === 'mobile' ? 0.5 : getDeviceTier() === 'tablet' ? 0.75 : 1;
  window.paradeDeviceTier = getDeviceTier();
  window._particleMult = _particleMult;

  const scene = new THREE.Scene();
  const CAMERA_DIST = 23350 * 0.8; /* ~20% zoom in (18680) */
  const CAMERA_FOV = 75;
  var currentCameraDist = CAMERA_DIST;
  var zoomMin = 5000 * 0.8;
  var zoomMax = 28000 * 0.8;
  const camera = new THREE.PerspectiveCamera(CAMERA_FOV, width / height, 1, 15000000);
  camera.position.set(0, 0, currentCameraDist);
  camera.lookAt(0, 0, 0);
  var lookAtTarget = new THREE.Vector3();

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, getPixelRatioCap()));
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (renderer.xr) renderer.xr.enabled = true;
  window.paradeRenderer = renderer;
  container.appendChild(renderer.domElement);

  function onWheel(e) {
    e.preventDefault();
    e.stopPropagation();
    var dy = typeof e.deltaY !== 'undefined' ? e.deltaY : -(e.wheelDelta || 0) / 3;
    var step = dy > 0 ? 1 : -1;
    var amount = Math.abs(dy) < 100 ? 400 : Math.min(1200, Math.abs(dy) * 2);
    currentCameraDist = Math.max(zoomMin, Math.min(zoomMax, currentCameraDist + step * amount));
  }
  renderer.domElement.setAttribute('tabindex', '0');
  renderer.domElement.style.outline = 'none';
  window.addEventListener('wheel', onWheel, { passive: false, capture: true });
  window.addEventListener('mousewheel', onWheel, { passive: false, capture: true });

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const key = new THREE.DirectionalLight(0xffffff, 0.7);
  key.position.set(80, 120, 280);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x28EDED, 0.35);
  rim.position.set(0, -60, -200);
  scene.add(rim);
  window.paradeAmbientLight = ambientLight;
  window.paradeKeyLight = key;
  window.paradeRimLight = rim;

  var imaxConfig = window.PARADE_IMAX_CONFIG || {};
  var scriptBase = new URL('.', import.meta.url).href;
  var defaultVideo1 = 'videos/KARAFURU_08_720p.mp4';
  var defaultVideo2 = 'videos/Karafuru_Rewind_v2_720p.mp4';
  var defaultGlobeVideo1 = 'videos/KARAFURU_08_480p.mp4';
  var defaultGlobeVideo2 = 'videos/Karafuru_Rewind_v2_480p.mp4';
  var videoUrl1 = (imaxConfig.videoUrl && imaxConfig.videoUrl.indexOf('http') === 0) ? imaxConfig.videoUrl : (scriptBase + defaultVideo1);
  var videoUrl2 = (imaxConfig.videoUrl2 && imaxConfig.videoUrl2.indexOf('http') === 0) ? imaxConfig.videoUrl2 : (scriptBase + defaultVideo2);
  var globeVideoUrl1 = scriptBase + defaultGlobeVideo1;
  var globeVideoUrl2 = scriptBase + defaultGlobeVideo2;

  const carousel = new THREE.Group();
  scene.add(carousel);

  var titleRingGroup = new THREE.Group();
  titleRingGroup.position.set(0, 326 - 200 - 300 - 300 - 350 - 50, 0);
  carousel.add(titleRingGroup);
  window.paradeTitleRingGroup = titleRingGroup;
  window.paradeCarousel = carousel;
  window.paradeHolographicMaterials = [];

  const baseHeight = 100;
  const discRadius = 1100;
  const discHeight = 600;
  const towerHeight = discHeight * 1.5;
  const discBottomY = -baseHeight - 100;
  const discGeometry = new THREE.CylinderGeometry(discRadius, discRadius, towerHeight, 64);
  const discMaterial = new THREE.MeshStandardMaterial({
    color: 0x000000,
    roughness: 0.95,
    metalness: 0,
    side: THREE.DoubleSide,
    transparent: false,
    opacity: 1.0
  });
  const disc = new THREE.Mesh(discGeometry, discMaterial);
  disc.position.set(0, 0, 0);
  disc.receiveShadow = true;

  var video1 = document.createElement('video');
  video1.loop = true;
  video1.muted = true;
  video1.playsInline = true;
  video1.crossOrigin = 'anonymous';
  video1.preload = 'auto';
  var video2 = document.createElement('video');
  video2.loop = true;
  video2.muted = true;
  video2.playsInline = true;
  video2.crossOrigin = 'anonymous';
  video2.preload = 'auto';
  if (videoUrl1) { video1.src = videoUrl1; video1.muted = true; video1.loop = true; video1.setAttribute('loop', true); }
  if (videoUrl2) { video2.src = videoUrl2; video2.muted = true; video2.loop = true; video2.setAttribute('loop', true); }
  var cylinderVideoTex1 = new THREE.VideoTexture(video1);
  cylinderVideoTex1.minFilter = THREE.LinearFilter;
  cylinderVideoTex1.magFilter = THREE.LinearFilter;
  cylinderVideoTex1.wrapS = THREE.RepeatWrapping;
  cylinderVideoTex1.wrapT = THREE.RepeatWrapping;
  cylinderVideoTex1.repeat.set(-1, -1);
  cylinderVideoTex1.offset.set(1, 1);
  if (cylinderVideoTex1.colorSpace !== undefined) cylinderVideoTex1.colorSpace = THREE.SRGBColorSpace;
  var cylinderVideoTex2 = new THREE.VideoTexture(video2);
  cylinderVideoTex2.minFilter = THREE.LinearFilter;
  cylinderVideoTex2.magFilter = THREE.LinearFilter;
  cylinderVideoTex2.wrapS = THREE.RepeatWrapping;
  cylinderVideoTex2.wrapT = THREE.RepeatWrapping;
  cylinderVideoTex2.repeat.set(-1, -1);
  cylinderVideoTex2.offset.set(1, 1);
  if (cylinderVideoTex2.colorSpace !== undefined) cylinderVideoTex2.colorSpace = THREE.SRGBColorSpace;
  if (videoUrl1) { video1.loop = true; video1.play().catch(function () {}); }
  if (videoUrl2) { video2.loop = true; video2.play().catch(function () {}); }
  video1.addEventListener('ended', function() { video1.currentTime = 0; video1.play().catch(function() {}); });
  video2.addEventListener('ended', function() { video2.currentTime = 0; video2.play().catch(function() {}); });

  function createCylinderSliceGeometry(radius, height, thetaStart, thetaLength, segmentsTheta, segmentsHeight) {
    segmentsTheta = segmentsTheta || 16;
    segmentsHeight = segmentsHeight || 16;
    var vertices = [];
    var uvs = [];
    for (var j = 0; j <= segmentsHeight; j++) {
      for (var i = 0; i <= segmentsTheta; i++) {
        var angle = thetaStart + (i / segmentsTheta) * thetaLength;
        var y = -height / 2 + (j / segmentsHeight) * height;
        vertices.push(radius * Math.sin(angle), y, radius * Math.cos(angle));
        uvs.push(i / segmentsTheta, 1 - j / segmentsHeight);
      }
    }
    var indices = [];
    for (var j = 0; j < segmentsHeight; j++) {
      for (var i = 0; i < segmentsTheta; i++) {
        var a = j * (segmentsTheta + 1) + i;
        var b = a + 1;
        var c = a + (segmentsTheta + 1);
        var d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  var finalHeight = towerHeight;
  var finalVideoHeight = finalHeight - 15;
  var videoAspect = 16 / 9;
  var targetWidth = finalVideoHeight * videoAspect;
  var videoScreenThetaLength = targetWidth / (discRadius + 2);
  var videoScreenRadius = discRadius + 5;
  var videoScreenGeo1 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, 0, videoScreenThetaLength, 64, 24);
  var videoScreenGeo2 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, Math.PI, videoScreenThetaLength, 64, 24);
  var videoScreenGeo3 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, Math.PI / 2, videoScreenThetaLength, 64, 24);
  var videoScreenGeo4 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, Math.PI * 1.5, videoScreenThetaLength, 64, 24);
  var gapThetaLength = Math.PI / 2 - videoScreenThetaLength;
  /* Tower = solid cylinder + band slices; separate group so we can hide it on mobile and keep video + torus */
  var towerGroup = new THREE.Group();
  towerGroup.add(disc);
  var paradeDiscBandMeshes = [];
  if (gapThetaLength > 0.001) {
    var bandMat = new THREE.MeshLambertMaterial({ color: 0x0d0d0d, side: THREE.DoubleSide });
    var bandGeo1 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, videoScreenThetaLength, gapThetaLength, 32, 24);
    var bandGeo2 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, Math.PI / 2 + videoScreenThetaLength, gapThetaLength, 32, 24);
    var bandGeo3 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, Math.PI + videoScreenThetaLength, gapThetaLength, 32, 24);
    var bandGeo4 = createCylinderSliceGeometry(videoScreenRadius, finalVideoHeight, Math.PI * 1.5 + videoScreenThetaLength, gapThetaLength, 32, 24);
    var band1 = new THREE.Mesh(bandGeo1, bandMat);
    var band2 = new THREE.Mesh(bandGeo2, bandMat);
    var band3 = new THREE.Mesh(bandGeo3, bandMat);
    var band4 = new THREE.Mesh(bandGeo4, bandMat);
    towerGroup.add(band1);
    towerGroup.add(band2);
    towerGroup.add(band3);
    towerGroup.add(band4);
    paradeDiscBandMeshes = [band1, band2, band3, band4];
  }
  window.paradeDiscBandMeshes = paradeDiscBandMeshes;
  window.paradeTowerGroup = towerGroup;

  function applyVideoAspectToTexture(video, texture, meshArcWidth, meshHeight, unmirror, logLabel) {
    function update() {
      var vw = video.videoWidth || 1;
      var vh = video.videoHeight || 1;
      var vAspect = vw / vh;
      var meshAspect = meshArcWidth / meshHeight;
      var rx = -1, ry = -1, ox = 1, oy = 1;
      if (vAspect > meshAspect) {
        rx = -(meshAspect / vAspect);
        ox = (1 + rx) / 2;
      } else {
        ry = -(vAspect / meshAspect);
        oy = (1 + ry) / 2;
      }
      if (unmirror) {
        texture.repeat.set(-rx, -ry);
        texture.offset.set(0.5 + rx / 2, 0.5 + ry / 2);
      } else {
        texture.repeat.set(rx, ry);
        texture.offset.set(ox, oy);
      }
      if (logLabel) {
        texture.repeat.y *= -1;
        texture.offset.y = 1 - texture.offset.y;
      }
    }
    video.addEventListener('loadedmetadata', update);
    if (video.readyState >= 1) update();
  }
  var meshArcWidth = videoScreenRadius * videoScreenThetaLength;
  applyVideoAspectToTexture(video1, cylinderVideoTex1, meshArcWidth, finalVideoHeight);
  applyVideoAspectToTexture(video2, cylinderVideoTex2, meshArcWidth, finalVideoHeight);

  function cylinderScreenMat(tex) {
    return new THREE.MeshBasicMaterial({
      map: tex,
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: false,
      opacity: 1.0,
      depthTest: true,
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: -10,
      polygonOffsetUnits: -10
    });
  }
  var cylinderScreenMat1 = cylinderScreenMat(cylinderVideoTex1);
  var cylinderScreenMat2 = cylinderScreenMat(cylinderVideoTex2);
  var videoScreen1 = new THREE.Mesh(videoScreenGeo1, cylinderScreenMat1);
  var videoScreen2 = new THREE.Mesh(videoScreenGeo2, cylinderScreenMat2);
  var videoScreen3 = new THREE.Mesh(videoScreenGeo3, cylinderScreenMat1);
  var videoScreen4 = new THREE.Mesh(videoScreenGeo4, cylinderScreenMat2);
  videoScreen1.position.set(0, 0, 0);
  videoScreen2.position.set(0, 0, 0);
  videoScreen3.position.set(0, 0, 0);
  videoScreen4.position.set(0, 0, 0);
  videoScreen1.renderOrder = 1002;
  videoScreen2.renderOrder = 1002;
  videoScreen3.renderOrder = 1002;
  videoScreen4.renderOrder = 1002;

  var borderTorusRadius = videoScreenRadius + 4;
  var borderTubeRadius = 7;
  var borderTorusGeo = new THREE.TorusGeometry(borderTorusRadius, borderTubeRadius, 8, 64);
  var borderRingMat = new THREE.MeshLambertMaterial({
    color: 0x28EDED,
    emissive: 0x28EDED,
    emissiveIntensity: 0.7,
    side: THREE.DoubleSide
  });
  var borderTop = new THREE.Mesh(borderTorusGeo.clone(), borderRingMat);
  borderTop.rotation.x = Math.PI / 2;
  borderTop.position.set(0, finalHeight / 2, 0);
  borderTop.renderOrder = 1002;
  var borderBottom = new THREE.Mesh(borderTorusGeo.clone(), borderRingMat);
  borderBottom.rotation.x = Math.PI / 2;
  borderBottom.position.set(0, -finalHeight / 2, 0);
  borderBottom.renderOrder = 1002;

  /* Video screens and cyan torus live beside tower (in discRotateGroup) so we can hide only the tower on mobile */
  window.paradeBorderRings = [borderTop, borderBottom];

  const discRotateGroup = new THREE.Group();
  discRotateGroup.position.set(0, 0, 0);
  discRotateGroup.rotation.y = Math.PI / 2;
  discRotateGroup.add(towerGroup);
  discRotateGroup.add(videoScreen1);
  discRotateGroup.add(videoScreen2);
  discRotateGroup.add(videoScreen3);
  discRotateGroup.add(videoScreen4);
  discRotateGroup.add(borderTop);
  discRotateGroup.add(borderBottom);

  const discGroup = new THREE.Group();
  discGroup.position.set(0, discBottomY + towerHeight / 2 - 200 - 300 - 300 - 300, 0);
  discGroup.add(discRotateGroup);
  carousel.add(discGroup);
  window.paradeDiscGroup = discGroup;
  window.paradeDiscRadius = discRadius;
  window.paradeDiscCenterY = discGroup.position.y;
  window.paradeDiscBottomY = discGroup.position.y - towerHeight / 2;
  window.paradeDiscRotateGroup = discRotateGroup;
  window.paradeDiscBaseCylinder = disc;

  (function addGlobeInnerScreens() {
    /* v6 frozen — Phase 2.4: globe screen layout (phi, theta, gap factor) */
    var GLOBE_PHI_RANGE = Math.PI / 2.5;   /* vertical spread (larger = more band) */
    var GLOBE_THETA_SPAN = Math.PI * 0.75;  /* 7/14 of original 1.5π — same screen size & gap, 7 cols */
    var GLOBE_GAP_FACTOR = 0.78;           /* 0–1: smaller = more gap between screens */
    var GLOBE_ROWS = 5;
    var GLOBE_COLS = 7;

    /* Distance R_eq 200000; ellipsoid; screen size from R_ref (decoupled) */
    var R_eq = 200000;
    var R_polar = R_eq / 2;
    var R_ref = 20000;
    var R_polar_ref = R_ref / 2;
    var screenScale = 5 * 2.25; // 11.25 — screens 2.25x
    var phiRange = GLOBE_PHI_RANGE;
    var phiMin = Math.PI / 2 - phiRange / 2;
    var phiMax = Math.PI / 2 + phiRange / 2;
    var thetaSpan = GLOBE_THETA_SPAN;
    var thetaMin = 2 * Math.PI - thetaSpan;
    var thetaMax = 2 * Math.PI;
    var rows = GLOBE_ROWS;
    var cols = GLOBE_COLS;
    var gapFactor = GLOBE_GAP_FACTOR;
    var cellH = (R_polar_ref * phiRange / rows) * gapFactor * screenScale;
    var refScreenW = (R_ref * thetaSpan / cols) * gapFactor * screenScale;
    var refScreenH = refScreenW / (16 / 9);
    var globeGroup = new THREE.Group();
    globeGroup.position.set(0, discGroup.position.y, 0);
    var center = new THREE.Vector3(0, 0, 0);

    var centerRow = Math.floor(rows / 2);
    var phiCenter = phiMin + (centerRow / Math.max(rows - 1, 1)) * (phiMax - phiMin);
    var radialRefCenter = R_ref * Math.sin(phiCenter);
    var arcPerColCenter = radialRefCenter * thetaSpan / cols;
    var maxScreenWCenter = cellH * (16 / 9);
    var refScreenW_center = Math.min(arcPerColCenter * gapFactor * screenScale, maxScreenWCenter);
    var refScreenH_center = refScreenW_center / (16 / 9);

    function createBrandPlaceholderTexture() {
      var canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 144;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = '#0b0b18';
      ctx.fillRect(0, 0, 256, 144);
      ctx.strokeStyle = '#28EDED';
      ctx.lineWidth = 2;
      ctx.strokeRect(3, 3, 250, 138);
      ctx.strokeStyle = 'rgba(40,237,237,0.25)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 240, 128);
      var tex = new THREE.CanvasTexture(canvas);
      tex.flipY = false;
      return tex;
    }
    var logoTextures = [];
    var logoFallbackTex = createBrandPlaceholderTexture();
    var scriptBase = new URL('.', import.meta.url).href;
    var logoPaths = (imaxConfig.logoUrls && imaxConfig.logoUrls.length) ? imaxConfig.logoUrls : [
      'logos/KARAFURU_LOGO_WHITE.png',
      'logos/KARAFURU_LOGO_BLACK.png',
      'logos/KARAFURU_LOGO_COLOR_WHITE.png',
      'logos/KARAFURU_LOGO__COLOR.png',
      'logos/KARAFURU_LOGO_COLOR_CIRCLE.png',
      'logos/KARAFURU_LOGO_WHITE_BORDER.png',
      'logos/KARAFURU_LOGO_WHITE_BORDER_BLACK_OUTLINE.png'
    ];
    var logoUrls = logoPaths.map(function(p) { return (p.indexOf('http') === 0) ? p : (scriptBase + p); });
    var videosStarted = false;
    var logosAssigned = false;
    var LOGO_INTRO_HOLD_MS = 5000; /* logos dissolve in (2s), then hold 3s before videos take over */

    function startVideosAfterLogoHold() {
      if (videosStarted) return;
      videosStarted = true;
      /* Start decoders immediately so video has full LOGO_INTRO_HOLD_MS to decode before reveal */
      if (window.paradeAllowGlobeVideosToPlay) window.paradeAllowGlobeVideosToPlay();
      /* Pre-warm: nudge video mat opacity so Three.js uploads texture to GPU early */
      for (var pw = 0; pw < globeMats.length; pw++) {
        if (globeMats[pw]) globeMats[pw].opacity = 0.01;
      }
      /* Wait until ALL 4 decoders are at readyState >= 3 before starting any cascade */
      function waitForAllDecoders(callback) {
        var decoders = [globeVid1a, globeVid1b, globeVid2a, globeVid2b];
        function check() {
          var allReady = true;
          for (var _d = 0; _d < decoders.length; _d++) {
            if (decoders[_d].readyState < 3) { allReady = false; break; }
          }
          if (allReady) callback();
          else setTimeout(check, 300);
        }
        check();
      }

      /* Diagonal cascade: sort slots by minimum (row+col) diagonal of their first screen.
         Build a map from matIndex → min diagonal key across all screens in the grid. */
      var slotMinDiag = [999, 999, 999, 999, 999, 999, 999, 999];
      var _deckPos2 = 0;
      for (var _dr = 0; _dr < rows; _dr++) {
        for (var _dc = 0; _dc < cols; _dc++) {
          var _slot = matIndexDeck[_deckPos2++];
          var diagKey = _dr + _dc;
          if (diagKey < slotMinDiag[_slot]) slotMinDiag[_slot] = diagKey;
        }
      }
      var slotOrder = [0, 1, 2, 3, 4, 5, 6, 7];
      slotOrder.sort(function(a, b) { return slotMinDiag[a] - slotMinDiag[b]; });

      waitForAllDecoders(function() {
        var CASCADE_MS = 300; /* stagger between each diagonal wave */
        for (var sk = 0; sk < slotOrder.length; sk++) {
          (function(slot, delay) {
            setTimeout(function() { showVideoOnScreenPlanes(slot); }, delay);
          })(slotOrder[sk], sk * CASCADE_MS);
        }
      });
    }

    function tryAssignLogos() {
      if (globeMats.length !== 8 || logoTextures.length === 0) return;
      if (typeof assignAllSevenLogos === 'function') assignAllSevenLogos();
      logosAssigned = true;
      /* Hold logos for LOGO_INTRO_HOLD_MS then start videos */
      setTimeout(startVideosAfterLogoHold, LOGO_INTRO_HOLD_MS);
    }
    /* Fallback: if logos haven't loaded after 4s, assign whatever is available and start */
    setTimeout(function() {
      if (!logosAssigned && globeMats.length === 8 && logoTextures.length > 0) {
        if (typeof assignAllSevenLogos === 'function') assignAllSevenLogos();
        logosAssigned = true;
        setTimeout(startVideosAfterLogoHold, LOGO_INTRO_HOLD_MS);
      } else if (!videosStarted) {
        startVideosAfterLogoHold();
      }
    }, 4000);

    var LOGO_FILL_HEIGHT = 0.72;

    /* 2 video decoders only — 480p sources for globe screens (lower decode/upload cost) */
    function makeGlobeVideo(url) {
      var v = document.createElement('video');
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      v.crossOrigin = 'anonymous';
      v.preload = 'auto';
      v.src = url;
      v.addEventListener('loadedmetadata', function() {
        if (v.duration && isFinite(v.duration) && v.duration > 1) {
          v.currentTime = Math.random() * (v.duration - 0.5);
        }
      });
      return v;
    }
    /* 4 decoders total (2 per source) — each starts at a different random offset,
       giving visual variety across screens while staying well below 8-decoder cost. */
    var globeVid1a = makeGlobeVideo(globeVideoUrl1);
    var globeVid1b = makeGlobeVideo(globeVideoUrl1);
    var globeVid2a = makeGlobeVideo(globeVideoUrl2);
    var globeVid2b = makeGlobeVideo(globeVideoUrl2);
    /* Slots: 0-1 → vid1a, 2-3 → vid1b, 4-5 → vid2a, 6-7 → vid2b */
    var globeVideos = [globeVid1a, globeVid1a, globeVid1b, globeVid1b, globeVid2a, globeVid2a, globeVid2b, globeVid2b];
    var globeVideo1Pool = [globeVid1a, globeVid1b];
    var globeVideo2Pool = [globeVid2a, globeVid2b];
    var globeVid1 = globeVid1a; var globeVid2 = globeVid2a; /* keep legacy refs for compat */

    var globeTexs = [];
    var globeMats = [];
    var globeLogoMats = [];
    var globeLogoPlanes = [];
    var LOGO_HOLD_MS = 3000;
    var showingLogo = [true, true, true, true, true, true, true, true];
    function pickRandomLogo() {
      if (logoTextures.length === 0) return logoFallbackTex;
      return logoTextures[Math.floor(Math.random() * logoTextures.length)];
    }

    function makeGlobeTex(vid) {
      var tx = new THREE.VideoTexture(vid);
      tx.minFilter = THREE.LinearFilter;
      tx.magFilter = THREE.LinearFilter;
      tx.flipY = false;
      if (tx.colorSpace !== undefined) tx.colorSpace = THREE.SRGBColorSpace;
      tx.repeat.set(-1, -1);
      tx.offset.set(1, 1);
      return tx;
    }
    /* One texture per decoder — 4 textures total */
    var globeTex1a = makeGlobeTex(globeVid1a);
    var globeTex1b = makeGlobeTex(globeVid1b);
    var globeTex2a = makeGlobeTex(globeVid2a);
    var globeTex2b = makeGlobeTex(globeVid2b);
    globeTexs.push(globeTex1a, globeTex1b, globeTex2a, globeTex2b);

    /* 8 material slots: 0-1 → tex1a, 2-3 → tex1b, 4-5 → tex2a, 6-7 → tex2b */
    var globeTexMap = [globeTex1a, globeTex1a, globeTex1b, globeTex1b, globeTex2a, globeTex2a, globeTex2b, globeTex2b];
    for (var t = 0; t < 8; t++) {
      globeMats.push(new THREE.MeshBasicMaterial({
        map: globeTexMap[t],
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        depthTest: true,
        toneMapped: false
      }));
      globeLogoMats.push(new THREE.MeshBasicMaterial({
        map: logoFallbackTex,
        color: 0xffffff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: true,
        toneMapped: false
      }));
    }

    /* Load logo textures NOW — globeMats/globeLogoMats are ready, tryAssignLogos will succeed */
    var logoLoader = new THREE.TextureLoader();
    for (var L = 0; L < logoUrls.length; L++) {
      (function(url) {
        logoLoader.load(url, function(t) {
          if (t) {
            t.minFilter = THREE.LinearFilter;
            t.magFilter = THREE.LinearFilter;
            logoTextures.push(t);
            tryAssignLogos();
          }
        }, undefined, function() {
          if (typeof console !== 'undefined' && console.warn) console.warn('Logo failed to load:', url);
          tryAssignLogos();
        });
      })(logoUrls[L]);
    }

    /* Per-screen show/hide — operates on each logo plane's own cloned material */
    function showLogoOnScreenPlanes(matIdx) {
      for (var p = 0; p < globeLogoPlanes.length; p++) {
        if (globeLogoPlanes[p].matIndex === matIdx) globeLogoPlanes[p].mat.opacity = 0.9;
      }
      if (globeMats[matIdx]) globeMats[matIdx].opacity = 0;
      showingLogo[matIdx] = true;
    }
    function showVideoOnScreenPlanes(matIdx) {
      /* Stop any in-progress logo dissolve-in for this slot before starting video cross-fade */
      if (window.paradeGlobeDissolveStart) window.paradeGlobeDissolveStart[matIdx] = 0;
      showingLogo[matIdx] = false;
      if (window.paradeGlobeVideoFadeStart) window.paradeGlobeVideoFadeStart[matIdx] = performance.now();
      /* Emit sparks from the first screen with this matIndex (use local position — sparks are in globeGroup space) */
      if (window._karafuruEmitSparks) {
        for (var sp = 0; sp < globeLogoPlanes.length; sp++) {
          if (globeLogoPlanes[sp].matIndex === matIdx) {
            window._karafuruEmitSparks(globeLogoPlanes[sp].mesh.position);
            break;
          }
        }
      }
    }

    /* Video cycle events — only handle end-of-cycle logo hold, not initial play */
    function attachGlobeVideoEvents(vid, slots) {
      vid.addEventListener('pause', function() {
        if (!videosStarted) return; /* ignore pauses before intro sequence completes */
        if (logoTextures.length > 0) {
          for (var s = 0; s < slots.length; s++) showLogoOnScreenPlanes(slots[s]);
        }
      });
      vid.addEventListener('ended', function() {
        if (!videosStarted) return;
        if (logoTextures.length > 0) {
          for (var s = 0; s < slots.length; s++) {
            var newLogo = pickRandomLogo();
            for (var p = 0; p < globeLogoPlanes.length; p++) {
              if (globeLogoPlanes[p].matIndex === slots[s]) {
                globeLogoPlanes[p].mat.map = newLogo;
                globeLogoPlanes[p].mat.map.needsUpdate = true;
              }
            }
            showLogoOnScreenPlanes(slots[s]);
          }
        }
        setTimeout(function() {
          vid.currentTime = 0;
          vid.play().catch(function() {});
          for (var s = 0; s < slots.length; s++) showVideoOnScreenPlanes(slots[s]);
        }, LOGO_HOLD_MS);
      });
    }
    attachGlobeVideoEvents(globeVid1a, [0, 1]);
    attachGlobeVideoEvents(globeVid1b, [2, 3]);
    attachGlobeVideoEvents(globeVid2a, [4, 5]);
    attachGlobeVideoEvents(globeVid2b, [6, 7]);

    function resizeLogoPlanes() {
      for (var p = 0; p < globeLogoPlanes.length; p++) {
        var entry = globeLogoPlanes[p];
        var mat = entry.mat;
        if (!mat || !mat.map || !mat.map.image) continue;
        var img = mat.map.image;
        var iw = img.naturalWidth || img.width || 0;
        var ih = img.naturalHeight || img.height || 0;
        if (!iw || !ih) continue;
        var aspect = iw / ih;
        var lH = entry.screenH * LOGO_FILL_HEIGHT;
        var lW = lH * aspect;
        if (lW > entry.screenW * 0.85) { lW = entry.screenW * 0.85; lH = lW / aspect; }
        entry.mesh.geometry.dispose();
        entry.mesh.geometry = new THREE.PlaneGeometry(lW, lH);
      }
    }

    function assignAllSevenLogos() {
      if (globeLogoMats.length !== 8 || logoTextures.length === 0) return;
      var available = Math.min(logoTextures.length, 7);
      var deck = [];
      for (var d = 0; d < available; d++) deck.push(d);
      while (deck.length < 8) deck.push(Math.floor(Math.random() * available));
      for (var k = deck.length - 1; k > 0; k--) {
        var j = Math.floor(Math.random() * (k + 1));
        var tmp = deck[k]; deck[k] = deck[j]; deck[j] = tmp;
      }
      for (var i = 0; i < 8; i++) {
        var assignedTex = logoTextures[deck[i]];
        globeLogoMats[i].map = assignedTex;
        globeLogoMats[i].map.needsUpdate = true;
        globeLogoMats[i].needsUpdate = true;
        globeMats[i].opacity = 0;
        showingLogo[i] = true;
        /* Start dissolve-in from opacity 0 */
        if (window.paradeGlobeDissolveStart) window.paradeGlobeDissolveStart[i] = performance.now();
        /* Push the assigned texture into every per-screen logo plane for this matIndex */
        for (var p = 0; p < globeLogoPlanes.length; p++) {
          if (globeLogoPlanes[p].matIndex === i) {
            globeLogoPlanes[p].mat.map = assignedTex;
            globeLogoPlanes[p].mat.map.needsUpdate = true;
            globeLogoPlanes[p].mat.opacity = 0;
          }
        }
      }
      resizeLogoPlanes();
    }

    /* Rounded-rectangle ShapeGeometry — used for both video and logo planes */
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
      /* Remap UVs from shape-space [min,max] → [0,1] so video texture fills correctly */
      var pos = geo.attributes.position;
      var uvArr = new Float32Array(pos.count * 2);
      for (var i = 0; i < pos.count; i++) {
        uvArr[i * 2]     = (pos.getX(i) + w / 2) / w;
        uvArr[i * 2 + 1] = (pos.getY(i) + h / 2) / h;
      }
      geo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
      return geo;
    }

    /* Build a shuffled-deck matIndex sequence — every 8 screens guaranteed to have all 8 slots,
       no clustering, no visible repeating pattern. */
    var totalScreens = rows * cols;
    var matIndexDeck = [];
    for (var di = 0; di < Math.ceil(totalScreens / globeMats.length); di++) {
      var chunk = [];
      for (var dj = 0; dj < globeMats.length; dj++) chunk.push(dj);
      for (var dk = chunk.length - 1; dk > 0; dk--) {
        var dl = Math.floor(Math.random() * (dk + 1));
        var dtmp = chunk[dk]; chunk[dk] = chunk[dl]; chunk[dl] = dtmp;
      }
      matIndexDeck = matIndexDeck.concat(chunk);
    }
    var deckPos = 0;

    /* Shared soft glow texture — radial gradient (center bright cyan → edge transparent).
       Used for screen back-glow to avoid hard boundaries. */
    var glowCanvas = document.createElement('canvas');
    glowCanvas.width = 128; glowCanvas.height = 128;
    var glowCtx = glowCanvas.getContext('2d');
    var glowGrad = glowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glowGrad.addColorStop(0,   'rgba(40, 237, 237, 0.65)');
    glowGrad.addColorStop(0.25, 'rgba(40, 237, 237, 0.35)');
    glowGrad.addColorStop(0.5,  'rgba(40, 237, 237, 0.12)');
    glowGrad.addColorStop(0.75, 'rgba(40, 237, 237, 0.03)');
    glowGrad.addColorStop(1,   'rgba(40, 237, 237, 0)');
    glowCtx.fillStyle = glowGrad;
    glowCtx.fillRect(0, 0, 128, 128);
    var glowTex = new THREE.CanvasTexture(glowCanvas);
    glowTex.needsUpdate = true;

    /* Magenta glow — alternate with cyan behind inner sphere screens */
    var glowMagentaCanvas = document.createElement('canvas');
    glowMagentaCanvas.width = 128; glowMagentaCanvas.height = 128;
    var glowMagentaCtx = glowMagentaCanvas.getContext('2d');
    var glowMagentaGrad = glowMagentaCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glowMagentaGrad.addColorStop(0,   'rgba(255, 111, 176, 0.5)');
    glowMagentaGrad.addColorStop(0.25, 'rgba(255, 111, 176, 0.28)');
    glowMagentaGrad.addColorStop(0.5,  'rgba(255, 111, 176, 0.1)');
    glowMagentaGrad.addColorStop(0.75, 'rgba(255, 111, 176, 0.025)');
    glowMagentaGrad.addColorStop(1,   'rgba(255, 111, 176, 0)');
    glowMagentaCtx.fillStyle = glowMagentaGrad;
    glowMagentaCtx.fillRect(0, 0, 128, 128);
    var glowMagentaTex = new THREE.CanvasTexture(glowMagentaCanvas);
    glowMagentaTex.needsUpdate = true;

    window.paradeGlowPlanes = [];
    window.paradeGlobeVideoPlanes = [];
    center.set(0, discGroup.position.y, 0);
    for (var row = 0; row < rows; row++) {
      var phi = phiMin + (row / Math.max(rows - 1, 1)) * (phiMax - phiMin);
      var sinPhi = Math.sin(phi);
      var cosPhi = Math.cos(phi);
      var radial = R_eq * sinPhi;
      var radialRef = R_ref * sinPhi;
      var arcPerCol = radialRef * thetaSpan / cols;
      var maxScreenWFromCell = cellH * (16 / 9);
      var screenW = Math.min(arcPerCol * gapFactor * screenScale, maxScreenWFromCell);
      var screenH = screenW / (16 / 9);
      var cornerR = screenW * 0.08; /* 8% corner radius — tasteful, not pill-shaped */
      for (var col = 0; col < cols; col++) {
        var theta = thetaMin + (col / cols) * (thetaMax - thetaMin);
        var sinTheta = Math.sin(theta);
        var cosTheta = Math.cos(theta);
        var x = radial * cosTheta;
        var y = R_polar * cosPhi;
        var z = radial * sinTheta;
        var matIndex = matIndexDeck[deckPos++];
        var videoMat = globeMats[matIndex];
        var screenGroup = new THREE.Group();
        screenGroup.position.set(x, y, z);
        screenGroup.lookAt(center);
        screenGroup.rotateY(Math.PI);

        /* Back-glow aura: cyan and magenta alternate by screen position */
        var useMagentaGlow = (row + col) % 2 === 1;
        var glowMat = new THREE.MeshBasicMaterial({
          map: useMagentaGlow ? glowMagentaTex : glowTex,
          transparent: true,
          opacity: 0.55,
          depthWrite: false,
          depthTest: true,
          blending: THREE.AdditiveBlending
        });
        var glowPlane = new THREE.Mesh(new THREE.PlaneGeometry(screenW * 2.2, screenH * 2.2), glowMat);
        glowPlane.position.z = -screenW * 0.04; /* pushed behind the screen */
        glowPlane.renderOrder = 993;
        screenGroup.add(glowPlane);
        glowPlane.rotateY(Math.PI);
        window.paradeGlowPlanes.push(glowPlane);

        /* Rounded video plane — geometry bakes in size, no scale needed */
        var frontPlane = new THREE.Mesh(makeRoundedRectGeo(screenW, screenH, cornerR), videoMat);
        frontPlane.userData.materialIndex = matIndex;
        frontPlane.renderOrder = 994;
        screenGroup.add(frontPlane);
        window.paradeGlobeVideoPlanes.push(frontPlane);
        /* Each logo plane gets its own material clone so toggling visibility is per-screen,
           not per-material-index (which would affect all screens sharing the same matIndex). */
        var sharedLogoMat = globeLogoMats[matIndex];
        var perScreenLogoMat = new THREE.MeshBasicMaterial({
          map: sharedLogoMat ? sharedLogoMat.map : logoFallbackTex,
          color: 0xffffff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
          depthTest: true,
          toneMapped: false
        });
        var logoInitW = screenW * 0.70;
        var logoInitH = screenH * LOGO_FILL_HEIGHT;
        /* Logo plane uses PlaneGeometry (logo is contained/fitted, corners don't matter visually) */
        var logoPlane = new THREE.Mesh(new THREE.PlaneGeometry(logoInitW, logoInitH), perScreenLogoMat);
        logoPlane.position.z = 2;
        logoPlane.renderOrder = 995;
        screenGroup.add(logoPlane);
        logoPlane.rotateY(Math.PI);
        globeLogoPlanes.push({ mesh: logoPlane, mat: perScreenLogoMat, matIndex: matIndex, screenW: screenW, screenH: screenH });
        globeGroup.add(screenGroup);
      }
    }

    /* Phase 3.6: inner sphere — texture or video inside globe */
    var INNER_SPHERE_RADIUS = R_eq * 0.38;
    var INNER_SPHERE_OPACITY = 0.6; /* inner screens 60% opaque */
    var innerSphereVideo = document.createElement('video');
    innerSphereVideo.loop = true;
    innerSphereVideo.muted = true;
    innerSphereVideo.playsInline = true;
    innerSphereVideo.crossOrigin = 'anonymous';
    innerSphereVideo.preload = 'auto';
    if (video1 && video1.src) {
      innerSphereVideo.src = video1.src;
      innerSphereVideo.play().catch(function() {});
    }
    innerSphereVideo.addEventListener('ended', function() {
      innerSphereVideo.currentTime = 0;
      innerSphereVideo.play().catch(function() {});
    });
    var innerSphereTex = new THREE.VideoTexture(innerSphereVideo);
    innerSphereTex.minFilter = THREE.LinearFilter;
    innerSphereTex.magFilter = THREE.LinearFilter;
    innerSphereTex.wrapS = THREE.RepeatWrapping;
    innerSphereTex.wrapT = THREE.RepeatWrapping;
    innerSphereTex.repeat.x = -1;
    innerSphereTex.offset.x = 1;
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
    innerSphere.renderOrder = 990;
    globeGroup.add(innerSphere);

    var globeShellGeo = new THREE.SphereGeometry(R_eq + 1, 48, 48);
    var globeShellMat = new THREE.MeshBasicMaterial({
      color: 0x88aacc,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.0003,
      depthWrite: false,
      depthTest: true
    });
    var globeShell = new THREE.Mesh(globeShellGeo, globeShellMat);
    globeShell.scale.set(1, R_polar / R_eq, 1);
    globeShell.renderOrder = 991;
    globeGroup.add(globeShell);
    window.paradeGlobeShell = globeShell; /* outer glow sphere — rotated opposite to inner video sphere */

    /* ── Ambient dust — ShaderMaterial matching catbotica_medallions style ─── */
    var DUST_COUNT = Math.max(1500, Math.floor(6000 * _particleMult));
    var dustPositions = new Float32Array(DUST_COUNT * 3);
    var dustColors    = new Float32Array(DUST_COUNT * 3);
    var dustSizes     = new Float32Array(DUST_COUNT);
    var dustPhases    = new Float32Array(DUST_COUNT);
    /* Spread across globe sphere AND down to card ring below */
    var dustSpanTop = R_eq * 0.9;
    var dustSpanBot = discGroup.position.y - towerHeight / 2 - 2200; /* extends to card ring */
    for (var dp = 0; dp < DUST_COUNT; dp++) {
      var dTheta = Math.random() * Math.PI * 2;
      var dR = dustSpanTop * (0.15 + Math.random() * 0.85);
      dustPositions[dp * 3]     = dR * Math.cos(dTheta);
      dustPositions[dp * 3 + 1] = dustSpanBot + Math.random() * (dustSpanTop - dustSpanBot);
      dustPositions[dp * 3 + 2] = dR * Math.sin(dTheta);
      dustSizes[dp]  = 1 + Math.random() * 9;
      dustPhases[dp] = Math.random() * Math.PI * 2;
      var normR = dR / dustSpanTop;
      var n = Math.pow(1 - normR, 2);
      var alpha = 0.25 + 0.5 * n;
      dustColors[dp * 3]     = alpha * 0.6 + 0.1; /* slight cyan tint */
      dustColors[dp * 3 + 1] = alpha;
      dustColors[dp * 3 + 2] = alpha + 0.15;
    }
    var dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color',    new THREE.BufferAttribute(dustColors, 3));
    dustGeo.setAttribute('size',     new THREE.BufferAttribute(dustSizes, 1));
    dustGeo.setAttribute('phase',    new THREE.BufferAttribute(dustPhases, 1));
    var dustCanvas = document.createElement('canvas');
    dustCanvas.width = 64; dustCanvas.height = 64;
    var dctx = dustCanvas.getContext('2d');
    var dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0,   'rgba(255,255,255,0.9)');
    dg.addColorStop(0.4, 'rgba(255,255,255,0.4)');
    dg.addColorStop(1,   'rgba(255,255,255,0)');
    dctx.fillStyle = dg; dctx.fillRect(0, 0, 64, 64);
    var dustTex = new THREE.CanvasTexture(dustCanvas);
    dustTex.needsUpdate = true;
    var dustVShader = [
      'attribute float size;',
      'attribute float phase;',
      'attribute vec3 color;',
      'uniform float uSize;',
      'varying vec3 vColor;',
      'varying float vPhase;',
      'void main() {',
      '  vColor = color;',
      '  vPhase = phase;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = size * uSize * (8000000.0 / -mv.z);', /* scaled for CAMERA_DIST ~23350 */
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n');
    var dustFShader = [
      'uniform float uTime;',
      'uniform sampler2D uMap;',
      'uniform float uLuminosity;',
      'uniform vec3 uColorTint;',
      'varying vec3 vColor;',
      'varying float vPhase;',
      'void main() {',
      '  vec4 tex = texture2D(uMap, gl_PointCoord);',
      '  float sparkle = 0.8 + 0.4 * sin(uTime * 4.0 + vPhase);',
      '  vec3 finalColor = vColor * uColorTint * uLuminosity;',
      '  gl_FragColor = vec4(finalColor, 0.88 * uLuminosity) * tex * sparkle;',
      '}'
    ].join('\n');
    var dustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: dustTex }, uLuminosity: { value: 1.0 }, uSize: { value: 1.0 }, uColorTint: { value: new THREE.Vector3(1, 1, 1) } },
      vertexShader: dustVShader,
      fragmentShader: dustFShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    var dustMesh = new THREE.Points(dustGeo, dustMat);
    dustMesh.frustumCulled = false;
    dustMesh.renderOrder = 992;
    /* Add to scene (not globeGroup) so it covers the full vertical span */
    scene.add(dustMesh);
    window.paradeDustMaterial = dustMat;
    window.paradeDustPoints = dustMesh;
    window.paradeGlobeDustCount = DUST_COUNT;
    window.paradeGlobeDustQuantity = 1.0;
    window.paradeGlobeDustLuminosity = 0.5;
    window.paradeGlobeDustRotationSpeed = 1.0;
    window.paradeGlobeDustSpeed = 1.0;
    window.paradeGlobeDustSize = 0.1;
    window.paradeGlobeDustColor = 0x88aacc;
    dustMesh.geometry.setDrawRange(0, DUST_COUNT);
    window._karafuruDust = null; /* disable old drift loop — ShaderMaterial handles animation */

    /* ── Ambient fireworks: 4 independent burst slots, auto-firing every 3-7s ── */
    var FW_BURST_COUNT = 4;       /* simultaneous burst slots */
    var FW_SPARKS_PER_BURST = 30; /* particles per burst */
    var FW_TOTAL = FW_BURST_COUNT * FW_SPARKS_PER_BURST;
    var FW_BURST_V = 18000;       /* max velocity in globeGroup local units */
    var FW_BURST_DUR = 3200;      /* ms each burst lasts */
    /* Colours: cyan, magenta, gold (no white) */
    var FW_COLORS = [0x28EDED, 0xFF40FF, 0xFFD700];

    (function() {
      /* Soft circular mote sprite for fireworks (same approach as dust) */
      var fwCanvas = document.createElement('canvas');
      fwCanvas.width = 64; fwCanvas.height = 64;
      var fwCtx = fwCanvas.getContext('2d');
      var fwGrad = fwCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
      fwGrad.addColorStop(0,   'rgba(255,255,255,1.0)');
      fwGrad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
      fwGrad.addColorStop(0.7, 'rgba(255,255,255,0.15)');
      fwGrad.addColorStop(1,   'rgba(255,255,255,0)');
      fwCtx.fillStyle = fwGrad;
      fwCtx.fillRect(0, 0, 64, 64);
      var fwSpriteTex = new THREE.CanvasTexture(fwCanvas);
      fwSpriteTex.needsUpdate = true;

      var fwGeo = new THREE.BufferGeometry();
      var fwPos = new Float32Array(FW_TOTAL * 3);
      /* Park all particles far below the scene in globeGroup local Y */
      var _parkY = -R_eq * 20;
      for (var fp = 0; fp < FW_TOTAL; fp++) {
        fwPos[fp * 3]     = 0;
        fwPos[fp * 3 + 1] = _parkY;
        fwPos[fp * 3 + 2] = 0;
      }
      fwGeo.setAttribute('position', new THREE.BufferAttribute(fwPos, 3));
      var fwMat = new THREE.PointsMaterial({
        map: fwSpriteTex,
        vertexColors: false,
        color: 0x28EDED,
        size: 14000,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        depthTest: true,
        alphaTest: 0.01,
        blending: THREE.AdditiveBlending
      });
      var fwMesh = new THREE.Points(fwGeo, fwMat);
      fwMesh.renderOrder = 999; /* render before screens (1001) so particles appear behind them */
      fwMesh.frustumCulled = false;
      globeGroup.add(fwMesh);
      window.paradeFireworksMesh = fwMesh;

      /* Per-burst state */
      var bursts = [];
      for (var b = 0; b < FW_BURST_COUNT; b++) {
        bursts.push({
          active: false,
          startTime: 0,
          nextFireTime: performance.now() + 400 + Math.random() * 1000,
          originX: 0, originY: 0, originZ: 0,
          vels: new Float32Array(FW_SPARKS_PER_BURST * 3),
          color: FW_COLORS[b % FW_COLORS.length]
        });
      }
      window._karafuruFireworks = { geo: fwGeo, mat: fwMat, pos: fwPos, bursts: bursts, burstDur: FW_BURST_DUR, sparksPerBurst: FW_SPARKS_PER_BURST, parkY: _parkY };
      window.paradeFireworksSpeed = 1.0;
      window.paradeFireworksSize = 1.0;
    })();

    function _fwPickOrigin() {
      /* Random point inside globe volume (local globeGroup coords, R_eq = 200000) */
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      var r     = R_eq * (0.35 + Math.random() * 0.55);
      return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.cos(phi) * (R_polar / R_eq),
        z: r * Math.sin(phi) * Math.sin(theta)
      };
    }
    window._karafuruFwPickOrigin = _fwPickOrigin;

    function emitScreenSparks(localPos) {
      /* Still callable from showVideoOnScreenPlanes — picks the next idle slot */
      var fw = window._karafuruFireworks;
      if (!fw) return;
      for (var b = 0; b < fw.bursts.length; b++) {
        if (!fw.bursts[b].active) {
          var br = fw.bursts[b];
          br.active = true;
          br.startTime = performance.now();
          br.originX = localPos.x; br.originY = localPos.y; br.originZ = localPos.z;
          br.color = FW_COLORS[Math.floor(Math.random() * FW_COLORS.length)];
          for (var si = 0; si < FW_SPARKS_PER_BURST; si++) {
            var base = b * FW_SPARKS_PER_BURST * 3 + si * 3;
            fw.pos[base]     = localPos.x;
            fw.pos[base + 1] = localPos.y;
            fw.pos[base + 2] = localPos.z;
            var fwSpeedMult = (typeof window.paradeFireworksSpeed !== 'undefined' && window.paradeFireworksSpeed != null) ? window.paradeFireworksSpeed : 1;
            var speed = FW_BURST_V * fwSpeedMult * (0.3 + Math.random() * 0.7);
            var th = Math.random() * Math.PI * 2;
            var ph = Math.acos(2 * Math.random() - 1);
            br.vels[si * 3]     = speed * Math.sin(ph) * Math.cos(th);
            br.vels[si * 3 + 1] = speed * Math.cos(ph);
            br.vels[si * 3 + 2] = speed * Math.sin(ph) * Math.sin(th);
          }
          fw.geo.attributes.position.needsUpdate = true;
          break;
        }
      }
    }
    window._karafuruEmitSparks = emitScreenSparks;

    carousel.add(globeGroup);
    window.paradeGlobeGroup = globeGroup;
    window.paradeOuterSphere = innerSphere; /* the background video sphere (BackSide) */
    window.paradeInnerSphereTex = innerSphereTex;
    window.paradeFloatingScreenGroup = globeGroup;
    window.paradeGlobeTexs = globeTexs;
    window.paradeGlobeMats = globeMats;
    window.paradeGlobeLogoMats = globeLogoMats;
    window.paradeGlobeLogoPlanes = globeLogoPlanes;
    if (!window.paradeGlobeDissolveStart) window.paradeGlobeDissolveStart = [0, 0, 0, 0, 0, 0, 0, 0];
    if (!window.paradeGlobeVideoFadeStart) window.paradeGlobeVideoFadeStart = [0, 0, 0, 0, 0, 0, 0, 0];
    window.paradeAllowGlobeVideosToPlay = function() {
      [globeVid1a, globeVid1b, globeVid2a, globeVid2b].forEach(function(v) { v.play().catch(function() {}); });
    };
    window.paradeGlobeShowingLogo = showingLogo;
    window.paradeGlobeVideos = globeVideos;
    window.paradeGlobeUniqueVids = [globeVid1a, globeVid1b, globeVid2a, globeVid2b];
    window.paradeGlobeTex1 = globeTexs[0];
    window.paradeGlobeTex2 = globeTexs[1];
    window.paradeGlobeVideo1 = video1;
    window.paradeGlobeVideo2 = video2;
  })();

  var karafuruContainer = new THREE.Group();
  karafuruContainer.position.set(0, 50 - 200 - 300 - 300 - 350 - 50, 0);
  carousel.add(karafuruContainer);
  karafuruContainer.scale.set(1.0125, 1.0125, 1.0125);
  window.paradeKarafuruContainer = karafuruContainer;

  var guideCylinderRadius = 1000;
  var guideCylinderHeight = 10000;
  var guideCylinderInnerRadius = guideCylinderRadius - 25;
  var guideCylinderGeo = new THREE.CylinderGeometry(guideCylinderRadius, guideCylinderRadius, guideCylinderHeight, 32, 1, false);
  var guideCylinderMat = new THREE.MeshBasicMaterial({
    color: 0xff6fb0,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  });
  var guideCylinder = new THREE.Mesh(guideCylinderGeo, guideCylinderMat);
  guideCylinder.position.set(0, discGroup.position.y, 0);
  guideCylinder.renderOrder = 998;
  carousel.add(guideCylinder);

  var guideCylinderInner = new THREE.Mesh(guideCylinderGeo, guideCylinderMat);
  guideCylinderInner.scale.set(guideCylinderInnerRadius / guideCylinderRadius, 1, guideCylinderInnerRadius / guideCylinderRadius);
  guideCylinderInner.position.set(0, discGroup.position.y, 0);
  guideCylinderInner.renderOrder = 997;
  carousel.add(guideCylinderInner);

  const ROTATE_STEP = Math.PI / 36;
  const REF_SIZE = 500;
  const CAROUSEL_SIZE_MULT = 2.8;
  const ORBIT_LIMIT = 10 * Math.PI / 180;
  const ORBIT_LIMIT_V = 10 * Math.PI / 180;
  const ORBIT_SMOOTH = 2;
  var CONTENT_TOP_Y = 326 - 200 - 300 - 300 - 350;
  var CONTENT_BOTTOM_Y = discGroup.position.y - towerHeight / 2 - 200;
  var CONTENT_SPAN = CONTENT_TOP_Y - CONTENT_BOTTOM_Y;
  var CONTENT_CENTER_Y = (CONTENT_TOP_Y + CONTENT_BOTTOM_Y) / 2;
  var CLEARANCE_RATIO = 0.04;

  let orbitAngleH = 0;
  let orbitAngleV = 0;
  let orbitAngleHTarget = 0;
  let orbitAngleVTarget = 0;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragStartOrbitH = 0;
  let dragStartOrbitV = 0;

  function applyOrbitCamera() {
    var r = currentCameraDist;
    var cosV = Math.cos(orbitAngleV);
    var sinV = Math.sin(orbitAngleV);
    var cosH = Math.cos(orbitAngleH);
    var sinH = Math.sin(orbitAngleH);
    camera.position.x = r * cosV * sinH;
    camera.position.y = r * sinV;
    camera.position.z = r * cosV * cosH;
    lookAtTarget.set(0, 0, 0);
    camera.lookAt(lookAtTarget);
  }

  function updateLayout() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (!w || !h) return;
    var size = Math.min(w, h);
    var visibleHeight = 2 * CAMERA_DIST * Math.tan((CAMERA_FOV * Math.PI / 180) / 2);
    var clearance = CLEARANCE_RATIO;
    var sizeMult = CAROUSEL_SIZE_MULT;
    if (getDeviceTier() === 'mobile') {
      clearance = 0.02; /* tighter so globe + marquee cylinder fill more of view */
      sizeMult = CAROUSEL_SIZE_MULT * 1.15; /* scale up so visible components stay large with inner sphere */
    }
    var maxScaleForFit = visibleHeight * (1 - 2 * clearance) / CONTENT_SPAN;
    var scale = sizeMult * size / REF_SIZE;
    scale = Math.min(scale, maxScaleForFit);
    scale = Math.max(0.6, Math.min(scale, 12));
    carousel.scale.set(scale, scale, scale);
    carousel.position.y = -CONTENT_CENTER_Y * scale;
    if (!(renderer.xr && renderer.xr.isPresenting)) applyOrbitCamera();
  }

  function runAnimation() {
    var s = getSize();
    var w = s.w, h = s.h;
    if (w && h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    updateLayout(); /* apply scale on initial load (e.g. mobile) so assembly fits screen */
    var lastTime = performance.now();
    function animate() {
      var inXR = renderer.xr && renderer.xr.isPresenting;
      var xrParticleMult = inXR ? 0.5 : 1;
      var isMobile = getDeviceTier() === 'mobile';
      var particleDensityMult = (window.paradeParticleDensityMultiplier != null ? window.paradeParticleDensityMultiplier : 1);
      var globalLumMult = (window.paradeGlobalLuminosityMultiplier != null ? window.paradeGlobalLuminosityMultiplier : 1);
      /* Mobile: hide particle fields and tower; on desktop leave visibility to debug panel toggles */
      if (isMobile) {
        if (window.paradeDustPoints) window.paradeDustPoints.visible = false;
        if (window.paradeTowerGroup) window.paradeTowerGroup.visible = false;
        if (window.paradeWaterfallPoints) window.paradeWaterfallPoints.visible = false;
        if (window.paradeFireworksMesh) window.paradeFireworksMesh.visible = false;
        if (window.paradeRingDustFields && window.paradeRingDustFields.length === 4) {
          for (var rfi = 0; rfi < 4; rfi++) { if (window.paradeRingDustFields[rfi]) window.paradeRingDustFields[rfi].visible = false; }
        }
        if (window.paradeCardRingDust) window.paradeCardRingDust.visible = false;
        if (window.paradeTopDustPoints) window.paradeTopDustPoints.visible = false;
        if (window.paradeTopDustAbove) window.paradeTopDustAbove.visible = false;
        if (window.paradeTopDustAbove2) window.paradeTopDustAbove2.visible = false;
      } else {
        if (window.paradeTowerGroup && window.paradeTowerVisible !== undefined) window.paradeTowerGroup.visible = window.paradeTowerVisible !== false;
      }
      if (!inXR) window.__paradeRectRaf = requestAnimationFrame(animate);
      var now = performance.now();
      var uTimeSec = now * 0.001;
      /* Keep cylinder video textures in sync with playback to avoid stutter */
      if (video1 && video1.readyState >= 2 && cylinderVideoTex1) cylinderVideoTex1.needsUpdate = true;
      if (video2 && video2.readyState >= 2 && cylinderVideoTex2) cylinderVideoTex2.needsUpdate = true;
      if (window.paradeHolographicMaterials) {
        for (var hi = 0; hi < window.paradeHolographicMaterials.length; hi++) {
          var hm = window.paradeHolographicMaterials[hi];
          if (hm.uniforms && hm.uniforms.uTime) hm.uniforms.uTime.value = uTimeSec * 2;
        }
      }
      /* Dust shader time + luminosity + drawRange + color tint */
      var gdQ = (window.paradeGlobeDustQuantity != null ? window.paradeGlobeDustQuantity : 1);
      var gdL = (window.paradeGlobeDustLuminosity != null ? window.paradeGlobeDustLuminosity : 1);
      var gdS = (window.paradeGlobeDustSpeed != null ? window.paradeGlobeDustSpeed : 1);
      var gdSz = (window.paradeGlobeDustSize != null ? window.paradeGlobeDustSize : 1);
      if (window.paradeDustMaterial && window.paradeDustMaterial.uniforms) {
        if (window.paradeDustMaterial.uniforms.uTime) window.paradeDustMaterial.uniforms.uTime.value = uTimeSec * gdS;
        if (window.paradeDustMaterial.uniforms.uLuminosity) window.paradeDustMaterial.uniforms.uLuminosity.value = gdL * globalLumMult;
        if (window.paradeDustMaterial.uniforms.uSize) window.paradeDustMaterial.uniforms.uSize.value = gdSz;
        if (window.paradeDustMaterial.uniforms.uColorTint && window.paradeGlobeDustColor != null) {
          var _gc = new THREE.Color(window.paradeGlobeDustColor);
          window.paradeDustMaterial.uniforms.uColorTint.value.set(_gc.r, _gc.g, _gc.b);
        }
      }
      if (window.paradeDustPoints && window.paradeGlobeDustCount != null) {
        window.paradeDustPoints.geometry.setDrawRange(0, Math.floor(window.paradeGlobeDustCount * Math.max(0, Math.min(1, gdQ)) * xrParticleMult * particleDensityMult));
      }
      var rdRot = (window.paradeRingDustRotationSpeed != null ? window.paradeRingDustRotationSpeed : 1);
      var rdS = (window.paradeRingDustSpeed != null ? window.paradeRingDustSpeed : 1);
      var rdL = (window.paradeRingDustLuminosity != null ? window.paradeRingDustLuminosity : 1) * 4.5 * globalLumMult; /* scale 0–2 slider to 0–9, default 4.5 */
      var rdQ = (window.paradeRingDustQuantity != null ? window.paradeRingDustQuantity : 1);
      var rdSz = (window.paradeRingDustSize != null ? window.paradeRingDustSize : 1);
      if (window.paradeRingDustFields && window.paradeRingDustFields.length === 4) {
        var ringCount = window.paradeRingDustCount != null ? window.paradeRingDustCount : 5000;
        var drawCount = Math.floor(ringCount * Math.max(0, Math.min(1, rdQ)) * xrParticleMult * particleDensityMult);
        for (var rf = 0; rf < 4; rf++) {
          var ringDust = window.paradeRingDustFields[rf];
          if (ringDust) {
            if (ringDust.geometry) ringDust.geometry.setDrawRange(0, drawCount);
            if (ringDust.material && ringDust.material.uniforms) {
              if (ringDust.material.uniforms.uTime) ringDust.material.uniforms.uTime.value = uTimeSec * rdS;
              if (ringDust.material.uniforms.uLuminosity) ringDust.material.uniforms.uLuminosity.value = rdL;
              if (ringDust.material.uniforms.uSize) ringDust.material.uniforms.uSize.value = rdSz;
            }
          }
        }
      }
      if (window.paradeCardRingDust && window.paradeCardRingDust.material && window.paradeCardRingDust.material.uniforms) {
        if (window.paradeCardRingDust.material.uniforms.uTime) window.paradeCardRingDust.material.uniforms.uTime.value = uTimeSec * rdS;
        if (window.paradeCardRingDust.material.uniforms.uLuminosity) window.paradeCardRingDust.material.uniforms.uLuminosity.value = rdL;
        if (window.paradeCardRingDust.material.uniforms.uSize) window.paradeCardRingDust.material.uniforms.uSize.value = rdSz;
      }
      var tdRot = (window.paradeTopDustRotationSpeed != null ? window.paradeTopDustRotationSpeed : 1);
      var tdS = (window.paradeTopDustSpeed != null ? window.paradeTopDustSpeed : 1);
      var tdL = (window.paradeTopDustLuminosity != null ? window.paradeTopDustLuminosity : 1) * 4.5 * globalLumMult; /* scale 0–2 slider to 0–9, default 4.5 */
      var tdQ = (window.paradeTopDustQuantity != null ? window.paradeTopDustQuantity : 1);
      var tdSz = (window.paradeTopDustSize != null ? window.paradeTopDustSize : 1);
      var topDustMeshes = [window.paradeTopDustPoints, window.paradeTopDustAbove, window.paradeTopDustAbove2];
      var topCount = window.paradeTopDustCount != null ? window.paradeTopDustCount : 3500;
      var topDrawCount = Math.floor(topCount * Math.max(0, Math.min(1, tdQ)) * xrParticleMult * particleDensityMult);
      for (var tm = 0; tm < topDustMeshes.length; tm++) {
        var tmesh = topDustMeshes[tm];
        if (tmesh) {
          if (tmesh.geometry) tmesh.geometry.setDrawRange(0, topDrawCount);
          if (tmesh.material && tmesh.material.uniforms) {
            if (tmesh.material.uniforms.uTime) tmesh.material.uniforms.uTime.value = uTimeSec * tdS;
            if (tmesh.material.uniforms.uLuminosity) tmesh.material.uniforms.uLuminosity.value = tdL;
            if (tmesh.material.uniforms.uSize) tmesh.material.uniforms.uSize.value = tdSz;
          }
        }
      }
      if (window.paradeTopDustMaterial && window.paradeTopDustMaterial.uniforms) {
        if (window.paradeTopDustMaterial.uniforms.uTime) window.paradeTopDustMaterial.uniforms.uTime.value = uTimeSec * tdS;
        if (window.paradeTopDustMaterial.uniforms.uLuminosity) window.paradeTopDustMaterial.uniforms.uLuminosity.value = tdL;
        if (window.paradeTopDustMaterial.uniforms.uSize) window.paradeTopDustMaterial.uniforms.uSize.value = tdSz;
      }
      /* Slowly rotate dust fields for ambient drift */
      if (window.paradeRingDustFields && window.paradeRingDustFields.length === 4) {
        var d = (delta || 0.016) * rdRot;
        for (var rf = 0; rf < 4; rf++) {
          var ringDust = window.paradeRingDustFields[rf];
          if (ringDust) ringDust.rotation.y += (rf % 2 === 0 ? -0.03 : 0.03) * d;
        }
      }
      var gdRot = (window.paradeGlobeDustRotationSpeed != null ? window.paradeGlobeDustRotationSpeed : 1);
      if (window.paradeDustPoints) {
        window.paradeDustPoints.rotation.y += 0.03 * (delta || 0.016) * gdRot;
      }
      if (window.paradeTopDustPoints) {
        window.paradeTopDustPoints.rotation.y += 0.02 * (delta || 0.016) * tdRot;
      }
      if (window.paradeTopDustAbove) {
        window.paradeTopDustAbove.rotation.y -= 0.02 * (delta || 0.016) * tdRot;
      }
      if (window.paradeTopDustAbove2) {
        window.paradeTopDustAbove2.rotation.y += 0.02 * (delta || 0.016) * tdRot;
      }
      /* Fireworks tick — auto-fire + update all burst slots */
      if (window._karafuruFireworks) {
        var fw = window._karafuruFireworks;
        var fwSz = (window.paradeFireworksSize != null ? window.paradeFireworksSize : 1);
        if (fw.mat) fw.mat.size = 14000 * fwSz;
        var _fdt = Math.min(delta || 0.016, 0.05);
        var _fwDur = fw.burstDur; /* 3200ms */
        var _fwSpc = fw.sparksPerBurst; /* 30 */
        var anyDirty = false;
        for (var _b = 0; _b < fw.bursts.length; _b++) {
          var br = fw.bursts[_b];
          /* Auto-fire: trigger a new burst at random intervals */
          if (!br.active && now >= br.nextFireTime) {
            if (window._karafuruEmitSparks && window._karafuruFwPickOrigin) {
              window._karafuruEmitSparks(window._karafuruFwPickOrigin());
            }
            /* Schedule next auto-fire 0.5–2s from now */
            br.nextFireTime = now + 500 + Math.random() * 1500;
          }
          if (!br.active) continue;
          var _be = now - br.startTime;
          if (_be >= _fwDur) {
            /* Burst expired — park particles far below scene */
            br.active = false;
            var base0 = _b * _fwSpc * 3;
            for (var _pi = 0; _pi < _fwSpc; _pi++) {
              fw.pos[base0 + _pi * 3]     = 0;
              fw.pos[base0 + _pi * 3 + 1] = fw.parkY;
              fw.pos[base0 + _pi * 3 + 2] = 0;
            }
            anyDirty = true;
            br.nextFireTime = now + 400 + Math.random() * 800;
          } else {
            /* Move particles outward; velocity decays with a drag curve */
            var _bt = _be / _fwDur;
            var drag = Math.pow(1 - _bt, 0.4);
            var base1 = _b * _fwSpc * 3;
            for (var _si = 0; _si < _fwSpc; _si++) {
              var _pi2 = base1 + _si * 3;
              fw.pos[_pi2]     += br.vels[_si * 3]     * drag * _fdt;
              fw.pos[_pi2 + 1] += br.vels[_si * 3 + 1] * drag * _fdt;
              fw.pos[_pi2 + 2] += br.vels[_si * 3 + 2] * drag * _fdt;
            }
            anyDirty = true;
            /* Fade: bright flash at start, slow sparkle fade to end */
            var fadeT = _bt < 0.15 ? 1.0 : 1.0 - (_bt - 0.15) / 0.85;
            fw.mat.opacity = Math.max(0, fadeT * fadeT * 0.92);
            fw.mat.color.setHex(br.color);
          }
        }
        if (anyDirty) fw.geo.attributes.position.needsUpdate = true;
      }
      var delta = (now - lastTime) / 1000;
      lastTime = now;
      /* Waterfall particle physics update */
      // #region agent log
      if (!window._wfAnimLog) {
        window._wfAnimLog = true;
        console.warn('[WF-DEBUG] Animate guard:', {hasData:!!window.paradeWaterfallData, hasPoints:!!window.paradeWaterfallPoints, delta:delta});
      }
      // #endregion
      if (window.paradeWaterfallData && window.paradeWaterfallPoints) {
        var wData = window.paradeWaterfallData;
        var wPos = wData.positions;
        var wVel = wData.velocities;
        var wLife = wData.lifetimes;
        var wAngles = wData.angles;
        var wDelta = Math.min(delta, 0.05);
        var WF_START_Y = window.paradeWaterfallData.startY || 1000;
        var WF_END_Y = window.paradeWaterfallData.endY || -400;
        var WF_GRAVITY = -3;
        var WF_MAX_VEL = -80;
        var WF_DRIFT_AMP_X = 40;
        var WF_DRIFT_AMP_Z = 30;
        
        var wfSpeed = (window.paradeWaterfallSpeed != null ? window.paradeWaterfallSpeed : 1);
        var wfL = (window.paradeWaterfallLuminosity != null ? window.paradeWaterfallLuminosity : 1) * 2.25; /* scale to match DUST_LUMINOSITY*0.5 default */
        var wfQ = (window.paradeWaterfallQuantity != null ? window.paradeWaterfallQuantity : 1);
        var wfSz = (window.paradeWaterfallSize != null ? window.paradeWaterfallSize : 1);
        if (window.paradeWaterfallPoints.material.uniforms) {
          window.paradeWaterfallPoints.material.uniforms.uTime.value = uTimeSec;
        if (window.paradeWaterfallPoints.material.uniforms.uLuminosity) window.paradeWaterfallPoints.material.uniforms.uLuminosity.value = wfL * globalLumMult;
        if (window.paradeWaterfallPoints.material.uniforms.uSize) window.paradeWaterfallPoints.material.uniforms.uSize.value = wfSz;
        }
        if (window.paradeWaterfallPoints.geometry && window.paradeWaterfallCount != null) {
          window.paradeWaterfallPoints.geometry.setDrawRange(0, Math.floor(window.paradeWaterfallCount * Math.max(0, Math.min(1, wfQ)) * xrParticleMult * particleDensityMult));
        }
        for (var wp = 0; wp < wData.count; wp++) {
          var idx = wp * 3;
          wLife[wp] += wDelta;

          wVel[idx + 1] += WF_GRAVITY * wDelta;
          if (wVel[idx + 1] < WF_MAX_VEL) wVel[idx + 1] = WF_MAX_VEL;

          var wDriftX = Math.sin(wLife[wp] * 1.2 + wAngles[wp]) * WF_DRIFT_AMP_X * wDelta * wfSpeed;
          var wDriftZ = Math.cos(wLife[wp] * 0.9 + wAngles[wp] * 0.7) * WF_DRIFT_AMP_Z * wDelta * wfSpeed;

          wPos[idx]     += wDriftX;
          wPos[idx + 1] += wVel[idx + 1] * wDelta * wfSpeed;
          wPos[idx + 2] += wDriftZ;
          
          if (wPos[idx + 1] < WF_END_Y) {
            var rAngle = Math.random() * Math.PI * 2;
            var rR = 100 + Math.random() * 850;
            wPos[idx]     = rR * Math.cos(rAngle);
            wPos[idx + 1] = WF_START_Y + Math.random() * 50;
            wPos[idx + 2] = rR * Math.sin(rAngle);
            wVel[idx + 1] = -20 - Math.random() * 20;
            wAngles[wp] = Math.random() * Math.PI * 2;
            wLife[wp] = 0;
          }
        }
        
        window.paradeWaterfallPoints.geometry.attributes.position.needsUpdate = true;
        // #region agent log
        if (!window._wfTickLog) window._wfTickLog = 0;
        if (window._wfTickLog < 3) {
          window._wfTickLog++;
          window._wfTickData = {delta:delta,wDelta:wDelta,pos0:[wPos[0],wPos[1],wPos[2]],vel0y:wVel[1],isNaN:isNaN(wPos[0])||isNaN(wPos[1]),scale:[carousel.scale.x,carousel.scale.y,carousel.scale.z],carouselY:carousel.position.y,vis:window.paradeWaterfallPoints.visible,parent:!!window.paradeWaterfallPoints.parent};
          console.warn('[WF-DEBUG] Tick #' + window._wfTickLog + ':', JSON.stringify(window._wfTickData));
        }
        // #endregion
      }
      if (!inXR) {
        var orbitT = 1 - Math.exp(-ORBIT_SMOOTH * delta);
        orbitAngleH += (orbitAngleHTarget - orbitAngleH) * orbitT;
        orbitAngleV += (orbitAngleVTarget - orbitAngleV) * orbitT;
        orbitAngleH = Math.max(-ORBIT_LIMIT, Math.min(ORBIT_LIMIT, orbitAngleH));
        orbitAngleV = Math.max(-ORBIT_LIMIT_V, Math.min(ORBIT_LIMIT_V, orbitAngleV));
      }
      /* updateLayout() called only on resize/orientationchange, not every frame */
      /* Text groups: visibility, scale, color from toggles (wrapped so a throw cannot freeze the loop) */
      try {
        var d = (typeof delta === 'number' && !isNaN(delta)) ? delta : 0.016;
        var wVis = window.paradeWelcomeVisible !== false;
        var wSz = (window.paradeWelcomeSize != null ? window.paradeWelcomeSize : 1);
        var wSpd = (window.paradeWelcomeSpinSpeed != null ? window.paradeWelcomeSpinSpeed : 0.075);
        var wDir = (window.paradeWelcomeSpinDir != null ? window.paradeWelcomeSpinDir : -1);
        if (window.paradeWelcomeToGroup) {
          window.paradeWelcomeToGroup.visible = wVis;
          if (window.paradeWelcomeToGroup.scale && window.paradeWelcomeToGroup.scale.setScalar) window.paradeWelcomeToGroup.scale.setScalar(wSz);
          window.paradeWelcomeToGroup.rotation.y += wDir * wSpd * d;
        }
        var woVis = window.paradeWorldVisible !== false;
        var woSz = (window.paradeWorldSize != null ? window.paradeWorldSize : 1);
        var woSpd = (window.paradeWorldSpinSpeed != null ? window.paradeWorldSpinSpeed : 0.065625);
        var woDir = (window.paradeWorldSpinDir != null ? window.paradeWorldSpinDir : 1);
        if (window.paradeWorldOfGroup) {
          window.paradeWorldOfGroup.visible = woVis;
          if (window.paradeWorldOfGroup.scale && window.paradeWorldOfGroup.scale.setScalar) window.paradeWorldOfGroup.scale.setScalar(woSz);
          window.paradeWorldOfGroup.rotation.y += woDir * woSpd * d;
        }
        if (window.paradeDiscRotateGroup && window.paradeDiscRotateGroup.rotation) {
          window.paradeDiscRotateGroup.rotation.y -= woDir * woSpd * d;
        }
        var kVis = window.paradeKarafuruVisible !== false;
        var kSz = (window.paradeKarafuruSize != null ? window.paradeKarafuruSize : 1);
        var kSpd = (window.paradeKarafuruSpinSpeed != null ? window.paradeKarafuruSpinSpeed : 1.875);
        var kDir = (window.paradeKarafuruSpinDir != null ? window.paradeKarafuruSpinDir : -1);
        if (window.paradeKarafuruOrbitGroup) {
          window.paradeKarafuruOrbitGroup.visible = kVis;
          if (window.paradeKarafuruOrbitGroup.scale && window.paradeKarafuruOrbitGroup.scale.setScalar) window.paradeKarafuruOrbitGroup.scale.setScalar(kSz);
          var theta = window.paradeKarafuruOrbitGroup.rotation.y;
          var speedFactor = 1 - 0.5 * Math.cos(2 * theta);
          var degPerSec = kSpd * speedFactor * kDir;
          window.paradeKarafuruOrbitGroup.rotation.y += (degPerSec * Math.PI / 180) * d;
        }
        var xlVis = window.paradeKarafuruCopyVisible !== false;
        var xlSz = (window.paradeKarafuruCopySize != null ? window.paradeKarafuruCopySize : 1.4);
        var xlSpd = (window.paradeKarafuruCopySpinSpeed != null ? window.paradeKarafuruCopySpinSpeed : 1.875);
        var xlDir = (window.paradeKarafuruCopySpinDir != null ? window.paradeKarafuruCopySpinDir : -1);
        if (window.paradeKarafuruOrbitGroupCopy) {
          window.paradeKarafuruOrbitGroupCopy.visible = xlVis;
          if (window.paradeKarafuruOrbitGroupCopy.scale && window.paradeKarafuruOrbitGroupCopy.scale.setScalar) window.paradeKarafuruOrbitGroupCopy.scale.setScalar(xlSz);
          var thetaXl = window.paradeKarafuruOrbitGroupCopy.rotation.y;
          var speedFactorXl = 1 - 0.5 * Math.cos(2 * thetaXl);
          var degPerSecXl = xlSpd * speedFactorXl * xlDir;
          window.paradeKarafuruOrbitGroupCopy.rotation.y += (degPerSecXl * Math.PI / 180) * d;
        }
        if (window.paradeWelcomeMaterials && Array.isArray(window.paradeWelcomeMaterials) && window.paradeWelcomeMaterials.length > 0) {
          var wCol = (window.paradeWelcomeColor != null ? window.paradeWelcomeColor : 0x28EDED);
          for (var wi = 0; wi < window.paradeWelcomeMaterials.length; wi++) {
            var wm = window.paradeWelcomeMaterials[wi];
            if (wm && wm.uniforms && wm.uniforms.uColor && wm.uniforms.uColor.value && typeof wm.uniforms.uColor.value.setHex === 'function') {
              wm.uniforms.uColor.value.setHex(wCol);
            }
          }
        }
        if (window.paradeWorldOfMaterials && Array.isArray(window.paradeWorldOfMaterials) && window.paradeWorldOfMaterials.length > 0) {
          var woCol = (window.paradeWorldColor != null ? window.paradeWorldColor : 0xFF6FB0);
          for (var woi = 0; woi < window.paradeWorldOfMaterials.length; woi++) {
            var wom = window.paradeWorldOfMaterials[woi];
            if (wom && wom.uniforms && wom.uniforms.uColor && wom.uniforms.uColor.value && typeof wom.uniforms.uColor.value.setHex === 'function') {
              wom.uniforms.uColor.value.setHex(woCol);
            }
          }
        }
        if (window.paradeKarafuruMaterials && Array.isArray(window.paradeKarafuruMaterials) && window.paradeKarafuruMaterials.length > 0) {
          var kA = (window.paradeKarafuruColorA != null ? window.paradeKarafuruColorA : 0x28EDED);
          var kB = (window.paradeKarafuruColorB != null ? window.paradeKarafuruColorB : 0xFF6FB0);
          for (var ki = 0; ki < window.paradeKarafuruMaterials.length; ki++) {
            var km = window.paradeKarafuruMaterials[ki];
            if (km && km.uniforms) {
              if (km.uniforms.uColorA && km.uniforms.uColorA.value && typeof km.uniforms.uColorA.value.setHex === 'function') km.uniforms.uColorA.value.setHex(kA);
              if (km.uniforms.uColorB && km.uniforms.uColorB.value && typeof km.uniforms.uColorB.value.setHex === 'function') km.uniforms.uColorB.value.setHex(kB);
            }
          }
        }
      } catch (e) {
        if (window.console && typeof window.console.warn === 'function') window.console.warn('[parade] text group update:', e);
      }
      carousel.rotation.y = 0;
      /* Inner sphere screens: oscillate between ±10°, slow and reverse at limits. */
      if (window.paradeGlobeGroup) {
        var GLOBE_ANGLE_LIMIT = 10;
        var GLOBE_ANGLE_SPEED = 8 * 0.2 * 0.25; /* 5% of original (20% then -75%) */
        if (window.paradeGlobeGroupAngleDeg === undefined) {
          window.paradeGlobeGroupAngleDeg = 0;
          window.paradeGlobeGroupDirection = 1;
        }
        var distToLimit = window.paradeGlobeGroupDirection > 0
          ? (GLOBE_ANGLE_LIMIT - window.paradeGlobeGroupAngleDeg)
          : (window.paradeGlobeGroupAngleDeg - (-GLOBE_ANGLE_LIMIT));
        var ease = Math.max(0.2, Math.min(1, distToLimit / 4));
        window.paradeGlobeGroupAngleDeg += window.paradeGlobeGroupDirection * GLOBE_ANGLE_SPEED * ease * delta;
        if (window.paradeGlobeGroupAngleDeg >= GLOBE_ANGLE_LIMIT) {
          window.paradeGlobeGroupAngleDeg = GLOBE_ANGLE_LIMIT;
          window.paradeGlobeGroupDirection = -1;
        } else if (window.paradeGlobeGroupAngleDeg <= -GLOBE_ANGLE_LIMIT) {
          window.paradeGlobeGroupAngleDeg = -GLOBE_ANGLE_LIMIT;
          window.paradeGlobeGroupDirection = 1;
        }
        window.paradeGlobeGroup.rotation.y = window.paradeGlobeGroupAngleDeg * Math.PI / 180;
      }
      if (window.paradeOuterSphere) {
        /* Inner video sphere: counter-rotate vs globeGroup — visible parallax */
        window.paradeOuterSphere.rotation.y -= (0.36 * Math.PI / 180) * delta;
      }
      if (window.paradeGlobeShell) {
        /* Outer glow sphere: rotate opposite to inner sphere for sense of dimension */
        window.paradeGlobeShell.rotation.y += (0.4 * Math.PI / 180) * delta;
      }
      if (!inXR) applyOrbitCamera();
      var frameIndex = Math.floor(now / 16) | 0;
      if (frameIndex % 2 === 0 && window.paradeGlobeTexs) {
        for (var pt = 0; pt < window.paradeGlobeTexs.length; pt++) {
          var gtex = window.paradeGlobeTexs[pt];
          var gvid = gtex.image;
          if (gvid && gvid.readyState >= 2 && gvid.videoWidth > 0 && !gvid.paused && !gvid.ended) gtex.needsUpdate = true;
        }
      }
      if (frameIndex % 300 === 0 && window.paradeGlobeUniqueVids) {
        for (var wdi = 0; wdi < window.paradeGlobeUniqueVids.length; wdi++) {
          var wv = window.paradeGlobeUniqueVids[wdi];
          if (wv.paused && !wv.ended) wv.play().catch(function() {});
        }
      }
      if (frameIndex % 2 === 0 && window.paradeInnerSphereTex) {
        var isvid = window.paradeInnerSphereTex.image;
        if (isvid && isvid.readyState >= 2 && isvid.videoWidth > 0) window.paradeInnerSphereTex.needsUpdate = true;
      }
      if (window.paradeGlobeLogoPlanes && window.paradeGlobeDissolveStart) {
        var LOGO_DISSOLVE_MS = 2000;
        for (var di = 0; di < 8; di++) {
          /* Logo dissolve-in */
          var dstart = window.paradeGlobeDissolveStart[di];
          if (dstart > 0) {
            var delapsed = now - dstart;
            var targetOpacity = delapsed >= LOGO_DISSOLVE_MS ? 0.9 : 0.1 + (delapsed / LOGO_DISSOLVE_MS) * 0.8;
            for (var dp = 0; dp < window.paradeGlobeLogoPlanes.length; dp++) {
              var dentry = window.paradeGlobeLogoPlanes[dp];
              if (dentry.matIndex === di) dentry.mat.opacity = targetOpacity;
            }
            if (delapsed >= LOGO_DISSOLVE_MS) window.paradeGlobeDissolveStart[di] = 0;
          }
          /* Two-phase video transition — logo stays as watermark overlay:
             0–400ms  : logo holds at 0.9, video pre-warms invisibly
             400–800ms : logo fades from 0.9 → 0.55 (watermark level)
             600–1400ms: video fades in 0→0.9
             After TOTAL_MS: logo locked at 0.55 overlay, video at 0.9 behind it */
          if (window.paradeGlobeVideoFadeStart) {
            var vstart = window.paradeGlobeVideoFadeStart[di];
            if (vstart > 0) {
              var velapsed = now - vstart;
              var LOGO_HOLD   = 400;
              var LOGO_FADE   = 400;  /* fade from 0.9 down to watermark 0.55 */
              var LOGO_FINAL  = 0.55; /* watermark opacity — logo stays visible over video */
              var VID_START   = 600;
              var VID_IN      = 800;
              var TOTAL_MS    = VID_START + VID_IN;

              var logoOp;
              if (velapsed < LOGO_HOLD) {
                logoOp = 0.9;
              } else if (velapsed < LOGO_HOLD + LOGO_FADE) {
                var lf = (velapsed - LOGO_HOLD) / LOGO_FADE;
                logoOp = 0.9 - lf * (0.9 - LOGO_FINAL); /* ease to watermark level */
              } else {
                logoOp = LOGO_FINAL;
              }

              var vidOp;
              if (velapsed < VID_START) {
                vidOp = 0.01;
              } else if (velapsed < VID_START + VID_IN) {
                var vFrac = (velapsed - VID_START) / VID_IN;
                vidOp = vFrac * vFrac * 0.9;
              } else {
                vidOp = 0.9;
              }

              for (var vp = 0; vp < window.paradeGlobeLogoPlanes.length; vp++) {
                if (window.paradeGlobeLogoPlanes[vp].matIndex === di) {
                  window.paradeGlobeLogoPlanes[vp].mat.opacity = logoOp;
                }
              }
              if (window.paradeGlobeMats && window.paradeGlobeMats[di]) {
                window.paradeGlobeMats[di].opacity = vidOp;
              }
              if (velapsed >= TOTAL_MS) {
                window.paradeGlobeVideoFadeStart[di] = 0;
                /* Lock final state: logo at watermark, video at full */
                for (var vp2 = 0; vp2 < window.paradeGlobeLogoPlanes.length; vp2++) {
                  if (window.paradeGlobeLogoPlanes[vp2].matIndex === di) {
                    window.paradeGlobeLogoPlanes[vp2].mat.opacity = LOGO_FINAL;
                  }
                }
                if (window.paradeGlobeMats[di]) window.paradeGlobeMats[di].opacity = 0.9;
              }
            }
          }
        }
      }
      /* Card carousel tick */
      if (window._karafuruCardTick) window._karafuruCardTick(now, delta, uTimeSec);
      renderer.render(scene, camera);
    }
    window.__paradeAnimate = animate;
    animate();
  }

  function setupXRButton() {
    var btnContainer = document.getElementById('parade-xr-button');
    if (!btnContainer || !navigator.xr) return;
    navigator.xr.isSessionSupported('immersive-vr').then(function(supported) {
      if (!supported) return;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Enter VR';
      btn.setAttribute('aria-label', 'Enter VR');
      btn.className = 'kf-xr-btn';
      btn.addEventListener('click', function() {
        if (!window.paradeRenderer || !window.__paradeAnimate) return;
        navigator.xr.requestSession('immersive-vr', { optionalFeatures: ['local-floor'] }).then(function(session) {
          window.paradeRenderer.xr.setSession(session);
          window.paradeRenderer.setAnimationLoop(window.__paradeAnimate);
          session.addEventListener('end', function() {
            window.paradeRenderer.setAnimationLoop(null);
            if (window.__paradeAnimate) requestAnimationFrame(window.__paradeAnimate);
          });
        }).catch(function(err) {
          if (window.console && window.console.warn) window.console.warn('[parade] XR session failed:', err);
        });
      });
      btnContainer.appendChild(btn);
    }).catch(function() {});
  }

  /* ═══════════════════════════════════════════════════════════════════════
     HERO CARD CAROUSEL — integrated below the globe cylinder
     CARD_RING_Y  = discGroup.position.y - towerHeight/2 - 100  (within visible band)
     CARD_RING_RADIUS = 1300  (reduced so cards visible in camera view)
     Drag spins the ring. Click focuses a card + globe fades out.
  ═══════════════════════════════════════════════════════════════════════ */
  (function() {
    var cardConfig = window.PARADE_MEDALLIONS_COINS_CONFIG || {};
    var imageList = cardConfig.imageList || [];
    if (imageList.length === 0) return;
    /* Resolve card URLs from document base so assets/ matches server root (e.g. open at http://localhost:8765/ when server root is karafuru_marquee) */
    var cardBase = new URL('.', document.baseURI || window.location.href).href;
    function resolveCardUrl(relativePath) {
      if (!relativePath || relativePath.indexOf('http') === 0) return relativePath;
      return new URL(relativePath, cardBase).href;
    }
    var rearUrl = resolveCardUrl(cardConfig.rearUrl || '');
    /* Set to true to hide ring dust and confirm it's the glow source; set back to false after testing */
    var DEBUG_HIDE_RING_DUST = false;

    /* Card geometry constants — match tcg/catbotica_medallions.js exactly */
    var REF_SIL = 512;
    var cardWSil = REF_SIL;
    var contentHSil = REF_SIL;
    var thicknessSil = 4;
    var SILHOUETTE_SCALE = 0.9; /* increased from 0.4 so cards visible at marquee camera distance */
    var CARD_RING_RADIUS = 1300;
    /* Ring in lower visible band: midway between cylinder bottom and content bottom */
    var cylinderBottomY = discGroup.position.y - towerHeight / 2;
    var CARD_RING_Y = (CONTENT_BOTTOM_Y + cylinderBottomY) / 2 - 250;

    /* Card interaction state */
    var heroCardsGroup = new THREE.Group();
    heroCardsGroup.frustumCulled = false;
    heroCardsGroup.position.set(0, 0, 0); /* align ring axis with cylinder */
    carousel.add(heroCardsGroup);
    window.paradeHeroCardsGroup = heroCardsGroup;

    /* Dust particle field from TCG catbotica_medallions — fits hero card ring, same look (5000 pts, uTime sparkle) */
    var DUST_LUMINOSITY = 4.5;
    var dustCount = Math.max(1500, Math.floor(5000 * (window._particleMult != null ? window._particleMult : 1)));
    var dustPositions = new Float32Array(dustCount * 3);
    var dustColors = new Float32Array(dustCount * 3);
    var dustSizes = new Float32Array(dustCount);
    var dustPhases = new Float32Array(dustCount);
    var dustRadius = CARD_RING_RADIUS * 1.0;
    var cx = 0, cy = CARD_RING_Y + 100, cz = 0;
    for (var di = 0; di < dustCount; di++) {
      var r = dustRadius * Math.pow(Math.random(), 1.0);
      var th = Math.random() * Math.PI * 2;
      dustPositions[di * 3]     = cx + r * Math.cos(th);
      dustPositions[di * 3 + 1] = cy + (Math.random() - 0.5) * 240;
      dustPositions[di * 3 + 2] = cz + r * Math.sin(th);
      dustSizes[di] = 1 + Math.random() * 9;
      dustPhases[di] = Math.random() * Math.PI * 2;
      var normR = r / dustRadius;
      var n = Math.pow(1 - normR, 2);
      var alpha = 0.25 + 0.5 * n;
      dustColors[di * 3]     = alpha;
      dustColors[di * 3 + 1] = alpha;
      dustColors[di * 3 + 2] = alpha + 0.1;
    }
    var dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeom.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));
    dustGeom.setAttribute('size', new THREE.BufferAttribute(dustSizes, 1));
    dustGeom.setAttribute('phase', new THREE.BufferAttribute(dustPhases, 1));
    var dustCanvas = document.createElement('canvas');
    dustCanvas.width = 64; dustCanvas.height = 64;
    var dctx = dustCanvas.getContext('2d');
    var dg = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    dg.addColorStop(0, 'rgba(255,255,255,1)');
    dg.addColorStop(0.12, 'rgba(255,255,255,0.4)');
    dg.addColorStop(0.25, 'rgba(255,255,255,0)');
    dctx.fillStyle = dg; dctx.fillRect(0, 0, 64, 64);
    var dustTex = new THREE.CanvasTexture(dustCanvas);
    dustTex.needsUpdate = true;
    var dustVShader = [
      'attribute float size;',
      'attribute float phase;',
      'attribute vec3 color;',
      'uniform float uSize;',
      'varying vec3 vColor;',
      'varying float vPhase;',
      'void main() {',
      '  vColor = color;',
      '  vPhase = phase;',
      '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = 36.0 * size * uSize * (4000.0 / -mv.z);',
      '  gl_Position = projectionMatrix * mv;',
      '}'
    ].join('\n');
    var dustFShader = [
      'uniform float uTime;',
      'uniform sampler2D uMap;',
      'uniform float uLuminosity;',
      'varying vec3 vColor;',
      'varying float vPhase;',
      'void main() {',
      '  vec4 tex = texture2D(uMap, gl_PointCoord);',
      '  float sparkle = 0.8 + 0.4 * sin(uTime * 4.0 + vPhase);',
      '  gl_FragColor = vec4(vColor * uLuminosity, 0.88 * uLuminosity) * tex * sparkle;',
      '}'
    ].join('\n');

    var dustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: dustTex }, uLuminosity: { value: DUST_LUMINOSITY }, uSize: { value: 1.0 } },
      vertexShader: dustVShader,
      fragmentShader: dustFShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    var dustPoints = new THREE.Points(dustGeom, dustMat);
    dustPoints.frustumCulled = false;
    dustPoints.renderOrder = 0;
    dustPoints.visible = !DEBUG_HIDE_RING_DUST;
    heroCardsGroup.add(dustPoints);
    window.paradeCardRingDust = dustPoints;

    /* 3x duplicate of lower particle field below the existing one */
    var dustCopy1 = dustPoints.clone();
    dustCopy1.position.y = -400;
    dustCopy1.renderOrder = 0;
    dustCopy1.frustumCulled = false;
    dustCopy1.visible = !DEBUG_HIDE_RING_DUST;
    heroCardsGroup.add(dustCopy1);
    var dustCopy2 = dustPoints.clone();
    dustCopy2.position.y = -800;
    dustCopy2.renderOrder = 0;
    dustCopy2.frustumCulled = false;
    dustCopy2.visible = !DEBUG_HIDE_RING_DUST;
    heroCardsGroup.add(dustCopy2);
    var dustCopy3 = dustPoints.clone();
    dustCopy3.position.y = -1200;
    dustCopy3.renderOrder = 0;
    dustCopy3.frustumCulled = false;
    dustCopy3.visible = !DEBUG_HIDE_RING_DUST;
    heroCardsGroup.add(dustCopy3);
    window.paradeRingDustFields = [dustPoints, dustCopy1, dustCopy2, dustCopy3];
    window.paradeRingDustCount = dustCount;
    window.paradeRingDustQuantity = 0.2;
    window.paradeRingDustLuminosity = 1.0;
    window.paradeRingDustRotationSpeed = 1.0;
    window.paradeRingDustSpeed = 1.0;
    window.paradeRingDustSize = 1.0;

    /* Top particle field — same style, emanating from cylinder top */
    var topDustCount = Math.max(1000, Math.floor(3500 * (window._particleMult != null ? window._particleMult : 1)));
    var topDustY = discGroup.position.y + towerHeight / 2 + 400;
    var topDustRadius = discRadius * 1.05;
    var topPositions = new Float32Array(topDustCount * 3);
    var topColors = new Float32Array(topDustCount * 3);
    var topSizes = new Float32Array(topDustCount);
    var topPhases = new Float32Array(topDustCount);
    for (var ti = 0; ti < topDustCount; ti++) {
      var tr = topDustRadius * Math.pow(Math.random(), 0.7);
      var tth = Math.random() * Math.PI * 2;
      topPositions[ti * 3]     = tr * Math.cos(tth);
      topPositions[ti * 3 + 1] = topDustY + (Math.random() - 0.5) * 120;
      topPositions[ti * 3 + 2] = tr * Math.sin(tth);
      topSizes[ti] = 1 + Math.random() * 8;
      topPhases[ti] = Math.random() * Math.PI * 2;
      var tn = Math.pow(1 - tr / topDustRadius, 1.5);
      var ta = 0.3 + 0.5 * tn;
      topColors[ti * 3] = topColors[ti * 3 + 1] = topColors[ti * 3 + 2] = ta;
    }
    var topDustGeo = new THREE.BufferGeometry();
    topDustGeo.setAttribute('position', new THREE.BufferAttribute(topPositions, 3));
    topDustGeo.setAttribute('color', new THREE.BufferAttribute(topColors, 3));
    topDustGeo.setAttribute('size', new THREE.BufferAttribute(topSizes, 1));
    topDustGeo.setAttribute('phase', new THREE.BufferAttribute(topPhases, 1));
    var topDustMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: dustTex }, uLuminosity: { value: DUST_LUMINOSITY }, uSize: { value: 1.0 } },
      vertexShader: dustVShader,
      fragmentShader: dustFShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    var topDustPoints = new THREE.Points(topDustGeo, topDustMat);
    topDustPoints.frustumCulled = false;
    topDustPoints.renderOrder = 0;
    /* Top group: dust only — full-height guide cylinders provide contiguous magenta at top */
    var topParticleGroup = new THREE.Group();
    topParticleGroup.frustumCulled = false;
    topParticleGroup.add(topDustPoints);
    carousel.add(topParticleGroup);
    window.paradeTopDustPoints = topDustPoints;
    window.paradeTopDustMaterial = topDustMat;
    window.paradeTopParticleGroup = topParticleGroup;
    window.paradeTopDustCount = topDustCount;
    window.paradeTopDustQuantity = 0.2;
    window.paradeTopDustLuminosity = 1.0;
    window.paradeTopDustRotationSpeed = 1.0;
    window.paradeTopDustSpeed = 1.0;
    window.paradeTopDustSize = 1.0;

    /* Duplicate top particle field above the current one */
    var topDustAbove = topDustPoints.clone();
    topDustAbove.position.y = 450; /* 400 units above the current top field */
    topDustAbove.frustumCulled = false;
    topDustAbove.renderOrder = 0;
    carousel.add(topDustAbove);
    window.paradeTopDustAbove = topDustAbove;

    /* Second duplicate top particle field */
    var topDustAbove2 = topDustPoints.clone();
    topDustAbove2.position.y = 850; /* 400 units above topDustAbove */
    topDustAbove2.frustumCulled = false;
    topDustAbove2.renderOrder = 0;
    carousel.add(topDustAbove2);
    window.paradeTopDustAbove2 = topDustAbove2;
    window.paradeTopParticleFields = [topParticleGroup, topDustAbove, topDustAbove2];

    /* Cascading waterfall particle system */
    var waterfallCount = Math.max(600, Math.floor(2000 * (window._particleMult != null ? window._particleMult : 1)));
    var waterfallPositions = new Float32Array(waterfallCount * 3);
    var waterfallVelocities = new Float32Array(waterfallCount * 3);
    var waterfallColors = new Float32Array(waterfallCount * 3);
    var waterfallSizes = new Float32Array(waterfallCount);
    var waterfallPhases = new Float32Array(waterfallCount);
    var waterfallLifetimes = new Float32Array(waterfallCount);
    var waterfallAngles = new Float32Array(waterfallCount);
    
    var WF_INIT_START_Y = 1000;
    var WF_INIT_END_Y = -400;
    var WF_INIT_RADIUS = guideCylinderRadius + 50;
    
    for (var wi = 0; wi < waterfallCount; wi++) {
      var wAngle = Math.random() * Math.PI * 2;
      var wSpread = Math.random();
      var wStartY = WF_INIT_START_Y - wSpread * (WF_INIT_START_Y - WF_INIT_END_Y);
      var wR = 100 + Math.random() * 850;
      
      waterfallPositions[wi * 3]     = wR * Math.cos(wAngle);
      waterfallPositions[wi * 3 + 1] = wStartY;
      waterfallPositions[wi * 3 + 2] = wR * Math.sin(wAngle);
      
      waterfallVelocities[wi * 3]     = 0;
      waterfallVelocities[wi * 3 + 1] = -20 - Math.random() * 20;
      waterfallVelocities[wi * 3 + 2] = 0;
      
      waterfallSizes[wi] = (1.5 + Math.random() * 4) * 0.75;
      waterfallPhases[wi] = Math.random() * Math.PI * 2;
      waterfallLifetimes[wi] = Math.random() * 8;
      waterfallAngles[wi] = wAngle;
      
      var cyanBias = 0.4 + Math.random() * 0.4;
      waterfallColors[wi * 3]     = cyanBias * 0.55;
      waterfallColors[wi * 3 + 1] = cyanBias * 0.95;
      waterfallColors[wi * 3 + 2] = cyanBias * 1.1;
    }
    
    var waterfallGeo = new THREE.BufferGeometry();
    waterfallGeo.setAttribute('position', new THREE.BufferAttribute(waterfallPositions, 3));
    waterfallGeo.setAttribute('color', new THREE.BufferAttribute(waterfallColors, 3));
    waterfallGeo.setAttribute('size', new THREE.BufferAttribute(waterfallSizes, 1));
    waterfallGeo.setAttribute('phase', new THREE.BufferAttribute(waterfallPhases, 1));
    
    var waterfallMat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uMap: { value: dustTex }, uLuminosity: { value: DUST_LUMINOSITY * 0.5 }, uSize: { value: 1.0 } },
      vertexShader: dustVShader,
      fragmentShader: dustFShader,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending
    });
    
    var waterfallPoints = new THREE.Points(waterfallGeo, waterfallMat);
    waterfallPoints.frustumCulled = false;
    waterfallPoints.renderOrder = 999;
    waterfallPoints.visible = false; /* default off */
    carousel.add(waterfallPoints);
    
    window.paradeWaterfallPoints = waterfallPoints;
    window.paradeWaterfallCount = waterfallCount;
    window.paradeWaterfallQuantity = 1.0;
    window.paradeWaterfallLuminosity = 1.0;
    window.paradeWaterfallSpeed = 1.0;
    window.paradeWaterfallSize = 1.0;
    waterfallPoints.geometry.setDrawRange(0, waterfallCount);
    window.paradeWaterfallData = {
      positions: waterfallPositions,
      velocities: waterfallVelocities,
      lifetimes: waterfallLifetimes,
      angles: waterfallAngles,
      count: waterfallCount,
      startY: WF_INIT_START_Y,
      endY: WF_INIT_END_Y
    };
    // #region agent log
    window._wfDebug = {init:true,startY:WF_INIT_START_Y,endY:WF_INIT_END_Y,contentTop:CONTENT_TOP_Y,contentBot:CONTENT_BOTTOM_Y,contentCenter:CONTENT_CENTER_Y,pos0:[waterfallPositions[0],waterfallPositions[1],waterfallPositions[2]]};
    console.warn('[WF-DEBUG] Waterfall INIT:', JSON.stringify(window._wfDebug));
    // #endregion

    var closeupGroup = new THREE.Group();
    scene.add(closeupGroup);
    var closeupCenterWorld = new THREE.Vector3();

    var selectedCard = null;
    var cardMousedownTarget = null;
    var cardDragDist = 0;
    var cardDragStartX = 0;
    var cardDragStartRingY = 0;
    var cardIsDragging = false;
    var cardPointerNx = 0, cardPointerNy = 0;
    var closeupRotationX = 0, closeupRotationY = 0;
    var cardRaycaster = new THREE.Raycaster();
    var cardMouse = new THREE.Vector2();

    /* Camera state for two-mode system */
    var CARD_OVERVIEW_DIST = currentCameraDist; /* captured after runAnimation sets it */
    var cardCloseupDist = 0; /* computed dynamically */
    var cardCameraMode = 'overview'; /* 'overview' | 'closeup' */
    var cardLookAtTarget = new THREE.Vector3();
    var globeFadeTarget = 1; /* 1 = fully visible, 0 = faded out */
    var globeFadeCurrent = 1;

    /* Lights for card ring */
    var cardHighlightLight = new THREE.PointLight(0xffffff, 0.5, 8000);
    scene.add(cardHighlightLight);
    var cardAccentLight = new THREE.PointLight(0xFF6FB0, 0.25, 8000);
    scene.add(cardAccentLight);
    var cardFrontLight = new THREE.PointLight(0xffffff, 0, 3000);
    scene.add(cardFrontLight);

    /* Helpers */
    function getDominantColor(tex) {
      var img = tex && tex.image;
      if (!img || !img.width) return 0x28EDED;
      var w = Math.min(img.width, 128), h = Math.min(img.height, 128);
      var c = document.createElement('canvas'); c.width = w; c.height = h;
      var ctx = c.getContext('2d'); ctx.drawImage(img, 0, 0, w, h);
      var d; try { d = ctx.getImageData(0, 0, w, h).data; } catch(e) { return 0x28EDED; }
      var r=0,g=0,b=0,n=0;
      for (var i=0;i<d.length;i+=16) { if(d[i+3]<26) continue; r+=d[i];g+=d[i+1];b+=d[i+2];n++; }
      if (!n) return 0x28EDED;
      return (Math.round(r/n)<<16)|(Math.round(g/n)<<8)|Math.round(b/n);
    }

    function makeSilhouetteCard(frontTex, rearTex) {
      var rimColor = getDominantColor(frontTex);
      var edgeMat = new THREE.MeshBasicMaterial({ color: rimColor, side: THREE.DoubleSide, depthTest: true, depthWrite: true });
      var halfT = thicknessSil / 2, halfW = cardWSil / 2, halfH = contentHSil / 2;
      var group = new THREE.Group();
      group.renderOrder = 1;
      var frontMat = new THREE.MeshLambertMaterial({ map: frontTex, color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 1, alphaTest: 0.1, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 2, polygonOffsetUnits: 2 });
      var backMat  = new THREE.MeshLambertMaterial({ map: rearTex,  color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 1, alphaTest: 0.1, depthWrite: true, polygonOffset: true, polygonOffsetFactor: 6, polygonOffsetUnits: 6 });
      if (frontTex.colorSpace !== undefined) frontTex.colorSpace = THREE.SRGBColorSpace;
      if (rearTex.colorSpace  !== undefined) rearTex.colorSpace  = THREE.SRGBColorSpace;
      /* Rounded rect shape */
      var r = 32, s = new THREE.Shape();
      s.moveTo(-halfW+r,-halfH); s.lineTo(halfW-r,-halfH); s.quadraticCurveTo(halfW,-halfH,halfW,-halfH+r);
      s.lineTo(halfW,halfH-r); s.quadraticCurveTo(halfW,halfH,halfW-r,halfH);
      s.lineTo(-halfW+r,halfH); s.quadraticCurveTo(-halfW,halfH,-halfW,halfH-r);
      s.lineTo(-halfW,-halfH+r); s.quadraticCurveTo(-halfW,-halfH,-halfW+r,-halfH);
      var geom = new THREE.ExtrudeGeometry(s, { depth: thicknessSil, bevelEnabled: false });
      geom.translate(0, 0, -halfT);
      var invisCap = new THREE.MeshBasicMaterial({ visible: false, depthWrite: false, side: THREE.DoubleSide });
      group.add(new THREE.Mesh(geom, [invisCap, invisCap]));
      var front = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), frontMat);
      front.position.set(0, 0, halfT + 0.5); front.renderOrder = 2; group.add(front);
      var back = new THREE.Mesh(new THREE.PlaneGeometry(cardWSil, contentHSil), backMat);
      back.position.set(0, 0, -halfT - 0.5); back.rotation.y = Math.PI; back.renderOrder = 1; group.add(back);
      group.scale.set(SILHOUETTE_SCALE, SILHOUETTE_SCALE, SILHOUETTE_SCALE);
      return group;
    }

    function placeCard(mesh, i, total) {
      var angle = (i / Math.max(1, total)) * Math.PI * 2;
      mesh.position.set(CARD_RING_RADIUS * Math.sin(angle), CARD_RING_Y, CARD_RING_RADIUS * Math.cos(angle));
      mesh.rotation.order = 'YXZ';
      mesh.rotation.y = angle;
      mesh.userData.baseRotationY = angle;
      mesh.userData.index = i;
      mesh.userData.facingCamera = false;
      mesh.userData.spinStartTime = undefined;
    }

    function returnCardToRing(card) {
      if (!card) return;
      if (card.parent === closeupGroup) closeupGroup.remove(card);
      heroCardsGroup.add(card);
      placeCard(card, card.userData.index, imageList.length);
      card.scale.set(SILHOUETTE_SCALE, SILHOUETTE_SCALE, SILHOUETTE_SCALE);
    }

    /* Load cards */
    var cardLoader = new THREE.TextureLoader();
    cardLoader.setCrossOrigin('anonymous');
    var cardsLoaded = 0;
    var cardsTotal = imageList.length;

    function tryStartCardAnimation() {
      if (cardsLoaded >= cardsTotal) {
        /* Wire up back button */
        var backBtn = document.getElementById('closeup-back');
        if (backBtn) backBtn.addEventListener('click', function() {
          if (selectedCard) returnCardToRing(selectedCard);
          selectedCard = null;
          cardCameraMode = 'overview';
          globeFadeTarget = 1;
          closeupRotationX = 0; closeupRotationY = 0;
        });
        startCardLoop();
      }
    }

    if (rearUrl) {
      cardLoader.load(rearUrl, function(rearTex) {
        rearTex.needsUpdate = true;
        imageList.forEach(function(item, i) {
          var url = item.url || '';
          if (!url) { cardsLoaded++; tryStartCardAnimation(); return; }
          cardLoader.load(resolveCardUrl(url), function(frontTex) {
            frontTex.needsUpdate = true;
            var mesh = makeSilhouetteCard(frontTex, rearTex);
            mesh.userData.name = item.name || '';
            placeCard(mesh, i, imageList.length);
            heroCardsGroup.add(mesh);
            cardsLoaded++;
            tryStartCardAnimation();
          }, undefined, function() { cardsLoaded++; tryStartCardAnimation(); });
        });
      }, undefined, function() {
        /* rear failed — use placeholder */
        imageList.forEach(function(item, i) {
          var url = item.url || '';
          if (!url) { cardsLoaded++; tryStartCardAnimation(); return; }
          cardLoader.load(resolveCardUrl(url), function(frontTex) {
            frontTex.needsUpdate = true;
            var mesh = makeSilhouetteCard(frontTex, frontTex);
            mesh.userData.name = item.name || '';
            placeCard(mesh, i, imageList.length);
            heroCardsGroup.add(mesh);
            cardsLoaded++;
            tryStartCardAnimation();
          }, undefined, function() { cardsLoaded++; tryStartCardAnimation(); });
        });
      });
    }

    /* Collect all meshes in heroCardsGroup for raycasting */
    function getCardMeshes() {
      var meshes = [];
      heroCardsGroup.children.forEach(function(card) {
        card.traverse(function(obj) { if (obj.isMesh) meshes.push(obj); });
      });
      return meshes;
    }

    function hitTestCards(clientX, clientY) {
      var rect = renderer.domElement.getBoundingClientRect();
      cardMouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      cardMouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      cardRaycaster.setFromCamera(cardMouse, camera);
      var meshes = getCardMeshes();
      var hits = cardRaycaster.intersectObjects(meshes, false);
      if (!hits.length) return null;
      var obj = hits[0].object;
      while (obj.parent && obj.parent !== heroCardsGroup) obj = obj.parent;
      if (obj.parent === heroCardsGroup) return obj;
      return null;
    }

    /* Card animation loop — called from the main animate() via window hook */
    var COIN_SPIN_SLOW = 0.12, COIN_SPIN_FAST = 1.05;
    var PARALLAX_STRENGTH = 0.18, CLOSEUP_PARALLAX_STRENGTH = 0.45;
    var _lastCardsLum = undefined;

    window._karafuruCardTick = function(now, delta, uTimeSec) {
      /* Orbit lights around card ring */
      cardHighlightLight.position.set(
        CARD_RING_RADIUS * 0.3 * Math.sin(uTimeSec * 0.22),
        CARD_RING_Y * carousel.scale.y + carousel.position.y,
        CARD_RING_RADIUS * 0.3 * Math.cos(uTimeSec * 0.22)
      );
      cardAccentLight.position.set(
        CARD_RING_RADIUS * 0.3 * Math.sin(uTimeSec * 0.22 + Math.PI),
        CARD_RING_Y * carousel.scale.y + carousel.position.y,
        CARD_RING_RADIUS * 0.3 * Math.cos(uTimeSec * 0.22 + Math.PI)
      );

      /* Auto-spin ring: visibility, speed, direction, spin multiplier from debug panel */
      var cardsVis = window.paradeCarouselCardsVisible !== false;
      var cardsSpd = (window.paradeCarouselCardsSpeed != null ? window.paradeCarouselCardsSpeed : 0.08);
      var cardsDir = (window.paradeCarouselCardsDir != null ? window.paradeCarouselCardsDir : -1);
      var cardsLum = (window.paradeCarouselCardsBrightness != null ? window.paradeCarouselCardsBrightness : 1);
      var cardsSpinMult = (window.paradeCarouselSpinMultiplier != null ? window.paradeCarouselSpinMultiplier : 1);
      heroCardsGroup.visible = cardsVis;
      heroCardsGroup.rotation.y += cardsDir * (selectedCard ? cardsSpd * 0.5 : cardsSpd) * cardsSpinMult * delta;
      if (heroCardsGroup.visible && cardsLum !== undefined && _lastCardsLum !== cardsLum) {
        _lastCardsLum = cardsLum;
        heroCardsGroup.traverse(function(o) {
          if (o.isMesh && o.material) {
            o.material.transparent = true;
            o.material.opacity = Math.max(0, Math.min(1, cardsLum));
          }
        });
      }

      /* Globe fade */
      var fadeSpeed = 3.0;
      globeFadeCurrent += (globeFadeTarget - globeFadeCurrent) * fadeSpeed * delta;
      globeFadeCurrent = Math.max(0, Math.min(1, globeFadeCurrent));
      /* Apply fade to globe materials */
      if (window.paradeGlobeMats) {
        window.paradeGlobeMats.forEach(function(m) {
          if (m && !window.showingLogo) m.opacity = 0.9 * globeFadeCurrent;
        });
      }
      if (window.paradeGlobeLogoPlanes) {
        window.paradeGlobeLogoPlanes.forEach(function(e) {
          if (e && e.mat) e.mat.opacity = Math.min(e.mat.opacity, globeFadeCurrent * 0.9);
        });
      }
      if (window.paradeDiscGroup) {
        window.paradeDiscGroup.traverse(function(obj) {
          if (obj.isMesh && obj.material && obj.material.opacity !== undefined) {
            obj.material.opacity = obj.material._baseOpacity !== undefined
              ? obj.material._baseOpacity * globeFadeCurrent
              : obj.material.opacity;
          }
        });
      }

      /* Camera lerp between overview and closeup */
      var targetDist, targetLookAt;
      if (selectedCard && cardCameraMode === 'closeup') {
        /* Compute closeup dist from card world position */
        closeupCenterWorld.set(0, CARD_RING_Y, 0);
        carousel.localToWorld(closeupCenterWorld);
        closeupGroup.position.copy(closeupCenterWorld);
        cardLookAtTarget.copy(closeupCenterWorld);
        var cardScale = carousel.scale.x;
        cardCloseupDist = cardScale * CARD_RING_RADIUS * 0.55;
        targetDist = cardCloseupDist;
        targetLookAt = closeupCenterWorld;
        cardFrontLight.position.copy(closeupCenterWorld);
        cardFrontLight.intensity = 3;
      } else {
        targetDist = CARD_OVERVIEW_DIST;
        targetLookAt = new THREE.Vector3(0, 0, 0);
        cardFrontLight.intensity = 0;
      }
      currentCameraDist += (targetDist - currentCameraDist) * 0.05;

      /* Card spin/face logic */
      var cards = heroCardsGroup.children;
      for (var i = 0; i < cards.length; i++) {
        var card = cards[i];
        if (!card.userData || card.userData.index === undefined) continue;
        card.rotation.order = 'YXZ';
        var faceOn = Math.abs(Math.cos(card.rotation.y));
        var t2 = 1 - faceOn;
        var speed = COIN_SPIN_SLOW + (COIN_SPIN_FAST - COIN_SPIN_SLOW) * t2;
        var baseY = (card.userData.baseRotationY !== undefined ? card.userData.baseRotationY : card.rotation.y) + speed * delta;
        card.userData.baseRotationY = baseY;
        var cardWorldPos = new THREE.Vector3();
        card.getWorldPosition(cardWorldPos);
        var dirToCard = cardWorldPos.clone().normalize();
        var dirToCam = camera.position.clone().normalize();
        var dot = dirToCard.dot(dirToCam);
        /* Hide card when behind cylinder to avoid back-face z-fight glitch */
        card.visible = (card === selectedCard) || (dot > -0.15);
        if (dot > 0.5) {
          if (!card.userData.facingCamera) {
            if (card.userData.spinStartTime === undefined) {
              card.userData.spinStartTime = now;
              card.userData.spinStartY = card.rotation.y;
            }
            var t = (now - card.userData.spinStartTime) / 1000 / 0.6;
            if (t >= 1) {
              card.userData.facingCamera = true;
              card.userData.spinStartTime = undefined;
              card.lookAt(camera.position);
            } else {
              card.rotation.y = card.userData.spinStartY + Math.PI * 2 * t;
            }
          } else {
            card.lookAt(camera.position);
            card.rotation.x += Math.sin(uTimeSec * 8) * 0.015;
            card.rotation.z += Math.sin(uTimeSec * 6 + 1) * 0.01;
          }
        } else {
          card.userData.facingCamera = false;
          card.userData.spinStartTime = undefined;
          card.rotation.x = cardPointerNy * PARALLAX_STRENGTH;
          card.rotation.y = baseY + cardPointerNx * PARALLAX_STRENGTH;
        }
      }

      /* Closeup card handling */
      if (selectedCard) {
        if (selectedCard.parent !== closeupGroup) {
          heroCardsGroup.remove(selectedCard);
          closeupGroup.add(selectedCard);
          selectedCard.position.set(0, 0, 0);
          selectedCard.rotation.set(0, 0, 0);
          var cs = SILHOUETTE_SCALE * 20;
          selectedCard.scale.set(cs, cs, cs);
        }
        if (selectedCard.parent === closeupGroup) {
          selectedCard.lookAt(camera.position);
          selectedCard.rotation.x += closeupRotationX + cardPointerNy * CLOSEUP_PARALLAX_STRENGTH;
          selectedCard.rotation.y += closeupRotationY + cardPointerNx * CLOSEUP_PARALLAX_STRENGTH;
          selectedCard.rotation.z = Math.sin(uTimeSec * 6) * 0.012;
        }
        /* Show overlay */
        var overlay = document.getElementById('closeup-overlay');
        var nameEl = document.getElementById('closeup-card-name');
        if (overlay && !overlay.classList.contains('show')) {
          overlay.classList.add('show');
          overlay.setAttribute('aria-hidden', 'false');
        }
        if (nameEl) nameEl.textContent = selectedCard.userData.name || 'CARD';
        var hint = document.getElementById('zoom-hint');
        if (hint) hint.style.opacity = '0';
      } else {
        var overlay = document.getElementById('closeup-overlay');
        if (overlay && overlay.classList.contains('show')) {
          overlay.classList.remove('show');
          overlay.setAttribute('aria-hidden', 'true');
        }
        var hint = document.getElementById('zoom-hint');
        if (hint) hint.style.opacity = '1';
      }
    };

    function startCardLoop() {
      /* Store base opacities for globe fade */
      if (window.paradeDiscGroup) {
        window.paradeDiscGroup.traverse(function(obj) {
          if (obj.isMesh && obj.material && obj.material.opacity !== undefined) {
            obj.material._baseOpacity = obj.material.opacity;
          }
        });
      }
      CARD_OVERVIEW_DIST = currentCameraDist;
    }

    /* Mouse/touch handlers — replace orbit with card ring drag */
    renderer.domElement.addEventListener('mousedown', function(e) {
      if (e.button !== 0) return;
      renderer.domElement.focus();
      cardIsDragging = true;
      cardDragDist = 0;
      cardDragStartX = e.clientX;
      cardDragStartRingY = heroCardsGroup.rotation.y;
      cardMousedownTarget = hitTestCards(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', function(e) {
      if (!cardIsDragging) return;
      var dx = e.clientX - cardDragStartX;
      cardDragDist = Math.abs(dx);
      heroCardsGroup.rotation.y = cardDragStartRingY - dx * 0.004;
      /* Update pointer for parallax */
      var rect = renderer.domElement.getBoundingClientRect();
      cardPointerNx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      cardPointerNy = -(((e.clientY - rect.top) / rect.height) - 0.5) * 2;
    });
    window.addEventListener('mouseup', function(e) {
      if (!cardIsDragging) return;
      cardIsDragging = false;
      /* Click = drag < 6px */
      if (cardDragDist < 6 && cardMousedownTarget) {
        if (selectedCard === cardMousedownTarget) {
          returnCardToRing(selectedCard);
          selectedCard = null;
          cardCameraMode = 'overview';
          globeFadeTarget = 1;
        }
        /* Zoom-in on card click disabled; click does not enter closeup */
      }
      cardMousedownTarget = null;
    });

    /* Touch */
    renderer.domElement.addEventListener('touchstart', function(e) {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      cardIsDragging = true;
      cardDragDist = 0;
      cardDragStartX = e.touches[0].clientX;
      cardDragStartRingY = heroCardsGroup.rotation.y;
      cardMousedownTarget = hitTestCards(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    renderer.domElement.addEventListener('touchmove', function(e) {
      if (!cardIsDragging || e.touches.length !== 1) return;
      e.preventDefault();
      var dx = e.touches[0].clientX - cardDragStartX;
      cardDragDist = Math.abs(dx);
      heroCardsGroup.rotation.y = cardDragStartRingY - dx * 0.004;
    }, { passive: false });
    renderer.domElement.addEventListener('touchend', function(e) {
      if (!cardIsDragging) return;
      cardIsDragging = false;
      if (cardDragDist < 10 && cardMousedownTarget) {
        if (selectedCard === cardMousedownTarget) {
          returnCardToRing(selectedCard);
          selectedCard = null;
          cardCameraMode = 'overview';
          globeFadeTarget = 1;
        }
        /* Zoom-in on card tap disabled */
      }
      cardMousedownTarget = null;
    });
    renderer.domElement.addEventListener('touchcancel', function() { cardIsDragging = false; });
  })();

  /* Arrow keys spin the card ring; +/- zoom; Escape deselects */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); if (window.paradeHeroCardsGroup) window.paradeHeroCardsGroup.rotation.y += 0.15; }
    else if (e.key === 'ArrowRight') { e.preventDefault(); if (window.paradeHeroCardsGroup) window.paradeHeroCardsGroup.rotation.y -= 0.15; }
    else if (e.key === '+' || e.key === '=') { e.preventDefault(); currentCameraDist = Math.max(zoomMin, currentCameraDist - 600); }
    else if (e.key === '-') { e.preventDefault(); currentCameraDist = Math.min(zoomMax, currentCameraDist + 600); }
    else if (e.key === 'Escape') { var b = document.getElementById('closeup-back'); if (b) b.click(); }
  });
  function onResizeOrOrientation() {
    var s = getSize();
    var w = s.w, h = s.h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, getPixelRatioCap()));
    renderer.setSize(w, h);
    window.paradeDeviceTier = getDeviceTier();
    updateLayout();
  }
  var _resizeDebounce = null;
  function debouncedResize() {
    if (_resizeDebounce) cancelAnimationFrame(_resizeDebounce);
    _resizeDebounce = requestAnimationFrame(function() {
      _resizeDebounce = null;
      onResizeOrOrientation();
    });
  }
  window.addEventListener('resize', debouncedResize);
  window.addEventListener('orientationchange', function() {
    setTimeout(debouncedResize, 100);
  });

  runAnimation();
  setupXRButton();
})();
