/* =========================================================
   BIM LABS — PROCESS FULLSCREEN TAKEOVER
   Full replacement for: sections/process-world.js

   Behavior:
   - Process section enters as a framed scene
   - Expands into true fullscreen
   - Rows animate in while screen is pinned
   - Closing CTA appears
   - Section shrinks/screens out at the end

   Required HTML:
   .bim-process-wall
   .process-sticky
   .process-hero
   .process-wall
   .process-row
   .process-exit-band
   ========================================================= */

(function () {
  const section = document.querySelector(".bim-process-wall");
  const stage = document.querySelector(".process-sticky");

  if (!section || !stage) {
    console.warn("[Process] Missing .bim-process-wall or .process-sticky");
    return;
  }

  const meta = section.querySelector(".process-meta");
  const footerMeta = section.querySelector(".process-footer-meta");

  const hero = section.querySelector(".process-hero");
  const kicker = section.querySelector(".process-kicker");
  const heading = section.querySelector(".process-hero h2");
  const introCopy = section.querySelector(".process-intro-copy");

  const wall = section.querySelector(".process-wall");
  const rows = Array.from(section.querySelectorAll(".process-row"));
  const rowLines = Array.from(section.querySelectorAll(".process-row-line"));
  const rowNumbers = Array.from(section.querySelectorAll(".process-row-number"));
  const rowTitles = Array.from(section.querySelectorAll(".process-row-title"));
  const rowDetails = Array.from(section.querySelectorAll(".process-row-detail"));

  const close = section.querySelector(".process-close");

  const exitBand = section.querySelector(".process-exit-band");
  const exitLine = section.querySelector(".process-exit-line");
  const exitLabel = section.querySelector(".process-exit-band span");

  let enabled = false;
  let sectionTop = 0;
  let sectionHeight = 1;
  let scrollLength = 1;

  let targetProgress = 0;
  let currentProgress = 0;
  let rafRunning = false;

  const DESKTOP_QUERY = "(min-width: 1101px)";

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

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

  function setupDesktopBase() {
    section.style.position = "relative";
    section.style.minHeight = "430vh";
    section.style.overflow = "visible";
    section.style.background = "#030303";

    stage.style.position = "absolute";
    stage.style.top = "0";
    stage.style.left = "0";
    stage.style.right = "0";
    stage.style.bottom = "auto";
    stage.style.width = "100%";
    stage.style.height = "100vh";
    stage.style.height = "100svh";
    stage.style.overflow = "hidden";
    stage.style.transformOrigin = "center center";
    stage.style.willChange = "transform, opacity, clip-path, border-radius";

    setStyles(stage, {
      opacity: "1",
      transform: "scale(0.9)",
      clipPath: "inset(42px round 34px)",
      borderRadius: "34px"
    });

    setStyles(meta, { opacity: "0" });
    setStyles(footerMeta, { opacity: "0" });

    setStyles(kicker, {
      opacity: "0",
      transform: "translate3d(0, 24px, 0)"
    });

    setStyles(heading, {
      opacity: "0",
      transform: "translate3d(0, 70px, 0)",
      filter: "blur(12px)",
      letterSpacing: "-0.105em"
    });

    setStyles(introCopy, {
      opacity: "0",
      transform: "translate3d(0, 34px, 0)"
    });

    setStyles(hero, {
      opacity: "1",
      transform: "translate3d(0, 0, 0)"
    });

    setStyles(wall, {
      opacity: "1",
      transform: "translate3d(0, 110px, 0)"
    });

    rows.forEach((row) => {
      setStyles(row, {
        opacity: "0",
        transform: "translate3d(0, 72px, 0)"
      });
    });

    rowLines.forEach((line) => {
      setStyles(line, {
        transform: "scaleX(0)",
        transformOrigin: "left center"
      });
    });

    [...rowNumbers, ...rowTitles, ...rowDetails].forEach((item) => {
      setStyles(item, {
        opacity: "0",
        transform: "translate3d(0, 34px, 0)"
      });
    });

    setStyles(close, {
      opacity: "0",
      transform: "translate3d(0, 40px, 0)",
      pointerEvents: "none"
    });

    setStyles(exitBand, {
      opacity: "0",
      transform: "translate3d(0, 100%, 0)"
    });

    setStyles(exitLine, {
      transform: "scaleX(0)",
      transformOrigin: "center center"
    });

    setStyles(exitLabel, {
      opacity: "0",
      transform: "translate3d(0, 18px, 0)"
    });
  }

  function resetMobile() {
    section.style.position = "";
    section.style.minHeight = "";
    section.style.overflow = "";
    section.style.background = "";

    stage.style.position = "";
    stage.style.top = "";
    stage.style.left = "";
    stage.style.right = "";
    stage.style.bottom = "";
    stage.style.width = "";
    stage.style.height = "";
    stage.style.overflow = "";
    stage.style.transformOrigin = "";
    stage.style.willChange = "";
    stage.style.opacity = "";
    stage.style.transform = "";
    stage.style.clipPath = "";
    stage.style.borderRadius = "";

    [
      meta,
      footerMeta,
      hero,
      kicker,
      heading,
      introCopy,
      wall,
      close,
      exitBand,
      exitLine,
      exitLabel,
      ...rows,
      ...rowLines,
      ...rowNumbers,
      ...rowTitles,
      ...rowDetails
    ].forEach((element) => {
      if (!element) return;

      element.style.opacity = "";
      element.style.transform = "";
      element.style.filter = "";
      element.style.letterSpacing = "";
      element.style.pointerEvents = "";
      element.style.clipPath = "";
      element.style.borderRadius = "";
      element.style.position = "";
      element.style.top = "";
      element.style.left = "";
      element.style.right = "";
      element.style.bottom = "";
    });
  }

  function measure() {
    enabled = window.matchMedia(DESKTOP_QUERY).matches;

    if (!enabled) {
      resetMobile();
      return;
    }

    setupDesktopBase();

    const rect = section.getBoundingClientRect();

    sectionTop = rect.top + window.scrollY;
    sectionHeight = section.offsetHeight;
    scrollLength = Math.max(1, sectionHeight - window.innerHeight);

    updateTargets();
    startLoop();
  }

  function updatePin() {
    const scrollY = window.scrollY;

    const beforeSection = scrollY < sectionTop;
    const insideSection = scrollY >= sectionTop && scrollY <= sectionTop + scrollLength;
    const afterSection = scrollY > sectionTop + scrollLength;

    if (beforeSection) {
      stage.style.position = "absolute";
      stage.style.top = "0";
      stage.style.bottom = "auto";
      stage.style.left = "0";
      stage.style.right = "0";
    }

    if (insideSection) {
      stage.style.position = "fixed";
      stage.style.top = "0";
      stage.style.bottom = "auto";
      stage.style.left = "0";
      stage.style.right = "0";
    }

    if (afterSection) {
      stage.style.position = "absolute";
      stage.style.top = "auto";
      stage.style.bottom = "0";
      stage.style.left = "0";
      stage.style.right = "0";
    }
  }

  function updateTargets() {
    if (!enabled) return;

    const rawProgress = (window.scrollY - sectionTop) / scrollLength;

    targetProgress = clamp(rawProgress, 0, 1);

    updatePin();
    startLoop();
  }

  function startLoop() {
    if (rafRunning) return;

    rafRunning = true;
    requestAnimationFrame(animate);
  }

  function animate() {
    currentProgress = lerp(currentProgress, targetProgress, 0.11);

    render(currentProgress);

    const stillMoving = Math.abs(currentProgress - targetProgress) > 0.001;

    if (stillMoving) {
      requestAnimationFrame(animate);
    } else {
      rafRunning = false;
    }
  }

  function renderProcessScreen(progress) {
    /*
      0.00 → 0.14 = framed entry into fullscreen
      0.14 → 0.88 = true fullscreen
      0.88 → 1.00 = framed exit
    */

    const entryProgress = clamp(progress / 0.14, 0, 1);
    const exitProgress = clamp((progress - 0.88) / 0.12, 0, 1);

    let scale = 1;
    let opacity = 1;
    let inset = 0;
    let radius = 0;

    if (progress < 0.14) {
      scale = lerp(0.9, 1, entryProgress);
      opacity = lerp(0.68, 1, entryProgress);
      inset = lerp(42, 0, entryProgress);
      radius = lerp(34, 0, entryProgress);
    } else if (progress > 0.88) {
      scale = lerp(1, 0.9, exitProgress);
      opacity = lerp(1, 0.68, exitProgress);
      inset = lerp(0, 42, exitProgress);
      radius = lerp(0, 34, exitProgress);
    }

    stage.style.transform = `scale(${scale})`;
    stage.style.opacity = opacity.toFixed(3);
    stage.style.clipPath = `inset(${inset}px round ${radius}px)`;
    stage.style.borderRadius = `${radius}px`;
  }

  function renderHero(progress) {
    setStyles(meta, {
      opacity: mapRange(progress, 0.03, 0.12, 0, 1).toFixed(3)
    });

    setStyles(footerMeta, {
      opacity: mapRange(progress, 0.03, 0.12, 0, 1).toFixed(3)
    });

    setStyles(kicker, {
      opacity: mapRange(progress, 0.06, 0.15, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(progress, 0.06, 0.15, 24, 0)}px, 0)`
    });

    setStyles(heading, {
      opacity: mapRange(progress, 0.08, 0.24, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(progress, 0.08, 0.24, 70, 0)}px, 0)`,
      filter: `blur(${mapRange(progress, 0.08, 0.24, 12, 0)}px)`,
      letterSpacing: `${mapRange(progress, 0.08, 0.24, -0.105, -0.075)}em`
    });

    setStyles(introCopy, {
      opacity: mapRange(progress, 0.16, 0.28, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(progress, 0.16, 0.28, 34, 0)}px, 0)`
    });

    const heroOpacity = mapRange(progress, 0.72, 0.86, 1, 0.24);
    const heroY = mapRange(progress, 0.72, 0.86, 0, -60);

    setStyles(hero, {
      opacity: heroOpacity.toFixed(3),
      transform: `translate3d(0, ${heroY}px, 0)`
    });
  }

  function renderRows(progress) {
    const wallInY = mapRange(progress, 0.22, 0.36, 110, 0);
    const wallExitY = mapRange(progress, 0.80, 0.90, 0, -22);
    const wallOpacity = mapRange(progress, 0.92, 0.98, 1, 0);

    setStyles(wall, {
      opacity: wallOpacity.toFixed(3),
      transform: `translate3d(0, ${wallInY + wallExitY}px, 0)`
    });

    rows.forEach((row, index) => {
      const start = 0.3 + index * 0.095;
      const end = start + 0.14;

      const rowOpacity = mapRange(progress, start, end, 0, 1);
      const rowY = mapRange(progress, start, end, 72, 0);

      setStyles(row, {
        opacity: rowOpacity.toFixed(3),
        transform: `translate3d(0, ${rowY}px, 0)`
      });

      setStyles(rowLines[index], {
        transform: `scaleX(${mapRange(progress, start, end, 0, 1)})`
      });

      setStyles(rowNumbers[index], {
        opacity: mapRange(progress, start + 0.02, end, 0, 1).toFixed(3),
        transform: `translate3d(0, ${mapRange(progress, start + 0.02, end, 34, 0)}px, 0)`
      });

      setStyles(rowTitles[index], {
        opacity: mapRange(progress, start + 0.035, end, 0, 1).toFixed(3),
        transform: `translate3d(0, ${mapRange(progress, start + 0.035, end, 34, 0)}px, 0)`
      });

      setStyles(rowDetails[index], {
        opacity: mapRange(progress, start + 0.05, end, 0, 1).toFixed(3),
        transform: `translate3d(0, ${mapRange(progress, start + 0.05, end, 34, 0)}px, 0)`
      });
    });
  }

  function renderClose(progress) {
    const closeOpacity = mapRange(progress, 0.82, 0.9, 0, 1);
    const closeY = mapRange(progress, 0.82, 0.9, 40, 0);
    const closeExitOpacity = mapRange(progress, 0.93, 0.98, 1, 0);

    setStyles(close, {
      opacity: Math.min(closeOpacity, closeExitOpacity).toFixed(3),
      transform: `translate3d(0, ${closeY}px, 0)`,
      pointerEvents: progress > 0.84 && progress < 0.93 ? "auto" : "none"
    });
  }

  function renderExit(progress) {
    const exitOpacity = mapRange(progress, 0.92, 0.98, 0, 1);
    const exitY = mapRange(progress, 0.92, 0.98, 100, 0);
    const lineScale = mapRange(progress, 0.94, 0.99, 0, 1);
    const labelOpacity = mapRange(progress, 0.96, 1, 0, 1);
    const labelY = mapRange(progress, 0.96, 1, 18, 0);

    setStyles(exitBand, {
      opacity: exitOpacity.toFixed(3),
      transform: `translate3d(0, ${exitY}%, 0)`
    });

    setStyles(exitLine, {
      transform: `scaleX(${lineScale})`
    });

    setStyles(exitLabel, {
      opacity: labelOpacity.toFixed(3),
      transform: `translate3d(0, ${labelY}px, 0)`
    });

    if (progress > 0.94) {
      const fadeOut = mapRange(progress, 0.94, 0.99, 1, 0);

      [hero, wall, close, meta, footerMeta].forEach((element) => {
        if (!element) return;
        element.style.opacity = Math.min(Number(element.style.opacity || 1), fadeOut).toFixed(3);
      });
    }
  }

  function render(progress) {
    renderProcessScreen(progress);
    renderHero(progress);
    renderRows(progress);
    renderClose(progress);
    renderExit(progress);
  }

  function init() {
    measure();

    window.addEventListener("scroll", updateTargets, { passive: true });
    window.addEventListener("resize", debounce(measure, 150));
    window.addEventListener("load", measure);

    console.log("[Process] Fullscreen takeover loaded", {
      rows: rows.length
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
