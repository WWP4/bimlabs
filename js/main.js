const header = document.querySelector(".site-header");
const showcaseScroll = document.querySelector("#showcaseScroll");
const showcase = document.querySelector(".HomeShowcase");
const outerFrame = document.querySelector(".HomeShowcase__outerFrame");
const track = document.querySelector("#track");

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

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

/* ======================================================
   HORIZONTAL SHOWCASE
====================================================== */

function measure() {
  enabled =
    window.innerWidth > 900 &&
    showcaseScroll &&
    showcase &&
    outerFrame &&
    track;

  if (!enabled) {
    if (track) track.style.transform = "none";

    if (outerFrame) {
      outerFrame.style.transform = "none";
      outerFrame.style.opacity = "1";
    }

    return;
  }

  maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
  scrollLength = Math.max(1, showcaseScroll.offsetHeight - window.innerHeight);

  updateTargets();
  startLoop();
}

function updateTargets() {
  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  if (!enabled) return;

  const rect = showcaseScroll.getBoundingClientRect();
  const progress = clamp(-rect.top / scrollLength, 0, 1);

  /*
    0.00 → 0.10 = scale into fullscreen
    0.10 → 0.82 = full horizontal section
    0.82 → 1.00 = scale back out
  */

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

  startLoop();
}

function startLoop() {
  if (rafRunning) return;

  rafRunning = true;
  requestAnimationFrame(animate);
}

function animate() {
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
    requestAnimationFrame(animate);
  } else {
    rafRunning = false;
  }
}

function debounce(fn, delay = 150) {
  let timer;

  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

/* ======================================================
   SPLINE HERO
====================================================== */

const heroSection = document.querySelector(".hero");
const splineHero = document.querySelector(".spline-hero");

function setupHeroVisibility() {
  if (!heroSection || !splineHero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
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

function setupSplineScrollPassThrough() {
  if (!heroSection) return;

  window.addEventListener(
    "wheel",
    (e) => {
      if (!heroSection.contains(e.target)) return;
      if (e.ctrlKey) return;

      window.scrollBy({
        top: e.deltaY,
        left: 0,
        behavior: "auto",
      });

      e.preventDefault();
    },
    {
      passive: false,
      capture: true,
    }
  );
}

/* ======================================================
   INIT
====================================================== */

function init() {
  measure();
  setupHeroVisibility();
  setupSplineScrollPassThrough();

  window.addEventListener("scroll", updateTargets, { passive: true });
  window.addEventListener("resize", debounce(measure, 150));
  window.addEventListener("load", measure);
}

init();
