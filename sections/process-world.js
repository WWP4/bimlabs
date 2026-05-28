/* =========================================================
   BIM LABS — PROCESS SECTION
   Full replacement for: sections/process-world.js

   Behavior:
   - PROCESS stays sticky/centered while the user moves through cards
   - Cards reveal smoothly over the word
   - Final phase becomes a cinematic void handoff
   - PROCESS dissolves fully into depth
   - Booking appears from inside the void, not as a normal section
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
     MEASURE SECTION
     ========================================================= */

  function measure() {
    const rect = section.getBoundingClientRect();

    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(section.offsetHeight, window.innerHeight);

    scrollStart = sectionTop;
    scrollEnd = sectionTop + sectionHeight - window.innerHeight;

    updateTargetProgress();
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
    section.classList.remove("is-entering-void");

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

    const voidExit = section.querySelector(".process-void-exit");

    if (voidExit) {
      voidExit.style.setProperty("--void-opacity", "0");
      voidExit.style.setProperty("--void-scale", "0.72");
      voidExit.style.setProperty("--void-blur", "30px");

      voidExit.style.setProperty("--door-opacity", "0");
      voidExit.style.setProperty("--door-scale", "0.18");
      voidExit.style.setProperty("--door-blur", "52px");

      voidExit.style.setProperty("--dust-opacity", "0");
      voidExit.style.setProperty("--dust-pull", "0");
      voidExit.style.setProperty("--dust-scale", "0.72");
      voidExit.style.setProperty("--dust-blur", "0px");
      voidExit.style.setProperty("--field-scale", "1");

      voidExit.style.setProperty("--booking-opacity", "0");
      voidExit.style.setProperty("--booking-scale", "0.56");
      voidExit.style.setProperty("--booking-blur", "38px");
    }
  }

  /* =========================================================
     BIG PROCESS WORD
     ========================================================= */

  function renderBigWord(progress) {
    if (!bigWord) return;

    const enter = smoothstep(0, 0.16, progress);
    const grow = smoothstep(0.08, 0.62, progress);

    /*
      This starts earlier and lasts longer.
      The old timing made PROCESS hang too long and disappear too abruptly.
    */
    const exit = smoothstep(0.58, 0.94, progress);

    const scale =
      lerp(0.72, 0.92, enter) +
      lerp(0, 0.18, grow) -
      lerp(0, 0.16, exit);

    const opacity =
      lerp(0.08, 0.22, enter) -
      lerp(0, 0.215, exit);

    const blur = lerp(2, 0, enter) + lerp(0, 24, exit);

    setStyles(bigWord, {
      color: "#ffffff",

      /*
        Critical fix:
        min opacity is 0, not .08.
        Otherwise the word can never dissolve.
      */
      opacity: clamp(opacity, 0, 0.22).toFixed(3),

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

    /*
      Quiet phase begins before the void fully opens.
      This makes the cards feel like they are shutting down.
    */
    const quiet = smoothstep(0.58, 0.76, progress);

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
      const finalScale = baseScale * lerp(1, 0.96, quiet);
      const finalY = driftY + lerp(0, -44, quiet);

      if (!item.classList.contains("is-hovered")) {
        setStyles(card, {
          opacity: finalOpacity.toFixed(3),
          transform: `translate3d(${driftX.toFixed(2)}px, ${finalY.toFixed(
            2
          )}px, 0) scale(${finalScale.toFixed(4)})`
        });
      }
    });
  }

  /* =========================================================
     VOID EXIT / BOOKING HANDOFF
     ========================================================= */

  function renderVoidExit(progress) {
    const voidExit = section.querySelector(".process-void-exit");

    if (!voidExit) return;

    /*
      Longer timings = less "new section appearing"
      and more "camera moving into depth."
    */
    const quiet = smoothstep(0.56, 0.74, progress);
    const exit = smoothstep(0.62, 0.9, progress);
    const deepExit = smoothstep(0.7, 1, progress);
    const booking = smoothstep(0.82, 1, progress);

    const voidOpacity = lerp(0, 1, exit);
    const voidScale = lerp(0.72, 1.48, deepExit);
    const voidBlur = lerp(34, 0, exit);

    const doorOpacity = lerp(0, 1, deepExit);
    const doorScale = lerp(0.16, 1.65, deepExit);
    const doorBlur = lerp(58, 6, deepExit);

    const dustOpacity = lerp(0, 0.82, exit);
    const dustPull = lerp(0, 0.36, deepExit);
    const dustScale = lerp(0.72, 2.35, deepExit);
    const dustBlur = lerp(0, 2.9, deepExit);
    const fieldScale = lerp(1, 1.24, deepExit);

    const bookingOpacity = lerp(0, 1, booking);
    const bookingScale = lerp(0.54, 1, booking);
    const bookingBlur = lerp(42, 0, booking);

    voidExit.style.setProperty("--void-opacity", voidOpacity.toFixed(3));
    voidExit.style.setProperty("--void-scale", voidScale.toFixed(3));
    voidExit.style.setProperty("--void-blur", `${voidBlur.toFixed(2)}px`);

    voidExit.style.setProperty("--door-opacity", doorOpacity.toFixed(3));
    voidExit.style.setProperty("--door-scale", doorScale.toFixed(3));
    voidExit.style.setProperty("--door-blur", `${doorBlur.toFixed(2)}px`);

    voidExit.style.setProperty("--dust-opacity", dustOpacity.toFixed(3));
    voidExit.style.setProperty("--dust-pull", dustPull.toFixed(3));
    voidExit.style.setProperty("--dust-scale", dustScale.toFixed(3));
    voidExit.style.setProperty("--dust-blur", `${dustBlur.toFixed(2)}px`);
    voidExit.style.setProperty("--field-scale", fieldScale.toFixed(3));

    voidExit.style.setProperty("--booking-opacity", bookingOpacity.toFixed(3));
    voidExit.style.setProperty("--booking-scale", bookingScale.toFixed(3));
    voidExit.style.setProperty("--booking-blur", `${bookingBlur.toFixed(2)}px`);

    section.classList.toggle("is-entering-void", quiet > 0.5);
  }

  /* =========================================================
     MAIN RENDER LOOP
     ========================================================= */

  function render(progress) {
    renderBigWord(progress);
    renderCards(progress);
    renderVoidExit(progress);
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
            opacity: "1"
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
        transform: "none"
      });
    });

    const voidExit = section.querySelector(".process-void-exit");

    if (voidExit) {
      voidExit.style.setProperty("--void-opacity", "1");
      voidExit.style.setProperty("--void-scale", "1");
      voidExit.style.setProperty("--void-blur", "0px");

      voidExit.style.setProperty("--door-opacity", "0.55");
      voidExit.style.setProperty("--door-scale", "1");
      voidExit.style.setProperty("--door-blur", "10px");

      voidExit.style.setProperty("--dust-opacity", "0.35");
      voidExit.style.setProperty("--dust-pull", "0");
      voidExit.style.setProperty("--dust-scale", "1");
      voidExit.style.setProperty("--dust-blur", "0px");
      voidExit.style.setProperty("--field-scale", "1");

      voidExit.style.setProperty("--booking-opacity", "1");
      voidExit.style.setProperty("--booking-scale", "1");
      voidExit.style.setProperty("--booking-blur", "0px");
    }
  }

  /* =========================================================
     EVENT LISTENERS
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

    console.log("[Process] Loaded correctly.", {
      items: items.length,
      cards: cards.length,
      hasBigWord: Boolean(bigWord),
      hasVoidExit: Boolean(section.querySelector(".process-void-exit")),
      hasVoidStage: Boolean(section.querySelector(".process-void-stage"))
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
