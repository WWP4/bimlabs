/* =========================================================
   BIM LABS — CINEMATIC PROCESS GLITCH SCROLL
   Full replacement for: sections/process-world.js

   Built for:
   .bim-process-cinema
   .process-cinema-bg span
   .process-cinema-step
   .process-step-card
   .glitch-text

   Behavior:
   - Huge PROCESS word slowly scales/fades with scroll
   - Step cards reveal as they enter view
   - Alternating left/right cards get subtle motion
   - Titles scramble/glitch on scroll reveal
   - Titles glitch again on hover
   - Underline hover is handled by CSS
   ========================================================= */

(function () {
  const section = document.querySelector(".bim-process-cinema");

  if (!section) {
    console.warn("[Process Cinema] Missing .bim-process-cinema");
    return;
  }

  const bgWord = section.querySelector(".process-cinema-bg span");
  const steps = Array.from(section.querySelectorAll("[data-process-step]"));
  const cards = Array.from(section.querySelectorAll(".process-step-card"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  if (!steps.length) {
    console.warn("[Process Cinema] No [data-process-step] elements found.");
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&<>/[]{}+-=_";

  let revealObserver = null;
  let targetProgress = 0;
  let currentProgress = 0;
  let rafRunning = false;
  let sectionTop = 0;
  let sectionHeight = 1;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  function smoothstep(edge0, edge1, value) {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function randomGlyph() {
    return glyphs[Math.floor(Math.random() * glyphs.length)];
  }

  function setStyles(element, styles) {
    if (!element) return;
    Object.assign(element.style, styles);
  }

  function debounce(fn, delay = 160) {
    let timer;

    return function () {
      clearTimeout(timer);
      timer = window.setTimeout(fn, delay);
    };
  }

  function scrambleText(element, options = {}) {
    if (!element || prefersReducedMotion) return;

    const force = options.force === true;

    if (element.dataset.scrambling === "true") return;
    if (!force && element.dataset.scrambled === "true") return;

    const finalText = element.getAttribute("data-glitch-text") || element.textContent.trim();

    element.dataset.scrambling = "true";
    element.classList.add("is-scrambling");

    let frame = 0;
    const totalFrames = force ? 18 : 30;
    const speed = force ? 22 : 26;

    const interval = window.setInterval(() => {
      const progress = frame / totalFrames;

      const output = finalText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";

          const revealPoint = index / Math.max(finalText.length, 1);
          const shouldReveal = progress > revealPoint + 0.16;

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

        const parentStep = element.closest(".process-cinema-step");

        if (parentStep) {
          parentStep.classList.add("is-glitching");

          window.setTimeout(() => {
            parentStep.classList.remove("is-glitching");
          }, 520);
        }
      }
    }, speed);
  }

  function revealStep(step) {
    if (!step) return;

    step.classList.add("is-visible");

    const title = step.querySelector(".glitch-text");

    if (title) {
      scrambleText(title);
    }
  }

  function hideStep(step) {
    if (!step) return;
    step.classList.remove("is-visible");
  }

  function setupRevealObserver() {
    if (revealObserver) {
      revealObserver.disconnect();
    }

    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const step = entry.target;

          if (entry.isIntersecting) {
            revealStep(step);
          } else {
            hideStep(step);
          }
        });
      },
      {
        root: null,
        threshold: 0.34,
        rootMargin: "-10% 0px -16% 0px"
      }
    );

    steps.forEach((step) => revealObserver.observe(step));
  }

  function setupInitialState() {
    steps.forEach((step) => {
      step.classList.remove("is-visible", "is-hovered", "is-glitching");
    });

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.scrambled = "false";
      text.dataset.scrambling = "false";
      text.classList.remove("is-scrambling");
    });
  }

  function setupHoverEffects() {
    steps.forEach((step) => {
      const title = step.querySelector(".glitch-text");

      function enter() {
        step.classList.add("is-hovered");

        if (title) {
          scrambleText(title, { force: true });
        }
      }

      function leave() {
        step.classList.remove("is-hovered");
      }

      step.addEventListener("mouseenter", enter);
      step.addEventListener("mouseleave", leave);
      step.addEventListener("focusin", enter);
      step.addEventListener("focusout", leave);
    });
  }

  function measure() {
    const rect = section.getBoundingClientRect();

    sectionTop = rect.top + window.scrollY;
    sectionHeight = Math.max(section.offsetHeight, window.innerHeight);

    updateTarget();
  }

  function updateTarget() {
    const start = sectionTop;
    const end = sectionTop + sectionHeight - window.innerHeight;
    const raw = (window.scrollY - start) / Math.max(end - start, 1);

    targetProgress = clamp(raw, 0, 1);
    startLoop();
  }

  function startLoop() {
    if (rafRunning || prefersReducedMotion) return;

    rafRunning = true;
    window.requestAnimationFrame(animate);
  }

  function animate() {
    currentProgress = lerp(currentProgress, targetProgress, 0.075);

    render(currentProgress);

    if (Math.abs(currentProgress - targetProgress) > 0.0006) {
      window.requestAnimationFrame(animate);
    } else {
      currentProgress = targetProgress;
      render(currentProgress);
      rafRunning = false;
    }
  }

  function render(progress) {
    renderBackgroundWord(progress);
    renderCards();
  }

  function renderBackgroundWord(progress) {
    if (!bgWord) return;

    /*
      The word should feel like the environment:
      it grows slowly, not like an animation gimmick.
    */

    const scale = lerp(0.82, 1.34, smoothstep(0, 1, progress));
    const opacity = lerp(0.075, 0.135, smoothstep(0.08, 0.72, progress));
    const blur = lerp(0, 1.4, smoothstep(0.72, 1, progress));
    const y = lerp(0, -18, smoothstep(0, 1, progress));

    setStyles(bgWord, {
      transform: `translate3d(0, ${y}px, 0) scale(${scale})`,
      opacity: opacity.toFixed(3),
      filter: `blur(${blur.toFixed(2)}px)`
    });
  }

  function renderCards() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    cards.forEach((card) => {
      const step = card.closest(".process-cinema-step");
      if (!step) return;

      const rect = step.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distanceFromCenter = (center - viewportHeight / 2) / viewportHeight;

      const normalized = clamp(Math.abs(distanceFromCenter), 0, 1);
      const strength = 1 - normalized;

      const isRight = step.classList.contains("process-cinema-step--right");
      const direction = isRight ? 1 : -1;

      /*
        Subtle horizontal drift as the card moves through the viewport.
        Keep this small. Big motion makes it feel cheap.
      */

      const driftX = direction * lerp(18, -18, clamp((center / viewportHeight), 0, 1));
      const driftY = lerp(12, -10, clamp((center / viewportHeight), 0, 1));
      const opacity = lerp(0.74, 1, strength);

      if (!step.classList.contains("is-hovered")) {
        setStyles(card, {
          transform: `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0)`,
          opacity: opacity.toFixed(3)
        });
      }
    });
  }

  function refreshVisibleSteps() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    steps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      const isNearCenter =
        center > viewportHeight * 0.16 &&
        center < viewportHeight * 0.84;

      if (isNearCenter) {
        revealStep(step);
      }
    });
  }

  function setupReducedMotion() {
    steps.forEach((step) => {
      step.classList.add("is-visible");
    });

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();
      text.textContent = finalText;
    });

    if (bgWord) {
      bgWord.style.transform = "";
      bgWord.style.opacity = "";
      bgWord.style.filter = "";
    }
  }

  function init() {
    setupInitialState();

    if (prefersReducedMotion) {
      setupReducedMotion();
      return;
    }

    setupRevealObserver();
    setupHoverEffects();
    measure();
    refreshVisibleSteps();

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", debounce(() => {
      measure();
      refreshVisibleSteps();
    }, 180));

    window.addEventListener("load", () => {
      measure();
      refreshVisibleSteps();
    });

    console.log("[Process Cinema] Glitch scroll loaded.", {
      steps: steps.length
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
