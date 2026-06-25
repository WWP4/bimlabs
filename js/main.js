const header = document.querySelector(".site-header");

const showcaseScroll = document.querySelector("#showcaseScroll");
const showcase = document.querySelector(".HomeShowcase");
const outerFrame = document.querySelector(".HomeShowcase__outerFrame");
const track = document.querySelector("#track");

const heroSection = document.querySelector(".hero");
const splineHero = document.querySelector(".spline-hero");

let enabled = false;
let maxMove = 0;
let scrollLength = 1;

let currentX = 0;
let targetX = 0;

let currentScale = 1;
let targetScale = 1;

let currentOpacity = 1;
let targetOpacity = 1;

let rafRunning = false;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, amount) => start + (end - start) * amount;

/* ======================================================
   HORIZONTAL SHOWCASE
====================================================== */

function measureShowcase() {
  enabled =
    window.innerWidth > 900 &&
    showcaseScroll &&
    showcase &&
    outerFrame &&
    track;

  if (!enabled) {
    if (track) {
      track.style.transform = "none";
    }

    if (outerFrame) {
      outerFrame.style.transform = "none";
      outerFrame.style.opacity = "1";
    }

    return;
  }

  maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
  scrollLength = Math.max(1, showcaseScroll.offsetHeight - window.innerHeight);

  updateShowcaseTargets();
  startShowcaseLoop();
}

function updateShowcaseTargets() {
  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  if (!enabled || !showcaseScroll) return;

  const rect = showcaseScroll.getBoundingClientRect();
  const progress = clamp(-rect.top / scrollLength, 0, 1);

  const introProgress = clamp(progress / 0.1, 0, 1);
  const horizontalProgress = clamp((progress - 0.08) / 0.72, 0, 1);
  const exitProgress = clamp((progress - 0.82) / 0.18, 0, 1);

  targetX = -maxMove * horizontalProgress;

  if (progress <= 0.1) {
    targetScale = lerp(0.92, 1, introProgress);
    targetOpacity = lerp(0.72, 1, introProgress);
  } else if (progress > 0.1 && progress < 0.82) {
    targetScale = 1;
    targetOpacity = 1;
  } else {
    targetScale = lerp(1, 0.92, exitProgress);
    targetOpacity = lerp(1, 0.72, exitProgress);
  }

  startShowcaseLoop();
}

function startShowcaseLoop() {
  if (rafRunning) return;

  rafRunning = true;
  requestAnimationFrame(animateShowcase);
}

function animateShowcase() {
  currentX = lerp(currentX, targetX, 0.12);
  currentScale = lerp(currentScale, targetScale, 0.08);
  currentOpacity = lerp(currentOpacity, targetOpacity, 0.08);

  if (track) {
    track.style.transform = `translate3d(${currentX}px, 0, 0)`;
  }

  if (outerFrame) {
    outerFrame.style.transform = `translate3d(0, 0, 0) scale(${currentScale})`;
    outerFrame.style.opacity = currentOpacity.toFixed(3);
  }

  const stillMoving =
    Math.abs(currentX - targetX) > 0.4 ||
    Math.abs(currentScale - targetScale) > 0.002 ||
    Math.abs(currentOpacity - targetOpacity) > 0.002;

  if (stillMoving) {
    requestAnimationFrame(animateShowcase);
  } else {
    rafRunning = false;
  }
}

/* ======================================================
   SPLINE HERO
====================================================== */

function setupHeroVisibility() {
  if (!heroSection || !splineHero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      const isVisible = entry.isIntersecting;

      if (isVisible) {
        splineHero.style.display = "block";
        splineHero.style.opacity = "1";
        splineHero.style.visibility = "visible";
        splineHero.style.pointerEvents = "auto";
      } else {
        splineHero.style.opacity = "0";
        splineHero.style.visibility = "hidden";
        splineHero.style.pointerEvents = "none";
        splineHero.style.display = "none";
      }
    },
    {
      threshold: 0.05,
    }
  );

  observer.observe(heroSection);
}

function setupSplineWheelPassThrough() {
  if (!heroSection) return;

  window.addEventListener(
    "wheel",
    (event) => {
      if (!heroSection.contains(event.target)) return;

      /*
        Do not prevent default.
        Do not manually scroll.
        This keeps browser scrolling smooth while stopping
        the Spline canvas from swallowing the wheel event.
      */
      event.stopImmediatePropagation();
    },
    {
      passive: true,
      capture: true,
    }
  );
}

/* ======================================================
   UTILITIES
====================================================== */

function debounce(fn, delay = 150) {
  let timer;

  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

/* ======================================================
   INIT
====================================================== */

function init() {
  measureShowcase();
  setupHeroVisibility();
  setupSplineWheelPassThrough();

  window.addEventListener("scroll", updateShowcaseTargets, { passive: true });
  window.addEventListener("resize", debounce(measureShowcase, 150));
  window.addEventListener("load", measureShowcase);
}

init();
