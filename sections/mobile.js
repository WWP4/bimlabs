/* ==========================================================
   BIM LABS — MOBILE JS
   Load this file LAST.
   Purpose:
   - Disable desktop-only interactions on mobile/touch
   - Prevent pinned/transform leftovers from making mobile feel broken
   - Fix mobile viewport height
   - Make dropdown taps feel reliable
========================================================== */

(() => {
  "use strict";

  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const touchQuery = window.matchMedia("(hover: none) and (pointer: coarse)");
  const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

  function isMobile() {
    return mobileQuery.matches || touchQuery.matches;
  }

  /* ==========================================================
     VIEWPORT HEIGHT FIX
  ========================================================== */

  function setViewportHeightVar() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--mobile-vh", `${vh}px`);
  }

  /* ==========================================================
     REMOVE DESKTOP FLOATING PREVIEWS
  ========================================================== */

  function removeFloatingPreviews() {
    document
      .querySelectorAll(
        ".work-archive-floating-preview, .work-project__hover-image"
      )
      .forEach((node) => node.remove());

    document
      .querySelectorAll(".work-project.is-previewing")
      .forEach((row) => row.classList.remove("is-previewing"));
  }

  /* ==========================================================
     KILL MOBILE SCROLLTRIGGERS FOR HEAVY SECTIONS
  ========================================================== */

  function killHeavyMobileScrollTriggers() {
    if (!isMobile()) return;

    const ScrollTrigger = window.ScrollTrigger;
    if (!ScrollTrigger || typeof ScrollTrigger.getAll !== "function") return;

    ScrollTrigger.getAll().forEach((trigger) => {
      const vars = trigger.vars || {};
      const id = vars.id || "";
      const triggerEl = vars.trigger;

      const shouldKill =
        id.includes("workArchive") ||
        id.includes("Archive") ||
        id.includes("process") ||
        id.includes("Process") ||
        id.includes("showcase") ||
        id.includes("Showcase") ||
        id.includes("trust") ||
        id.includes("Trust") ||
        triggerEl?.classList?.contains("work-archive") ||
        triggerEl?.classList?.contains("process-3d") ||
        triggerEl?.classList?.contains("salo-showcase") ||
        triggerEl?.classList?.contains("bim-showcase") ||
        triggerEl?.classList?.contains("bim-trust") ||
        triggerEl?.classList?.contains("work-trust");

      if (shouldKill && typeof trigger.kill === "function") {
        trigger.kill();
      }
    });

    if (typeof ScrollTrigger.refresh === "function") {
      ScrollTrigger.refresh();
    }
  }

  /* ==========================================================
     RESET INLINE TRANSFORMS FROM DESKTOP ANIMATIONS
  ========================================================== */

  function resetDesktopInlineStyles() {
    if (!isMobile()) return;

    const selectors = [
      ".HomeShowcase__inner",
      ".bim-track",
      ".bim-intro",
      ".bim-case",
      ".bim-statement",
      ".bim-editorial",
      ".bim-close",
      ".process-3d",
      ".process-scene",
      ".process-word",
      ".process-overlay",
      ".process-copy",
      ".process-cards",
      ".process-card",
      ".work-trust",
      ".work-trust__sticky",
      ".work-trust-card",
      ".bim-trust",
      ".bim-trust__sticky",
      ".bim-trust-card",
      ".bim-trust__headline",
      ".bim-trust__copy",
      ".work-archive",
      ".work-archive__label",
      ".work-archive__kicker",
      ".work-archive__title",
      ".work-archive__intro",
      ".work-project",
      ".work-project__index",
      ".work-project__name",
      ".work-project__meta",
      ".work-project__year",
      ".work-project__arrow"
    ];

    document.querySelectorAll(selectors.join(",")).forEach((node) => {
      node.style.removeProperty("transform");
      node.style.removeProperty("translate");
      node.style.removeProperty("scale");
      node.style.removeProperty("rotate");
      node.style.removeProperty("filter");
      node.style.removeProperty("opacity");
      node.style.removeProperty("visibility");
      node.style.removeProperty("will-change");
    });

    document.querySelectorAll(".work-project").forEach((row) => {
      row.style.setProperty("--row-line", "1");
      row.style.setProperty("--row-fill", "0");
    });

    const archive = document.querySelector(".work-archive");
    if (archive) {
      archive.classList.remove("is-forming");
      archive.classList.add("is-formed");
    }
  }

  /* ==========================================================
     MOBILE ACCORDION TAP CLEANUP
  ========================================================== */

  function setupMobileArchiveTaps() {
    const archive = document.querySelector(".work-archive");
    if (!archive) return;

    const rows = Array.from(archive.querySelectorAll(".work-project"));
    if (!rows.length) return;

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");
      if (!summary || summary.dataset.mobileTapReady === "true") return;

      summary.dataset.mobileTapReady = "true";

      summary.addEventListener(
        "touchstart",
        () => {
          row.classList.remove("is-previewing", "is-soft-signal", "is-glitching");
        },
        { passive: true }
      );
    });
  }

  /* ==========================================================
     BOOK CARD MOBILE CLEANUP
  ========================================================== */

  function disableBookMouseLightOnMobile() {
    if (!isMobile()) return;

    const card = document.querySelector("[data-book-card]");
    if (!card) return;

    card.style.setProperty("--book-x", "50%");
    card.style.setProperty("--book-y", "50%");
  }

  /* ==========================================================
     MOBILE CLASS
  ========================================================== */

  function updateMobileClass() {
    document.documentElement.classList.toggle("is-mobile", isMobile());
    document.documentElement.classList.toggle(
      "is-reduced-motion",
      reduceQuery.matches
    );
  }

  /* ==========================================================
     INIT / REFRESH
  ========================================================== */

  function applyMobileFixes() {
    setViewportHeightVar();
    updateMobileClass();

    if (!isMobile()) return;

    removeFloatingPreviews();
    killHeavyMobileScrollTriggers();
    resetDesktopInlineStyles();
    setupMobileArchiveTaps();
    disableBookMouseLightOnMobile();
  }

  function onResize() {
    window.clearTimeout(window.__bimMobileResizeTimer);

    window.__bimMobileResizeTimer = window.setTimeout(() => {
      applyMobileFixes();
    }, 120);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyMobileFixes, {
      once: true
    });
  } else {
    applyMobileFixes();
  }

  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", applyMobileFixes);
    touchQuery.addEventListener("change", applyMobileFixes);
    reduceQuery.addEventListener("change", applyMobileFixes);
  }
})();
