/* ==========================================================
   BIM LABS — MOBILE COHESIVE JS
   Load LAST.
   Purpose:
   - Kill desktop animation leftovers on mobile
   - Remove hover previews
   - Make project accordions tap cleanly
   - Keep mobile simple and premium
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

  function killScrollTriggers() {
    if (!isMobile()) return;

    const ScrollTrigger = window.ScrollTrigger;
    if (!ScrollTrigger || typeof ScrollTrigger.getAll !== "function") return;

    ScrollTrigger.getAll().forEach((trigger) => {
      if (typeof trigger.kill === "function") {
        trigger.kill();
      }
    });

    if (typeof ScrollTrigger.refresh === "function") {
      ScrollTrigger.refresh();
    }
  }

  function removeHoverPreviews() {
    document
      .querySelectorAll(
        ".work-archive-floating-preview, .work-project__hover-image"
      )
      .forEach((node) => node.remove());

    document.querySelectorAll(".work-project").forEach((row) => {
      row.classList.remove("is-previewing", "is-glitching", "is-soft-signal");
    });
  }

  function forceMobileLayoutState() {
    if (!isMobile()) return;

    const resetNodes = [
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
      ".work-project__arrow",
      ".book-with-us",
      ".book-card"
    ];

    document.querySelectorAll(resetNodes.join(",")).forEach((node) => {
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

    document.documentElement.classList.add("is-mobile-site");
  }

  function setupMobileArchiveAccordion() {
    if (!isMobile()) return;

    const archive = document.querySelector(".work-archive");
    if (!archive) return;

    const rows = Array.from(archive.querySelectorAll(".work-project"));
    if (!rows.length) return;

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");
      const panel = row.querySelector(".work-project__panel");

      if (!summary || !panel) return;
      if (summary.dataset.mobileAccordionReady === "true") return;

      summary.dataset.mobileAccordionReady = "true";

      summary.addEventListener("click", () => {
        window.setTimeout(() => {
          rows.forEach((other) => {
            if (other !== row) {
              other.classList.remove("is-open", "is-opening", "is-closing");
              other.removeAttribute("open");
              other.open = false;

              const otherSummary = other.querySelector(".work-project__summary");
              if (otherSummary) {
                otherSummary.setAttribute("aria-expanded", "false");
              }
            }
          });

          if (row.open) {
            row.classList.add("is-open");
            row.classList.remove("is-closing");
            summary.setAttribute("aria-expanded", "true");
          } else {
            row.classList.remove("is-open", "is-opening", "is-closing");
            summary.setAttribute("aria-expanded", "false");
          }
        }, 0);
      });
    });
  }

  function disableBookMouseLight() {
    if (!isMobile()) return;

    const card = document.querySelector("[data-book-card]");
    if (!card) return;

    card.style.setProperty("--book-x", "50%");
    card.style.setProperty("--book-y", "50%");
  }

  function applyMobileSite() {
    setViewportUnit();

    if (!isMobile()) {
      document.documentElement.classList.remove("is-mobile-site");
      return;
    }

    killScrollTriggers();
    removeHoverPreviews();
    forceMobileLayoutState();
    setupMobileArchiveAccordion();
    disableBookMouseLight();
  }

  function scheduleApply() {
    window.clearTimeout(window.__bimMobileTimer);

    window.__bimMobileTimer = window.setTimeout(() => {
      applyMobileSite();
    }, 80);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyMobileSite, {
      once: true
    });
  } else {
    applyMobileSite();
  }

  window.addEventListener("load", applyMobileSite, { once: true });
  window.addEventListener("resize", scheduleApply, { passive: true });
  window.addEventListener("orientationchange", scheduleApply, { passive: true });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", applyMobileSite);
    touchQuery.addEventListener("change", applyMobileSite);
  }
})();
