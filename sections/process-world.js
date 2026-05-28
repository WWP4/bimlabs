import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   BIM LABS — PROCESS WORLD
   WebGL atmosphere + GSAP pinned transition
   ========================================================= */

const section = document.querySelector(".bim-world-entry");
const canvas = document.querySelector("#bimWorldCanvas");

const capabilityScene = document.querySelector(".world-scene-capabilities");
const capabilityCopy = document.querySelector(".world-copy-capabilities");
const capabilityRibbon = document.querySelector(".capability-ribbon");
const capabilityPanels = gsap.utils.toArray(".capability-panel");

const voidScene = document.querySelector(".world-scene-void");
const processScene = document.querySelector(".world-scene-process");
const processCopy = document.querySelector(".world-copy-process");
const processChapters = gsap.utils.toArray(".process-chapter");

const progressBar = document.querySelector(".world-progress span");

if (!section || !canvas) {
  console.warn("BIM world section or canvas not found.");
}

/* =========================================================
   OPTIONAL SCROLLSMOOTHER
   Only activates if ScrollSmoother is already loaded.
   ========================================================= */

if (window.ScrollSmoother) {
  gsap.registerPlugin(window.ScrollSmoother);

  window.bimSmoother = window.ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 1.15,
    normalizeScroll: true,
    effects: false
  });
}

/* =========================================================
   THREE SETUP
   ========================================================= */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030303);
scene.fog = new THREE.FogExp2(0x030303, 0.032);

const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  220
);

camera.position.set(0, 4.2, 22);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

/* =========================================================
   LIGHTING
   Keep the world black, but readable.
   ========================================================= */

const ambient = new THREE.AmbientLight(0xffffff, 0.035);
scene.add(ambient);

const softKey = new THREE.DirectionalLight(0xffffff, 1.25);
softKey.position.set(-9, 10, 11);
scene.add(softKey);

const rim = new THREE.DirectionalLight(0xffffff, 2.4);
rim.position.set(8, 5, -9);
scene.add(rim);

const lowGlow = new THREE.PointLight(0xffffff, 2.1, 42);
lowGlow.position.set(0, -2.7, 2);
scene.add(lowGlow);

const farGlow = new THREE.PointLight(0xffffff, 1.25, 60);
farGlow.position.set(4, 2, -18);
scene.add(farGlow);

/* =========================================================
   MATERIALS
   ========================================================= */

const blackLux = new THREE.MeshStandardMaterial({
  color: 0x070707,
  roughness: 0.78,
  metalness: 0.14
});

const blackSoft = new THREE.MeshStandardMaterial({
  color: 0x0a0a0a,
  roughness: 0.92,
  metalness: 0.05
});

const edgeMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.075
});

const glowMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.055,
  depthWrite: false
});

/* =========================================================
   WORLD FLOOR — NO GRIDLINES
   Just depth, horizon, and luxury glow.
   ========================================================= */

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(120, 120, 1, 1),
  new THREE.MeshStandardMaterial({
    color: 0x030303,
    roughness: 0.96,
    metalness: 0.04
  })
);

floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -3.2, -16);
scene.add(floor);

const horizonGlow = new THREE.Mesh(
  new THREE.PlaneGeometry(42, 5),
  glowMat
);

horizonGlow.position.set(1.8, -1.35, -26);
scene.add(horizonGlow);

const floorGlow = new THREE.Mesh(
  new THREE.CircleGeometry(20, 96),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.045,
    depthWrite: false
  })
);

floorGlow.rotation.x = -Math.PI / 2;
floorGlow.position.set(3, -3.08, -9);
scene.add(floorGlow);

/* =========================================================
   DISTANT WORLD OBJECTS
   Abstract slabs, not UI cards.
   These create scale and depth.
   ========================================================= */

const worldGroup = new THREE.Group();
scene.add(worldGroup);

const distantObjects = [];

for (let i = 0; i < 12; i++) {
  const w = gsap.utils.random(2.2, 5.8);
  const h = gsap.utils.random(3.2, 9.5);
  const d = gsap.utils.random(0.18, 0.55);

  const geo = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geo, i % 3 === 0 ? blackSoft : blackLux);

  const side = i % 2 === 0 ? -1 : 1;

  mesh.position.set(
    side * gsap.utils.random(7, 23),
    -1.2 + h / 2,
    gsap.utils.random(-36, -12)
  );

  mesh.rotation.y = side * gsap.utils.random(0.08, 0.28);
  mesh.rotation.x = gsap.utils.random(-0.02, 0.02);

  worldGroup.add(mesh);
  distantObjects.push(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(edges, edgeMat);
  line.position.copy(mesh.position);
  line.rotation.copy(mesh.rotation);
  worldGroup.add(line);
}

