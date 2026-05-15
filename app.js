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

  /* ------------------------------
     Header behavior
  ------------------------------ */

  const header = document.querySelector("[data-header]");
  let lastScrollY = window.scrollY;

  const updateHeader = () => {
    if (!header) return;

    const currentScroll = window.scrollY;
    const goingDown = currentScroll > lastScrollY;
    const pastIntro = currentScroll > 90;

    header.classList.toggle("is-scrolled", currentScroll > 12);
    header.classList.toggle("is-hidden", goingDown && pastIntro);

    lastScrollY = currentScroll;
  };

  window.addEventListener("scroll", rafThrottle(updateHeader), { passive: true });
  updateHeader();

  /* ------------------------------
     Smooth anchor movement
  ------------------------------ */

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

  /* ------------------------------
     Background canvas
  ------------------------------ */

  const canvas = document.querySelector("#background-canvas");
  const ctx = canvas?.getContext("2d");

  const canvasState = {
    width: 0,
    height: 0,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    particles: [],
    time: 0,
  };

  function resizeCanvas() {
    if (!canvas || !ctx) return;

    canvasState.width = window.innerWidth;
    canvasState.height = window.innerHeight;
    canvasState.dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(canvasState.width * canvasState.dpr);
    canvas.height = Math.floor(canvasState.height * canvasState.dpr);

    canvas.style.width = `${canvasState.width}px`;
    canvas.style.height = `${canvasState.height}px`;

    ctx.setTransform(canvasState.dpr, 0, 0, canvasState.dpr, 0, 0);

    const particleCount = clamp(Math.floor(canvasState.width / 90), 10, 24);

    canvasState.particles = Array.from({ length: particleCount }, (_, index) => ({
      x: Math.random() * canvasState.width,
      y: Math.random() * canvasState.height,
      radius: Math.random() * 1.8 + 0.5,
      speed: Math.random() * 0.18 + 0.06,
      drift: Math.random() * 0.6 + 0.2,
      phase: index * 0.85,
    }));
  }

  function drawBackground() {
    if (!canvas || !ctx) return;

    const { width, height, particles } = canvasState;
    canvasState.time += 0.006;

    ctx.clearRect(0, 0, width, height);

    const gridSize = 72;
    const gridOpacity = 0.035;

    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(246, 248, 255, ${gridOpacity})`;

    for (let x = -gridSize; x <= width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = -gridSize; y <= height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    particles.forEach((particle) => {
      particle.y -= particle.speed;
      particle.x += Math.sin(canvasState.time + particle.phase) * particle.drift * 0.08;

      if (particle.y < -20) {
        particle.y = height + 20;
        particle.x = Math.random() * width;
      }

      const glow = ctx.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 9
      );

      glow.addColorStop(0, "rgba(0, 213, 255, 0.16)");
      glow.addColorStop(1, "rgba(0, 213, 255, 0)");

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius * 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "rgba(246, 248, 255, 0.18)";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (!prefersReducedMotion) {
      requestAnimationFrame(drawBackground);
    }
  }

  if (canvas && ctx) {
    resizeCanvas();

    if (!prefersReducedMotion) {
      drawBackground();
    } else {
      drawBackground();
    }

    window.addEventListener("resize", rafThrottle(resizeCanvas), { passive: true });
  }

  /* ------------------------------
     Global Signal Core / Orb states
  ------------------------------ */

  const orbSections = document.querySelectorAll("[data-orb-state]");

  function clearOrbClasses() {
    [...body.classList].forEach((className) => {
      if (className.startsWith("orb-")) {
        body.classList.remove(className);
      }
    });
  }

  if (orbSections.length) {
    const orbObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const activeEntry = visibleEntries[0];
        if (!activeEntry) return;

        const state = activeEntry.target.dataset.orbState;
        if (!state) return;

        clearOrbClasses();
        body.classList.add(`orb-${state}`);
        body.dataset.orbState = state;
      },
      {
        threshold: [0.22, 0.35, 0.48, 0.62],
        rootMargin: "-10% 0px -22% 0px",
      }
    );

    orbSections.forEach((section) => orbObserver.observe(section));
  }

  function updateScrollVars() {
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);

    root.style.setProperty("--orb-scroll-18", `${progress * 18}deg`);
    root.style.setProperty("--orb-scroll-24", `${progress * 24}deg`);
    root.style.setProperty("--orb-scroll-38", `${progress * 38}deg`);
    root.style.setProperty("--orb-scroll-50", `${progress * 50}deg`);
    root.style.setProperty("--orb-scroll-neg-24", `${progress * -24}deg`);
    root.style.setProperty("--orb-scroll-neg-30", `${progress * -30}deg`);
  }

  window.addEventListener("scroll", rafThrottle(updateScrollVars), { passive: true });
  window.addEventListener("resize", rafThrottle(updateScrollVars), { passive: true });
  updateScrollVars();

  /* ------------------------------
     Hero fade / cursor labels
  ------------------------------ */

  const hero = document.querySelector("[data-hero]");
  const heroContent = document.querySelector("[data-hero-content]");
  const cursorLabels = document.querySelectorAll(".bim-cursor-label");

  function updateHeroScroll() {
    if (!hero || !heroContent) return;

    const rect = hero.getBoundingClientRect();
    const progress = clamp(Math.abs(rect.top) / Math.max(rect.height * 0.72, 1), 0, 1);

    heroContent.style.opacity = `${1 - progress * 0.72}`;
    heroContent.style.filter = `blur(${progress * 10}px)`;
    heroContent.style.transform = `translate3d(0, ${progress * -42}px, 0) scale(${1 - progress * 0.035})`;
  }

  window.addEventListener("scroll", rafThrottle(updateHeroScroll), { passive: true });
  updateHeroScroll();

  if (hero && cursorLabels.length && !prefersReducedMotion) {
    hero.addEventListener(
      "mousemove",
      rafThrottle((event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        cursorLabels.forEach((label, index) => {
          const strength = index === 0 ? 28 : -24;

          label.style.setProperty("--cursor-x", `${x * strength}px`);
          label.style.setProperty("--cursor-y", `${y * strength}px`);
        });

        root.style.setProperty("--orb-nudge-x", `${x * 10}px`);
        root.style.setProperty("--orb-nudge-y", `${y * 10}px`);
      }),
      { passive: true }
    );
  }

  /* ------------------------------
     Glow buttons
  ------------------------------ */

  document.querySelectorAll("[data-glow-button]").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      button.style.setProperty("--glow-x", `${x}px`);
      button.style.setProperty("--glow-y", `${y}px`);
    });
  });

  /* ------------------------------
     Reveal on scroll
  ------------------------------ */

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
        threshold: 0.18,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  /* ------------------------------
     Image fallbacks
  ------------------------------ */

  document.querySelectorAll(".bim-media").forEach((media) => {
    const image = media.querySelector("img");
    if (!image) {
      media.classList.add("is-missing-image");
      return;
    }

    image.addEventListener("error", () => {
      media.classList.add("is-missing-image");
      image.setAttribute("aria-hidden", "true");
    });

    image.addEventListener("load", () => {
      media.classList.add("is-loaded");
    });

    if (image.complete && image.naturalWidth > 0) {
      media.classList.add("is-loaded");
    }
  });

  /* ------------------------------
     Quadrant interaction
  ------------------------------ */

  const quadrantStage = document.querySelector("[data-quadrant-stage]");
  const quadrants = document.querySelectorAll("[data-quadrant]");
  const quadrantPreview = document.querySelector("[data-quadrant-preview]");

  function updateQuadrantPreview(quadrant) {
    if (!quadrantPreview || !quadrant) return;

    const index = quadrant.dataset.index || "01";
    const title = quadrant.querySelector("h3")?.textContent?.trim() || "Bim Labs System";
    const description =
      quadrant.querySelector("p")?.textContent?.trim() ||
      "A polished digital system built around clarity, speed, and execution.";

    quadrantPreview.innerHTML = `
      <span>Active system</span>
      <strong>${title}</strong>
      <p>${description}</p>
    `;

    body.dataset.orbQuadrant = index;

    const nudgeMap = {
      "01": ["0px", "-9px"],
      "02": ["11px", "0px"],
      "03": ["0px", "9px"],
      "04": ["-11px", "0px"],
    };

    const [x, y] = nudgeMap[index] || ["0px", "0px"];
    root.style.setProperty("--orb-nudge-x", x);
    root.style.setProperty("--orb-nudge-y", y);
  }

  function setActiveQuadrant(quadrant) {
    if (!quadrant) return;

    quadrants.forEach((item) => {
      item.classList.toggle("is-active", item === quadrant);
    });

    updateQuadrantPreview(quadrant);
  }

  quadrants.forEach((quadrant) => {
    quadrant.addEventListener("mouseenter", () => setActiveQuadrant(quadrant));
    quadrant.addEventListener("focusin", () => setActiveQuadrant(quadrant));
  });

  if (quadrants.length) {
    setActiveQuadrant(document.querySelector("[data-quadrant].is-active") || quadrants[0]);
  }

  if (quadrantStage && !prefersReducedMotion) {
    quadrantStage.addEventListener(
      "mousemove",
      rafThrottle((event) => {
        const rect = quadrantStage.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;

        root.style.setProperty("--orb-nudge-x", `${x * 18}px`);
        root.style.setProperty("--orb-nudge-y", `${y * 18}px`);
      }),
      { passive: true }
    );

    quadrantStage.addEventListener("mouseleave", () => {
      const active = document.querySelector("[data-quadrant].is-active");
      updateQuadrantPreview(active);
    });
  }

  /* ------------------------------
     Reactive divider measurement
  ------------------------------ */

  const dividers = document.querySelectorAll("[data-divider]");

  function updateDividers() {
    dividers.forEach((divider) => {
      const anchors = divider.querySelectorAll(".bim-divider__anchor");
      const line = divider.querySelector(".bim-divider__line");
      const value = divider.querySelector(".bim-divider__value");

      if (!anchors.length || !line) return;

      const startRect = anchors[0].getBoundingClientRect();
      const endRect = anchors[anchors.length - 1].getBoundingClientRect();
      const width = Math.abs(endRect.left - startRect.right);

      divider.style.setProperty("--divider-width", `${Math.max(width, 0)}px`);

      if (value) {
        value.textContent = `${Math.round(width)}px`;
      }
    });
  }

  window.addEventListener("resize", rafThrottle(updateDividers), { passive: true });
  window.addEventListener("scroll", rafThrottle(updateDividers), { passive: true });
  updateDividers();

  /* ------------------------------
     Showcase cursor + parallax
  ------------------------------ */

  const showcase = document.querySelector("[data-showcase]");
  const showcaseCursor = document.querySelector("[data-showcase-cursor]");
  const parallaxItems = document.querySelectorAll("[data-parallax]");

  if (showcase && showcaseCursor && !prefersReducedMotion) {
    showcase.addEventListener("pointerenter", () => {
      showcaseCursor.classList.add("is-visible");
    });

    showcase.addEventListener("pointerleave", () => {
      showcaseCursor.classList.remove("is-visible");
    });

    showcase.addEventListener(
      "pointermove",
      rafThrottle((event) => {
        const rect = showcase.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        showcaseCursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
      }),
      { passive: true }
    );
  }

  function updateParallax() {
    if (!parallaxItems.length) return;

    parallaxItems.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const viewportProgress = clamp(
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height),
        0,
        1
      );

      const strength = Number(item.dataset.parallax || 0);
      const y = (viewportProgress - 0.5) * strength * 2;

      item.style.translate = `0 ${y.toFixed(2)}px`;
    });
  }

  if (!prefersReducedMotion) {
    window.addEventListener("scroll", rafThrottle(updateParallax), { passive: true });
    window.addEventListener("resize", rafThrottle(updateParallax), { passive: true });
    updateParallax();
  }

  /* ------------------------------
     Wheel / process slides
  ------------------------------ */

  const wheel = document.querySelector("[data-wheel]");
  const wheelCards = document.querySelectorAll("[data-wheel-card]");
  const wheelTabs = wheel?.querySelectorAll(".bim-wheel__tabs span") || [];

  function setActiveWheelCard(card) {
    if (!card) return;

    const index = [...wheelCards].indexOf(card);
    if (index < 0) return;

    const rotation = index * 36;

    root.style.setProperty("--wheel-rotation", `${rotation}deg`);

    wheelCards.forEach((item) => {
      item.classList.toggle("is-active", item === card);
    });

    wheelTabs.forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === index);
    });
  }

  if (wheelCards.length) {
    const wheelObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visible[0]) return;

        setActiveWheelCard(visible[0].target);
      },
      {
        threshold: [0.28, 0.45, 0.62],
        rootMargin: "-18% 0px -20% 0px",
      }
    );

    wheelCards.forEach((card) => wheelObserver.observe(card));
    setActiveWheelCard(document.querySelector("[data-wheel-card].is-active") || wheelCards[0]);
  }

  /* ------------------------------
     Contact mailto helper
  ------------------------------ */

  const contactLinks = document.querySelectorAll('a[href^="mailto:"]');

  contactLinks.forEach((link) => {
    link.addEventListener("click", () => {
      body.classList.add("has-contact-intent");
    });
  });

  /* ------------------------------
     Initial ready state
  ------------------------------ */

  window.addEventListener("load", () => {
    body.classList.add("is-loaded");
    updateScrollVars();
    updateHeroScroll();
    updateDividers();
    updateParallax();
  });
})();
