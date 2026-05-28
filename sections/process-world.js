/* =========================================================
   BIM LABS — PROCESS LONG PINNED SCROLL
   Smoother / slower premium version
   Full replacement for: sections/process-world.js
   ========================================================= */

(function () {
  const section = document.querySelector(".bim-process-scroll");
  const track = document.querySelector(".process-scroll-track");
  const sticky = document.querySelector(".process-sticky");

  if (!section || !track || !sticky) {
    console.warn("[Process] Missing process section, track, or sticky stage.");
    return;
  }

  const scenes = Array.from(section.querySelectorAll(".process-scene"));
  const progressItems = Array.from(section.querySelectorAll(".process-progress span"));

  if (!scenes.length) {
    console.warn("[Process] No .process-scene elements found.");
    return;
  }

  const DESKTOP_QUERY = "(min-width: 1101px)";

  let enabled = false;
  let sectionTop = 0;
  let scrollLength = 1;

  let targetProgress = 0;
  let currentProgress = 0;
  let rafRunning = false;
  let activeIndex = -1;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (start, end, amount) => start + (end - start) * amount;

  function smoothstep(edge0, edge1, value) {
    const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
  }

  function mapRange(value, inMin, inMax, outMin, outMax) {
    const progress = smoothstep(inMin, inMax, value);
    return lerp(outMin, outMax, progress);
  }

  function setStyles(element, styles) {
    if (!element) return;
    Object.assign(element.style, styles);
  }

  function debounce(fn, delay = 160) {
    let timer;

    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function getSceneIndex(progress) {
    /*
      More breathing room per scene.

      0.00 - 0.20 intro
      0.20 - 0.34 step 01
      0.34 - 0.48 step 02
      0.48 - 0.62 step 03
      0.62 - 0.77 step 04
      0.77 - 1.00 close
    */

    if (progress < 0.2) return 0;
    if (progress < 0.34) return 1;
    if (progress < 0.48) return 2;
    if (progress < 0.62) return 3;
    if (progress < 0.77) return 4;
    return 5;
  }

  function getLocalSceneProgress(progress, index) {
    const ranges = [
      [0.0, 0.2],
      [0.2, 0.34],
      [0.34, 0.48],
      [0.48, 0.62],
      [0.62, 0.77],
      [0.77, 1.0]
    ];

    const range = ranges[index] || [0, 1];
    return clamp((progress - range[0]) / (range[1] - range[0]), 0, 1);
  }

  function updateSceneClasses(index) {
    if (index === activeIndex) return;

    activeIndex = index;

    scenes.forEach((scene, sceneIndex) => {
      scene.classList.remove("is-active", "is-before", "is-after");

      if (sceneIndex === index) {
        scene.classList.add("is-active");
      } else if (sceneIndex < index) {
        scene.classList.add("is-before");
      } else {
        scene.classList.add("is-after");
      }
    });

    const activeScene = scenes[index];
    const activeKey = activeScene ? activeScene.getAttribute("data-process-scene") : "";

    progressItems.forEach((item) => {
      const itemKey = item.getAttribute("data-progress-step");
      item.classList.toggle("is-active", itemKey === activeKey);
    });
  }

  function setupDesktop() {
    enabled = window.matchMedia(DESKTOP_QUERY).matches;

    if (!enabled) {
      resetMobile();
      return;
    }

    section.style.minHeight = "760vh";
    track.style.minHeight = "760vh";

    sticky.style.transform = "translate3d(0, 0, 0)";
    sticky.style.opacity = "1";
    sticky.style.clipPath = "inset(0px round 0px)";
    sticky.style.borderRadius = "0px";

    scenes.forEach((scene, index) => {
      scene.style.opacity = "";
      scene.style.visibility = "";
      scene.style.transform = "";
      scene.style.filter = "";
      scene.style.pointerEvents = "";

      if (index === 0) {
        scene.classList.add("is-active");
        scene.classList.remove("is-before", "is-after");
      } else {
        scene.classList.remove("is-active", "is-before");
        scene.classList.add("is-after");
      }
    });

    progressItems.forEach((item) => {
      const itemKey = item.getAttribute("data-progress-step");
      item.classList.toggle("is-active", itemKey === "intro");
    });

    activeIndex = 0;
  }

  function resetMobile() {
    section.style.minHeight = "";
    track.style.minHeight = "";

    sticky.style.transform = "";
    sticky.style.opacity = "";
    sticky.style.clipPath = "";
    sticky.style.borderRadius = "";

    scenes.forEach((scene) => {
      scene.classList.remove("is-active", "is-before", "is-after");
      scene.style.opacity = "";
      scene.style.visibility = "";
      scene.style.transform = "";
      scene.style.filter = "";
      scene.style.pointerEvents = "";
    });

    progressItems.forEach((item) => {
      item.classList.remove("is-active");
    });

    activeIndex = -1;
  }

  function measure() {
    setupDesktop();

    if (!enabled) return;

    const rect = section.getBoundingClientRect();

    sectionTop = rect.top + window.scrollY;
    scrollLength = Math.max(1, section.offsetHeight - window.innerHeight);

    updateTarget();
    startLoop();
  }

  function updateTarget() {
    if (!enabled) return;

    const rawProgress = (window.scrollY - sectionTop) / scrollLength;
    targetProgress = clamp(rawProgress, 0, 1);

    startLoop();
  }

  function startLoop() {
    if (rafRunning) return;

    rafRunning = true;
    requestAnimationFrame(animate);
  }

  function animate() {
    /*
      Lower number = smoother / heavier / less snappy.
      0.045 is very slow.
      0.055 is premium but still responsive.
      0.075 is slightly faster.
    */

    currentProgress = lerp(currentProgress, targetProgress, 0.055);

    render(currentProgress);

    const stillMoving = Math.abs(currentProgress - targetProgress) > 0.00045;

    if (stillMoving) {
      requestAnimationFrame(animate);
    } else {
      currentProgress = targetProgress;
      render(currentProgress);
      rafRunning = false;
    }
  }

  function render(progress) {
    const sceneIndex = getSceneIndex(progress);

    updateSceneClasses(sceneIndex);
    renderStickyFrame(progress);
    renderSceneDetail(progress, sceneIndex);
  }

  function renderStickyFrame(progress) {
    const entry = smoothstep(0, 0.13, progress);
    const exit = smoothstep(0.9, 1, progress);

    let inset = 0;
    let radius = 0;
    let scale = 1;
    let opacity = 1;

    if (progress < 0.13) {
      inset = lerp(52, 0, entry);
      radius = lerp(34, 0, entry);
      scale = lerp(0.92, 1, entry);
      opacity = lerp(0.72, 1, entry);
    }

    if (progress > 0.9) {
      inset = lerp(0, 52, exit);
      radius = lerp(0, 34, exit);
      scale = lerp(1, 0.92, exit);
      opacity = lerp(1, 0.72, exit);
    }

    setStyles(sticky, {
      transform: `scale(${scale})`,
      opacity: opacity.toFixed(3),
      clipPath: `inset(${inset}px round ${radius}px)`,
      borderRadius: `${radius}px`
    });
  }

  function renderSceneDetail(progress, sceneIndex) {
    const scene = scenes[sceneIndex];
    if (!scene) return;

    const local = getLocalSceneProgress(progress, sceneIndex);

    const intro = scene.querySelector(".process-intro");
    const introAside = scene.querySelector(".process-intro-aside");

    const stepLeft = scene.querySelector(".process-step-left");
    const stepRight = scene.querySelector(".process-step-right");
    const stepNumber = scene.querySelector(".process-step-bg-number");

    const closeCopy = scene.querySelector(".process-close-copy");

    /*
      Small movement only. The more we move things, the cheaper/snappier it feels.
    */

    if (intro) {
      setStyles(intro, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 10, -6)}px, 0)`,
        opacity: mapRange(local, 0, 0.34, 0.82, 1).toFixed(3)
      });
    }

    if (introAside) {
      setStyles(introAside, {
        transform: `translate3d(${mapRange(local, 0.2, 1, 0, 16)}px, 0, 0)`,
        opacity: mapRange(local, 0.7, 1, 1, 0).toFixed(3)
      });
    }

    if (stepLeft) {
      setStyles(stepLeft, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 12, -6)}px, 0)`,
        opacity: mapRange(local, 0, 0.32, 0.78, 1).toFixed(3)
      });
    }

    if (stepRight) {
      setStyles(stepRight, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 20, -4)}px, 0)`,
        opacity: mapRange(local, 0.08, 0.38, 0, 1).toFixed(3)
      });
    }

    if (stepNumber) {
      setStyles(stepNumber, {
        transform: `translate3d(0, -50%, 0) scale(${mapRange(local, 0, 1, 0.985, 1.025)})`,
        opacity: mapRange(local, 0, 0.45, 0.55, 1).toFixed(3)
      });
    }

    if (closeCopy) {
      setStyles(closeCopy, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 18, -3)}px, 0)`,
        opacity: mapRange(local, 0, 0.34, 0.76, 1).toFixed(3)
      });
    }

    resetInactiveInlineStyles(sceneIndex);
  }

  function resetInactiveInlineStyles(activeSceneIndex) {
    scenes.forEach((scene, index) => {
      if (index === activeSceneIndex) return;

      const animatedChildren = scene.querySelectorAll(
        ".process-intro, .process-intro-aside, .process-step-left, .process-step-right, .process-step-bg-number, .process-close-copy"
      );

      animatedChildren.forEach((element) => {
        element.style.transform = "";
        element.style.opacity = "";
      });
    });
  }

  function init() {
    measure();

    window.addEventListener("scroll", updateTarget, { passive: true });
    window.addEventListener("resize", debounce(measure, 180));
    window.addEventListener("load", measure);

    console.log("[Process] Smooth long pinned process scroll loaded.", {
      scenes: scenes.length
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
