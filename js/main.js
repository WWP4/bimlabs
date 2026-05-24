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

let showcaseProgress = 0;
let isInsideShowcase = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function renderShowcase() {
  if (!track || !outerFrame || !showcase) return;

  const maxMove = track.offsetWidth - window.innerWidth;
  const horizontalProgress = clamp((showcaseProgress - 0.08) / 0.74, 0, 1);
  const x = -maxMove * horizontalProgress;

  track.style.transform = `translate3d(${x}px, 0, 0)`;

  const enterProgress = clamp(showcaseProgress / 0.14, 0, 1);
  const exitProgress = clamp((showcaseProgress - 0.82) / 0.18, 0, 1);

  const frameInset = lerp(0, 28, enterProgress) + lerp(0, 90, exitProgress);
  const radius = lerp(0, 13, enterProgress) + lerp(0, 22, exitProgress);
  const scale = lerp(1, 0.88, exitProgress);
  const opacity = lerp(1, 0.72, exitProgress);

  outerFrame.style.inset = `${frameInset}px`;
  outerFrame.style.borderRadius = `${radius}px`;
  outerFrame.style.transform = `scale(${scale})`;
  outerFrame.style.opacity = opacity;
}

function checkShowcasePosition() {
  if (!showcaseScroll) return;

  const rect = showcaseScroll.getBoundingClientRect();

  isInsideShowcase =
    rect.top <= 0 &&
    rect.bottom >= window.innerHeight &&
    window.innerWidth > 820;
}

function lockShowcaseWheel(event) {
  if (!isInsideShowcase) return;

  const goingDown = event.deltaY > 0;
  const goingUp = event.deltaY < 0;

  const canMoveForward = goingDown && showcaseProgress < 1;
  const canMoveBackward = goingUp && showcaseProgress > 0;

  if (canMoveForward || canMoveBackward) {
    event.preventDefault();

    showcaseProgress += event.deltaY * 0.00055;
    showcaseProgress = clamp(showcaseProgress, 0, 1);

    renderShowcase();
  }
}

function syncProgressToScroll() {
  if (!showcaseScroll || window.innerWidth <= 820) return;

  const rect = showcaseScroll.getBoundingClientRect();
  const scrollLength = showcaseScroll.offsetHeight - window.innerHeight;
  const scrollProgress = clamp(-rect.top / scrollLength, 0, 1);

  if (!isInsideShowcase) {
    showcaseProgress = scrollProgress;
    renderShowcase();
  }

  checkShowcasePosition();
}

window.addEventListener("scroll", syncProgressToScroll, { passive: true });
window.addEventListener("wheel", lockShowcaseWheel, { passive: false });
window.addEventListener("resize", renderShowcase);
window.addEventListener("load", () => {
  syncProgressToScroll();
  renderShowcase();
});
