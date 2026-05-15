(() => {
  "use strict";

  const body = document.body;
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* Header */

  const header = document.querySelector("[data-header]");
  let lastScrollY = window.scrollY;

  function updateHeader() {
    if (!header) return;

    const currentScroll = window.scrollY;
    const goingDown = currentScroll > lastScrollY;
    const pastIntro = currentScroll > 100;

    header.classList.toggle("is-scrolled", currentScroll > 12);
    header.classList.toggle("is-hidden", goingDown && pastIntro);

    lastScrollY = currentScroll;
  }

  window.addEventListener("scroll", rafThrottle(updateHeader), { passive: true });
  updateHeader();

  /* Smooth anchors */

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

  /* Glow buttons */

  document.querySelectorAll("[data-glow-button]").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();

      button.style.setProperty("--glow-x", `${event.clientX - rect.left}px`);
      button.style.setProperty("--glow-y", `${event.clientY - rect.top}px`);
    });
  });

  /* Reveal */

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

  /* Image fallback */

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

  /* Quadrants: content only, no orb movement */

  const quadrants = document.querySelectorAll("[data-quadrant]");
  const quadrantPreview = document.querySelector("[data-quadrant-preview]");

  function setActiveQuadrant(quadrant) {
    if (!quadrant) return;

    quadrants.forEach((item) => {
      item.classList.toggle("is-active", item === quadrant);
    });

    if (!quadrantPreview) return;

    const title = quadrant.querySelector("h3")?.textContent?.trim() || "Bim Labs System";
    const description =
      quadrant.querySelector("p")?.textContent?.trim() ||
      "A polished digital system built around clarity, speed, and execution.";

    quadrantPreview.innerHTML = `
      <span>Active system</span>
      <strong>${title}</strong>
      <p>${description}</p>
    `;
  }

  quadrants.forEach((quadrant) => {
    quadrant.addEventListener("mouseenter", () => setActiveQuadrant(quadrant));
    quadrant.addEventListener("focusin", () => setActiveQuadrant(quadrant));
  });

  if (quadrants.length) {
    setActiveQuadrant(document.querySelector("[data-quadrant].is-active") || quadrants[0]);
  }

  body.classList.add("is-loaded");
})();
