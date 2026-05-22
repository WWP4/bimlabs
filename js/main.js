const header = document.querySelector(".site-header");
const splineHero = document.querySelector(".spline-hero");
const particleCanvas = document.querySelector("#particle-whisp-canvas");
const heroContent = document.querySelector(".hero-content");
const heroActions = document.querySelector(".hero-actions");
const portalChapter = document.querySelector(".portal-chapter");

let targetProgress = 0;
let currentProgress = 0;
let targetMouseX = 0;
let targetMouseY = 0;
let mouseX = 0;
let mouseY = 0;
let ticking = false;

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

/* HEADER */

function updateHeader() {
  if (!header) return;

  if (window.scrollY > 40) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }
}

/* PREVENT SPLINE FROM BLOCKING SCROLL */

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

/* SUBTLE MOUSE DRIFT */

window.addEventListener(
  "pointermove",
  (event) => {
    const x = event.clientX / window.innerWidth - 0.5;
    const y = event.clientY / window.innerHeight - 0.5;

    targetMouseX = x;
    targetMouseY = y;
  },
  { passive: true }
);

/* CINEMATIC SCROLL SYSTEM */

function calculateTargetProgress() {
  const vh = window.innerHeight || 1;
  const scrollY = window.scrollY || 0;

  targetProgress = clamp(scrollY / (vh * 1.25), 0, 1);
}

function render() {
  currentProgress = lerp(currentProgress, targetProgress, 0.075);
  mouseX = lerp(mouseX, targetMouseX, 0.04);
  mouseY = lerp(mouseY, targetMouseY, 0.04);

  const progress = currentProgress;
  const eased = easeOutCubic(progress);
  const soft = easeInOutCubic(progress);

  const heroOut = clamp(progress / 0.62, 0, 1);
  const heroOutEased = easeOutCubic(heroOut);

  const chapterIn = clamp((progress - 0.48) / 0.42, 0, 1);
  const chapterEased = easeOutCubic(chapterIn);

  const driftX = mouseX * 18;
  const driftY = mouseY * 14;

  if (splineHero) {
    const splineScale = 1.08 + eased * 7.5;
    const splineOpacity = 0.96 - soft * 0.08;
    const splineBlur = soft * 0.8;

    splineHero.style.transform = `
      translate3d(${driftX}px, ${driftY}px, 0)
      scale(${splineScale})
    `;

    splineHero.style.opacity = splineOpacity.toFixed(3);
    splineHero.style.filter = `blur(${splineBlur}px) saturate(${1.02 + soft * 0.08})`;
  }

  if (particleCanvas) {
    const particleScale = 1 + eased * 0.72;
    const particleOpacity = 0.42 - soft * 0.2;
    const particleBlur = soft * 1.5;

    particleCanvas.style.transform = `
      translate3d(${-driftX * 0.45}px, ${-driftY * 0.45}px, 0)
      scale(${particleScale})
    `;

    particleCanvas.style.opacity = particleOpacity.toFixed(3);
    particleCanvas.style.filter = `blur(${particleBlur}px)`;
  }

  if (heroContent) {
    heroContent.style.opacity = (1 - heroOutEased).toFixed(3);
    heroContent.style.transform = `
      translateX(-50%)
      translateY(${-heroOutEased * 52}px)
      scale(${1 - heroOutEased * 0.025})
    `;
  }

  if (heroActions) {
    heroActions.style.opacity = (1 - heroOutEased).toFixed(3);
    heroActions.style.transform = `
      translateY(${heroOutEased * 28}px)
      scale(${1 - heroOutEased * 0.02})
    `;
  }

  if (portalChapter) {
    portalChapter.style.opacity = chapterEased.toFixed(3);
    portalChapter.style.transform = `
      translateY(${70 - chapterEased * 70}px)
      scale(${0.965 + chapterEased * 0.035})
    `;
  }

  document.documentElement.style.setProperty(
    "--portal-progress",
    progress.toFixed(4)
  );

  ticking = false;

  requestAnimationFrame(render);
}

function onScroll() {
  calculateTargetProgress();
  updateHeader();

  if (!ticking) {
    ticking = true;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", calculateTargetProgress);

calculateTargetProgress();
updateHeader();
requestAnimationFrame(render);

console.log("BIM Labs cinematic scroll loaded");