/* =========================================================
   PROCESS MONOLITHS
   These rise later as the process world appears.
   ========================================================= */

const processGroup = new THREE.Group();
processGroup.position.set(2.4, -4.6, -8);
processGroup.rotation.y = -0.12;
scene.add(processGroup);

const processMonoliths = [];

const monolithHeights = [5.4, 6.2, 5.8, 6.8];

for (let i = 0; i < 4; i++) {
  const geo = new THREE.BoxGeometry(2.55, monolithHeights[i], 0.52);
  const mesh = new THREE.Mesh(geo, blackLux);

  mesh.position.set(i * 3.15, -4.2, -i * 0.55);
  mesh.rotation.y = -0.08;

  processGroup.add(mesh);
  processMonoliths.push(mesh);

  const edges = new THREE.EdgesGeometry(geo);
  const line = new THREE.LineSegments(edges, edgeMat);
  line.position.copy(mesh.position);
  line.rotation.copy(mesh.rotation);
  processGroup.add(line);
}

processGroup.traverse((child) => {
  if (child.material) {
    child.material.transparent = true;
    child.material.opacity = 0;
  }
});

/* =========================================================
   LUXURY PARTICLE DEPTH
   Very subtle. Not "tech dots everywhere."
   ========================================================= */

const particleCount = 420;
const positions = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  positions[i * 3] = gsap.utils.random(-36, 36);
  positions[i * 3 + 1] = gsap.utils.random(-2.2, 12);
  positions[i * 3 + 2] = gsap.utils.random(-48, 10);
}

const particleGeo = new THREE.BufferGeometry();
particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const particles = new THREE.Points(
  particleGeo,
  new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.018,
    transparent: true,
    opacity: 0.32,
    depthWrite: false
  })
);

scene.add(particles);

/* =========================================================
   DOM INITIAL STATES
   ========================================================= */

gsap.set(capabilityPanels, {
  transformOrigin: "center center",
  z: 0,
  rotateY: -5
});

gsap.set(processScene, {
  opacity: 0,
  y: 34
});

gsap.set(processCopy, {
  opacity: 0,
  y: 28
});

gsap.set(processChapters, {
  opacity: 0,
  y: 190,
  rotateX: 13,
  transformOrigin: "bottom center"
});

gsap.set(voidScene, {
  opacity: 0,
  scale: 0.86
});

/* =========================================================
   HELPERS
   ========================================================= */

function setGroupOpacity(group, opacity) {
  group.traverse((child) => {
    if (!child.material) return;
    child.material.transparent = true;
    child.material.opacity = opacity;
  });
}

const lookAtTarget = new THREE.Vector3(0, -0.8, -10);

/* =========================================================
   MAIN SCROLL TIMELINE
   Keep this focused.
   This is section 2 entering section 3.
   ========================================================= */

const tl = gsap.timeline({
  defaults: {
    ease: "none"
  },
  scrollTrigger: {
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1.2,
    pin: ".world-sticky",
    anticipatePin: 1,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      if (progressBar) {
        progressBar.style.width = `${self.progress * 100}%`;
      }
    }
  }
});

/* -----------------------------
   Phase 1: horizontal world
----------------------------- */

tl.to(capabilityRibbon, {
  x: () => -window.innerWidth * 0.72,
  duration: 0.32
}, 0);

tl.to(worldGroup.position, {
  x: -5.6,
  z: 1.8,
  duration: 0.32
}, 0);

tl.to(camera.position, {
  x: -1.4,
  y: 4.05,
  z: 20.4,
  duration: 0.32
}, 0);

/* -----------------------------
   Phase 2: slow-down / camera pause
   Feels like the world stops breathing.
----------------------------- */

tl.to(camera.position, {
  x: -0.35,
  y: 4.0,
  z: 20.9,
  duration: 0.14
}, 0.32);

tl.to(capabilityRibbon, {
  scale: 0.985,
  duration: 0.14
}, 0.32);

tl.to(lowGlow, {
  intensity: 1.55,
  duration: 0.14
}, 0.32);

/* -----------------------------
   Phase 3: capabilities fall backward
----------------------------- */

tl.to(capabilityScene, {
  opacity: 0,
  scale: 0.92,
  filter: "blur(10px)",
  duration: 0.22
}, 0.48);

