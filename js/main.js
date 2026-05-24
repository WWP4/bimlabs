const header = document.querySelector(".site-header");
const splineHero = document.querySelector(".spline-hero");

const showcaseScroll = document.querySelector("#showcaseScroll");
const showcase = document.querySelector(".HomeShowcase");
const outerFrame = document.querySelector(".HomeShowcase__outerFrame");
const track = document.querySelector("#track");

let ticking = false;
let showcaseEnabled = false;
let maxMove = 0;
let scrollLength = 1;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 40);
}

function measureShowcase() {
  if (!showcaseScroll || !showcase || !outerFrame || !track) return;

  showcaseEnabled = window.innerWidth > 820;

  if (!showcaseEnabled) {
    track.style.transform = "none";
    outerFrame.style.transform = "none";
    outerFrame.style.opacity = "1";
    outerFrame.style.inset = "";
    outerFrame.style.borderRadius = "";
    showcase.style.background = "";
    return;
  }

  maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
  scrollLength = Math.max(1, showcaseScroll.offsetHeight - window.innerHeight);

  updateShowcase();
}

function updateShowcase() {
  if (!showcaseEnabled || !showcaseScroll || !showcase || !outerFrame || !track) return;

  const rect = showcaseScroll.getBoundingClientRect();
  const progress = clamp(-rect.top / scrollLength, 0, 1);

  const enterProgress = clamp(progress / 0.14, 0, 1);
  const exitProgress = clamp((progress - 0.82) / 0.18, 0, 1);
  const horizontalProgress = clamp((progress - 0.08) / 0.74, 0, 1);

  const x = -maxMove * horizontalProgress;

  track.style.transform = `translate3d(${x}px, 0, 0)`;

  const frameInset = lerp(0, 28, enterProgress) + lerp(0, 90, exitProgress);
  const radius = lerp(0, 13, enterProgress) + lerp(0, 22, exitProgress);
  const scale = lerp(1, 0.88, exitProgress);
  const opacity = lerp(1, 0.72, exitProgress);
  const bgOpacity = 1 - lerp(0, 0.22, exitProgress);

  outerFrame.style.inset = `${frameInset}px`;
  outerFrame.style.borderRadius = `${radius}px`;
  outerFrame.style.transform = `scale(${scale})`;
  outerFrame.style.opacity = String(opacity);
  showcase.style.background = `rgba(5, 5, 5, ${bgOpacity})`;
}

function requestUpdate() {
  if (ticking) return;

  ticking = true;

  requestAnimationFrame(() => {
    updateHeader();
    updateShowcase();
    ticking = false;
  });
}

function debounce(fn, delay = 150) {
  let timer;

  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delay);
  };
}

function setupSplineScrollPassThrough() {
  if (!splineHero) return;

  splineHero.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();

      window.scrollBy({
        top: event.deltaY,
        left: 0,
        behavior: "auto",
      });
    },
    { passive: false }
  );
}

function init() {
  updateHeader();
  measureShowcase();
  setupSplineScrollPassThrough();

  window.addEventListener("scroll", requestUpdate, { passive: true });

  window.addEventListener(
    "resize",
    debounce(() => {
      measureShowcase();
      requestUpdate();
    }, 150)
  );

  window.addEventListener("load", () => {
    measureShowcase();
    requestUpdate();
  });
}

init();

console.log("BIM Labs loaded");
