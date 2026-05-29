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
    this.dust = null;

    this.clock = new THREE.Clock();
    this.raf = null;

    this.state = {
      intro: 0,
      cards: 0,
      handoff: 0
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

    this.mount.appendChild(this.renderer.domElement);

    this.handleResize();
    this.addEvents();
    this.render();
  }

  createScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#020202");
    this.scene.fog = new THREE.FogExp2("#020202", 0.06);
  }

  createCamera() {
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
    this.camera.position.set(0, 0, 8.2);
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

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "900 610px Arial, Helvetica, sans-serif";

    const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0.08)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.72)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0.88)");
    gradient.addColorStop(1, "rgba(255,255,255,0.08)");

    ctx.fillStyle = gradient;
    ctx.fillText(this.word, canvas.width / 2, canvas.height / 2 + 10);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(10.4, 2.6, 1, 1);

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.74,
      depthWrite: false
    });

    this.wordMesh = new THREE.Mesh(geometry, material);
    this.wordMesh.position.set(0, 0, -0.45);
    this.wordMesh.scale.setScalar(0.74);

    this.wordTexture = texture;

    this.scene.add(this.wordMesh);
  }

  createDepthDust() {
    const count = 360;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3 + 0] = (Math.random() - 0.5) * 13;
      positions[i3 + 1] = (Math.random() - 0.5) * 7;
      positions[i3 + 2] = -Math.random() * 18;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: "#ffffff",
      size: 0.012,
      transparent: true,
      opacity: 0.18,
      depthWrite: false
    });

    this.dust = new THREE.Points(geometry, material);
    this.scene.add(this.dust);
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
    this.mouse.x = event.clientX / window.innerWidth - 0.5;
    this.mouse.y = event.clientY / window.innerHeight - 0.5;
  }

  setProgress({ intro = this.state.intro, cards = this.state.cards, handoff = this.state.handoff }) {
    this.state.intro = clamp01(intro);
    this.state.cards = clamp01(cards);
    this.state.handoff = clamp01(handoff);
  }

  render() {
    this.raf = requestAnimationFrame(this.render);

    const elapsed = this.clock.getElapsedTime();

    this.mouse.easedX += (this.mouse.x - this.mouse.easedX) * 0.035;
    this.mouse.easedY += (this.mouse.y - this.mouse.easedY) * 0.035;

    const intro = easeOutCubic(this.state.intro);
    const cards = easeInOutCubic(this.state.cards);
    const handoff = easeInOutCubic(this.state.handoff);

    const cameraZ = lerp(8.6, 5.85, intro);
    const cardCameraZ = lerp(cameraZ, 5.2, cards);
    const exitCameraZ = lerp(cardCameraZ, 3.85, handoff);

    const parallaxX = this.mouse.easedX * 0.12 * (1 - handoff);
    const parallaxY = -this.mouse.easedY * 0.08 * (1 - handoff);

    this.camera.position.x = lerp(this.camera.position.x, parallaxX, 0.07);
    this.camera.position.y = lerp(this.camera.position.y, parallaxY, 0.07);
    this.camera.position.z = lerp(this.camera.position.z, exitCameraZ, 0.07);
    this.camera.lookAt(0, 0, -0.5);

    if (this.wordMesh) {
      const baseScale = lerp(0.74, 1.12, intro);
      const cardScale = lerp(baseScale, 1.22, cards);
      const exitScale = lerp(cardScale, 1.55, handoff);

      this.wordMesh.scale.setScalar(exitScale);
      this.wordMesh.position.y = lerp(0.02, -0.08, cards);
      this.wordMesh.position.z = lerp(-0.45, -1.15, handoff);

      const baseOpacity = lerp(0.38, 0.7, intro);
      const activeOpacity = lerp(baseOpacity, 0.48, cards);
      this.wordMesh.material.opacity = lerp(activeOpacity, 0.08, handoff);
    }

    if (this.dust) {
      this.dust.rotation.y = elapsed * 0.012;
      this.dust.position.z = handoff * 0.75;
      this.dust.material.opacity = lerp(0.1, 0.2, intro) * lerp(1, 0.35, handoff);
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

    if (this.renderer.domElement?.parentNode) {
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
