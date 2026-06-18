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
  if (!enabled) return;

  const rect = showcaseScroll.getBoundingClientRect();
  const progress = clamp(-rect.top / scrollLength, 0, 1);

  /*
    TIMING MAP

    0.00 → 0.10 = scale into fullscreen
    0.10 → 0.82 = full cinematic horizontal section
    0.82 → 1.00 = scale back out
  */

  const introProgress = clamp(progress / 0.10, 0, 1);
  const horizontalProgress = clamp((progress - 0.08) / 0.72, 0, 1);
  const exitProgress = clamp((progress - 0.82) / 0.18, 0, 1);

  targetX = -maxMove * horizontalProgress;

  // ENTRY
  if (progress <= 0.10) {
    targetScale = lerp(0.92, 1, introProgress);
    targetOpacity = lerp(0.72, 1, introProgress);
  }

  // MIDDLE
  else if (progress > 0.10 && progress < 0.82) {
    targetScale = 1;
    targetOpacity = 1;
  }

  // EXIT
  else {
    targetScale = lerp(1, 0.92, exitProgress);
    targetOpacity = lerp(1, 0.72, exitProgress);
  }

  if (header) {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
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
    outerFrame.style.transform = `translate3d(0,0,0) scale(${currentScale})`;
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

function init() {
  measure();

  window.addEventListener("scroll", updateTargets, { passive: true });
  window.addEventListener("resize", debounce(measure, 150));
  window.addEventListener("load", measure);
}

init();



const hero = document.querySelector(".hero");
const splineHero = document.querySelector(".spline-hero");

function setupHeroVisibility() {
  if (!hero || !splineHero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      const visible = entry.isIntersecting;

      if (visible) {
        splineHero.style.display = "block";
        splineHero.style.opacity = "1";
        splineHero.style.visibility = "visible";

        // IMPORTANT: keep this none so scrolling works over Spline
        splineHero.style.pointerEvents = "none";
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

  observer.observe(hero);
}

setupHeroVisibility();
