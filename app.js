(async () => {
  const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.js");
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required for the BIM Labs immersive scroll experience.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (window.__bimLabsExperienceStarted) {
    console.warn("BIM Labs immersive experience already initialized; skipping duplicate app.js execution.");
    return;
  }

  window.__bimLabsExperienceStarted = true;

  const root = document.documentElement;
  const canvas = document.querySelector("#bim-world");
  const progressFill = document.querySelector("#progressFill");
  const pixelLayer = document.querySelector(".pixel-transition");

  if (!canvas) {
    console.warn("BIM Labs immersive experience skipped: #bim-world canvas was not found.");
    window.__bimLabsExperienceStarted = false;
    return;
  }

  const labels = {
    ai: document.querySelector('[data-label="ai"]'),
    portal: document.querySelector('[data-label="portal"]'),
    viewer: document.querySelector('[data-label="viewer"]'),
    archive: document.querySelector('[data-label="archive"]')
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const screenPosition = new THREE.Vector3();
  const labelOpacity = { value: 0 };
  const workLabelOpacity = { value: 0 };
  const sceneState = { progress: 0, work: 0, depth: 0, buildPhase: 0, archivePhase: 0 };
  let animationFrameId = null;

  const archivePixel = {
    canvas: document.querySelector("#archivePixelCanvas"),
    ctx: null,
    particles: [],
    captured: false,
    capturing: false,
    progress: 0,
    target: 0,
    state: "formed",
    raf: null,
    lastTime: 0,
    dpr: 1,
    source: null
  };

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe7f0fb, 7, 16);

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  camera.position.set(0, 0.1, 7.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const world = new THREE.Group();
  const orb = new THREE.Group();
  const rings = new THREE.Group();
  const nodeGroup = new THREE.Group();
  const radialGroup = new THREE.Group();
  const innerFrame = new THREE.Group();
  const workGroup = new THREE.Group();
  const workMaterials = [];
  const labelAnchors = {
    ai: new THREE.Object3D(),
    portal: new THREE.Object3D(),
    viewer: new THREE.Object3D(),
    archive: new THREE.Object3D()
  };

  scene.add(world);
  world.add(orb);
  orb.scale.setScalar(0.001);
  orb.add(rings, nodeGroup, radialGroup, innerFrame);
  world.add(workGroup);

  const deepLine = new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.28 });
  const softLine = new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.15 });
  const blueLine = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.72 });
  const blueSoft = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.34 });
  const surfaceMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.075,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  function lineFromPoints(points, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }

  function makeCircle(radius, segments = 160, arc = Math.PI * 2, offset = 0) {
    const points = [];

    for (let i = 0; i <= segments; i += 1) {
      const angle = offset + (i / segments) * arc;
      points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
    }

    return points;
  }

  function buildOuterWireSphere() {
    const sphere = new THREE.Group();

    [-0.92, -0.56, -0.24, 0.24, 0.56, 0.92].forEach((y, index) => {
      const radius = Math.sqrt(Math.max(0, 1.44 - y * y));
      const line = lineFromPoints(makeCircle(radius, 128), index % 2 ? softLine : deepLine);
      line.position.y = y;
      line.rotation.x = Math.PI / 2;
      sphere.add(line);
    });

    for (let i = 0; i < 9; i += 1) {
      const meridian = lineFromPoints(makeCircle(1.2, 128), i % 3 === 0 ? blueSoft : softLine);
      meridian.rotation.y = (i / 9) * Math.PI;
      meridian.rotation.z = Math.PI / 2;
      sphere.add(meridian);
    }

    return sphere;
  }

  function buildRings() {
    const ringData = [
      [1.76, 0.35, 0.1, 0.22, blueLine],
      [1.5, -0.58, 0.38, -0.16, deepLine],
      [1.28, 0.94, -0.22, 0.42, blueSoft],
      [1.05, -0.3, -0.75, 0.78, softLine],
      [1.9, 0.12, 1.05, -0.55, softLine]
    ];

    ringData.forEach(([radius, rx, ry, rz, material]) => {
      const ring = lineFromPoints(makeCircle(radius, 192), material);
      ring.rotation.set(rx, ry, rz);
      rings.add(ring);
    });
  }

  function buildRadials() {
    for (let i = 0; i < 10; i += 1) {
      const angle = (i / 10) * Math.PI * 2;
      const start = new THREE.Vector3(Math.cos(angle) * 0.44, Math.sin(angle) * 0.44, 0);
      const end = new THREE.Vector3(
        Math.cos(angle) * (0.92 + (i % 3) * 0.12),
        Math.sin(angle) * (0.92 + (i % 3) * 0.12),
        0
      );
      const material = i % 5 === 0 ? blueSoft : softLine;
      const radialLine = lineFromPoints([start, end], material);

      radialLine.rotation.set((i % 3) * 0.34, (i % 4) * 0.22, 0);
      radialLine.userData.baseScale = 0.48 + (i % 4) * 0.07;
      radialGroup.add(radialLine);
    }
  }

  function buildNodes() {
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.86 });
    const darkNodeMaterial = new THREE.MeshBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.56 });
    const geometry = new THREE.SphereGeometry(0.025, 12, 12);

    const positions = [
      [-0.72, 0.52, 0.28],
      [0.72, 0.48, -0.2],
      [0.62, -0.58, 0.22],
      [-0.58, -0.62, -0.24],
      [0, 0.86, 0.06],
      [0, -0.86, -0.06]
    ];

    positions.forEach((position, index) => {
      const node = new THREE.Mesh(geometry, index % 3 === 0 ? nodeMaterial : darkNodeMaterial);
      node.position.set(...position);
      node.userData.pulse = 0.7 + index * 0.17;
      nodeGroup.add(node);
    });
  }

  function buildInnerFrame() {
    const cube = new THREE.BoxGeometry(0.98, 0.98, 0.98);
    const edges = new THREE.EdgesGeometry(cube);
    const edgeMesh = new THREE.LineSegments(edges, blueSoft);
    const surface = new THREE.Mesh(cube, surfaceMaterial);
    const gridLines = new THREE.Group();

    for (let i = -1; i <= 1; i += 1) {
      const offset = i * 0.24;

      gridLines.add(lineFromPoints([new THREE.Vector3(-0.5, offset, 0.5), new THREE.Vector3(0.5, offset, 0.5)], softLine));
      gridLines.add(lineFromPoints([new THREE.Vector3(offset, -0.5, 0.5), new THREE.Vector3(offset, 0.5, 0.5)], softLine));
      gridLines.add(lineFromPoints([new THREE.Vector3(-0.5, offset, -0.5), new THREE.Vector3(0.5, offset, -0.5)], softLine));
      gridLines.add(lineFromPoints([new THREE.Vector3(offset, -0.5, -0.5), new THREE.Vector3(offset, 0.5, -0.5)], softLine));
    }

    innerFrame.add(surface, edgeMesh, gridLines);
    innerFrame.rotation.set(0.72, 0.44, 0.18);
  }

  function addLabelAnchors() {
    labelAnchors.ai.position.set(1.32, 0.78, 0.25);
    labelAnchors.portal.position.set(-1.12, -0.12, 0.38);
    labelAnchors.viewer.position.set(0.88, -0.86, -0.1);
    labelAnchors.archive.position.set(-0.68, -1.7, 0.52);

    Object.entries(labelAnchors).forEach(([key, anchor]) => {
      if (key === "archive") {
        workGroup.add(anchor);
      } else {
        orb.add(anchor);
      }
    });
  }

  function buildAtmosphere() {
    const planeMaterial = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.025,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < 3; i += 1) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(4.2 + i * 0.8, 2.2 + i * 0.34, 1, 1), planeMaterial.clone());
      plane.position.set(0.2 - i * 0.2, 0.04 + i * 0.18, -0.5 - i * 0.32);
      plane.rotation.set(0.35 + i * 0.2, -0.22, 0.18 - i * 0.12);
      world.add(plane);
    }
  }

  function registerWorkMaterial(material) {
    workMaterials.push({ material, target: material.opacity });
    material.opacity = 0;
    return material;
  }

  function makeFrameGeometry(widthValue, heightValue) {
    const w = widthValue / 2;
    const h = heightValue / 2;

    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w, -h, 0),
      new THREE.Vector3(w, -h, 0),
      new THREE.Vector3(w, h, 0),
      new THREE.Vector3(-w, h, 0),
      new THREE.Vector3(-w, -h, 0)
    ]);
  }

  function buildWorkArchive() {
    workGroup.position.set(0.18, -3.6, -0.85);
    workGroup.scale.setScalar(1.42);
    workGroup.rotation.set(-0.12, -0.08, 0.015);

    const archiveLine = registerWorkMaterial(new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.18 }));
    const archiveBlue = registerWorkMaterial(new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.42 }));
    const archiveSurface = registerWorkMaterial(new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide
    }));

    const frames = [
      { position: [-0.22, 2.4, 0.12], size: [2.35, 1.28], rotation: [0.01, 0.06, -0.012] },
      { position: [0.18, 0.8, -0.06], size: [2.7, 1.38], rotation: [-0.018, -0.045, 0.01] },
      { position: [-0.12, -0.8, 0.06], size: [2.32, 1.22], rotation: [0.02, 0.04, 0.014] },
      { position: [0.2, -2.38, -0.02], size: [2.5, 1.3], rotation: [-0.012, -0.035, -0.01] }
    ];

    frames.forEach(({ position, size, rotation }, index) => {
      const frame = new THREE.Group();
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1], 1, 1), archiveSurface);
      const outline = new THREE.Line(makeFrameGeometry(size[0], size[1]), index === 1 ? archiveBlue : archiveLine);
      const header = lineFromPoints([
        new THREE.Vector3(-size[0] * 0.38, size[1] * 0.24, 0.01),
        new THREE.Vector3(size[0] * 0.38, size[1] * 0.24, 0.01)
      ], index === 1 ? archiveBlue : archiveLine);
      const metric = lineFromPoints([
        new THREE.Vector3(-size[0] * 0.38, -size[1] * 0.12, 0.01),
        new THREE.Vector3(size[0] * (0.08 + index * 0.09), -size[1] * 0.12, 0.01)
      ], archiveLine);

      frame.position.set(...position);
      frame.rotation.set(...rotation);
      frame.userData.baseY = position[1];
      frame.userData.floatOffset = index * 0.85;
      frame.add(surface, outline, header, metric);
      workGroup.add(frame);
    });

    const descentRail = lineFromPoints([
      new THREE.Vector3(-1.58, 3.18, 0),
      new THREE.Vector3(-1.58, -3.18, 0)
    ], archiveBlue);

    const crossLinks = new THREE.Group();

    frames.forEach(({ position }, index) => {
      crossLinks.add(lineFromPoints([
        new THREE.Vector3(-1.58, position[1], 0),
        new THREE.Vector3(position[0] - 1.18, position[1], position[2])
      ], index === 1 ? archiveBlue : archiveLine));
    });

    workGroup.add(descentRail, crossLinks);
  }

  orb.add(buildOuterWireSphere());
  buildRings();
  buildRadials();
  buildNodes();
  buildInnerFrame();
  addLabelAnchors();
  buildAtmosphere();
  buildWorkArchive();

  function setBackground(progress) {
    const start = new THREE.Color(0xe7f0fb);
    const end = new THREE.Color(0xfbfdff);
    const current = start.lerp(end, progress);

    scene.fog.color.copy(current);
    document.body.style.background = `linear-gradient(180deg, #${current.getHexString()} 0%, #fbfdff 100%)`;
  }

  function updateLabels() {
    Object.entries(labelAnchors).forEach(([key, anchor]) => {
      const opacity = key === "archive"
        ? workLabelOpacity.value * sceneState.archivePhase
        : labelOpacity.value * sceneState.buildPhase;

      anchor.getWorldPosition(screenPosition);
      screenPosition.project(camera);

      const x = (screenPosition.x * 0.5 + 0.5) * width;
      const y = (-screenPosition.y * 0.5 + 0.5) * height;
      const drift = Math.sin(clock.elapsedTime * 0.9 + x * 0.01) * 5;
      const label = labels[key];

      if (!label) return;

      label.style.transform = `translate3d(${x + drift}px, ${y}px, 0) translate(-50%, -50%)`;
      label.style.opacity = Math.max(0, opacity * (screenPosition.z < 1 ? 1 : 0)).toFixed(3);
    });
  }

  function mapRange(value, inMin, inMax) {
    return THREE.MathUtils.clamp((value - inMin) / (inMax - inMin), 0, 1);
  }

  function createArchivePixelLayer() {
    if (!pixelLayer || !archivePixel.canvas) return;

    archivePixel.ctx = archivePixel.canvas.getContext("2d", { alpha: true });
    resizeArchivePixelCanvas();
  }

  function resizeArchivePixelCanvas() {
    if (!archivePixel.canvas || !archivePixel.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    archivePixel.dpr = dpr;
    archivePixel.canvas.width = Math.round(window.innerWidth * dpr);
    archivePixel.canvas.height = Math.round(window.innerHeight * dpr);
    archivePixel.canvas.style.width = `${window.innerWidth}px`;
    archivePixel.canvas.style.height = `${window.innerHeight}px`;

    archivePixel.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    archivePixel.ctx.imageSmoothingEnabled = false;
  }

  function archiveClamp(value, min = 0, max = 1) {
    return Math.min(Math.max(value, min), max);
  }

  function archiveEaseOutQuart(value) {
    return 1 - Math.pow(1 - value, 4);
  }

  function archiveSeedRandom(seed) {
    const value = Math.sin(seed) * 10000;
    return value - Math.floor(value);
  }

  async function captureArchivePixels(sourceElement) {
    if (!window.html2canvas || !pixelLayer || !archivePixel.ctx || !sourceElement || archivePixel.capturing) {
      return false;
    }

    archivePixel.capturing = true;
    archivePixel.source = sourceElement;
    resizeArchivePixelCanvas();

    const sourceRect = sourceElement.getBoundingClientRect();
    const captureScale = window.innerWidth < 760 ? 1.35 : 1.7;
    const sampleGap = window.innerWidth < 760 ? 4.2 : 3.45;
    const maxParticles = window.innerWidth < 760 ? 7200 : 13500;
    const alphaCutoff = 34;

    try {
      const shot = await window.html2canvas(sourceElement, {
        backgroundColor: null,
        scale: captureScale,
        useCORS: true,
        logging: false,
        removeContainer: true
      });

      const temp = document.createElement("canvas");
      const tempCtx = temp.getContext("2d", { willReadFrequently: true });

      temp.width = shot.width;
      temp.height = shot.height;
      tempCtx.imageSmoothingEnabled = false;
      tempCtx.drawImage(shot, 0, 0);

      const image = tempCtx.getImageData(0, 0, temp.width, temp.height);
      const data = image.data;
      const scaleX = sourceRect.width / temp.width;
      const scaleY = sourceRect.height / temp.height;
      const centerX = sourceRect.left + sourceRect.width / 2;
      const centerY = sourceRect.top + sourceRect.height / 2;

      archivePixel.particles = [];

      for (let y = 0; y < temp.height; y += sampleGap) {
        for (let x = 0; x < temp.width; x += sampleGap) {
          if (archivePixel.particles.length >= maxParticles) break;

          const ix = Math.floor(x);
          const iy = Math.floor(y);
          const index = (iy * temp.width + ix) * 4;
          const alpha = data[index + 3];

          if (alpha < alphaCutoff) continue;

          const r = data[index];
          const g = data[index + 1];
          const b = data[index + 2];
          const brightness = (r + g + b) / 765;

          if (brightness < 0.045 && alpha < 220) continue;

          const ox = sourceRect.left + x * scaleX;
          const oy = sourceRect.top + y * scaleY;
          const dx = ox - centerX;
          const dy = oy - centerY;
          const distance = Math.hypot(dx, dy) || 1;

          const rx = archiveSeedRandom(x * 13.13 + y * 91.7);
          const ry = archiveSeedRandom(x * 71.2 + y * 22.6);
          const rz = archiveSeedRandom(x * 9.9 + y * 37.4);
          const side = ox < centerX ? -1 : 1;

          archivePixel.particles.push({
            ox,
            oy,
            dirX: dx / distance,
            dirY: dy / distance,
            size: window.innerWidth < 760 ? 1 : 1.25,
            color: `rgb(${r}, ${g}, ${b})`,
            alpha: alpha / 255,
            brightness,
            rx,
            ry,
            rz,
            side,
            delay: rx * 0.24,
            speed: 0.58 + ry * 1.04,
            isBar: rx > 0.94,
            isBlock: ry > 0.96,
            hasGlow: brightness > 0.74 && rz > 0.92,
            hasSplit: brightness > 0.78 && rx < 0.05,
            flickerSeed: archiveSeedRandom(x * 99.2 + y * 4.4)
          });
        }
      }

      archivePixel.captured = true;
      archivePixel.capturing = false;
      drawArchivePixels();
      return true;
    } catch (error) {
      console.warn("Archive pixel capture failed:", error);
      archivePixel.capturing = false;
      return false;
    }
  }

  function playArchivePixels(direction = "break") {
    if (!archivePixel.captured || !archivePixel.ctx) return;

    archivePixel.target = direction === "break" ? 1 : 0;
    archivePixel.state = direction === "break" ? "breaking" : "reforming";

    if (archivePixel.raf) return;

    archivePixel.lastTime = performance.now();
    archivePixel.raf = requestAnimationFrame(stepArchivePixels);
  }

  function stepArchivePixels(now) {
    const delta = Math.min(64, now - archivePixel.lastTime) / 1000;
    archivePixel.lastTime = now;

    const direction = archivePixel.target > archivePixel.progress ? 1 : -1;
    const speed = archivePixel.state === "breaking" ? 0.86 : 1.18;

    archivePixel.progress = archiveClamp(archivePixel.progress + direction * speed * delta);

    drawArchivePixels();

    const doneBreaking = archivePixel.target === 1 && archivePixel.progress >= 0.999;
    const doneReforming = archivePixel.target === 0 && archivePixel.progress <= 0.001;

    if (doneBreaking || doneReforming) {
      archivePixel.progress = archivePixel.target;
      archivePixel.state = doneBreaking ? "broken" : "formed";
      archivePixel.raf = null;
      drawArchivePixels();
      return;
    }

    archivePixel.raf = requestAnimationFrame(stepArchivePixels);
  }

  function drawArchivePixel(px, py, size, alpha, particle) {
    const ctx = archivePixel.ctx;
    const s = Math.max(1, Math.round(size));

    if (particle.hasGlow) {
      ctx.globalAlpha = alpha * 0.11;
      ctx.fillStyle = "rgba(255,255,255,0.86)";
      ctx.fillRect(px - s, py - s, s * 3, s * 3);
    }

    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.fillRect(px, py, s, s);

    if (s >= 2 && particle.brightness > 0.25) {
      ctx.globalAlpha = alpha * 0.3;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fillRect(px, py, 1, 1);

      ctx.globalAlpha = alpha * 0.2;
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(px + s - 1, py, 1, s);
      ctx.fillRect(px, py + s - 1, s, 1);
    }
  }

  function drawArchivePixels() {
    if (!archivePixel.ctx) return;

    const ctx = archivePixel.ctx;
    const p = archivePixel.progress;
    const eased = archiveEaseOutQuart(p);
    const w = archivePixel.canvas.width / archivePixel.dpr;
    const h = archivePixel.canvas.height / archivePixel.dpr;

    ctx.clearRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = false;

    if (pixelLayer) {
      pixelLayer.style.opacity = p > 0.006 ? "1" : "0";
    }

    if (archivePixel.source) {
      archivePixel.source.classList.toggle("is-pixel-breaking", p > 0.012);
    }

    if (p <= 0.006 || !archivePixel.particles.length) return;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";

    archivePixel.particles.forEach((particle) => {
      const local = archiveClamp((p - particle.delay) / (1 - particle.delay));
      const le = archiveEaseOutQuart(local);

      if (le <= 0.002) return;

      const waveX = Math.sin(particle.oy * 0.038 + p * 8) * 72 * eased * particle.rx;
      const waveY = Math.cos(particle.ox * 0.026 + p * 7) * 24 * eased * particle.ry;

      const x = particle.ox
        + particle.side * 315 * le * particle.speed
        + particle.dirX * 38 * le
        + waveX;

      const y = particle.oy
        + (particle.ry - 0.5) * 105 * le
        - 48 * le
        + waveY;

      const flicker = Math.sin(particle.flickerSeed * 22 + p * 22);
      const alpha = particle.alpha * Math.pow(1 - p, 1.02) * (1 - Math.abs(flicker) * 0.055);

      if (alpha <= 0.01) return;

      const px = Math.round(x);
      const py = Math.round(y);
      const size = particle.size * (particle.isBlock ? 1.65 : 1);

      if (particle.hasSplit && p > 0.12) {
        const split = 0.8 * le;
        ctx.globalAlpha = alpha * 0.1;
        ctx.fillStyle = "rgba(255,70,70,0.72)";
        ctx.fillRect(Math.round(px - split), py, 1, 1);
        ctx.fillStyle = "rgba(70,185,255,0.72)";
        ctx.fillRect(Math.round(px + split), py, 1, 1);
      }

      if (particle.isBar && p > 0.18) {
        const length = Math.max(2, Math.round(size * (3.5 + particle.ry * 8) * le));
        const height = Math.max(1, Math.round(size));

        ctx.globalAlpha = alpha;
        ctx.fillStyle = particle.color;
        ctx.fillRect(Math.round(px - length * 0.18), py, length, height);

        if (particle.brightness > 0.45) {
          ctx.globalAlpha = alpha * 0.26;
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.fillRect(Math.round(px - length * 0.18), py, Math.max(1, Math.round(length * 0.32)), 1);
        }
      } else {
        drawArchivePixel(px, py, size, alpha, particle);
      }
    });

    ctx.restore();
  }

  function resetArchivePixels() {
    archivePixel.captured = false;
    archivePixel.capturing = false;
    archivePixel.particles = [];
    archivePixel.progress = 0;
    archivePixel.target = 0;
    archivePixel.state = "formed";

    if (archivePixel.raf) {
      cancelAnimationFrame(archivePixel.raf);
      archivePixel.raf = null;
    }

    if (archivePixel.ctx && archivePixel.canvas) {
      resizeArchivePixelCanvas();
      archivePixel.ctx.clearRect(0, 0, archivePixel.canvas.width, archivePixel.canvas.height);
    }

    if (pixelLayer) pixelLayer.style.opacity = "0";
    if (archivePixel.source) archivePixel.source.classList.remove("is-pixel-breaking");
  }

  function createArchiveTransition() {
    if (reduceMotion) return;

    const archive = document.querySelector(".work-archive");
    const archiveContent = document.querySelector(".archive-content");
    const workCards = gsap.utils.toArray(".work-card");
    const intro = document.querySelector(".work-scroll__intro");
    const nextInner = document.querySelector(".next-section-inner");

    if (!archive || !archiveContent || !workCards.length || !intro || !nextInner || !pixelLayer) {
      return;
    }

    gsap.set(workCards, {
      opacity: 0,
      y: "74vh",
      scale: 0.94,
      filter: "blur(6px)"
    });

    gsap.set(nextInner, {
      opacity: 0,
      y: 70,
      filter: "blur(10px)"
    });

    let breakRequested = false;
    let reformRequested = false;

    const archiveTl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: archive,
        start: "top top",
        end: "+=420%",
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onUpdate: async (self) => {
          if (self.progress > 0.69 && !breakRequested) {
            breakRequested = true;
            reformRequested = false;

            if (!archivePixel.captured) {
              await captureArchivePixels(archiveContent);
            }

            playArchivePixels("break");
          }

          if (self.progress < 0.62 && !reformRequested) {
            reformRequested = true;
            breakRequested = false;
            playArchivePixels("reform");
          }
        }
      }
    });

    archiveTl
      .to(intro, { opacity: 0, y: -80, filter: "blur(8px)", duration: 0.08 }, 0.08)
      .to(workCards[0], { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.12 }, 0.1)
      .to(workCards[0], { opacity: 0, y: "-76vh", scale: 0.96, filter: "blur(5px)", duration: 0.12 }, 0.24)
      .to(workCards[1], { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.12 }, 0.24)
      .to(workCards[1], { opacity: 0, y: "-76vh", scale: 0.96, filter: "blur(5px)", duration: 0.12 }, 0.39)
      .to(workCards[2], { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.12 }, 0.39)
      .to(workCards[2], { opacity: 0, y: "-76vh", scale: 0.96, filter: "blur(5px)", duration: 0.12 }, 0.54)
      .to(workCards[3], { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.12 }, 0.54)
      .to(archiveContent, { opacity: 0.98, filter: "blur(0px)", scale: 1, duration: 0.05 }, 0.68)
      .to(workCards[3], { opacity: 0.24, scale: 0.99, filter: "blur(4px)", duration: 0.12 }, 0.7)
      .to(archiveContent, { opacity: 0, filter: "blur(10px)", scale: 0.965, duration: 0.14 }, 0.76)
      .fromTo(nextInner, {
        opacity: 0,
        y: 70,
        filter: "blur(10px)"
      }, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.18
      }, 0.8)
      .to(pixelLayer, { opacity: 0, duration: 0.08 }, 0.96);
  }

  function updateProgress(progress) {
    const page = window.scrollY / Math.max(1, window.innerHeight);
    const heroOut = mapRange(page, 0.68, 0.96);
    const buildReveal = mapRange(page, 0.98, 1.18);
    const buildOut = mapRange(page, 1.72, 2.02);
    const workReveal = mapRange(page, 2.02, 2.28);
    const workDepth = mapRange(page, 2.34, 2.74);
    const workUiOut = mapRange(page, 3.08, 3.46);

    sceneState.progress = progress;
    sceneState.work = workReveal;
    sceneState.depth = workDepth;
    sceneState.buildPhase = buildReveal * (1 - buildOut);
    sceneState.archivePhase = workReveal * (1 - workUiOut);

    root.style.setProperty("--section-progress", progress.toFixed(4));
    root.style.setProperty("--hero-out", heroOut.toFixed(4));
    root.style.setProperty("--build-reveal", buildReveal.toFixed(4));
    root.style.setProperty("--build-out", buildOut.toFixed(4));
    root.style.setProperty("--work-reveal", workReveal.toFixed(4));
    root.style.setProperty("--work-depth", workDepth.toFixed(4));
    root.style.setProperty("--work-ui-out", workUiOut.toFixed(4));

    if (progressFill) {
      progressFill.style.width = `${Math.round(progress * 100)}%`;
    }

    setBackground(progress);
  }

  function createScrollTimeline() {
    updateProgress(0);

    if (reduceMotion) {
      labelOpacity.value = 0.5;
      workLabelOpacity.value = 0.8;
      updateProgress(1);
      orb.scale.setScalar(1);
      orb.position.set(0.4, 1.25, -0.25);
      workGroup.position.set(0.25, 0.15, -0.85);
      camera.position.set(0, -0.7, 5.15);
      radialGroup.scale.setScalar(1.2);
      rings.scale.setScalar(1.15);
      return;
    }

    const timeline = gsap.timeline({
      defaults: { ease: "none", duration: 0.14 },
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.15,
        onUpdate: (self) => updateProgress(self.progress)
      }
    });

    timeline
      .to(orb.scale, { x: 1, y: 1, z: 1 }, 0.12)
      .to(camera.position, { z: 4.15, y: 0.03 }, 0.12)
      .to(camera.rotation, { z: -0.035 }, 0.12)
      .to(orb.position, { x: 1.08, y: -0.03, z: 0.18 }, 0.12)
      .to(orb.rotation, { y: Math.PI * 0.58, x: 0.25 }, 0.12)
      .to(rings.scale, { x: 1.38, y: 1.38, z: 1.38 }, 0.12)
      .to(radialGroup.scale, { x: 1.35, y: 1.35, z: 1.35 }, 0.14)
      .to(innerFrame.scale, { x: 1.18, y: 1.18, z: 1.18 }, 0.12)
      .to(labelOpacity, { value: 1 }, 0.18)
      .to(camera.position, { z: 3.75, y: -0.38, x: -0.06 }, 0.32)
      .to(camera.rotation, { z: 0.025, x: -0.045 }, 0.32)
      .to(orb.position, { x: 0.58, y: 1.25, z: -0.28 }, 0.32)
      .to(orb.rotation, { y: Math.PI * 1.08, x: -0.14, z: 0.12 }, 0.32)
      .to(rings.scale, { x: 1.58, y: 1.58, z: 1.58 }, 0.32)
      .to(workGroup.position, { x: 0.1, y: -2.05, z: -0.88 }, 0.32)
      .to(workGroup.rotation, { x: -0.1, y: -0.04, z: 0.006 }, 0.32)
      .to(workLabelOpacity, { value: 1 }, 0.38)
      .to(camera.position, { z: 2.9, y: -1.22, x: 0.02, duration: 0.34 }, 0.58)
      .to(camera.rotation, { z: 0.01, x: -0.08, duration: 0.34 }, 0.58)
      .to(workGroup.position, { y: 2.35, z: -0.72, duration: 0.34 }, 0.58)
      .to(orb.position, { y: 1.88, z: -0.58, duration: 0.34 }, 0.58);
  }

  function onPointerMove(event) {
    pointerTarget.x = (event.clientX / width - 0.5) * 2;
    pointerTarget.y = (event.clientY / height - 0.5) * 2;
  }

  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(width, height);

    resetArchivePixels();
    ScrollTrigger.refresh();
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();

    pointer.x += (pointerTarget.x - pointer.x) * 0.055;
    pointer.y += (pointerTarget.y - pointer.y) * 0.055;

    const motionScale = reduceMotion ? 0.22 : 1;

    orb.rotation.y += delta * 0.08 * motionScale;
    orb.rotation.x += delta * 0.025 * motionScale;
    world.rotation.y = pointer.x * 0.055;
    world.rotation.x = -pointer.y * 0.04;
    world.position.x = pointer.x * 0.08;
    world.position.y = -pointer.y * 0.055;

    rings.children.forEach((ring, index) => {
      ring.rotation.z += delta * (0.035 + index * 0.006) * motionScale;
    });

    radialGroup.children.forEach((line, index) => {
      const extension = THREE.MathUtils.lerp(line.userData.baseScale, 1.25, sceneState.progress);
      const pulse = Math.sin(elapsed * 0.65 + index) * 0.018;
      line.scale.setScalar(extension + pulse * motionScale);
    });

    nodeGroup.children.forEach((node) => {
      const pulse = 1 + Math.sin(elapsed * 1.7 + node.userData.pulse) * 0.18 * motionScale;
      node.scale.setScalar(pulse * THREE.MathUtils.lerp(1, 1.35, sceneState.progress));
    });

    innerFrame.rotation.y += delta * 0.045 * motionScale;

    workGroup.children.forEach((child) => {
      if (child.isGroup && Number.isFinite(child.userData.baseY)) {
        child.position.y = child.userData.baseY + Math.sin(elapsed * 0.5 + child.userData.floatOffset) * 0.012 * motionScale;
      }
    });

    workMaterials.forEach(({ material, target }) => {
      material.opacity = target * THREE.MathUtils.lerp(sceneState.work, 1, sceneState.depth * 0.35);
    });

    updateLabels();
    renderer.render(scene, camera);
    animationFrameId = requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize);

  createArchivePixelLayer();
  createArchiveTransition();
  createScrollTimeline();
  ScrollTrigger.refresh();

  if (animationFrameId === null) {
    animate();
  }
})();
