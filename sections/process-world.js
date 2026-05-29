import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

(function () {
  const section = document.querySelector(".process-work-copy");
  if (!section) return;

  const domWord = section.querySelector(".process-work-word");
  const wordWrap = section.querySelector(".process-work-word-wrap");

  const items = Array.from(section.querySelectorAll("[data-process-step]"));
  const cards = Array.from(section.querySelectorAll(".process-work-card"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  const portalExit = section.querySelector(".process-portal-exit");
  const portalStage = section.querySelector(".process-portal-stage");
  const portalBooking = section.querySelector(".portal-booking");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&<>/[]{}+-=_";

  let targetSectionProgress = 0;
  let targetPortalProgress = 0;
  let currentSectionProgress = 0;
  let currentPortalProgress = 0;

  let rafRunning = false;
  let observer = null;

  let renderer;
  let scene;
  let camera;
  let canvas;
  let apertureMesh;
  let glowMesh;
  let particleSystem;
  let clock;

  const portal = {
    cFocusX: 0.54,
    cFocusY: 0.5
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

  function forceBlackSite() {
    document.documentElement.style.background = "#000";
    document.body.style.background = "#000";
    section.style.background = "#000";
  }

  function updateProgress() {
    targetSectionProgress = getScrollProgress(section);
    targetPortalProgress = getScrollProgress(portalExit);
    startAnimationLoop();
  }

  function setupInitialState() {
    forceBlackSite();

    section.classList.add("process-js-ready");
    section.classList.remove("is-entering-portal", "is-inside-portal");

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

    if (wordWrap) {
      setStyles(wordWrap, {
        zIndex: "18",
        pointerEvents: "none"
      });
    }

    if (domWord) {
      setStyles(domWord, {
        color: "#ffffff",
        opacity: "0.08",
        filter: "blur(1.5px)",
        transform: "translate3d(0, -50%, 0) scale(0.72)",
        transformOrigin: "54% 50%",
        willChange: "transform, opacity, filter"
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

  function createApertureTexture() {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    const size = 1024;

    c.width = size;
    c.height = size;

    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.25, "rgba(0,0,0,0.95)");
    g.addColorStop(0.54, "rgba(0,0,0,0.46)");
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
    const count = 320;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = (Math.random() - 0.5) * 7;
      positions[i3 + 2] = -Math.random() * 12 - 1;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.016,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    return new THREE.Points(geometry, material);
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
    scene.fog = new THREE.FogExp2(0x000000, 0.05);

    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
    camera.position.set(0, 0, 7.5);

    clock = new THREE.Clock();

    const apertureGeometry = new THREE.PlaneGeometry(2.4, 2.4);
    const apertureMaterial = new THREE.MeshBasicMaterial({
      map: createApertureTexture(),
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    apertureMesh = new THREE.Mesh(apertureGeometry, apertureMaterial);
    apertureMesh.position.set(0.28, -0.02, 0.1);
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
    glowMesh.position.set(0.28, -0.02, -0.05);
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

  function renderDomProcessWord(sectionP, portalP) {
    if (!domWord) return;

    const enter = smoothstep(0.02, 0.16, sectionP);
    const grow = smoothstep(0.1, 0.52, sectionP);

    const portalStart = smoothstep(0.01, 0.18, portalP);
    const zoomRaw = smoothstep(0.14, 0.7, portalP);
    const zoom = easeInOutCubic(zoomRaw);
    const dissolve = smoothstep(0.64, 0.88, portalP);

    const baseScale = lerp(0.72, 1.04, grow);
    const portalScale = lerp(1, 4.6, zoom);

    const opacity =
      lerp(0.08, 0.24, enter) *
      lerp(1, 0.82, portalStart) *
      lerp(1, 0, dissolve);

    const blur =
      lerp(1.5, 0, enter) +
      lerp(0, 18, dissolve);

    const x = lerp(0, -4.5, zoom);
    const y = lerp(-50, -50, zoom);

    setStyles(domWord, {
      transformOrigin: "54% 50%",
      opacity: clamp(opacity, 0, 0.26).toFixed(3),
      filter: `blur(${blur.toFixed(2)}px)`,
      transform: `translate3d(${x.toFixed(2)}vw, ${y}%, 0) scale(${(baseScale * portalScale).toFixed(4)})`
    });
  }

  function renderCards(sectionP, portalP) {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const portalQuiet = smoothstep(0.01, 0.22, portalP);

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
      const driftX = direction * lerp(26, -26, smoothstep(0, 1, viewportProgress));
      const driftY = lerp(24, -18, smoothstep(0, 1, viewportProgress));

      const opacity = lerp(0.62, 1, visible) * lerp(1, 0, portalQuiet);
      const scale = lerp(0.975, 1, visible) * lerp(1, 0.94, portalQuiet);
      const y = driftY + lerp(0, -70, portalQuiet);
      const blur = lerp(0, 11, portalQuiet);

      setStyles(card, {
        opacity: opacity.toFixed(3),
        filter: `blur(${blur.toFixed(2)}px)`,
        transform: `translate3d(${driftX.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`
      });
    });
  }

  function renderWebGLVoid(portalP) {
    if (!renderer || !scene || !camera) return;

    const time = clock ? clock.getElapsedTime() : 0;

    const sceneIn = smoothstep(0.02, 0.18, portalP);
    const travelRaw = smoothstep(0.16, 0.72, portalP);
    const travel = easeInOutCubic(travelRaw);

    const apertureOpen = smoothstep(0.3, 0.78, portalP);
    const bookingIn = smoothstep(0.68, 0.96, portalP);

    camera.position.x = lerp(0, 0.28, travel);
    camera.position.y = lerp(0, -0.02, travel);
    camera.position.z = lerp(7.5, 2.0, travel);
    camera.lookAt(lerp(0, 0.28, travel), lerp(0, -0.02, travel), 0);

    if (apertureMesh) {
      apertureMesh.material.opacity = sceneIn * lerp(0.05, 0.9, apertureOpen);
      apertureMesh.scale.setScalar(lerp(0.2, 6.2, apertureOpen));
      apertureMesh.position.z = lerp(0.08, 0.32, apertureOpen);
    }

    if (glowMesh) {
      glowMesh.material.opacity = sceneIn * lerp(0.015, 0.1, apertureOpen) * lerp(1, 0.35, bookingIn);
      glowMesh.scale.setScalar(lerp(0.7, 6.8, apertureOpen));
    }

    if (particleSystem) {
      particleSystem.material.opacity = sceneIn * lerp(0.04, 0.3, travel) * lerp(1, 0.52, bookingIn);
      particleSystem.rotation.z = time * 0.012;
      particleSystem.position.z = lerp(1.3, 4.8, travel);

      const positions = particleSystem.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        const pull = travel * 0.0017;
        positions[i] += (0.28 - positions[i]) * pull;
        positions[i + 1] += (-0.02 - positions[i + 1]) * pull;
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

    section.classList.toggle("is-entering-portal", sceneIn > 0.15);
    section.classList.toggle("is-inside-portal", bookingIn > 0.7);

    renderer.render(scene, camera);
  }

  function render() {
    renderCards(currentSectionProgress, currentPortalProgress);
    renderDomProcessWord(currentSectionProgress, currentPortalProgress);
    renderWebGLVoid(currentPortalProgress);
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

    if (
      Math.abs(currentSectionProgress - targetSectionProgress) > 0.0005 ||
      Math.abs(currentPortalProgress - targetPortalProgress) > 0.0005
    ) {
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

      frame += 1;

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
    forceBlackSite();

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
      forceBlackSite();
      resizeWebGL();
      updateProgress();
      refreshVisibleItems();
      render();
    });
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

    console.log("[Process] Real DOM process word zoom loaded.", {
      cards: cards.length,
      items: items.length,
      hasDomWord: Boolean(domWord),
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
