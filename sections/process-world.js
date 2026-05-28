/* =========================================================
   BIM LABS — PROCESS FULLSCREEN SCROLL
   Replacement for: sections/process-world.js

   This does NOT depend on CSS sticky working.
   It uses JS to create the fullscreen/pinned feeling,
   similar to your showcase/main.js logic.
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

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;

  function mapRange(value, inMin, inMax, outMin, outMax) {
    const p = clamp((value - inMin) / (inMax - inMin), 0, 1);
    return lerp(outMin, outMax, p);
  }

  function setStyles(el, styles) {
    if (!el) return;
    Object.assign(el.style, styles);
  }

  function measure() {
    enabled = window.innerWidth > 1100;

    if (!enabled) {
      resetMobile();
      return;
    }

    section.style.minHeight = "430vh";
    section.style.position = "relative";
    section.style.overflow = "visible";

    stage.style.position = "absolute";
    stage.style.top = "0";
    stage.style.left = "0";
    stage.style.right = "0";
    stage.style.width = "100%";
    stage.style.height = "100vh";
    stage.style.height = "100svh";

    const rect = section.getBoundingClientRect();
    sectionTop = rect.top + window.scrollY;
    sectionHeight = section.offsetHeight;
    scrollLength = Math.max(1, sectionHeight - window.innerHeight);

    updateTargets();
    startLoop();
  }

  function resetMobile() {
    section.style.minHeight = "";
    section.style.position = "";
    section.style.overflow = "";

    stage.style.position = "";
    stage.style.top = "";
    stage.style.left = "";
    stage.style.right = "";
    stage.style.bottom = "";
    stage.style.width = "";
    stage.style.height = "";
    stage.style.transform = "";
    stage.style.opacity = "";

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
    ].forEach((el) => {
      if (!el) return;
      el.style.opacity = "";
      el.style.transform = "";
      el.style.filter = "";
      el.style.letterSpacing = "";
      el.style.pointerEvents = "";
    });
  }

  function updatePin(progress) {
    const beforeSection = window.scrollY < sectionTop;
    const insideSection =
      window.scrollY >= sectionTop &&
      window.scrollY <= sectionTop + scrollLength;
    const afterSection = window.scrollY > sectionTop + scrollLength;

    if (beforeSection) {
      stage.style.position = "absolute";
      stage.style.top = "0";
      stage.style.bottom = "auto";
      stage.style.left = "0";
      stage.style.right = "0";
      stage.style.transform = "none";
    }

    if (insideSection) {
      stage.style.position = "fixed";
      stage.style.top = "0";
      stage.style.left = "0";
      stage.style.right = "0";
      stage.style.bottom = "auto";
      stage.style.transform = "none";
    }

    if (afterSection) {
      stage.style.position = "absolute";
      stage.style.top = "auto";
      stage.style.bottom = "0";
      stage.style.left = "0";
      stage.style.right = "0";
      stage.style.transform = "none";
    }
  }

  function updateTargets() {
    if (!enabled) return;

    const raw = (window.scrollY - sectionTop) / scrollLength;
    targetProgress = clamp(raw, 0, 1);

    updatePin(targetProgress);
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

  function render(p) {
    /*
      TIMING MAP

      0.00 - 0.12 = fullscreen stage enters
      0.08 - 0.30 = hero appears
      0.25 - 0.72 = rows reveal
      0.72 - 0.88 = close appears
      0.90 - 1.00 = thin exit band
    */

    const entry = clamp(p / 0.12, 0, 1);

    const stageScale = mapRange(entry, 0, 1, 0.92, 1);
    const stageOpacity = mapRange(entry, 0, 1, 0.72, 1);

    stage.style.transform = `scale(${stageScale})`;
    stage.style.opacity = stageOpacity.toFixed(3);

    setStyles(meta, {
      opacity: mapRange(p, 0.03, 0.12, 0, 1).toFixed(3)
    });

    setStyles(footerMeta, {
      opacity: mapRange(p, 0.03, 0.12, 0, 1).toFixed(3)
    });

    setStyles(kicker, {
      opacity: mapRange(p, 0.06, 0.15, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(p, 0.06, 0.15, 24, 0)}px, 0)`
    });

    setStyles(heading, {
      opacity: mapRange(p, 0.08, 0.24, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(p, 0.08, 0.24, 70, 0)}px, 0)`,
      filter: `blur(${mapRange(p, 0.08, 0.24, 12, 0)}px)`,
      letterSpacing: `${mapRange(p, 0.08, 0.24, -0.105, -0.075)}em`
    });

    setStyles(introCopy, {
      opacity: mapRange(p, 0.16, 0.28, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(p, 0.16, 0.28, 34, 0)}px, 0)`
    });

    const heroFade = mapRange(p, 0.72, 0.86, 1, 0.25);
    const heroLift = mapRange(p, 0.72, 0.86, 0, -60);

    setStyles(hero, {
      opacity: heroFade.toFixed(3),
      transform: `translate3d(0, ${heroLift}px, 0)`
    });

    setStyles(wall, {
      opacity: "1",
      transform: `translate3d(0, ${mapRange(p, 0.22, 0.36, 110, 0)}px, 0)`
    });

    rows.forEach((row, index) => {
      const start = 0.30 + index * 0.095;
      const end = start + 0.14;

      const rowOpacity = mapRange(p, start, end, 0, 1);
      const rowY = mapRange(p, start, end, 72, 0);

      setStyles(row, {
        opacity: rowOpacity.toFixed(3),
        transform: `translate3d(0, ${rowY}px, 0)`
      });

      setStyles(rowLines[index], {
        transform: `scaleX(${mapRange(p, start, end, 0, 1)})`
      });

      setStyles(rowNumbers[index], {
        opacity: mapRange(p, start + 0.02, end, 0, 1).toFixed(3),
        transform: `translate3d(0, ${mapRange(p, start + 0.02, end, 34, 0)}px, 0)`
      });

      setStyles(rowTitles[index], {
        opacity: mapRange(p, start + 0.035, end, 0, 1).toFixed(3),
        transform: `translate3d(0, ${mapRange(p, start + 0.035, end, 34, 0)}px, 0)`
      });

      setStyles(rowDetails[index], {
        opacity: mapRange(p, start + 0.05, end, 0, 1).toFixed(3),
        transform: `translate3d(0, ${mapRange(p, start + 0.05, end, 34, 0)}px, 0)`
      });
    });

    const wallLift = mapRange(p, 0.80, 0.90, 0, -22);

    setStyles(wall, {
      opacity: mapRange(p, 0.92, 0.98, 1, 0).toFixed(3),
      transform: `translate3d(0, ${wallLift}px, 0)`
    });

    setStyles(close, {
      opacity: mapRange(p, 0.82, 0.9, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(p, 0.82, 0.9, 40, 0)}px, 0)`,
      pointerEvents: p > 0.84 && p < 0.94 ? "auto" : "none"
    });

    const exitIn = mapRange(p, 0.92, 0.98, 0, 1);

    setStyles(exitBand, {
      opacity: exitIn.toFixed(3),
      transform: `translate3d(0, ${mapRange(p, 0.92, 0.98, 100, 0)}%, 0)`
    });

    setStyles(exitLine, {
      transform: `scaleX(${mapRange(p, 0.94, 0.99, 0, 1)})`
    });

    setStyles(exitLabel, {
      opacity: mapRange(p, 0.96, 1, 0, 1).toFixed(3),
      transform: `translate3d(0, ${mapRange(p, 0.96, 1, 18, 0)}px, 0)`
    });

    if (p > 0.94) {
      [
        hero,
        wall,
        close,
        meta,
        footerMeta
      ].forEach((el) => {
        if (!el) return;
        el.style.opacity = mapRange(p, 0.94, 0.99, Number(el.style.opacity || 1), 0).toFixed(3);
      });
    }
  }

  function debounce(fn, delay = 150) {
    let timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    };
  }

  function init() {
    measure();

    window.addEventListener("scroll", updateTargets, { passive: true });
    window.addEventListener("resize", debounce(measure, 150));
    window.addEventListener("load", measure);

    console.log("[Process] JS fullscreen process loaded");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
