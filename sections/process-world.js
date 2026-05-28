/* =========================================================
   BIM LABS — PROCESS SECTION
   Full replacement for: sections/process-world.js

   True single-word portal behavior:
   - Uses ONE PROCESS word only
   - Zoom target is the optical center of the letter C
   - Booking exists behind PROCESS before the zoom finishes
   - No fake blackout-to-new-section handoff
   - Scroll up reverses the zoom
   ========================================================= */

(function () {
  const section = document.querySelector(".process-work-copy");

  if (!section) {
    console.warn("[Process] Missing .process-work-copy");
    return;
  }

  const bigWord = section.querySelector(".process-work-word[data-portal-word]");
  const portalTarget = section.querySelector("[data-portal-target]");

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

  let portalMetrics = {
    x: 0,
    y: 0,
    scale: 7,
    originX: 0,
    originY: 0
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

      timer = window.setTimeout(() => {
        fn();
      }, delay);
    };
  }

  /* =========================================================
     MEASURE
     ========================================================= */

  function measure() {
    const rect = section.getBoundingClientRect();

    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(section.offsetHeight, window.innerHeight);

    scrollStart = sectionTop;
    scrollEnd = sectionTop + sectionHeight - window.innerHeight;

    measurePortalTarget();
    updateTargetProgress();
  }

  function measurePortalTarget() {
    if (!bigWord || !portalTarget) return;

    /*
      Reset the word to a clean measurable position.
      It is sticky at 50vh, so translateY(-50%) stays.
    */
    setStyles(bigWord, {
      transformOrigin: "center center",
      transform: "translate3d(0px, -50%, 0) scale(1)"
    });

    const wordRect = bigWord.getBoundingClientRect();
    const targetRect = portalTarget.getBoundingClientRect();

    const viewportCenterX = window.innerWidth / 2;
    const viewportCenterY = window.innerHeight / 2;

    /*
      A lowercase c's visual opening is not perfectly centered
      in the bounding box. These are optical tuning values.

      Increase opticalX slightly if it still feels too far left.
      Decrease opticalX if it feels too far right.
    */
    const opticalX = 0.54;
    const opticalY = 0.5;

    const targetCenterX = targetRect.left + targetRect.width * opticalX;
    const targetCenterY = targetRect.top + targetRect.height * opticalY;

    const originX = targetCenterX - wordRect.left;
    const originY = targetCenterY - wordRect.top;

    const moveX = viewportCenterX - targetCenterX;
    const moveY = viewportCenterY - targetCenterY;

    const targetSize = Math.max(targetRect.width, targetRect.height, 1);
    const viewportMax = Math.max(window.innerWidth, window.innerHeight);

    /*
      Controlled zoom scale.
      Do not go massive here. The C should become the doorway,
      then the room behind it should take over.
    */
    const zoomScale = clamp((viewportMax * 1.45) / targetSize, 5.2, 9.5);

    portalMetrics = {
      x: moveX,
      y: moveY,
      scale: zoomScale,
      originX,
      originY
    };
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

    if (bigWord) {
      setStyles(bigWord, {
        color: "#ffffff",
        opacity: "0.08",
        filter: "blur(2px)",
        transformOrigin: "center center",
        transform: "translate3d(0px, -50%, 0) scale(0.78)"
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
      portalExit.style.setProperty("--portal-progress", "0");
      portalExit.style.setProperty("--portal-bg-opacity", "0");

      portalExit.style.setProperty("--portal-depth-opacity", "0");
      portalExit.style.setProperty("--portal-depth-scale", "1");
      portalExit.style.setProperty("--portal-pull", "0");
      portalExit.style.setProperty("--portal-dot-scale", "1");
      portalExit.style.setProperty("--portal-dot-blur", "0px");

      portalExit.style.setProperty("--portal-core-opacity", "0");
      portalExit.style.setProperty("--portal-core-scale", "0.18");
      portalExit.style.setProperty("--portal-core-blur", "42px");

      portalExit.style.setProperty("--booking-opacity", "0");
      portalExit.style.setProperty("--booking-scale", "0.86");
      portalExit.style.setProperty("--booking-blur", "22px");
    }

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: "0",
        transform: "scale(0.86)",
        filter: "blur(22px)"
      });
    }
  }

  /* =========================================================
     PROCESS WORD / C TARGET ZOOM
     ========================================================= */

  function renderProcessWord(progress) {
    if (!bigWord) return;

    const enter = smoothstep(0, 0.16, progress);
    const grow = smoothstep(0.08, 0.52, progress);

    /*
      The portal starts taking over while cards are quieting.
    */
    const portalIntro = smoothstep(0.58, 0.68, progress);

    /*
      Faster zoom. The C should not hang huge on screen.
    */
    const zoomRaw = smoothstep(0.66, 0.82, progress);
    const zoom = easeInOutCubic(zoomRaw);

    /*
      Fade the word as the C becomes the doorway.
      This prevents the blown-up text from looking cheap.
    */
    const wordFadeOut = smoothstep(0.72, 0.82, progress);

    const baseScale =
      lerp(0.72, 0.92, enter) +
      lerp(0, 0.12, grow);

    const zoomScale = lerp(baseScale, portalMetrics.scale, zoom);

    const moveX = lerp(0, portalMetrics.x, zoom);
    const moveY = lerp(0, portalMetrics.y, zoom);

    const baseOpacity = lerp(0.08, 0.21, enter);

    /*
      Keep PROCESS readable through cards,
      then let it become the portal target,
      then get out of the way.
    */
    const opacity =
      baseOpacity *
      lerp(1, 1.08, portalIntro) *
      lerp(1, 0, wordFadeOut);

    const blur =
      lerp(2, 0, enter) +
      lerp(0, 8, wordFadeOut);

    const brightness = lerp(1, 0.82, wordFadeOut);
    const contrast = lerp(1, 1.1, zoom);

    setStyles(bigWord, {
      color: "#ffffff",
      opacity: clamp(opacity, 0, 0.24).toFixed(3),
      transformOrigin: `${portalMetrics.originX.toFixed(
        2
      )}px ${portalMetrics.originY.toFixed(2)}px`,
      filter: `blur(${blur.toFixed(2)}px) brightness(${brightness.toFixed(
        3
      )}) contrast(${contrast.toFixed(3)})`,
      transform: `translate3d(${moveX.toFixed(2)}px, calc(-50% + ${moveY.toFixed(
        2
      )}px), 0) scale(${zoomScale.toFixed(5)})`
    });
  }

  /* =========================================================
     CARD MOTION
     ========================================================= */

  function renderCards(progress) {
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

    /*
      Cards leave before the C zoom fully takes over.
    */
    const quiet = smoothstep(0.52, 0.68, progress);

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
      const blur = lerp(0, 10, quiet);

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
     PORTAL / BOOKING BEHIND PROCESS
     ========================================================= */

  function renderPortal(progress) {
    if (!portalExit) return;

    const portalIntro = smoothstep(0.58, 0.68, progress);
    const zoomRaw = smoothstep(0.66, 0.82, progress);
    const zoom = easeInOutCubic(zoomRaw);

    /*
      Booking starts early so it exists behind PROCESS during the zoom.
      This is the key difference from the old blackout/fade approach.
    */
    const bookingIn = smoothstep(0.68, 0.9, progress);

    /*
      Core is now a soft lens/depth layer, not a black curtain.
    */
    const coreOpen = smoothstep(0.72, 0.9, progress);
    const inside = smoothstep(0.78, 0.94, progress);

    portalExit.style.setProperty("--portal-progress", zoom.toFixed(3));
    portalExit.style.setProperty("--portal-bg-opacity", portalIntro.toFixed(3));

    /*
      Dust/depth should support the zoom, not become a space effect.
    */
    const depthOpacity = lerp(0, 0.5, portalIntro) * lerp(1, 0.55, inside);
    const depthScale = lerp(1, 1.18, zoom);
    const pull = lerp(0, 0.3, zoom);
    const dotScale = lerp(0.9, 1.55, zoom);
    const dotBlur = lerp(0, 2, zoom);

    portalExit.style.setProperty("--portal-depth-opacity", depthOpacity.toFixed(3));
    portalExit.style.setProperty("--portal-depth-scale", depthScale.toFixed(3));
    portalExit.style.setProperty("--portal-pull", pull.toFixed(3));
    portalExit.style.setProperty("--portal-dot-scale", dotScale.toFixed(3));
    portalExit.style.setProperty("--portal-dot-blur", `${dotBlur.toFixed(2)}px`);

    /*
      Soft lens. Not a full blackout.
      CSS should make portal-core semi-transparent, not pure black.
    */
    const coreOpacity = lerp(0, 0.72, coreOpen);
    const coreScale = lerp(0.18, 1.85, coreOpen);
    const coreBlur = lerp(42, 6, coreOpen);

    portalExit.style.setProperty("--portal-core-opacity", coreOpacity.toFixed(3));
    portalExit.style.setProperty("--portal-core-scale", coreScale.toFixed(3));
    portalExit.style.setProperty("--portal-core-blur", `${coreBlur.toFixed(2)}px`);

    /*
      Booking sits behind the PROCESS word and sharpens as we enter.
    */
    const bookingOpacity = bookingIn;
    const bookingScale = lerp(0.86, 1, easeInOutCubic(bookingIn));
    const bookingBlur = lerp(22, 0, bookingIn);

    portalExit.style.setProperty("--booking-opacity", bookingOpacity.toFixed(3));
    portalExit.style.setProperty("--booking-scale", bookingScale.toFixed(3));
    portalExit.style.setProperty("--booking-blur", `${bookingBlur.toFixed(2)}px`);

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: bookingOpacity.toFixed(3),
        filter: `blur(${bookingBlur.toFixed(2)}px)`,
        transform: `scale(${bookingScale.toFixed(4)})`
      });
    }

    section.classList.toggle("is-entering-portal", portalIntro > 0.4);
    section.classList.toggle("is-inside-portal", inside > 0.5);
  }

  /* =========================================================
     MAIN RENDER LOOP
     ========================================================= */

  function render(progress) {
    renderCards(progress);
    renderPortal(progress);
    renderProcessWord(progress);
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
     REVEAL OBSERVER
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

    if (bigWord) {
      setStyles(bigWord, {
        opacity: "0.12",
        filter: "none",
        transformOrigin: "center center",
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

    if (portalExit) {
      portalExit.style.setProperty("--portal-bg-opacity", "1");
      portalExit.style.setProperty("--portal-depth-opacity", "0.3");

      portalExit.style.setProperty("--portal-core-opacity", "0.45");
      portalExit.style.setProperty("--portal-core-scale", "1");
      portalExit.style.setProperty("--portal-core-blur", "8px");

      portalExit.style.setProperty("--booking-opacity", "1");
      portalExit.style.setProperty("--booking-scale", "1");
      portalExit.style.setProperty("--booking-blur", "0px");
    }

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
        measurePortalTarget();
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

    measure();
    refreshVisibleItems();
    render(currentProgress);
    bindEvents();

    console.log("[Process] Loaded accurate C portal zoom.", {
      items: items.length,
      cards: cards.length,
      hasProcessWord: Boolean(bigWord),
      hasPortalTargetC: Boolean(portalTarget),
      hasPortalExit: Boolean(portalExit),
      hasPortalStage: Boolean(portalStage),
      hasPortalBooking: Boolean(portalBooking),
      portalMetrics
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
