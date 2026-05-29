// js/process-scene.js

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export class ProcessScene {
  constructor({ mount, word = "PROCESS" }) {
    this.mount = mount;
    this.word = word;

    this.width = 1;
    this.height = 1;
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    this.wordMesh = null;
    this.wordTexture = null;
    this.wordCanvas = null;
    this.wordContext = null;

    this.dust = null;
    this.tunnel = null;
    this.vignettePlane = null;

    this.clock = new THREE.Clock();
    this.raf = null;

    this.state = {
      intro: 0,
      cards: 0,
      handoff: 0,
      targetX: 0,
      targetY: 0,
      cameraZ: 7.5,
      cameraX: 0,
      cameraY: 0,
      wordScale: 1,
      opacity: 1
    };

    this.mouse = {
      x: 0,
      y: 0,
      easedX: 0,
      easedY: 0
    };

    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.render = this.render.bind(this);
  }

  init() {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createWord();
    this.createDepthDust();
    this.createTunnel();
    this.createVignette();

    this.mount.appendChild(this.renderer.domElement);

    this.handleResize();
    this.addEvents();
    this.render();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#020202");
    this.scene.fog = new THREE.FogExp2("#020202", 0.075);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    this.camera.position.set(0, 0, this.state.cameraZ);
    this.camera.lookAt(0, 0, 0);
  }

  createRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance"
    });

    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setClearColor("#020202", 1);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  createWord() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 4096;
    canvas.height = 1024;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0.18)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.92)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0.98)");
    gradient.addColorStop(1, "rgba(255,255,255,0.18)");

    ctx.fillStyle = gradient;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.font = "900 610px Arial, Helvetica, sans-serif";
    ctx.letterSpacing = "-28px";

    ctx.shadowColor = "rgba(255,255,255,0.26)";
    ctx.shadowBlur = 42;
    ctx.fillText(this.word, canvas.width / 2, canvas.height / 2 + 12);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 2;
    ctx.strokeText(this.word, canvas.width / 2, canvas.height / 2 + 12);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(9.6, 2.4, 1, 1);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.95,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 0, 0);
    mesh.scale.setScalar(0.72);

    this.wordCanvas = canvas;
    this.wordContext = ctx;
    this.wordTexture = texture;
    this.wordMesh = mesh;

    this.scene.add(mesh);
  }

  createDepthDust() {
    const count = 900;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3 + 0] = (Math.random() - 0.5) * 14;
      positions[i3 + 1] = (Math.random() - 0.5) * 8;
      positions[i3 + 2] = -Math.random() * 24;

      sizes[i] = Math.random() * 0.018 + 0.006;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.018,
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    this.dust = new THREE.Points(geometry, material);
    this.scene.add(this.dust);
  }

  createTunnel() {
    const group = new THREE.Group();

    const ringCount = 16;

    for (let i = 0; i < ringCount; i++) {
      const radius = 1.1 + i * 0.34;
      const geometry = new THREE.TorusGeometry(radius, 0.006, 8, 96);

      const material = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        transparent: true,
        opacity: Math.max(0.015, 0.105 - i * 0.005),
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const ring = new THREE.Mesh(geometry, material);
      ring.position.z = -i * 0.55 - 0.4;
      ring.rotation.z = i * 0.08;

      group.add(ring);
    }

    group.position.set(1.28, -0.03, -0.28);
    group.scale.setScalar(0.08);
    group.visible = false;

    this.tunnel = group;
    this.scene.add(group);
  }

  createVignette() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 1024;
    canvas.height = 1024;

    const gradient = ctx.createRadialGradient(
      512,
      512,
      80,
      512,
      512,
      520
    );

    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(0.62, "rgba(0,0,0,0.12)");
    gradient.addColorStop(1, "rgba(0,0,0,0.82)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 1024);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    this.vignettePlane = new THREE.Mesh(geometry, material);

    this.vignettePlane.position.z = -1;
  }

  addEvents() {
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("mousemove", this.handleMouseMove);
  }

  removeEvents() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("mousemove", this.handleMouseMove);
  }

  handleResize() {
    const rect = this.mount.getBoundingClientRect();

    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height, false);
  }

  handleMouseMove(event) {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    this.mouse.x = x;
    this.mouse.y = y;
  }

  setIntroProgress(value) {
    this.state.intro = clamp01(value);
  }

  setCardsProgress(value) {
    this.state.cards = clamp01(value);
  }

  setHandoffProgress(value) {
    this.state.handoff = clamp01(value);
  }

  setProgress({ intro = this.state.intro, cards = this.state.cards, handoff = this.state.handoff }) {
    this.state.intro = clamp01(intro);
    this.state.cards = clamp01(cards);
    this.state.handoff = clamp01(handoff);
  }

  render() {
    this.raf = requestAnimationFrame(this.render);

    const elapsed = this.clock.getElapsedTime();

    this.mouse.easedX += (this.mouse.x - this.mouse.easedX) * 0.045;
    this.mouse.easedY += (this.mouse.y - this.mouse.easedY) * 0.045;

    const intro = easeOutCubic(this.state.intro);
    const cards = easeInOutCubic(this.state.cards);
    const handoff = easeInOutCubic(this.state.handoff);

    const cameraBaseZ = lerp(8.2, 5.35, intro);
    const cameraCardsZ = lerp(cameraBaseZ, 4.2, cards);
    const cameraHandoffZ = lerp(cameraCardsZ, 0.62, handoff);

    const targetX = lerp(0, 1.28, handoff);
    const targetY = lerp(0, -0.03, handoff);

    const parallaxX = this.mouse.easedX * 0.18 * (1 - handoff);
    const parallaxY = -this.mouse.easedY * 0.12 * (1 - handoff);

    this.camera.position.x = lerp(this.camera.position.x, targetX + parallaxX, 0.075);
    this.camera.position.y = lerp(this.camera.position.y, targetY + parallaxY, 0.075);
    this.camera.position.z = lerp(this.camera.position.z, cameraHandoffZ, 0.075);

    this.camera.lookAt(targetX, targetY, -0.5 - handoff * 1.9);

    if (this.wordMesh) {
      const wordScale = lerp(0.72, 1.26, intro);
      const handoffScale = lerp(wordScale, 3.9, handoff);

      this.wordMesh.scale.setScalar(handoffScale);

      this.wordMesh.position.x = lerp(0, -1.18, handoff);
      this.wordMesh.position.y = lerp(0, 0.05, handoff);
      this.wordMesh.position.z = lerp(0, -1.35, handoff);

      this.wordMesh.material.opacity = lerp(0.55, 0.98, intro) * lerp(1, 0.18, handoff);
    }

    if (this.dust) {
      this.dust.rotation.y = elapsed * 0.018;
      this.dust.rotation.x = Math.sin(elapsed * 0.18) * 0.025;
      this.dust.material.opacity = lerp(0.16, 0.42, intro) * lerp(1, 1.3, handoff);
      this.dust.position.z = handoff * 1.4;
    }

    if (this.tunnel) {
      this.tunnel.visible = handoff > 0.015;
      this.tunnel.scale.setScalar(lerp(0.08, 1.45, handoff));
      this.tunnel.rotation.z = elapsed * 0.035 + handoff * 1.4;

      this.tunnel.children.forEach((ring, index) => {
        ring.position.z += 0.006 + handoff * 0.035;

        if (ring.position.z > 0.5) {
          ring.position.z = -8;
        }

        ring.material.opacity = (0.035 + handoff * 0.12) * (1 - index / this.tunnel.children.length);
      });
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.removeEvents();

    this.scene.traverse((object) => {
      if (!object.isMesh && !object.isPoints) return;

      if (object.geometry) object.geometry.dispose();

      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(disposeMaterial);
        } else {
          disposeMaterial(object.material);
        }
      }
    });

    if (this.wordTexture) this.wordTexture.dispose();

    this.renderer.dispose();
    this.renderer.forceContextLoss();

    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

function disposeMaterial(material) {
  Object.keys(material).forEach((key) => {
    const value = material[key];

    if (value && typeof value === "object" && "minFilter" in value) {
      value.dispose();
    }
  });

  material.dispose();
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
