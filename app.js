(() => {
  "use strict";

  const body = document.body;
  const root = document.documentElement;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const rafThrottle = (callback) => {
    let ticking = false;

    return (...args) => {
      if (ticking) return;

      ticking = true;
      requestAnimationFrame(() => {
        callback(...args);
        ticking = false;
      });
    };
  };

  /* =========================================================
     HEADER
  ========================================================= */

  const header = document.querySelector("[data-header]");

  function updateHeader() {
    if (!header) return;

    const currentScroll = window.scrollY;

    header.classList.toggle("is-scrolled", currentScroll > 12);

    // Keep header stable for now while we build the flow.
    header.classList.remove("is-hidden");
  }

  window.addEventListener("scroll", rafThrottle(updateHeader), { passive: true });
  updateHeader();

  /* =========================================================
     SMOOTH ANCHORS
  ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  /* =========================================================
     BUTTON GLOW
  ========================================================= */

  document.querySelectorAll("[data-glow-button]").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();

      button.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
      button.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
    });
  });

  /* =========================================================
     REVEAL
  ========================================================= */

  const revealItems = document.querySelectorAll("[data-reveal]");

  if (revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      {
        threshold: 0.16,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* =========================================================
     ORB STORY SYSTEM
     Hero = identity
     Services = controller
  ========================================================= */

  const orbLayer = document.querySelector(".bim-orb-layer");
  const sections = document.querySelectorAll("[data-orb-state]");
  const statusIndex = document.querySelector("[data-orb-status-index]");
  const statusLabel = document.querySelector("[data-orb-status-label]");

  const sectionMeta = {
    hero: {
      bodyClass: "orb-hero",
      index: "01",
      label: "Intro",
      rotation: "0deg",
    },
    quadrants: {
      bodyClass: "orb-quadrants",
      index: "02",
      label: "Services",
      rotation: "18deg",
    },
  };

  function clearOrbClasses() {
    [...body.classList].forEach((className) => {
      if (className.startsWith("orb-")) {
        body.classList.remove(className);
      }
    });
  }

  function setOrbState(state) {
    const meta = sectionMeta[state] || sectionMeta.hero;

    clearOrbClasses();

    body.classList.add(meta.bodyClass);
    body.dataset.orbState = state;

    if (orbLayer) {
      orbLayer.style.setProperty("--orb-rotation", meta.rotation);
    }

    if (statusIndex) statusIndex.textContent = meta.index;
    if (statusLabel) statusLabel.textContent = meta.label;
  }

  function updatePageProgress() {
    if (!orbLayer) return;

    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      1
    );

    const progress = clamp(window.scrollY / maxScroll, 0, 1);
    orbLayer.style.setProperty("--orb-page-progress", (progress * 100).toFixed(2));
  }

  window.addEventListener("scroll", rafThrottle(updatePageProgress), { passive: true });
  window.addEventListener("resize", rafThrottle(updatePageProgress), { passive: true });
  updatePageProgress();

  if (sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible[0]) return;

        const state = visible[0].target.dataset.orbState;
        if (!state) return;

        setOrbState(state);
      },
      {
        threshold: [0.28, 0.48, 0.68],
        rootMargin: "-12% 0px -22% 0px",
      }
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  /* =========================================================
     SERVICES / QUADRANT CONTROL
  ========================================================= */

  const quadrants = document.querySelectorAll("[data-quadrant]");
  const quadrantPreview = document.querySelector("[data-quadrant-preview]");

  const serviceRotation = {
    "01": "0deg",
    "02": "90deg",
    "03": "180deg",
    "04": "270deg",
  };

  function setActiveQuadrant(quadrant) {
    if (!quadrant) return;

    const index = quadrant.dataset.index || "01";
    const title = quadrant.querySelector("h3")?.textContent?.trim() || "Bim Labs System";
    const description =
      quadrant.querySelector("p")?.textContent?.trim() ||
      "A polished digital system built around clarity, speed, and execution.";

    quadrants.forEach((item) => {
      item.classList.toggle("is-active", item === quadrant);
    });

    body.dataset.activeQuadrant = index;

    if (orbLayer) {
      orbLayer.style.setProperty("--orb-rotation", serviceRotation[index] || "0deg");
    }

    if (statusIndex) statusIndex.textContent = index;
    if (statusLabel) statusLabel.textContent = title;

    if (quadrantPreview) {
      quadrantPreview.innerHTML = `
        <span>Active system</span>
        <strong>${title}</strong>
        <p>${description}</p>
      `;
    }
  }

  quadrants.forEach((quadrant) => {
    quadrant.addEventListener("mouseenter", () => setActiveQuadrant(quadrant));
    quadrant.addEventListener("focusin", () => setActiveQuadrant(quadrant));
  });

  if (quadrants.length) {
    setActiveQuadrant(document.querySelector("[data-quadrant].is-active") || quadrants[0]);
  }

  /* =========================================================
     INITIAL STATE
  ========================================================= */

  setOrbState("hero");
  body.classList.add("is-loaded");
})();
