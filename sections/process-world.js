import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

(function () {
  const section = document.querySelector(".process-work-copy");
  if (!section) return;

  const domWord = section.querySelector(".process-work-word");
  const items = Array.from(section.querySelectorAll("[data-process-step]"));
  const cards = Array.from(section.querySelectorAll(".process-work-card"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  const portalExit = section.querySelector(".process-portal-exit");
  const portalStage = section.querySelector(".process-portal-stage");
  const portalBooking = section.querySelector(".portal-booking");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&<>/[]{}+-=_";

  let sectionProgress = 0;
  let portalProgress = 0;

  let targetSectionProgress = 0;
  let targetPortalProgress = 0;

  let currentSectionProgress = 0;
  let currentPortalProgress = 0;

  let rafRunning = false;
  let observer = null;

  let renderer, scene, camera, canvas;
  let wordMesh, apertureMesh, glowMesh, particleSystem;
  let clock;

  const webgl = {
    cTargetX: 0.72,
    cTargetY: -0.02,
    cameraStartZ: 8.8,
    cameraEndZ: 2.05
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function smoothstep(edge0, edge1, value) {
    const x = clamp((value - edge0) / Math.max(edge1 - edge0, 0.0001), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function easeInOutCubic(value) {
    const x = clamp(value, 0, 1);
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function setStyles(element, styles) {
    if (!element) return;
    Object.assign(element.style, styles);
  }

  function randomGlyph() {
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function debounce(fn, delay) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function getScrollProgress(el) {
    if (!el) return 0;

    const rect = el.getBoundingClientRect();
    const start = window.scrollY + rect.top;
    const end = start + el.offsetHeight - window.innerHeight;

    return clamp((window.scrollY - start) / Math.max(end - start, 1), 0, 1);
  }

  function updateProgress() {
    sectionProgress = getScrollProgress(section);
    portalProgress = getScrollProgress(portalExit);

    targetSectionProgress = sectionProgress;
    targetPortalProgress = portalProgress;

    startAnimationLoop();
  }

  function setupInitialState() {
    section.classList.add("process-js-ready");

    items.forEach((item) => {
      item.classList.remove("is-visible", "is-hovered", "is-glitching");
    });

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.finalText = finalText;
      text.dataset.scrambled = "false";
      text.dataset.scrambling = "false";
      text.classList.remove("is-scrambling");
    });

    if (domWord) {
      setStyles(domWord, {
        color: "#ffffff",
        opacity: "0.08",
        filter: "blur(2px)",
        transform: "translate3d(0, -50%, 0) scale(0.72)"
      });
    }

    cards.forEach((card) => {
      setStyles(card, {
        opacity: "0.72",
        filter: "blur(0px)",
        transform: "translate3d(0, 24px, 0) scale(0.985)"
      });
    });

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: "0",
        transform: "scale(0.88)",
        filter: "blur(24px)"
      });
    }
  }

  function createWordTexture() {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");

    c.width = 4096;
    c.height = 1200;

    const fontFamily = getComputedStyle(document.body).fontFamily || "Arial, sans-serif";

    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 660px ${fontFamily}`;

    ctx.fillText("process", c.width / 2, c.height / 2 + 36);

    const gradient = ctx.createLinearGradient(0, 0, c.width, c.height);
    gradient.addColorStop(0, "rgba(255,255,255,0.72)");
    gradient.addColorStop(0.48, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0.72)");

    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, c.width, c.height);

    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;

    return texture;
  }

  function createApertureTexture() {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const size = 1024;

    c.width = size;
    c.height = size;

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.28, "rgba(0,0,0,0.95)");
    g.addColorStop(0.56, "rgba(0,0,0,0.42)");
    g.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;

    return texture;
  }

  function createParticles() {
    const count = 260;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = (Math.random() - 0.5) * 7;
      positions[i3 + 2] = -Math.random() * 11 - 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.position.z = 1.4;

    return points;
  }

  function initWebGL() {
    if (!portalStage || canvas) return;

    canvas = document.createElement("canvas");
    canvas.className = "process-portal-canvas";
    canvas.setAttribute("aria-hidden", "true");
    portalStage.prepend(canvas);

    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });

    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.045);

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 0, webgl.cameraStartZ);

    clock = new THREE.Clock();

    const wordGeometry = new THREE.PlaneGeometry(7.2, 1.95);
    const wordMaterial = new THREE.MeshBasicMaterial({
      map: createWordTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    wordMesh = new THREE.Mesh(wordGeometry, wordMaterial);
    wordMesh.position.set(0, 0, 0);
    scene.add(wordMesh);

    const apertureGeometry = new THREE.PlaneGeometry(2.2, 2.2);
    const apertureMaterial = new THREE.MeshBasicMaterial({
      map: createApertureTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    apertureMesh = new THREE.Mesh(apertureGeometry, apertureMaterial);
    apertureMesh.position.set(webgl.cTargetX, webgl.cTargetY, 0.04);
    scene.add(apertureMesh);

    const glowGeometry = new THREE.CircleGeometry(1, 96);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.set(webgl.cTargetX, webgl.cTargetY, -0.05);
    scene.add(glowMesh);

    particleSystem = createParticles();
    scene.add(particleSystem);

    resizeWebGL();
  }

  function resizeWebGL() {
    if (!renderer || !camera || !portalStage) return;

    const rect = portalStage.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function renderDomProcessWord(progress, portal) {
    if (!domWord) return;

    const enter = smoothstep(0.02, 0.16, progress);
    const grow = smoothstep(0.12, 0.52, progress);

    const fadeForPortal = smoothstep(0.01, 0.22, portal);

    const scale = lerp(0.72, 1.04, grow);
    const opacity = lerp(0.08, 0.22, enter) * lerp(1, 0, fadeForPortal);
    const blur = lerp(2, 0, enter) + lerp(0, 12, fadeForPortal);

    setStyles(domWord, {
      opacity: clamp(opacity, 0, 0.24).toFixed(3),
      filter: `blur(${blur.toFixed(2)}px)`,
      transform: `translate3d(0, -50%, 0) scale(${scale.toFixed(4)})`
    });
  }

  function renderCards(progress, portal) {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const portalQuiet = smoothstep(0.01, 0.25, portal);

    cards.forEach((card) => {
      const item = card.closest(".process-work-item");
      if (!item || item.classList.contains("is-hovered")) return;

      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;

      const distance = Math.abs(itemCenter - viewportCenter) / viewportHeight;
      const focus = 1 - clamp(distance, 0, 1);
      const visible = smoothstep(0.12, 0.78, focus);

      const isRight = item.classList.contains("process-work-item--right");
      const direction = isRight ? 1 : -1;

      const viewportProgress = clamp(itemCenter / viewportHeight, 0, 1);
      const driftX = direction * lerp(28, -28, smoothstep(0, 1, viewportProgress));
      const driftY = lerp(26, -18, smoothstep(0, 1, viewportProgress));

      const opacity = lerp(0.62, 1, visible) * lerp(1, 0, portalQuiet);
      const scale = lerp(0.975, 1, visible) * lerp(1, 0.94, portalQuiet);
      const y = driftY + lerp(0, -64, portalQuiet);
      const blur = lerp(0, 10, portalQuiet);

      setStyles(card, {
        opacity: opacity.toFixed(3),
        filter: `blur(${blur.toFixed(2)}px)`,
        transform: `translate3d(${driftX.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
      });
    });
  }

  function renderWebGLPortal(progress) {
    if (!renderer || !scene || !camera) return;

    const time = clock ? clock.getElapsedTime() : 0;

    const sceneIn = smoothstep(0.02, 0.16, progress);
    const travelRaw = smoothstep(0.14, 0.58, progress);
    const travel = easeInOutCubic(travelRaw);

    const apertureOpen = smoothstep(0.34, 0.72, progress);
    const wordFade = smoothstep(0.5, 0.76, progress);
    const bookingIn = smoothstep(0.62, 0.94, progress);

    camera.position.x = lerp(0, webgl.cTargetX, travel);
    camera.position.y = lerp(0, webgl.cTargetY, travel);
    camera.position.z = lerp(webgl.cameraStartZ, webgl.cameraEndZ, travel);

    camera.lookAt(webgl.cTargetX * travel, webgl.cTargetY * travel, 0);

    if (wordMesh) {
      wordMesh.material.opacity = clamp(sceneIn * lerp(1, 0, wordFade), 0, 1);
      wordMesh.position.z = lerp(0, -0.26, travel);
      wordMesh.rotation.z = lerp(0, -0.006, travel);
      wordMesh.scale.setScalar(lerp(1, 1.1, travel));
    }

    if (apertureMesh) {
      apertureMesh.material.opacity = clamp(lerp(0, 0.88, apertureOpen), 0, 0.88);
      apertureMesh.scale.setScalar(lerp(0.18, 5.2, apertureOpen));
      apertureMesh.position.z = lerp(0.04, 0.28, apertureOpen);
    }

    if (glowMesh) {
      glowMesh.material.opacity = sceneIn * lerp(0.025, 0.11, apertureOpen) * lerp(1, 0.28, wordFade);
      glowMesh.scale.setScalar(lerp(0.8, 5.8, apertureOpen));
    }

    if (particleSystem) {
      particleSystem.material.opacity = sceneIn * lerp(0.05, 0.28, travel) * lerp(1, 0.55, bookingIn);
      particleSystem.rotation.z = time * 0.015;
      particleSystem.position.z = lerp(1.4, 4.4, travel);

      const positions = particleSystem.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        const pull = travel * 0.0015;
        positions[i] += (webgl.cTargetX - positions[i]) * pull;
        positions[i + 1] += (webgl.cTargetY - positions[i + 1]) * pull;
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    const bookingOpacity = bookingIn;
    const bookingScale = lerp(0.9, 1, easeInOutCubic(bookingIn));
    const bookingBlur = lerp(22, 0, bookingIn);

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: bookingOpacity.toFixed(3),
        transform: `scale(${bookingScale.toFixed(4)})`,
        filter: `blur(${bookingBlur.toFixed(2)}px)`
      });
    }

    section.classList.toggle("is-entering-portal", sceneIn > 0.18);
    section.classList.toggle("is-inside-portal", bookingIn > 0.7);

    renderer.render(scene, camera);
  }

  function render() {
    renderCards(currentSectionProgress, currentPortalProgress);
    renderDomProcessWord(currentSectionProgress, currentPortalProgress);
    renderWebGLPortal(currentPortalProgress);
  }

  function startAnimationLoop() {
    if (rafRunning || prefersReducedMotion) return;

    rafRunning = true;
    requestAnimationFrame(animate);
  }

  function animate() {
    currentSectionProgress = lerp(currentSectionProgress, targetSectionProgress, 0.08);
    currentPortalProgress = lerp(currentPortalProgress, targetPortalProgress, 0.08);

    render();

    const sectionDelta = Math.abs(currentSectionProgress - targetSectionProgress);
    const portalDelta = Math.abs(currentPortalProgress - targetPortalProgress);

    if (sectionDelta > 0.0005 || portalDelta > 0.0005) {
      requestAnimationFrame(animate);
    } else {
      currentSectionProgress = targetSectionProgress;
      currentPortalProgress = targetPortalProgress;
      render();
      rafRunning = false;
    }
  }

  function setupObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = entry.target;

          if (entry.isIntersecting) {
            revealItem(item);
          } else {
            item.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0.22,
        rootMargin: "-12% 0px -16% 0px"
      }
    );

    items.forEach((item) => observer.observe(item));
  }

  function revealItem(item) {
    item.classList.add("is-visible");

    const title = item.querySelector(".glitch-text");
    if (title) scrambleText(title);
  }

  function scrambleText(element, options = {}) {
    if (!element || prefersReducedMotion) return;
    if (element.dataset.scrambling === "true") return;
    if (!options.force && element.dataset.scrambled === "true") return;

    const finalText =
      element.dataset.finalText ||
      element.getAttribute("data-glitch-text") ||
      element.textContent.trim();

    element.dataset.scrambling = "true";
    element.classList.add("is-scrambling");

    let frame = 0;
    const totalFrames = options.force ? 12 : 22;
    const speed = options.force ? 18 : 24;

    const interval = setInterval(() => {
      const progress = frame / totalFrames;

      element.textContent = finalText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          const revealPoint = index / Math.max(finalText.length, 1);
          return progress > revealPoint + 0.12 ? char : randomGlyph();
        })
        .join("");

      frame++;

      if (frame > totalFrames) {
        clearInterval(interval);
        element.textContent = finalText;
        element.dataset.scrambling = "false";
        element.dataset.scrambled = "true";
        element.classList.remove("is-scrambling");

        const item = element.closest(".process-work-item");
        if (item) {
          item.classList.add("is-glitching");
          setTimeout(() => item.classList.remove("is-glitching"), 460);
        }
      }
    }, speed);
  }

  function setupHoverEffects() {
    items.forEach((item) => {
      const card = item.querySelector(".process-work-card");
      const title = item.querySelector(".glitch-text");

      function enter() {
        item.classList.add("is-hovered");

        if (card) {
          setStyles(card, {
            transform: "translate3d(0, -8px, 0) scale(1.012)",
            opacity: "1",
            filter: "blur(0px)"
          });
        }

        if (title) scrambleText(title, { force: true });
      }

      function leave() {
        item.classList.remove("is-hovered");
        updateProgress();
      }

      item.addEventListener("mouseenter", enter);
      item.addEventListener("mouseleave", leave);
      item.addEventListener("focusin", enter);
      item.addEventListener("focusout", leave);
    });
  }

  function refreshVisibleItems() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      if (center > viewportHeight * 0.1 && center < viewportHeight * 0.9) {
        revealItem(item);
      }
    });
  }

  function setupReducedMotion() {
    items.forEach((item) => item.classList.add("is-visible"));

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.scrambled = "true";
      text.dataset.scrambling = "false";
    });

    if (domWord) {
      setStyles(domWord, {
        opacity: "0.12",
        filter: "none",
        transform: "translate3d(0, -50%, 0) scale(1)"
      });
    }

    cards.forEach((card) => {
      setStyles(card, {
        opacity: "1",
        transform: "none",
        filter: "none"
      });
    });

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: "1",
        transform: "scale(1)",
        filter: "none"
      });
    }
  }

  function bindEvents() {
    window.addEventListener("scroll", updateProgress, { passive: true });

    window.addEventListener(
      "resize",
      debounce(() => {
        resizeWebGL();
        updateProgress();
        refreshVisibleItems();
        render();
      }, 150)
    );

    window.addEventListener("load", () => {
      resizeWebGL();
      updateProgress();
      refreshVisibleItems();
      render();
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (wordMesh) {
          wordMesh.material.map = createWordTexture();
          wordMesh.material.needsUpdate = true;
        }

        resizeWebGL();
        render();
      });
    }
  }

  function init() {
    setupInitialState();

    if (prefersReducedMotion) {
      setupReducedMotion();
      return;
    }

    setupObserver();
    setupHoverEffects();
    initWebGL();
    bindEvents();

    resizeWebGL();
    updateProgress();
    refreshVisibleItems();
    render();

    console.log("[Process] WebGL split timeline loaded.", {
      cards: cards.length,
      items: items.length,
      hasPortalExit: Boolean(portalExit),
      hasPortalStage: Boolean(portalStage),
      hasPortalBooking: Boolean(portalBooking)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
