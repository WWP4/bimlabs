(async () => {
  const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.js");
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required for the BIM Labs immersive scroll experience.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  if (window.__bimLabsExperienceStarted) return;
  window.__bimLabsExperienceStarted = true;

  const root = document.documentElement;
  const canvas = document.querySelector("#bim-world");
  const progressFill = document.querySelector("#progressFill");
  if (!canvas) return;

  const labels = {
    ai: document.querySelector('[data-label="ai"]'),
    portal: document.querySelector('[data-label="portal"]'),
    viewer: document.querySelector('[data-label="viewer"]'),
    archive: document.querySelector('[data-label="archive"]')
  };

  let width = window.innerWidth;
  let height = window.innerHeight;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const screenPosition = new THREE.Vector3();
  const labelState = Object.fromEntries(Object.keys(labels).map((k) => [k, { x: width * 0.5, y: height * 0.5, opacity: 0 }]));
  const sceneState = { progress: 0, build: 0, work: 0, cta: 0 };

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe7f0fb, 7, 17);
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  camera.position.set(0, 0.05, 6.8);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const world = new THREE.Group();
  const orb = new THREE.Group();
  const rings = new THREE.Group();
  const nodes = new THREE.Group();
  const workGroup = new THREE.Group();
  scene.add(world);
  world.add(orb, workGroup);

  const matDark = new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.22 });
  const matBlue = new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.5 });

  function circle(r, seg = 120) {
    const pts = [];
    for (let i = 0; i <= seg; i += 1) {
      const a = (i / seg) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }

  for (let i = 0; i < 5; i += 1) {
    const line = new THREE.Line(circle(1 + i * 0.2), i % 2 ? matDark : matBlue);
    line.rotation.set(i * 0.2, i * 0.3, i * 0.1);
    rings.add(line);
  }

  const nodeGeo = new THREE.SphereGeometry(0.03, 10, 10);
  for (let i = 0; i < 7; i += 1) {
    const n = new THREE.Mesh(nodeGeo, new THREE.MeshBasicMaterial({ color: i % 2 ? 0x0077ff : 0x07101d, transparent: true, opacity: 0.7 }));
    const a = (i / 7) * Math.PI * 2;
    n.position.set(Math.cos(a) * 1.1, Math.sin(a) * 0.75, (i % 3) * 0.12 - 0.12);
    n.userData.phase = i * 0.5;
    nodes.add(n);
  }
  orb.add(rings, nodes);

  const anchors = { ai: new THREE.Object3D(), portal: new THREE.Object3D(), viewer: new THREE.Object3D(), archive: new THREE.Object3D() };
  anchors.ai.position.set(1.35, 0.7, 0.2);
  anchors.portal.position.set(-1.2, -0.1, 0.2);
  anchors.viewer.position.set(0.9, -0.9, 0.1);
  anchors.archive.position.set(-0.8, -1.7, 0.2);
  orb.add(anchors.ai, anchors.portal, anchors.viewer);
  workGroup.add(anchors.archive);

  const frames = [];
  function addFrame(y, w, h) {
    const g = new THREE.Group();
    const edgeGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-w / 2, -h / 2, 0), new THREE.Vector3(w / 2, -h / 2, 0),
      new THREE.Vector3(w / 2, h / 2, 0), new THREE.Vector3(-w / 2, h / 2, 0), new THREE.Vector3(-w / 2, -h / 2, 0)
    ]);
    g.add(new THREE.Line(edgeGeo, matDark));
    g.position.set(0.15, y, -0.7);
    g.userData.baseY = y;
    workGroup.add(g);
    frames.push(g);
  }
  addFrame(2.2, 2.3, 1.25);
  addFrame(0.7, 2.6, 1.35);
  addFrame(-0.8, 2.35, 1.2);
  addFrame(-2.2, 2.45, 1.28);

  function mapRange(v, a, b) {
    return THREE.MathUtils.clamp((v - a) / (b - a), 0, 1);
  }

  function setProgress(p) {
    sceneState.progress = p;
    sceneState.build = mapRange(p, 0.2, 0.45);
    sceneState.work = mapRange(p, 0.45, 0.82);
    sceneState.cta = mapRange(p, 0.82, 1);

    root.style.setProperty("--section-progress", p.toFixed(4));
    root.style.setProperty("--hero-out", mapRange(p, 0.12, 0.25).toFixed(4));
    root.style.setProperty("--build-reveal", sceneState.build.toFixed(4));
    root.style.setProperty("--build-out", mapRange(p, 0.5, 0.66).toFixed(4));
    root.style.setProperty("--work-reveal", sceneState.work.toFixed(4));
    root.style.setProperty("--work-depth", mapRange(p, 0.68, 0.84).toFixed(4));
    root.style.setProperty("--work-ui-out", mapRange(p, 0.88, 1).toFixed(4));
    if (progressFill) progressFill.style.width = `${Math.round(p * 100)}%`;
  }

  function updateLabels() {
    Object.entries(anchors).forEach(([key, anchor]) => {
      const el = labels[key];
      if (!el) return;
      anchor.getWorldPosition(screenPosition);
      screenPosition.project(camera);
      const tx = (screenPosition.x * 0.5 + 0.5) * width;
      const ty = (-screenPosition.y * 0.5 + 0.5) * height;
      const state = labelState[key];
      state.x = THREE.MathUtils.lerp(state.x, tx, 0.2);
      state.y = THREE.MathUtils.lerp(state.y, ty, 0.2);
      const targetOpacity = key === "archive" ? sceneState.work : Math.min(sceneState.build + 0.2, 1);
      state.opacity = THREE.MathUtils.lerp(state.opacity, targetOpacity * (screenPosition.z < 1 ? 1 : 0), 0.15);
      el.style.transform = `translate3d(${state.x}px, ${state.y}px, 0) translate(-50%, -50%)`;
      el.style.opacity = state.opacity.toFixed(3);
    });
  }

  gsap.set(".work-scroll__intro", { opacity: 1, y: 0 });
  gsap.set(".work-card", { opacity: 0, y: 28, clearProps: "x" });
  gsap.set(".next-section-inner", { opacity: 0, y: 24 });

  const cards = gsap.utils.toArray(".work-card");
  cards.forEach((card, i) => {
    gsap.timeline({
      scrollTrigger: {
        trigger: ".chapter--work",
        start: `${20 + i * 20}% center`,
        end: `${38 + i * 20}% center`,
        scrub: 0.8
      }
    })
      .to(card, { opacity: 1, y: 0, duration: 0.35, ease: "power1.out" })
      .to(card, { opacity: 1, y: 0, duration: 0.45, ease: "none" })
      .to(card, { opacity: 0, y: -20, duration: 0.3, ease: "power1.in" });
  });

  gsap.timeline({
    scrollTrigger: {
      trigger: ".chapter--unlock",
      start: "top 75%",
      end: "top 40%",
      scrub: 0.8
    }
  }).to(".next-section-inner", { opacity: 1, y: 0, ease: "power1.out" });

  const mainTl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1,
      onUpdate: (self) => setProgress(self.progress)
    }
  });

  mainTl
    .to(orb.scale, { x: 1, y: 1, z: 1 }, 0.08)
    .to(camera.position, { z: 4.2, y: 0.02 }, 0.08)
    .to(orb.position, { x: 0.95, y: 0.1, z: 0.1 }, 0.1)
    .to(orb.rotation, { y: Math.PI * 0.5, x: 0.15 }, 0.12)
    .to(camera.position, { z: 3.7, y: -0.36, x: -0.04 }, 0.33)
    .to(orb.position, { x: 0.55, y: 1.05, z: -0.2 }, 0.33)
    .to(orb.rotation, { y: Math.PI * 0.95, x: -0.1, z: 0.08 }, 0.33)
    .to(workGroup.position, { x: 0.14, y: -1.9, z: -0.84 }, 0.45)
    .to(camera.position, { z: 3.0, y: -1.15, x: 0.02 }, 0.66)
    .to(workGroup.position, { y: 2.2, z: -0.72 }, 0.72);

  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    ScrollTrigger.refresh();
  }

  function animate() {
    const t = clock.getElapsedTime();
    const d = clock.getDelta();
    pointer.x += (pointerTarget.x - pointer.x) * 0.055;
    pointer.y += (pointerTarget.y - pointer.y) * 0.055;

    const idle = 1 - THREE.MathUtils.smoothstep(sceneState.progress, 0.2, 0.75);
    world.rotation.y = pointer.x * 0.04;
    world.rotation.x = -pointer.y * 0.03;
    orb.rotation.y += d * 0.025 * idle;
    rings.children.forEach((ring, i) => {
      ring.rotation.z += d * (0.012 + i * 0.003) * (0.7 + idle * 0.3);
    });
    nodes.children.forEach((n) => {
      const s = 1 + Math.sin(t * 1.4 + n.userData.phase) * 0.08;
      n.scale.setScalar(s);
    });
    frames.forEach((f, i) => {
      f.position.y = f.userData.baseY + Math.sin(t * 0.4 + i) * 0.01;
    });

    updateLabels();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", (e) => {
    pointerTarget.x = (e.clientX / width - 0.5) * 2;
    pointerTarget.y = (e.clientY / height - 0.5) * 2;
  }, { passive: true });
  window.addEventListener("resize", onResize);

  setProgress(0);
  ScrollTrigger.refresh();
  animate();
})();
