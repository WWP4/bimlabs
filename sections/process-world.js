/* =========================================================
   BIM LABS — PROCESS SECTION
   Full replacement for: sections/process-world.js

   Real ending behavior:
   - Cards teach the process
   - Cards quiet down
   - PROCESS background fades
   - Portal word appears as the final camera target
   - Camera zooms into the letter C
   - Booking appears from inside the C
   - Scrolling back reverses the zoom
   ========================================================= */

(function () {
  const section = document.querySelector(".process-work-copy");

  if (!section) {
    console.warn("[Process] Missing .process-work-copy");
    return;
  }

  const bigWord = section.querySelector(".process-work-word");
  const items = Array.from(section.querySelectorAll("[data-process-step]"));
  const cards = Array.from(section.querySelectorAll(".process-work-card"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  const portalExit = section.querySelector(".process-portal-exit");
  const portalStage = section.querySelector(".process-portal-stage");
  const portalWord = section.querySelector("[data-portal-word]");
  const portalTarget = section.querySelector("[data-portal-target]");
  const portalBooking = section.querySelector(".portal-booking");
  const portalCore = section.querySelector(".portal-core");
  const portalDepthField = section.querySelector(".portal-depth-field");

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
    scale: 1
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
    if (!portalStage || !portalWord || !portalTarget) return;

    /*
      Reset transform before measuring so the C target is measured
      from its natural position in the pinned scene.
    */
    setStyles(portalWord, {
      transform: "translate3d(0px, 0px, 0px) scale(1)"
    });

    const stageRect = portalStage.getBoundingClientRect();
    const targetRect = portalTarget.getBoundingClientRect();

    const stageCenterX = stageRect.left + stageRect.width / 2;
    const stageCenterY = stageRect.top + stageRect.height / 2;

    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const moveX = stageCenterX - targetCenterX;
    const moveY = stageCenterY - targetCenterY;

    /*
      Scale target:
      Make the C grow far beyond viewport size so it feels like
      the camera actually enters the letter instead of just zooming text.
    */
    const targetWidth = Math.max(targetRect.width, 1);
    const targetHeight = Math.max(targetRect.height, 1);
    const viewportMax = Math.max(window.innerWidth, window.innerHeight);

    const zoomScale = clamp((viewportMax * 3.4) / Math.max(targetWidth, targetHeight), 16, 42);

    portalMetrics = {
      x: moveX,
      y: moveY,
      scale: zoomScale
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
        transform: "translate3d(0, -50%, 0) scale(0.78)"
      });
    }

    cards.forEach((card) => {
      setStyles(card, {
        opacity: "0.78",
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
      portalExit.style.setProperty("--portal-core-scale", "0.2");
      portalExit.style.setProperty("--portal-core-blur", "48px");
      portalExit.style.setProperty("--booking-opacity", "0");
      portalExit.style.setProperty("--booking-scale", "0.72");
      portalExit.style.setProperty("--booking-blur", "32px");
    }

    if (portalWord) {
      setStyles(portalWord, {
        opacity: "0",
        filter: "blur(18px)",
        transform: "translate3d(0px, 0px, 0px) scale(0.82)"
      });
    }

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: "0",
        transform: "scale(0.72)",
        filter: "blur(32px)"
      });
    }
  }

  /* =========================================================
     BACKGROUND PROCESS WORD
     ========================================================= */

  function renderBigWord(progress) {
    if (!bigWord) return;

    const enter = smoothstep(0, 0.16, progress);
    const grow = smoothstep(0.08, 0.56, progress);

    /*
      This word belongs to the card chapter.
      It fades before the portal word takes over.
    */
    const exit = smoothstep(0.54, 0.73, progress);

    const scale =
      lerp(0.72, 0.92, enter) +
      lerp(0, 0.16, grow) -
      lerp(0, 0.12, exit);

    const opacity =
      lerp(0.08, 0.21, enter) -
      lerp(0, 0.21, exit);

    const blur = lerp(2, 0, enter) + lerp(0, 18, exit);

    setStyles(bigWord, {
      color: "#ffffff",
      opacity: clamp(opacity, 0, 0.21).toFixed(3),
      filter: `blur(${blur.toFixed(2)}px)`,
      transform: `translate3d(0, -50%, 0) scale(${scale.toFixed(4)})`
    });
  }

  /* =========================================================
     CARD MOTION
     ========================================================= */

  function renderCards(progress) {
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight;

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
     TRUE PORTAL ZOOM INTO LETTER C
     ========================================================= */

  function renderPortalZoom(progress) {
    if (!portalExit || !portalStage || !portalWord || !portalTarget) return;

    /*
      Timelines:
      - portalIntro: portal stage takes over
      - zoomRaw: camera moves into the C
      - inside: booking room becomes current section
    */
    const portalIntro = smoothstep(0.62, 0.74, progress);
    const zoomRaw = smoothstep(0.72, 0.94, progress);
    const zoom = easeInOutCubic(zoomRaw);
    const inside = smoothstep(0.86, 1, progress);

    const wordOpacity = lerp(0, 1, portalIntro) * lerp(1, 0.08, inside);
    const wordBlur = lerp(18, 0, portalIntro) + lerp(0, 6, inside);

    /*
      Real target zoom:
      Move the word so the C is centered, then scale heavily.
      This gives the camera-target feeling.
    */
    const moveX = lerp(0, portalMetrics.x, zoom);
    const moveY = lerp(0, portalMetrics.y, zoom);
    const scale = lerp(0.82, portalMetrics.scale, zoom);

    /*
      As we get very close, the word should stop feeling like text
      and become a wall/portal edge.
    */
    const brightness = lerp(1, 0.72, inside);
    const contrast = lerp(1, 1.25, zoom);

    setStyles(portalWord, {
      opacity: clamp(wordOpacity, 0, 1).toFixed(3),
      filter: `blur(${wordBlur.toFixed(2)}px) brightness(${brightness.toFixed(
        3
      )}) contrast(${contrast.toFixed(3)})`,
      transform: `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(
        2
      )}px, 0) scale(${scale.toFixed(5)})`
    });

    /*
      Depth atmosphere.
      Dots pull toward center as the C fills the screen.
    */
    const depthOpacity = lerp(0, 0.72, portalIntro) * lerp(1, 0.45, inside);
    const depthScale = lerp(1, 1.28, zoom);
    const pull = lerp(0, 0.42, zoom);
    const dotScale = lerp(0.9, 2.45, zoom);
    const dotBlur = lerp(0, 3.4, zoom);

    portalExit.style.setProperty("--portal-progress", zoom.toFixed(3));
    portalExit.style.setProperty("--portal-bg-opacity", portalIntro.toFixed(3));
    portalExit.style.setProperty("--portal-depth-opacity", depthOpacity.toFixed(3));
    portalExit.style.setProperty("--portal-depth-scale", depthScale.toFixed(3));
    portalExit.style.setProperty("--portal-pull", pull.toFixed(3));
    portalExit.style.setProperty("--portal-dot-scale", dotScale.toFixed(3));
    portalExit.style.setProperty("--portal-dot-blur", `${dotBlur.toFixed(2)}px`);

    /*
      Core darkness opens right where the C becomes too large to read.
    */
    const coreOpacity = smoothstep(0.76, 0.96, progress);
    const coreScale = lerp(0.2, 1.8, smoothstep(0.78, 1, progress));
    const coreBlur = lerp(52, 4, smoothstep(0.78, 1, progress));

    portalExit.style.setProperty("--portal-core-opacity", coreOpacity.toFixed(3));
    portalExit.style.setProperty("--portal-core-scale", coreScale.toFixed(3));
    portalExit.style.setProperty("--portal-core-blur", `${coreBlur.toFixed(2)}px`);

    /*
      Booking appears after the C has taken over the viewport.
      It does not scroll up. It comes forward from the same center.
    */
    const bookingIn = smoothstep(0.88, 1, progress);
    const bookingOpacity = bookingIn;
    const bookingScale = lerp(0.72, 1, easeInOutCubic(bookingIn));
    const bookingBlur = lerp(34, 0, bookingIn);

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: bookingOpacity.toFixed(3),
        filter: `blur(${bookingBlur.toFixed(2)}px)`,
        transform: `scale(${bookingScale.toFixed(4)})`
      });
    }

    portalExit.style.setProperty("--booking-opacity", bookingOpacity.toFixed(3));
    portalExit.style.setProperty("--booking-scale", bookingScale.toFixed(3));
    portalExit.style.setProperty("--booking-blur", `${bookingBlur.toFixed(2)}px`);

    section.classList.toggle("is-entering-portal", portalIntro > 0.4);
    section.classList.toggle("is-inside-portal", inside > 0.5);
  }

  /* =========================================================
     MAIN RENDER LOOP
     ========================================================= */

  function render(progress) {
    renderBigWord(progress);
    renderCards(progress);
    renderPortalZoom(progress);
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
        color: "#ffffff",
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

    if (portalWord) {
      setStyles(portalWord, {
        opacity: "1",
        filter: "none",
        transform: "none"
      });
    }

    if (portalBooking) {
      setStyles(portalBooking, {
        opacity: "1",
        transform: "scale(1)",
        filter: "none"
      });
    }

    if (portalExit) {
      portalExit.style.setProperty("--portal-bg-opacity", "1");
      portalExit.style.setProperty("--portal-depth-opacity", "0.35");
      portalExit.style.setProperty("--portal-core-opacity", "0.75");
      portalExit.style.setProperty("--portal-core-scale", "1");
      portalExit.style.setProperty("--portal-core-blur", "6px");
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

    console.log("[Process] Loaded portal zoom.", {
      items: items.length,
      cards: cards.length,
      hasBigWord: Boolean(bigWord),
      hasPortalExit: Boolean(portalExit),
      hasPortalStage: Boolean(portalStage),
      hasPortalWord: Boolean(portalWord),
      hasPortalTarget: Boolean(portalTarget),
      hasPortalBooking: Boolean(portalBooking)
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
