/* =========================================================
   BIM LABS — PROCESS LONG PINNED SCROLL
   Full replacement for: sections/process-world.js

   Built for:
   .bim-process-scroll
   .process-scroll-track
   .process-sticky
   .process-scene
   .process-progress

   Behavior:
   - Pins the process section naturally with CSS sticky
   - Converts scroll progress into scene changes
   - Intro → Step 01 → Step 02 → Step 03 → Step 04 → Close
   - Adds active/before/after classes
   - Updates progress rail
   - Uses light smoothing so it feels premium, not snappy
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

  function mapRange(value, inMin, inMax, outMin, outMax) {
    const progress = clamp((value - inMin) / (inMax - inMin), 0, 1);
    return lerp(outMin, outMax, progress);
  }

  function setStyles(element, styles) {
    if (!element) return;
    Object.assign(element.style, styles);
  }

  function debounce(fn, delay = 150) {
    let timer;

    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function getSceneIndex(progress) {
    /*
      6 total scenes:
      0 intro
      1 step 01
      2 step 02
      3 step 03
      4 step 04
      5 close

      Slightly longer hold on intro and close.
    */

    if (progress < 0.17) return 0;
    if (progress < 0.32) return 1;
    if (progress < 0.47) return 2;
    if (progress < 0.62) return 3;
    if (progress < 0.78) return 4;
    return 5;
  }

  function getLocalSceneProgress(progress, index) {
    const ranges = [
      [0.0, 0.17],
      [0.17, 0.32],
      [0.32, 0.47],
      [0.47, 0.62],
      [0.62, 0.78],
      [0.78, 1.0]
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

    section.style.minHeight = "620vh";
    track.style.minHeight = "620vh";

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
    currentProgress = lerp(currentProgress, targetProgress, 0.12);

    render(currentProgress);

    const stillMoving = Math.abs(currentProgress - targetProgress) > 0.0008;

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
    /*
      Small framed feeling at entry and exit.
      Fullscreen in the middle.
    */

    const entry = clamp(progress / 0.09, 0, 1);
    const exit = clamp((progress - 0.92) / 0.08, 0, 1);

    let inset = 0;
    let radius = 0;
    let scale = 1;
    let opacity = 1;

    if (progress < 0.09) {
      inset = lerp(46, 0, entry);
      radius = lerp(34, 0, entry);
      scale = lerp(0.925, 1, entry);
      opacity = lerp(0.72, 1, entry);
    }

    if (progress > 0.92) {
      inset = lerp(0, 46, exit);
      radius = lerp(0, 34, exit);
      scale = lerp(1, 0.925, exit);
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
      These are intentionally subtle because the CSS already handles
      the main scene fade/blur. JS adds internal motion only.
    */

    if (intro) {
      setStyles(intro, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 18, -8)}px, 0)`,
        opacity: mapRange(local, 0, 0.22, 0.7, 1).toFixed(3)
      });
    }

    if (introAside) {
      setStyles(introAside, {
        transform: `translate3d(${mapRange(local, 0, 1, 0, 28)}px, 0, 0)`,
        opacity: mapRange(local, 0.68, 1, 1, 0).toFixed(3)
      });
    }

    if (stepLeft) {
      setStyles(stepLeft, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 22, -10)}px, 0)`,
        opacity: mapRange(local, 0, 0.18, 0.65, 1).toFixed(3)
      });
    }

    if (stepRight) {
      setStyles(stepRight, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 42, -6)}px, 0)`,
        opacity: mapRange(local, 0.08, 0.28, 0, 1).toFixed(3)
      });
    }

    if (stepNumber) {
      setStyles(stepNumber, {
        transform: `translate3d(0, -50%, 0) scale(${mapRange(local, 0, 1, 0.96, 1.04)})`,
        opacity: mapRange(local, 0, 0.35, 0.45, 1).toFixed(3)
      });
    }

    if (closeCopy) {
      setStyles(closeCopy, {
        transform: `translate3d(0, ${mapRange(local, 0, 1, 30, -4)}px, 0)`,
        opacity: mapRange(local, 0, 0.22, 0.65, 1).toFixed(3)
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

    console.log("[Process] Long pinned process scroll loaded.", {
      scenes: scenes.length
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
