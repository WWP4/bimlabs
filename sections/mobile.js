/* ==========================================================
   BIM LABS — MOBILE CINEMATIC FLOW
   Replacement mobile.js

   Load LAST, after desktop JS.
   Purpose:
   - Keep desktop identity on mobile
   - Replace hover-only behavior with touch-safe states
   - Let vertical scroll drive horizontal cinematic areas
   - Avoid scroll traps by never blocking native page scroll
========================================================== */

(() => {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
  const reducedQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  const state = {
    rafs: new Map(),
    cleanup: [],
    booted: false
  };

  function isMobile() {
    return mobileQuery.matches || touchQuery.matches;
  }

  function prefersReducedMotion() {
    return reducedQuery.matches;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function bezier3(p0, p1, p2, t) {
    const a = lerp(p0, p1, t);
    const b = lerp(p1, p2, t);
    return lerp(a, b, t);
  }

  function on(target, event, handler, options) {
    if (!target) return;
    target.addEventListener(event, handler, options);
    state.cleanup.push(() => target.removeEventListener(event, handler, options));
  }

  function schedule(key, fn) {
    if (state.rafs.get(key)) return;

    const raf = window.requestAnimationFrame(() => {
      state.rafs.delete(key);
      fn();
    });

    state.rafs.set(key, raf);
  }

  function getProgress(section) {
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const travel = Math.max(section.offsetHeight - viewport, 1);

    return clamp(-rect.top / travel, 0, 1);
  }

  function setViewportUnit() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--mobile-vh", `${vh}px`);
  }

  function cancelWork() {
    state.rafs.forEach((raf) => window.cancelAnimationFrame(raf));
    state.rafs.clear();

    state.cleanup.splice(0).forEach((fn) => fn());
  }

  /* ==========================================================
     TOUCH / HOVER CLEANUP
  ========================================================== */

  function removeHoverOnlyElements() {
    document
      .querySelectorAll(
        ".work-archive-floating-preview, .work-project__hover-image, .work-project__preview"
      )
      .forEach((node) => {
        node.setAttribute("aria-hidden", "true");
        node.style.display = "none";
      });

    document.querySelectorAll(".work-project").forEach((row) => {
      row.classList.remove("is-previewing", "is-glitching", "is-soft-signal");
    });

    const bookCard = document.querySelector("[data-book-card]");
    if (bookCard) {
      bookCard.style.setProperty("--book-x", "50%");
      bookCard.style.setProperty("--book-y", "50%");
    }
  }

  /* ==========================================================
     HORIZONTAL SHOWCASE
     Native vertical scroll maps to track X movement.
  ========================================================== */

  function setupMobileHorizontalShowcase() {
    const section = document.querySelector(".salo-showcase, .bim-showcase");
    if (!section) return;

    const track =
      section.querySelector(".HomeShowcase__inner") ||
      section.querySelector(".bim-track") ||
      document.querySelector(".HomeShowcase__inner, .bim-track");

    if (!track) return;

    function render() {
      const progress = getProgress(section);
      const maxX = Math.max(track.scrollWidth - window.innerWidth, 0);
      const eased = easeInOutCubic(progress);

      track.style.transform = `translate3d(${-maxX * eased}px, 0, 0)`;
      section.style.setProperty("--mobile-showcase-progress", progress.toFixed(4));
    }

    function requestRender() {
      schedule("showcase", render);
    }

    on(window, "scroll", requestRender, { passive: true });
    on(window, "resize", requestRender, { passive: true });
    on(window, "orientationchange", requestRender, { passive: true });

    render();
  }

  /* ==========================================================
     PROCESS MOBILE
     The desktop ScrollTrigger can still exist.
     Mobile overlay makes cards a scroll-driven horizontal film strip.
  ========================================================== */

  function setupMobileProcessFlow() {
    const section = document.querySelector(".process-3d, #process");
    const cardsWrap = section?.querySelector(".process-cards");
    const cards = Array.from(
      section?.querySelectorAll("[data-process-card], .process-card") || []
    );
    const word = section?.querySelector(".process-word");

    if (!section || !cardsWrap || !cards.length) return;

    section.classList.add("is-mobile-process-flow");

    cards.forEach((card, index) => {
      card.style.setProperty("--mobile-card-index", String(index));
    });

    function render() {
      const progress = getProgress(section);
      const intro = clamp(progress / 0.22, 0, 1);
      const cardsProgress = clamp((progress - 0.18) / 0.62, 0, 1);
      const handoff = clamp((progress - 0.78) / 0.22, 0, 1);

      const maxX = Math.max(cardsWrap.scrollWidth - window.innerWidth, 0);
      const x = -maxX * easeInOutCubic(cardsProgress);

      section.style.setProperty("--mobile-process-progress", progress.toFixed(4));
      section.style.setProperty("--mobile-process-intro", intro.toFixed(4));
      section.style.setProperty("--mobile-process-cards", cardsProgress.toFixed(4));
      section.style.setProperty("--mobile-process-handoff", handoff.toFixed(4));

      cardsWrap.style.transform = `translate3d(${x}px, 0, 0)`;

      if (word) {
        const scale = lerp(0.72, 1.24, easeOutCubic(intro));
        const opacity = lerp(
          1,
          0.18,
          clamp((progress - 0.18) / 0.18, 0, 1)
        );

        word.style.transform = `translate3d(0, 0, 0) scale(${scale})`;
        word.style.opacity = String(opacity);
      }

      cards.forEach((card, index) => {
        const local = clamp(cardsProgress * cards.length - index, 0, 1);
        const active = local > 0.22 && local < 0.96;

        card.classList.toggle("is-active", active);
        card.classList.toggle("is-past", local >= 0.96);
      });
    }

    function requestRender() {
      schedule("process", render);
    }

    on(window, "scroll", requestRender, { passive: true });
    on(window, "resize", requestRender, { passive: true });
    on(window, "orientationchange", requestRender, { passive: true });

    window.setTimeout(() => {
      if (
        window.ScrollTrigger &&
        typeof window.ScrollTrigger.refresh === "function"
      ) {
        window.ScrollTrigger.refresh();
      }

      render();
    }, 180);

    render();
  }

  /* ==========================================================
     TRUST CARDS
     Keeps the desktop card-flight idea, but fits phone screens.
  ========================================================== */

  function setupMobileTrustCards() {
    const section = document.querySelector(".bim-trust");
    const cards = Array.from(document.querySelectorAll("[data-bim-trust-card]"));
    const headline = document.querySelector(".bim-trust__headline");
    const copy = document.querySelector(".bim-trust__copy");

    if (!section || !cards.length) return;

    const settings = [
      {
        startX: 106,
        midX: 12,
        endX: -108,
        startY: 42,
        midY: 24,
        endY: 43,
        rotateA: 7,
        rotateB: -8,
        delay: 0.0
      },
      {
        startX: 128,
        midX: 28,
        endX: -88,
        startY: 32,
        midY: 18,
        endY: 35,
        rotateA: 4,
        rotateB: -5,
        delay: 0.055
      },
      {
        startX: 150,
        midX: 44,
        endX: -68,
        startY: 47,
        midY: 23,
        endY: 40,
        rotateA: 5,
        rotateB: -6,
        delay: 0.11
      },
      {
        startX: 172,
        midX: 60,
        endX: -48,
        startY: 36,
        midY: 20,
        endY: 36,
        rotateA: 7,
        rotateB: -4,
        delay: 0.165
      }
    ];

    function render() {
      const progress = getProgress(section);

      section.style.setProperty("--mobile-trust-progress", progress.toFixed(4));

      cards.forEach((card, index) => {
        const item = settings[index] || settings[settings.length - 1];
        const raw = clamp((progress - item.delay) / 0.84, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier3(item.startX, item.midX, item.endX, t);
        const y = bezier3(item.startY, item.midY, item.endY, t);
        const rotate = lerp(item.rotateA, item.rotateB, t);
        const scale = lerp(0.96, 1, clamp(raw * 2, 0, 1));

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(30 + index);
        card.style.transform = `translate3d(${x}vw, ${y}vh, 0) rotate(${rotate}deg) scale(${scale})`;
      });

      if (headline) {
        headline.style.opacity = String(lerp(0.94, 0.5, progress));
        headline.style.transform = `translate3d(0, ${lerp(
          0,
          -4.5,
          progress
        )}vh, 0)`;
      }

      if (copy) {
        const copyFade = clamp((progress - 0.72) / 0.2, 0, 1);
        copy.style.opacity = String(lerp(1, 0.42, copyFade));
        copy.style.transform = `translate3d(0, ${lerp(
          0,
          -2,
          progress
        )}vh, 0)`;
      }
    }

    function requestRender() {
      schedule("trust", render);
    }

    on(window, "scroll", requestRender, { passive: true });
    on(window, "resize", requestRender, { passive: true });
    on(window, "orientationchange", requestRender, { passive: true });

    render();
  }

  /* ==========================================================
     ARCHIVE
     Touch devices get tap-clean behavior. Details remain normal scroll.
  ========================================================== */

  function setupMobileArchive() {
    const archive = document.querySelector(".work-archive");
    if (!archive) return;

    const rows = Array.from(archive.querySelectorAll(".work-project"));

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");
      if (!summary) return;

      summary.addEventListener(
        "touchstart",
        () => {
          row.classList.remove("is-previewing", "is-glitching", "is-soft-signal");
        },
        { passive: true }
      );
    });
  }

  function setupReducedMotionFallback() {
    if (!prefersReducedMotion()) return;

    document.documentElement.classList.add("is-reduced-motion");

    document
      .querySelectorAll(
        ".HomeShowcase__inner, .bim-track, .process-cards, .bim-trust-card"
      )
      .forEach((node) => {
        node.style.transform = "none";
      });
  }

  function applyMobile() {
    setViewportUnit();

    if (!isMobile()) {
      document.documentElement.classList.remove("is-mobile-site");
      cancelWork();
      state.booted = false;
      return;
    }

    if (state.booted) return;

    state.booted = true;

    document.documentElement.classList.add("is-mobile-site");

    removeHoverOnlyElements();
    setupMobileHorizontalShowcase();
    setupMobileProcessFlow();
    setupMobileTrustCards();
    setupMobileArchive();
    setupReducedMotionFallback();
  }

  function scheduleApply() {
    window.clearTimeout(window.__bimMobileFlowTimer);

    window.__bimMobileFlowTimer = window.setTimeout(() => {
      state.booted = false;
      cancelWork();
      applyMobile();
    }, 140);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyMobile, { once: true });
  } else {
    applyMobile();
  }

  window.addEventListener(
    "load",
    () => {
      setViewportUnit();
      applyMobile();
    },
    { once: true }
  );

  window.addEventListener("resize", scheduleApply, { passive: true });
  window.addEventListener("orientationchange", scheduleApply, { passive: true });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", scheduleApply);
    touchQuery.addEventListener("change", scheduleApply);
    reducedQuery.addEventListener("change", scheduleApply);
  }
})();
