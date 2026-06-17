/* ==========================================================
   BIM LABS — MOBILE CINEMATIC JS
   Load LAST.
   Keeps scroll experiences on mobile.
   Removes hover-only behavior.
========================================================== */

(() => {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");

  function isMobile() {
    return mobileQuery.matches || touchQuery.matches;
  }

  function setViewportUnit() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--mobile-vh", `${vh}px`);
  }

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

  function setupMobileHorizontalShowcase() {
    if (!isMobile()) return;

    const section = document.querySelector(".salo-showcase, .bim-showcase");
    const sticky = document.querySelector(".showcase-scroll");
    const track = document.querySelector(".HomeShowcase__inner, .bim-track");

    if (!section || !sticky || !track) return;

    let raf = null;

    function render() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);
      const progress = Math.min(Math.max(-rect.top / travel, 0), 1);

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

  function setupMobileTrustCards() {
    if (!isMobile()) return;

    const section = document.querySelector(".bim-trust");
    const cards = Array.from(document.querySelectorAll("[data-bim-trust-card]"));
    const headline = document.querySelector(".bim-trust__headline");
    const copy = document.querySelector(".bim-trust__copy");

    if (!section || !cards.length) return;

    let raf = null;

    const settings = [
      { startX: 105, endX: -92, y: 42, rotate: -7 },
      { startX: 124, endX: -73, y: 30, rotate: -4 },
      { startX: 143, endX: -54, y: 48, rotate: -6 },
      { startX: 162, endX: -35, y: 36, rotate: -3 }
    ];

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    function lerp(start, end, amount) {
      return start + (end - start) * amount;
    }

    function render() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);
      const progress = clamp(-rect.top / travel, 0, 1);

      cards.forEach((card, index) => {
        const item = settings[index] || settings[settings.length - 1];
        const stagger = index * 0.06;
        const p = clamp((progress - stagger) / 0.9, 0, 1);

        const x = lerp(item.startX, item.endX, p);

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.transform = `
          translate3d(${x}vw, ${item.y}vh, 0)
          rotate(${item.rotate}deg)
        `;
      });

      if (headline) {
        headline.style.transform = `translate3d(0, ${lerp(0, -3, progress)}vh, 0)`;
        headline.style.opacity = String(lerp(0.9, 0.58, progress));
      }

      if (copy) {
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

  function refreshScrollTrigger() {
    if (!isMobile()) return;

    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
      window.ScrollTrigger.refresh();
    }
  }

  function applyMobileCinematic() {
    setViewportUnit();

    if (!isMobile()) {
      document.documentElement.classList.remove("is-mobile-site");
      return;
    }

    document.documentElement.classList.add("is-mobile-site");

    removeHoverOnlyElements();
    setupMobileHorizontalShowcase();
    setupMobileTrustCards();

    window.setTimeout(refreshScrollTrigger, 250);
  }

  function scheduleApply() {
    window.clearTimeout(window.__bimMobileTimer);
    window.__bimMobileTimer = window.setTimeout(applyMobileCinematic, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyMobileCinematic, {
      once: true
    });
  } else {
    applyMobileCinematic();
  }

  window.addEventListener("load", applyMobileCinematic, { once: true });
  window.addEventListener("resize", scheduleApply, { passive: true });
  window.addEventListener("orientationchange", scheduleApply, { passive: true });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", applyMobileCinematic);
    touchQuery.addEventListener("change", applyMobileCinematic);
  }
})();
