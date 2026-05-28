/* =========================================================
   BIM LABS — PROCESS SECTION
   Full replacement for: sections/process-world.js

   Behavior:
   - Big "process" word stays centered
   - Big word grows as user scrolls through section
   - Big word stays white and visible
   - Cards reveal smoothly
   - Cards softly drift/parallax
   - Glitch/scramble on reveal + hover
   ========================================================= */

(function () {
  const section = document.querySelector(".process-work-copy");

  if (!section) {
    console.warn("[Process] Missing .process-work-copy");
    return;
  }

  const bigWord = section.querySelector(".process-work-word");
  const items = Array.from(section.querySelectorAll("[data-process-step]"));
  const cards = Array.from(section.querySelectorAll(".process-work-card"));
  const glitchTexts = Array.from(section.querySelectorAll(".glitch-text"));

  if (!bigWord) {
    console.warn("[Process] Missing .process-work-word");
  }

  if (!items.length) {
    console.warn("[Process] Missing [data-process-step] items");
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&<>/[]{}+-=_";

  let observer = null;

  let sectionTop = 0;
  let sectionHeight = 1;
  let targetProgress = 0;
  let currentProgress = 0;
  let rafRunning = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  function smoothstep(edge0, edge1, value) {
    const x = clamp((value - edge0) / Math.max(edge1 - edge0, 0.0001), 0, 1);
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

  /* =========================================================
     TEXT SCRAMBLE / GLITCH
     ========================================================= */

  function scrambleText(element, options = {}) {
    if (!element || prefersReducedMotion) return;

    const force = options.force === true;

    if (element.dataset.scrambling === "true") return;
    if (!force && element.dataset.scrambled === "true") return;

    const finalText = element.getAttribute("data-glitch-text") || element.textContent.trim();

    element.dataset.scrambling = "true";
    element.classList.add("is-scrambling");

    let frame = 0;
    const totalFrames = force ? 14 : 24;
    const speed = force ? 18 : 24;

    const interval = window.setInterval(() => {
      const progress = frame / totalFrames;

      const output = finalText
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";

          const revealPoint = index / Math.max(finalText.length, 1);
          const shouldReveal = progress > revealPoint + 0.12;

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

        const parentItem = element.closest(".process-work-item");

        if (parentItem) {
          parentItem.classList.add("is-glitching");

          window.setTimeout(() => {
            parentItem.classList.remove("is-glitching");
          }, 480);
        }
      }
    }, speed);
  }

  function revealItem(item) {
    if (!item) return;

    item.classList.add("is-visible");

    const title = item.querySelector(".glitch-text");

    if (title) {
      scrambleText(title);
    }
  }

  function hideItem(item) {
    if (!item) return;

    item.classList.remove("is-visible");
  }

  /* =========================================================
     OBSERVER
     ========================================================= */

  function setupObserver() {
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const item = entry.target;

          if (entry.isIntersecting) {
            revealItem(item);
          } else {
            hideItem(item);
          }
        });
      },
      {
        root: null,
        threshold: 0.24,
        rootMargin: "-10% 0px -14% 0px"
      }
    );

    items.forEach((item) => observer.observe(item));
  }

  /* =========================================================
     INITIAL STATE
     ========================================================= */

  function setupInitialState() {
    items.forEach((item) => {
      item.classList.remove("is-visible", "is-hovered", "is-glitching");
    });

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.scrambled = "false";
      text.dataset.scrambling = "false";
      text.classList.remove("is-scrambling");
    });

    if (bigWord) {
      setStyles(bigWord, {
        color: "#ffffff",
        opacity: "0.08",
        transform: "translate3d(0, -50%, 0) scale(0.72)",
        filter: "blur(3px)"
      });
    }
  }

  /* =========================================================
     HOVER EFFECTS
     ========================================================= */

  function setupHoverEffects() {
    items.forEach((item) => {
      const title = item.querySelector(".glitch-text");

      function enter() {
        item.classList.add("is-hovered");

        if (title) {
          scrambleText(title, { force: true });
        }
      }

      function leave() {
        item.classList.remove("is-hovered");
      }

      item.addEventListener("mouseenter", enter);
      item.addEventListener("mouseleave", leave);
      item.addEventListener("focusin", enter);
      item.addEventListener("focusout", leave);
    });
  }

  /* =========================================================
     MEASURE / SCROLL PROGRESS
     ========================================================= */

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
    currentProgress = lerp(currentProgress, targetProgress, 0.06);

    render(currentProgress);

    if (Math.abs(currentProgress - targetProgress) > 0.0005) {
      window.requestAnimationFrame(animate);
    } else {
      currentProgress = targetProgress;
      render(currentProgress);
      rafRunning = false;
    }
  }

  function render(progress) {
    renderBigWord(progress);
    renderCards();
  }

 function renderBigWord(progress) {
  if (!bigWord) return;

  const enter = smoothstep(0, 0.18, progress);
  const grow = smoothstep(0.08, 0.72, progress);
  const exit = smoothstep(0.84, 1, progress);

  const scale =
    lerp(0.8, 1.05, enter) +
    lerp(0, 0.28, grow) -
    lerp(0, 0.05, exit);

  const opacity =
    lerp(0.25, 1, enter) -
    lerp(0, 0.12, exit);

  setStyles(bigWord, {
    color: "#ffffff",
    opacity: clamp(opacity, 0.25, 1).toFixed(3),
    filter: "none",
    transform: `scale(${scale.toFixed(4)})`
  });
}

  /* =========================================================
     CARD MOTION
     ========================================================= */

  function renderCards() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    cards.forEach((card) => {
      const item = card.closest(".process-work-item");
      if (!item) return;

      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      const viewportProgress = clamp(center / viewportHeight, 0, 1);
      const distanceFromCenter = Math.abs(center - viewportHeight / 2) / viewportHeight;
      const focus = 1 - clamp(distanceFromCenter, 0, 1);

      const isRight = item.classList.contains("process-work-item--right");
      const direction = isRight ? 1 : -1;

      const driftX = direction * lerp(22, -22, smoothstep(0, 1, viewportProgress));
      const driftY = lerp(18, -14, smoothstep(0, 1, viewportProgress));
      const cardOpacity = lerp(0.72, 1, smoothstep(0.1, 0.78, focus));
      const cardScale = lerp(0.985, 1, smoothstep(0.08, 0.76, focus));

      if (!item.classList.contains("is-hovered")) {
        setStyles(card, {
          transform: `translate3d(${driftX.toFixed(2)}px, ${driftY.toFixed(2)}px, 0) scale(${cardScale.toFixed(4)})`,
          opacity: cardOpacity.toFixed(3)
        });
      }
    });
  }

  /* =========================================================
     VISIBILITY REFRESH
     ========================================================= */

  function refreshVisibleItems() {
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      const center = rect.top + rect.height / 2;

      const isNearReadingZone =
        center > viewportHeight * 0.12 &&
        center < viewportHeight * 0.88;

      if (isNearReadingZone) {
        revealItem(item);
      }
    });
  }

  /* =========================================================
     REDUCED MOTION
     ========================================================= */

  function setupReducedMotion() {
    items.forEach((item) => {
      item.classList.add("is-visible");
    });

    glitchTexts.forEach((text) => {
      const finalText = text.getAttribute("data-glitch-text") || text.textContent.trim();

      text.textContent = finalText;
      text.dataset.scrambled = "true";
      text.dataset.scrambling = "false";
    });

    if (bigWord) {
      setStyles(bigWord, {
        color: "#ffffff",
        opacity: "0.22",
        filter: "none",
        transform: "translate3d(0, -50%, 0) scale(1)"
      });
    }
  }

  /* =========================================================
     INIT
     ========================================================= */

  function init() {
    setupInitialState();

    if (prefersReducedMotion) {
      setupReducedMotion();
      return;
    }

    setupObserver();
    setupHoverEffects();

    measure();
    refreshVisibleItems();

    window.addEventListener("scroll", updateTarget, { passive: true });

    window.addEventListener(
      "resize",
      debounce(() => {
        measure();
        refreshVisibleItems();
      }, 180)
    );

    window.addEventListener("load", () => {
      measure();
      refreshVisibleItems();
    });

    console.log("[Process] Loaded.", {
      items: items.length,
      cards: cards.length
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
