(async () => {
  const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.js");
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required for the BIM Labs immersive scroll experience.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Core DOM references
  const root = document.documentElement;
  const canvas = document.querySelector("#bim-world");
  const progressFill = document.querySelector("#progressFill");
  const labels = {
  ai: document.querySelector('[data-label="ai"]'),
  portal: document.querySelector('[data-label="portal"]'),
  viewer: document.querySelector('[data-label="viewer"]'),
  archive: document.querySelector('[data-label="archive"]')
  };

  // Shared state
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

  // Scene and camera
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe7f0fb, 7, 16);

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  camera.position.set(0, 0.1, 7.2);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Scene graph groups
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

  // Materials
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
    const end = new THREE.Vector3(Math.cos(angle) * (0.92 + (i % 3) * 0.12), Math.sin(angle) * (0.92 + (i % 3) * 0.12), 0);
    const line = lineFromPoints([start, end], i % 5 === 0 ? blueSoft : softLine);
    line.rotation.set((i % 3) * 0.34, (i % 4) * 0.22, 0);
    line.userData.baseScale = 0.48 + (i % 4) * 0.07;
    radialGroup.add(line);
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
  const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.025, depthWrite: false, side: THREE.DoubleSide });
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

// Build scene content
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
    const opacity = key === "archive" ? workLabelOpacity.value : labelOpacity.value * (1 - sceneState.work * 0.5);
    anchor.getWorldPosition(screenPosition);
    screenPosition.project(camera);
    const x = (screenPosition.x * 0.5 + 0.5) * width;
    const y = (-screenPosition.y * 0.5 + 0.5) * height;
    const drift = Math.sin(clock.elapsedTime * 0.9 + x * 0.01) * 5;
    labels[key].style.transform = `translate3d(${x + drift}px, ${y}px, 0) translate(-50%, -50%)`;
    labels[key].style.opacity = Math.max(0, opacity * (screenPosition.z < 1 ? 1 : 0)).toFixed(3);
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
  progressFill.style.width = `${Math.round(progress * 100)}%`;
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
  requestAnimationFrame(animate);
}

// Runtime lifecycle
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("resize", onResize);
createScrollTimeline();
animate();

})();
