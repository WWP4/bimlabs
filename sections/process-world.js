/* =========================================================
   BIM LABS — PROCESS INDEX GLITCH REVEAL
   Full replacement for: sections/process-world.js

   Built for:
   .bim-process-index
   .process-index-step
   .glitch-text

   Behavior:
   - Steps fade into stronger focus as they enter view
   - Step titles scramble/glitch once when visible
   - Text stays readable; no pinned scene snapping
   ========================================================= */

(function () {
  const section = document.querySelector(".bim-process-index");

  if (!section) {
    console.warn("[Process Index] Missing .bim-process-index");
    return;
  }

  const steps = Array.from(section.querySelectorAll("[data-process-step]"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  if (!steps.length) {
    console.warn("[Process Index] No process steps found.");
    return;
  }

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&<>/[]{}+-=_";
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let observer = null;

  function randomGlyph() {
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function scrambleText(element) {
    if (!element || element.dataset.scrambled === "true") return;

    const finalText = element.getAttribute("data-glitch-text") || element.textContent.trim();

    element.dataset.scrambled = "true";
    element.classList.add("is-scrambling");

    let frame = 0;
    const totalFrames = 34;

    const interval = window.setInterval(() => {
      const progress = frame / totalFrames;

      const output = finalText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";

          const revealPoint = index / finalText.length;
          const shouldReveal = progress > revealPoint + 0.18;

          return shouldReveal ? char : randomGlyph();
        })
        .join("");

      element.textContent = output;

      frame += 1;

      if (frame > totalFrames) {
        window.clearInterval(interval);

        element.textContent = finalText;
        element.classList.remove("is-scrambling");

        const parentStep = element.closest(".process-index-step");

        if (parentStep) {
          parentStep.classList.add("is-glitching");

          window.setTimeout(() => {
            parentStep.classList.remove("is-glitching");
          }, 480);
        }
      }
    }, 28);
  }

  function revealStep(step) {
    if (!step) return;

    step.classList.add("is-visible");

    const title = step.querySelector(".glitch-text");

    if (!prefersReducedMotion && title) {
      scrambleText(title);
    }
  }

  function resetStep(step) {
    if (!step) return;

    step.classList.remove("is-visible");
  }

  function setupObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const step = entry.target;

          if (entry.isIntersecting) {
            revealStep(step);
          } else {
            resetStep(step);
          }
        });
      },
      {
        root: null,
        threshold: 0.36,
        rootMargin: "-12% 0px -18% 0px"
      }
    );

    steps.forEach((step) => observer.observe(step));
  }

  function setupInitialState() {
    steps.forEach((step) => {
      step.classList.remove("is-visible", "is-glitching");
    });

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.scrambled = "false";
      text.classList.remove("is-scrambling");
    });
  }

  function addMouseDetails() {
    steps.forEach((step) => {
      step.addEventListener("mouseenter", () => {
        step.classList.add("is-hovered");
      });

      step.addEventListener("mouseleave", () => {
        step.classList.remove("is-hovered");
      });

      step.addEventListener("focusin", () => {
        step.classList.add("is-hovered");
      });

      step.addEventListener("focusout", () => {
        step.classList.remove("is-hovered");
      });
    });
  }

  function refreshVisibleSteps() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    steps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const isNearCenter = center > viewportHeight * 0.18 && center < viewportHeight * 0.82;

      if (isNearCenter) {
        revealStep(step);
      }
    });
  }

  function init() {
    setupInitialState();

    if (prefersReducedMotion) {
      steps.forEach((step) => step.classList.add("is-visible"));
      return;
    }

    setupObserver();
    addMouseDetails();

    window.addEventListener("load", refreshVisibleSteps);
    window.addEventListener("resize", refreshVisibleSteps);

    refreshVisibleSteps();

    console.log("[Process Index] Glitch reveal loaded.", {
      steps: steps.length
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
