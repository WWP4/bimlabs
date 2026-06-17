/* ==========================================================
   BIM LABS — MOBILE CINEMATIC FLOW
   Load LAST.
   Mobile behavior:
   - Vertical scroll drives horizontal section
   - Process stays sticky/locked while desktop GSAP can run
   - Trust cards stay sticky/scroll-driven
   - Hover effects are removed
========================================================== */

(() => {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

  function isMobile() {
    return mobileQuery.matches || touchQuery.matches;
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function setViewportUnit() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--mobile-vh", `${vh}px`);
  }

  /* ==========================================================
     REMOVE HOVER ONLY STUFF
  ========================================================== */

  function removeHoverOnlyElements() {
    if (!isMobile()) return;

    document
      .querySelectorAll(".work-archive-floating-preview, .work-project__hover-image")
      .forEach((node) => node.remove());

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
     MOBILE HORIZONTAL SHOWCASE
     Vertical scroll drives sideways movement.
  ========================================================== */

  function setupMobileHorizontalShowcase() {
    if (!isMobile()) return;

    const section = document.querySelector(".salo-showcase, .bim-showcase");
    const sticky = section?.querySelector(".showcase-scroll");
    const track = section?.querySelector(".HomeShowcase__inner, .bim-track");

    if (!section || !sticky || !track) return;
    if (section.dataset.mobileHorizontalReady === "true") return;

    section.dataset.mobileHorizontalReady = "true";

    let raf = null;

    function render() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);
      const progress = clamp(-rect.top / travel, 0, 1);

      const maxX = Math.max(track.scrollWidth - window.innerWidth, 0);
      const x = -maxX * progress;

      track.style.transform = `translate3d(${x}px, 0, 0)`;

      raf = null;
    }

    function requestRender() {
      if (!raf) {
        raf = window.requestAnimationFrame(render);
      }
    }

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
    window.addEventListener("orientationchange", requestRender, { passive: true });

    render();
  }

  /* ==========================================================
     MOBILE TRUST CARDS
     Vertical scroll drives flying testimonial cards.
  ========================================================== */

  function setupMobileTrustCards() {
    if (!isMobile()) return;

    const section = document.querySelector(".bim-trust");
    const cards = Array.from(document.querySelectorAll("[data-bim-trust-card]"));
    const headline = document.querySelector(".bim-trust__headline");
    const copy = document.querySelector(".bim-trust__copy");

    if (!section || !cards.length) return;
    if (section.dataset.mobileTrustReady === "true") return;

    section.dataset.mobileTrustReady = "true";

    let raf = null;

    const settings = [
      {
        startX: 115,
        midX: 18,
        endX: -105,
        startY: 44,
        midY: 30,
        endY: 48,
        rotateA: 7,
        rotateB: -7,
        delay: 0
      },
      {
        startX: 138,
        midX: 34,
        endX: -84,
        startY: 34,
        midY: 22,
        endY: 39,
        rotateA: 5,
        rotateB: -4,
        delay: 0.06
      },
      {
        startX: 161,
        midX: 48,
        endX: -62,
        startY: 50,
        midY: 28,
        endY: 44,
        rotateA: 4,
        rotateB: -6,
        delay: 0.12
      },
      {
        startX: 184,
        midX: 64,
        endX: -42,
        startY: 39,
        midY: 25,
        endY: 40,
        rotateA: 7,
        rotateB: -3,
        delay: 0.18
      }
    ];

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

    function render() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);
      const progress = clamp(-rect.top / travel, 0, 1);

      cards.forEach((card, index) => {
        const item = settings[index] || settings[settings.length - 1];
        const raw = clamp((progress - item.delay) / 0.86, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier3(item.startX, item.midX, item.endX, t);
        const y = bezier3(item.startY, item.midY, item.endY, t);
        const rotate = lerp(item.rotateA, item.rotateB, t);

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(30 + index);
        card.style.transform = `
          translate3d(${x}vw, ${y}vh, 0)
          rotate(${rotate}deg)
        `;
      });

      if (headline) {
        headline.style.opacity = String(lerp(0.92, 0.54, progress));
        headline.style.transform = `translate3d(0, ${lerp(0, -4, progress)}vh, 0)`;
      }

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.78, progress));
        copy.style.transform = `translate3d(0, ${lerp(0, -1.5, progress)}vh, 0)`;
      }

      raf = null;
    }

    function requestRender() {
      if (!raf) {
        raf = window.requestAnimationFrame(render);
      }
    }

    window.addEventListener("scroll", requestRender, { passive: true });
    window.addEventListener("resize", requestRender, { passive: true });
    window.addEventListener("orientationchange", requestRender, { passive: true });

    render();
  }

  /* ==========================================================
     PROCESS
     Important:
     Do NOT kill desktop process ScrollTriggers.
     Just let the existing process JS run, while CSS makes it mobile-sized.
  ========================================================== */

  function refreshProcessFlow() {
    if (!isMobile()) return;

    const process = document.querySelector(".process-3d");
    if (!process) return;

    process.classList.add("is-mobile-process-flow");

    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
      window.setTimeout(() => {
        window.ScrollTrigger.refresh();
      }, 250);
    }
  }

  /* ==========================================================
     ARCHIVE MOBILE CLEANUP
  ========================================================== */

  function setupMobileArchive() {
    if (!isMobile()) return;

    const archive = document.querySelector(".work-archive");
    if (!archive) return;

    const rows = Array.from(archive.querySelectorAll(".work-project"));

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");
      if (!summary || summary.dataset.mobileCleanReady === "true") return;

      summary.dataset.mobileCleanReady = "true";

      summary.addEventListener(
        "touchstart",
        () => {
          row.classList.remove("is-previewing", "is-glitching", "is-soft-signal");
        },
        { passive: true }
      );
    });
  }

  function applyMobileCinematicFlow() {
    setViewportUnit();

    if (!isMobile()) {
      document.documentElement.classList.remove("is-mobile-site");
      return;
    }

    document.documentElement.classList.add("is-mobile-site");

    removeHoverOnlyElements();
    setupMobileHorizontalShowcase();
    setupMobileTrustCards();
    refreshProcessFlow();
    setupMobileArchive();
  }

  function scheduleApply() {
    window.clearTimeout(window.__bimMobileFlowTimer);

    window.__bimMobileFlowTimer = window.setTimeout(() => {
      applyMobileCinematicFlow();
    }, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyMobileCinematicFlow, {
      once: true
    });
  } else {
    applyMobileCinematicFlow();
  }

  window.addEventListener("load", applyMobileCinematicFlow, { once: true });
  window.addEventListener("resize", scheduleApply, { passive: true });
  window.addEventListener("orientationchange", scheduleApply, { passive: true });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", applyMobileCinematicFlow);
    touchQuery.addEventListener("change", applyMobileCinematicFlow);
  }
})();
