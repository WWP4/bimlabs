const header = document.querySelector(".site-header");
const splineHero = document.querySelector(".spline-hero");

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 40);
}

window.addEventListener("scroll", updateHeader, { passive: true });

if (splineHero) {
  splineHero.addEventListener(
    "wheel",
    (event) => {
      event.stopPropagation();

      window.scrollBy({
        top: event.deltaY,
        left: 0,
        behavior: "auto",
      });
    },
    { passive: false }
  );
}

updateHeader();

console.log("BIM Labs loaded");


const showcaseScroll = document.querySelector("#showcaseScroll");
const showcase = document.querySelector(".HomeShowcase");
const outerFrame = document.querySelector(".HomeShowcase__outerFrame");
const track = document.querySelector("#track");

let maxMove = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function updateShowcase() {
  if (!showcaseScroll || !showcase || !outerFrame || !track) return;

  const rect = showcaseScroll.getBoundingClientRect();
  const viewportH = window.innerHeight;

  const scrollLength = showcaseScroll.offsetHeight - viewportH;
  const rawProgress = -rect.top / scrollLength;
  const progress = clamp(rawProgress, 0, 1);

  const enterProgress = clamp(progress / 0.14, 0, 1);
  const exitProgress = clamp((progress - 0.82) / 0.18, 0, 1);

  maxMove = track.offsetWidth - window.innerWidth;

  const horizontalProgress = clamp((progress - 0.08) / 0.74, 0, 1);
  const x = -maxMove * horizontalProgress;

  track.style.transform = `translate3d(${x}px, 0, 0)`;

  const frameInset = lerp(0, 28, enterProgress) + lerp(0, 90, exitProgress);
  const radius = lerp(0, 13, enterProgress) + lerp(0, 22, exitProgress);
  const scale = lerp(1, 0.88, exitProgress);
  const opacity = lerp(1, 0.72, exitProgress);

  outerFrame.style.inset = `${frameInset}px`;
  outerFrame.style.borderRadius = `${radius}px`;
  outerFrame.style.transform = `scale(${scale})`;
  outerFrame.style.opacity = opacity;

  const bgFade = lerp(0, 1, exitProgress);
  showcase.style.background = `rgba(5, 5, 5, ${1 - bgFade * 0.22})`;

  requestAnimationFrame(updateShowcase);
}

function setupShowcase() {
  if (!showcaseScroll || !showcase || !outerFrame || !track) return;

  if (window.innerWidth <= 820) {
    track.style.transform = "none";
    outerFrame.style.transform = "none";
    outerFrame.style.opacity = "1";
    outerFrame.style.inset = "";
    outerFrame.style.borderRadius = "";
    return;
  }

  requestAnimationFrame(updateShowcase);
}

window.addEventListener("load", setupShowcase);
window.addEventListener("resize", setupShowcase);
