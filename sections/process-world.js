/* =========================================================
   BIM LABS — PROCESS SECTION
   Full replacement for: sections/process-world.js

   Real WebGL camera flow:
   - HTML cards still handle the readable process content
   - Final portal is a pinned Three.js scene
   - WebGL PROCESS word becomes the camera target
   - Camera moves toward the C area
   - Aperture / depth opens before text gets ugly
   - Booking overlay emerges behind the WebGL scene
   ========================================================= */

import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

(function () {
  const section = document.querySelector(".process-work-copy");

  if (!section) {
    console.warn("[Process] Missing .process-work-copy");
    return;
  }

  const domWord = section.querySelector(".process-work-word");
  const items = Array.from(section.querySelectorAll("[data-process-step]"));
  const cards = Array.from(section.querySelectorAll(".process-work-card"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  const portalExit = section.querySelector(".process-portal-exit");
  const portalStage = section.querySelector(".process-portal-stage");
  const portalBooking = section.querySelector(".portal-booking");

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&<>/[]{}+-=_";

  let sectionTop = 0;
  let sectionHeight = 1;
  let scrollStart = 0;
  let scrollEnd = 1;

  let targetProgress = 0;
  let currentProgress = 0;
  let rafRunning = false;
  let observer = null;

  let webglReady = false;
  let renderer;
  let scene;
  let camera;
  let canvas;
  let wordMesh;
  let apertureMesh;
  let glowMesh;
  let particleSystem;
  let clock;

  const webgl = {
    width: 1,
    height: 1,
    dpr: 1,
    wordAspect: 3.7,
    cTargetX: 0.18,
    cTargetY: 0,
    cameraStartZ: 8.5,
    cameraEndZ: 2.15
  };

  /* =========================================================
     HELPERS
     ========================================================= */

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function smoothstep(edge0, edge1, value) {
    const x = clamp(
      (value - edge0) / Math.max(edge1 - edge0, 0.0001),
      0,
      1
    );

    return x * x * (3 - 2 * x);
  }

  function easeInOutCubic(value) {
    const x = clamp(value, 0, 1);

    return x < 0.5
      ? 4 * x * x * x
      : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }

  function randomGlyph() {
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function setStyles(element, styles) {
    if (!element) return;
    Object.assign(element.style, styles);
  }

  function debounce(fn, delay) {
    let timer;

    return function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(fn, delay);
    };
  }

  /* =========================================================
     MEASURE / SCROLL PROGRESS
     ========================================================= */

  function measure() {
    const rect = section.getBoundingClientRect();

    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(section.offsetHeight, window.innerHeight);

    scrollStart = sectionTop;
    scrollEnd = sectionTop + sectionHeight - window.innerHeight;

    updateTargetProgress();
    resizeWebGL();
  }

  function updateTargetProgress() {
    const raw =
      (window.scrollY - scrollStart) / Math.max(scrollEnd - scrollStart, 1);

    targetProgress = clamp(raw, 0, 1);
    startAnimationLoop();
  }

  /* =========================================================
     INITIAL STATE
     ========================================================= */

  function setupInitialState() {
    section.classList.add("process-js-ready");
    section.classList.remove("is-entering-portal", "is-inside-portal");

    items.forEach((item) => {
      item.classList.remove("is-visible", "is-hovered", "is-glitching");
    });

    glitchTexts.forEach((text) => {
      const finalText =
        text.getAttribute("data-glitch-text") || text.textContent.trim();

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
        transform: "translate3d(0, -50%, 0) scale(0.78)"
      });
    }

    cards.forEach((card) => {
      setStyles(card, {
        opacity: "0.78",
        filter: "blur(0px)",
        transform: "translate3d(0, 24px, 0) scale(0.985)"
      });
    });

    if (portalExit) {
      portalExit.style.setProperty("--booking-opacity", "0");
      portalExit.style.setProperty("--booking-scale", "0.88");
      portalExit.style.setProperty("--booking-blur", "24px");
    }

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: "0",
        transform: "scale(0.88)",
        filter: "blur(24px)"
      });
    }
  }

  /* =========================================================
     WEBGL SETUP
     ========================================================= */

  function createWordTexture() {
    const textureCanvas = document.createElement("canvas");
    const ctx = textureCanvas.getContext("2d");

    const width = 4096;
    const height = 1200;

    textureCanvas.width = width;
    textureCanvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const fontFamily =
      getComputedStyle(document.body).fontFamily || "Manrope, Arial, sans-serif";

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 660px ${fontFamily}`;
    ctx.letterSpacing = "-58px";

    /*
      Canvas letter spacing support is inconsistent, so draw normally first.
      The mesh scale and camera move do the premium work.
    */
    ctx.fillText("process", width / 2, height / 2 + 36);

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "rgba(255,255,255,0.86)");
    gradient.addColorStop(0.5, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0.78)");

    ctx.globalCompositeOperation = "source-in";
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    return texture;
  }

  function createApertureTexture() {
    const textureCanvas = document.createElement("canvas");
    const ctx = textureCanvas.getContext("2d");

    const size = 1024;
    textureCanvas.width = size;
    textureCanvas.height = size;

    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    gradient.addColorStop(0, "rgba(0,0,0,1)");
    gradient.addColorStop(0.34, "rgba(0,0,0,0.92)");
    gradient.addColorStop(0.62, "rgba(0,0,0,0.42)");
    gradient.addColorStop(1, "rgba(0,0,0,0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture;
  }

  function createParticles() {
    const count = 220;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      const i3 = i * 3;

      positions[i3 + 0] = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = (Math.random() - 0.5) * 7;
      positions[i3 + 2] = -Math.random() * 10 - 1;

      sizes[i] = Math.random() * 0.8 + 0.2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.position.z = 1.5;

    return points;
  }

  function initWebGL() {
    if (!portalStage || webglReady) return;

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

    const wordTexture = createWordTexture();
    const wordMaterial = new THREE.MeshBasicMaterial({
      map: wordTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const wordGeometry = new THREE.PlaneGeometry(7.2, 1.95);
    wordMesh = new THREE.Mesh(wordGeometry, wordMaterial);
    wordMesh.position.set(0, 0, 0);
    scene.add(wordMesh);

    /*
      Approximate C target inside the word plane.
      Word is "process"; C is the fourth letter.
      This target is intentionally optical, not mathematically exact.
    */
    webgl.cTargetX = 0.72;
    webgl.cTargetY = -0.02;

    const apertureTexture = createApertureTexture();

    const apertureMaterial = new THREE.MeshBasicMaterial({
      map: apertureTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false
    });

    const apertureGeometry = new THREE.PlaneGeometry(2.1, 2.1);
    apertureMesh = new THREE.Mesh(apertureGeometry, apertureMaterial);
    apertureMesh.position.set(webgl.cTargetX, webgl.cTargetY, 0.04);
    scene.add(apertureMesh);

    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const glowGeometry = new THREE.CircleGeometry(1, 96);
    glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.position.set(webgl.cTargetX, webgl.cTargetY, -0.05);
    glowMesh.scale.set(0.8, 0.8, 1);
    scene.add(glowMesh);

    particleSystem = createParticles();
    scene.add(particleSystem);

    webglReady = true;
    resizeWebGL();
  }

  function resizeWebGL() {
    if (!renderer || !camera || !portalStage) return;

    const rect = portalStage.getBoundingClientRect();
    const width = Math.max(1, rect.width || window.innerWidth);
    const height = Math.max(1, rect.height || window.innerHeight);

    webgl.width = width;
    webgl.height = height;
    webgl.dpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(webgl.dpr);
    renderer.setSize(width, height, false);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  /* =========================================================
     HTML PROCESS WORD / CARDS
     ========================================================= */

  function renderDomProcessWord(progress) {
    if (!domWord) return;

    const enter = smoothstep(0, 0.16, progress);
    const grow = smoothstep(0.08, 0.52, progress);

    /*
      The DOM word fades out as the WebGL word takes over.
      This prevents duplicate PROCESS words.
    */
    const webglTakeover = smoothstep(0.52, 0.64, progress);

    const scale =
      lerp(0.72, 0.92, enter) +
      lerp(0, 0.12, grow);

    const opacity =
      lerp(0.08, 0.21, enter) *
      lerp(1, 0, webglTakeover);

    const blur =
      lerp(2, 0, enter) +
      lerp(0, 10, webglTakeover);

    setStyles(domWord, {
      color: "#ffffff",
      opacity: clamp(opacity, 0, 0.22).toFixed(3),
      filter: `blur(${blur.toFixed(2)}px)`,
      transform: `translate3d(0, -50%, 0) scale(${scale.toFixed(4)})`
    });
  }

  function renderCards(progress) {
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    const quiet = smoothstep(0.5, 0.64, progress);

    cards.forEach((card) => {
      const item = card.closest(".process-work-item");

      if (!item) return;

      const rect = item.getBoundingClientRect();
      const itemCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;

      const distanceFromCenter =
        Math.abs(itemCenter - viewportCenter) / viewportHeight;

      const focus = 1 - clamp(distanceFromCenter, 0, 1);
      const visibleStrength = smoothstep(0.12, 0.78, focus);

      const isRight = item.classList.contains("process-work-item--right");
      const direction = isRight ? 1 : -1;

      const viewportProgress = clamp(itemCenter / viewportHeight, 0, 1);

      const driftX =
        direction * lerp(28, -28, smoothstep(0, 1, viewportProgress));

      const driftY = lerp(26, -18, smoothstep(0, 1, viewportProgress));

      const baseOpacity = lerp(0.62, 1, visibleStrength);
      const baseScale = lerp(0.975, 1, visibleStrength);

      const finalOpacity = baseOpacity * lerp(1, 0, quiet);
      const finalScale = baseScale * lerp(1, 0.94, quiet);
      const finalY = driftY + lerp(0, -58, quiet);
      const blur = lerp(0, 9, quiet);

      if (!item.classList.contains("is-hovered")) {
        setStyles(card, {
          opacity: finalOpacity.toFixed(3),
          filter: `blur(${blur.toFixed(2)}px)`,
          transform: `translate3d(${driftX.toFixed(2)}px, ${finalY.toFixed(
            2
          )}px, 0) scale(${finalScale.toFixed(4)})`
        });
      }
    });
  }

  /* =========================================================
     WEBGL CAMERA SCENE
     ========================================================= */

  function renderWebGLPortal(progress) {
    if (!webglReady || !renderer || !scene || !camera) return;

    const time = clock ? clock.getElapsedTime() : 0;

    /*
      Main scene timeline.
      The scene appears before the camera move, then the camera travels
      toward the C target. Booking appears behind the WebGL scene early.
    */
    const sceneIn = smoothstep(0.54, 0.66, progress);
    const travelRaw = smoothstep(0.64, 0.84, progress);
    const travel = easeInOutCubic(travelRaw);
    const apertureOpen = smoothstep(0.68, 0.88, progress);
    const wordFade = smoothstep(0.74, 0.86, progress);
    const bookingIn = smoothstep(0.7, 0.92, progress);

    /*
      Camera moves through real 3D space.
      It starts centered, then tracks toward the C target.
    */
    camera.position.x = lerp(0, webgl.cTargetX, travel);
    camera.position.y = lerp(0, webgl.cTargetY, travel);
    camera.position.z = lerp(webgl.cameraStartZ, webgl.cameraEndZ, travel);

    camera.lookAt(webgl.cTargetX * travel, webgl.cTargetY * travel, 0);

    if (wordMesh) {
      const wordOpacity = sceneIn * lerp(1, 0, wordFade);

      wordMesh.material.opacity = clamp(wordOpacity, 0, 1);
      wordMesh.position.z = lerp(0, -0.22, travel);
      wordMesh.rotation.z = lerp(0, -0.006, travel);
      wordMesh.scale.setScalar(lerp(1, 1.08, travel));
    }

    if (apertureMesh) {
      apertureMesh.material.opacity = clamp(lerp(0, 0.86, apertureOpen), 0, 0.86);
      apertureMesh.scale.setScalar(lerp(0.22, 4.8, apertureOpen));
      apertureMesh.position.z = lerp(0.04, 0.25, apertureOpen);
    }

    if (glowMesh) {
      glowMesh.material.opacity =
        sceneIn * lerp(0.035, 0.11, apertureOpen) * lerp(1, 0.3, wordFade);

      glowMesh.scale.setScalar(lerp(0.8, 5.2, apertureOpen));
    }

    if (particleSystem) {
      particleSystem.material.opacity =
        sceneIn * lerp(0.08, 0.32, travel) * lerp(1, 0.55, bookingIn);

      particleSystem.rotation.z = time * 0.015;
      particleSystem.position.z = lerp(1.5, 4.2, travel);

      const positions = particleSystem.geometry.attributes.position.array;

      for (let i = 0; i < positions.length; i += 3) {
        const pull = travel * 0.0018;

        positions[i + 0] += (webgl.cTargetX - positions[i + 0]) * pull;
        positions[i + 1] += (webgl.cTargetY - positions[i + 1]) * pull;
      }

      particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    /*
      Booking overlay is HTML but visually synchronized with camera.
      It appears behind the scene instead of after a hard blackout.
    */
    const bookingOpacity = bookingIn;
    const bookingScale = lerp(0.9, 1, easeInOutCubic(bookingIn));
    const bookingBlur = lerp(22, 0, bookingIn);

    if (portalExit) {
      portalExit.style.setProperty("--booking-opacity", bookingOpacity.toFixed(3));
      portalExit.style.setProperty("--booking-scale", bookingScale.toFixed(3));
      portalExit.style.setProperty("--booking-blur", `${bookingBlur.toFixed(2)}px`);
    }

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: bookingOpacity.toFixed(3),
        transform: `scale(${bookingScale.toFixed(4)})`,
        filter: `blur(${bookingBlur.toFixed(2)}px)`
      });
    }

    section.classList.toggle("is-entering-portal", sceneIn > 0.25);
    section.classList.toggle("is-inside-portal", bookingIn > 0.62);

    renderer.render(scene, camera);
  }

  /* =========================================================
     MAIN RENDER LOOP
     ========================================================= */

  function render(progress) {
    renderCards(progress);
    renderDomProcessWord(progress);
    renderWebGLPortal(progress);
  }

  function startAnimationLoop() {
    if (rafRunning || prefersReducedMotion) return;

    rafRunning = true;
    window.requestAnimationFrame(animate);
  }

  function animate() {
    currentProgress = lerp(currentProgress, targetProgress, 0.075);

    render(currentProgress);

    if (Math.abs(currentProgress - targetProgress) > 0.0005) {
      window.requestAnimationFrame(animate);
    } else {
      currentProgress = targetProgress;
      render(currentProgress);
      rafRunning = false;
    }
  }

  /* =========================================================
     CARD REVEAL OBSERVER
     ========================================================= */

  function setupObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = entry.target;

          if (entry.isIntersecting) {
            revealItem(item);
          } else {
            hideItem(item);
          }
        });
      },
      {
        root: null,
        threshold: 0.22,
        rootMargin: "-12% 0px -16% 0px"
      }
    );

    items.forEach((item) => {
      observer.observe(item);
    });
  }

  function revealItem(item) {
    if (!item) return;

    item.classList.add("is-visible");

    const title = item.querySelector(".glitch-text");

    if (title) {
      scrambleText(title);
    }
  }

  function hideItem(item) {
    if (!item) return;
    item.classList.remove("is-visible");
  }

  function refreshVisibleItems() {
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      const isInReadingZone =
        center > viewportHeight * 0.1 && center < viewportHeight * 0.9;

      if (isInReadingZone) {
        revealItem(item);
      }
    });
  }

  /* =========================================================
     SCRAMBLE / GLITCH TEXT
     ========================================================= */

  function scrambleText(element, options = {}) {
    if (!element || prefersReducedMotion) return;

    const force = options.force === true;

    if (element.dataset.scrambling === "true") return;
    if (!force && element.dataset.scrambled === "true") return;

    const finalText =
      element.dataset.finalText ||
      element.getAttribute("data-glitch-text") ||
      element.textContent.trim();

    element.dataset.scrambling = "true";
    element.classList.add("is-scrambling");

    let frame = 0;

    const totalFrames = force ? 12 : 22;
    const speed = force ? 18 : 24;

    const interval = window.setInterval(() => {
      const progress = frame / totalFrames;

      const output = finalText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";

          const revealPoint = index / Math.max(finalText.length, 1);
          const shouldReveal = progress > revealPoint + 0.12;

          return shouldReveal ? char : randomGlyph();
        })
        .join("");

      element.textContent = output;
      frame += 1;

      if (frame > totalFrames) {
        window.clearInterval(interval);

        element.textContent = finalText;
        element.dataset.scrambling = "false";
        element.dataset.scrambled = "true";
        element.classList.remove("is-scrambling");

        triggerGlitch(element);
      }
    }, speed);
  }

  function triggerGlitch(element) {
    const item = element.closest(".process-work-item");

    if (!item) return;

    item.classList.add("is-glitching");

    window.setTimeout(() => {
      item.classList.remove("is-glitching");
    }, 460);
  }

  /* =========================================================
     HOVER EFFECTS
     ========================================================= */

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

        if (title) {
          scrambleText(title, { force: true });
        }
      }

      function leave() {
        item.classList.remove("is-hovered");

        updateTargetProgress();
        renderCards(currentProgress);
      }

      item.addEventListener("mouseenter", enter);
      item.addEventListener("mouseleave", leave);
      item.addEventListener("focusin", enter);
      item.addEventListener("focusout", leave);
    });
  }

  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  function setupReducedMotion() {
    items.forEach((item) => {
      item.classList.add("is-visible");
    });

    glitchTexts.forEach((text) => {
      const finalText =
        text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.scrambled = "true";
      text.dataset.scrambling = "false";
      text.classList.remove("is-scrambling");
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

  /* =========================================================
     EVENTS
     ========================================================= */

  function bindEvents() {
    window.addEventListener(
      "scroll",
      () => {
        updateTargetProgress();
      },
      { passive: true }
    );

    window.addEventListener(
      "resize",
      debounce(() => {
        measure();
        refreshVisibleItems();
        render(currentProgress);
      }, 160)
    );

    window.addEventListener("load", () => {
      measure();
      refreshVisibleItems();
      render(currentProgress);
    });

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (webglReady && wordMesh) {
          wordMesh.material.map = createWordTexture();
          wordMesh.material.map.needsUpdate = true;
        }

        resizeWebGL();
        render(currentProgress);
      });
    }
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    setupInitialState();

    if (prefersReducedMotion) {
      setupReducedMotion();
      return;
    }

    setupObserver();
    setupHoverEffects();
    initWebGL();

    measure();
    refreshVisibleItems();
    render(currentProgress);
    bindEvents();

    console.log("[Process] Loaded WebGL camera portal.", {
      items: items.length,
      cards: cards.length,
      hasPortalExit: Boolean(portalExit),
      hasPortalStage: Boolean(portalStage),
      hasPortalBooking: Boolean(portalBooking),
      webglReady
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
