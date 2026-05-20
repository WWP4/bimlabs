(async () => {
  const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.js");
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const canvas = document.querySelector("#bim-world");
  const progressFill = document.querySelector("#progressFill");

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
  const sceneState = { progress: 0, work: 0, depth: 0 };

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
  const workGroup = new THREE.Group();
  const layeredCore = new THREE.Group();
  const glassPanels = new THREE.Group();
  const systemLayers = new THREE.Group();
  const lightNodes = new THREE.Group();
  const accentLines = new THREE.Group();
  const workMaterials = [];

  const labelAnchors = {
    ai: new THREE.Object3D(),
    portal: new THREE.Object3D(),
    viewer: new THREE.Object3D(),
    archive: new THREE.Object3D()
  };

  scene.add(world);
  world.add(orb);
  world.add(workGroup);
  orb.add(layeredCore, glassPanels, systemLayers, lightNodes, accentLines);
  orb.scale.setScalar(0.001);

  const darkLine = new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.24 });
  const softLine = new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.12 });
  const blueLine = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.56 });

  const whiteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.78,
    depthWrite: false
  });

  const darkMat = new THREE.MeshBasicMaterial({
    color: 0x07101d,
    transparent: true,
    opacity: 0.82,
    depthWrite: false
  });

  const glassMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  const blueMat = new THREE.MeshBasicMaterial({
    color: 0x0077ff,
    transparent: true,
    opacity: 0.72,
    depthWrite: false
  });

  function lineFromPoints(points, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
  }

  function makeRectLine(w, h, material) {
    const x = w / 2;
    const y = h / 2;
    return lineFromPoints([
      new THREE.Vector3(-x, -y, 0),
      new THREE.Vector3(x, -y, 0),
      new THREE.Vector3(x, y, 0),
      new THREE.Vector3(-x, y, 0),
      new THREE.Vector3(-x, -y, 0)
    ], material);
  }

  function makeBox(w, h, d, material, position, rotation = [0, 0, 0]) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    return mesh;
  }

  function buildLayeredSystemCore() {
    layeredCore.add(makeBox(2.45, 0.08, 1.04, darkMat, [0, -0.82, 0]));
    layeredCore.add(makeBox(2.05, 0.06, 0.78, whiteMat, [0, -0.58, 0.1]));
    layeredCore.add(makeBox(1.62, 0.045, 0.58, darkMat, [0, -0.36, 0.2]));

    const mainFrame = new THREE.Group();
    mainFrame.position.set(0, 0.24, 0);
    mainFrame.rotation.set(-0.08, 0.18, 0);

    const screenSurface = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 1.08), glassMat);
    const screenOutline = makeRectLine(1.85, 1.08, darkLine);
    const innerOutline = makeRectLine(1.42, 0.76, blueLine);

    mainFrame.add(screenSurface, screenOutline, innerOutline);

    for (let i = 0; i < 4; i += 1) {
      const y = 0.28 - i * 0.17;
      mainFrame.add(lineFromPoints([
        new THREE.Vector3(-0.58, y, 0.012),
        new THREE.Vector3(0.62 - i * 0.09, y, 0.012)
      ], i === 1 ? blueLine : softLine));
    }

    layeredCore.add(mainFrame);

    const leftPanel = new THREE.Group();
    leftPanel.position.set(-1.36, 0.04, -0.08);
    leftPanel.rotation.set(-0.06, 0.54, 0.02);
    leftPanel.add(new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.88), glassMat));
    leftPanel.add(makeRectLine(0.7, 0.88, softLine));
    leftPanel.add(lineFromPoints([
      new THREE.Vector3(-0.22, 0.18, 0.012),
      new THREE.Vector3(0.22, 0.18, 0.012)
    ], blueLine));
    glassPanels.add(leftPanel);

    const rightPanel = new THREE.Group();
    rightPanel.position.set(1.36, -0.02, -0.1);
    rightPanel.rotation.set(-0.04, -0.54, -0.02);
    rightPanel.add(new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.92), glassMat));
    rightPanel.add(makeRectLine(0.72, 0.92, softLine));
    rightPanel.add(lineFromPoints([
      new THREE.Vector3(-0.24, -0.12, 0.012),
      new THREE.Vector3(0.26, -0.12, 0.012)
    ], blueLine));
    glassPanels.add(rightPanel);

    const topLayer = makeBox(1.55, 0.055, 0.42, whiteMat, [0.08, 0.98, -0.05], [0.02, -0.12, 0.01]);
    const midLayer = makeBox(2.22, 0.045, 0.36, darkMat, [-0.04, 0.78, 0.02], [0.01, 0.08, -0.01]);
    const blueSeam = makeBox(1.52, 0.018, 0.04, blueMat, [0, 0.71, 0.25]);

    systemLayers.add(topLayer, midLayer, blueSeam);

    const railLeft = lineFromPoints([
      new THREE.Vector3(-1.02, -0.66, 0.14),
      new THREE.Vector3(-0.74, 0.64, 0.04)
    ], softLine);

    const railRight = lineFromPoints([
      new THREE.Vector3(1.02, -0.66, 0.14),
      new THREE.Vector3(0.74, 0.64, 0.04)
    ], softLine);

    accentLines.add(railLeft, railRight);

    const nodeGeo = new THREE.SphereGeometry(0.035, 16, 16);
    const nodePositions = [
      [-0.82, 0.58, 0.08],
      [0.86, 0.52, 0.08],
      [-1.12, -0.28, 0.08],
      [1.12, -0.34, 0.08],
      [0, -0.12, 0.32]
    ];

    nodePositions.forEach((pos, i) => {
      const node = new THREE.Mesh(nodeGeo, i === 4 ? blueMat : darkMat);
      node.position.set(...pos);
      node.userData.pulse = i * 0.42;
      lightNodes.add(node);
    });

    const verticalBlue = makeBox(0.026, 1.18, 0.026, blueMat, [0, 0.2, 0.38]);
    const horizontalBlue = makeBox(1.38, 0.018, 0.026, blueMat, [0, 0.2, 0.39]);
    accentLines.add(verticalBlue, horizontalBlue);
  }

  function addLabelAnchors() {
    labelAnchors.ai.position.set(0.05, -0.1, 0.6);
    labelAnchors.portal.position.set(-1.55, 0.08, 0.08);
    labelAnchors.viewer.position.set(1.55, -0.02, 0.08);
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
      const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(4.2 + i * 0.8, 2.2 + i * 0.34),
        planeMaterial.clone()
      );

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

    const archiveLine = registerWorkMaterial(new THREE.LineBasicMaterial({
      color: 0x07101d,
      transparent: true,
      opacity: 0.18
    }));

    const archiveBlue = registerWorkMaterial(new THREE.LineBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.42
    }));

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
      const surface = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), archiveSurface);
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

  buildLayeredSystemCore();
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
        ? workLabelOpacity.value
        : labelOpacity.value * (1 - sceneState.work * 0.5);

      anchor.getWorldPosition(screenPosition);
      screenPosition.project(camera);

      const x = (screenPosition.x * 0.5 + 0.5) * width;
      const y = (-screenPosition.y * 0.5 + 0.5) * height;
      const drift = Math.sin(clock.elapsedTime * 0.9 + x * 0.01) * 5;

      if (labels[key]) {
        labels[key].style.transform = `translate3d(${x + drift}px, ${y}px, 0) translate(-50%, -50%)`;
        labels[key].style.opacity = Math.max(0, opacity * (screenPosition.z < 1 ? 1 : 0)).toFixed(3);
      }
    });
  }

  function mapRange(value, inMin, inMax) {
    return THREE.MathUtils.clamp((value - inMin) / (inMax - inMin), 0, 1);
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
      .to(camera.position, { z: 4.3, y: 0.02 }, 0.12)
      .to(camera.rotation, { z: -0.025 }, 0.12)
      .to(orb.position, { x: 0.92, y: -0.02, z: 0.12 }, 0.12)
      .to(orb.rotation, { y: Math.PI * 0.18, x: 0.14 }, 0.12)
      .to(systemLayers.position, { y: 0.12 }, 0.16)
      .to(glassPanels.position, { z: 0.12 }, 0.16)
      .to(labelOpacity, { value: 1 }, 0.2)
      .to(camera.position, { z: 3.75, y: -0.36, x: -0.04 }, 0.32)
      .to(camera.rotation, { z: 0.018, x: -0.035 }, 0.32)
      .to(orb.position, { x: 0.48, y: 1.18, z: -0.24 }, 0.32)
      .to(orb.rotation, { y: Math.PI * 0.34, x: -0.1, z: 0.06 }, 0.32)
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

    ScrollTrigger.refresh();
  }

  function animate() {
    const elapsed = clock.getElapsedTime();
    const delta = clock.getDelta();
    const motionScale = reduceMotion ? 0.22 : 1;

    pointer.x += (pointerTarget.x - pointer.x) * 0.055;
    pointer.y += (pointerTarget.y - pointer.y) * 0.055;

    world.rotation.y = pointer.x * 0.045;
    world.rotation.x = -pointer.y * 0.035;
    world.position.x = pointer.x * 0.065;
    world.position.y = -pointer.y * 0.045;

    orb.rotation.y += delta * 0.035 * motionScale;
    orb.position.y += Math.sin(elapsed * 0.62) * 0.0008 * motionScale;

    glassPanels.children.forEach((panel, index) => {
      panel.position.y += Math.sin(elapsed * 0.7 + index) * 0.0009 * motionScale;
      panel.rotation.z += Math.sin(elapsed * 0.42 + index) * 0.00008 * motionScale;
    });

    systemLayers.children.forEach((layer, index) => {
      layer.position.x += Math.sin(elapsed * 0.48 + index) * 0.00045 * motionScale;
    });

    lightNodes.children.forEach((node) => {
      const pulse = 1 + Math.sin(elapsed * 1.8 + node.userData.pulse) * 0.18 * motionScale;
      node.scale.setScalar(pulse);
    });

    accentLines.children.forEach((item, index) => {
      if (item.material && item.material.opacity !== undefined) {
        item.material.opacity = index % 2 === 0
          ? 0.28 + Math.sin(elapsed * 1.1 + index) * 0.06
          : 0.52 + Math.sin(elapsed * 1.25 + index) * 0.08;
      }
    });

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
    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize);

  createScrollTimeline();
  animate();
})();