tl.to(capabilityPanels, {
  z: -180,
  rotateY: -14,
  stagger: 0.015,
  duration: 0.2
}, 0.48);

tl.to(worldGroup.position, {
  z: -10,
  y: -1.2,
  duration: 0.22
}, 0.48);

tl.to(worldGroup.scale, {
  x: 0.72,
  y: 0.72,
  z: 0.72,
  duration: 0.22
}, 0.48);

tl.to(scene.fog, {
  density: 0.07,
  duration: 0.22
}, 0.48);

tl.to(voidScene, {
  opacity: 1,
  scale: 1,
  duration: 0.2
}, 0.5);

/* -----------------------------
   Phase 4: dark floor / process world arrives
----------------------------- */

tl.to(voidScene, {
  opacity: 0,
  scale: 1.12,
  duration: 0.18
}, 0.66);

tl.to(processScene, {
  opacity: 1,
  y: 0,
  duration: 0.2
}, 0.64);

tl.to(processCopy, {
  opacity: 1,
  y: 0,
  duration: 0.18
}, 0.68);

tl.to(camera.position, {
  x: 2.6,
  y: 4.35,
  z: 17.8,
  duration: 0.34
}, 0.64);

tl.to(scene.fog, {
  density: 0.038,
  duration: 0.34
}, 0.64);

tl.to(lowGlow, {
  intensity: 3.2,
  duration: 0.34
}, 0.64);

tl.to(farGlow, {
  intensity: 2.2,
  duration: 0.34
}, 0.64);

tl.to(horizonGlow.material, {
  opacity: 0.095,
  duration: 0.34
}, 0.64);

tl.to(floorGlow.material, {
  opacity: 0.075,
  duration: 0.34
}, 0.64);

/* Process WebGL monoliths rise */

tl.to(processGroup.position, {
  y: 1.2,
  z: -9.4,
  duration: 0.32
}, 0.66);

tl.to(processGroup.rotation, {
  y: -0.03,
  duration: 0.32
}, 0.66);

tl.to({}, {
  duration: 0.26,
  onUpdate: function () {
    const opacity = this.progress();
    setGroupOpacity(processGroup, opacity * 0.88);
  }
}, 0.66);

processMonoliths.forEach((mesh, index) => {
  tl.to(mesh.position, {
    y: -0.2 + index * 0.14,
    duration: 0.16,
    ease: "power2.out"
  }, 0.69 + index * 0.045);
});

/* DOM chapters rise */

processChapters.forEach((chapter, index) => {
  tl.to(chapter, {
    opacity: 1,
    y: 0,
    rotateX: 0,
    duration: 0.16,
    ease: "power2.out"
  }, 0.72 + index * 0.055);
});

/* -----------------------------
   Phase 5: final living-world drift
----------------------------- */

tl.to(camera.position, {
  x: 4.2,
  y: 4.18,
  z: 16.6,
  duration: 0.2
}, 0.86);

tl.to(processGroup.position, {
  x: 0.6,
  z: -10.2,
  duration: 0.2
}, 0.86);

/* =========================================================
   RENDER LOOP
   ========================================================= */

const clock = new THREE.Clock();

function animate() {
  const elapsed = clock.getElapsedTime();

  particles.rotation.y = elapsed * 0.009;
  particles.position.y = Math.sin(elapsed * 0.25) * 0.06;

  horizonGlow.material.opacity =
    0.055 + Math.sin(elapsed * 0.45) * 0.012;

  floorGlow.material.opacity =
    0.045 + Math.sin(elapsed * 0.35) * 0.01;

  distantObjects.forEach((object, index) => {
    object.position.y += Math.sin(elapsed * 0.45 + index) * 0.0007;
    object.rotation.y += Math.sin(elapsed * 0.28 + index) * 0.00008;
  });

  processMonoliths.forEach((object, index) => {
    object.rotation.y += Math.sin(elapsed * 0.35 + index) * 0.0001;
  });

  const scrollProgress = tl.scrollTrigger ? tl.scrollTrigger.progress : 0;

  lookAtTarget.set(
    THREE.MathUtils.lerp(0, 3.4, scrollProgress),
    THREE.MathUtils.lerp(-0.85, -1.05, scrollProgress),
    THREE.MathUtils.lerp(-11, -12.8, scrollProgress)
  );

  camera.lookAt(lookAtTarget);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* =========================================================
   RESIZE
   ========================================================= */

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  ScrollTrigger.refresh();
}

window.addEventListener("resize", resize);

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});
