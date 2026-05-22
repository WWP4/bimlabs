const header = document.querySelector(".site-header");
const splineHero = document.querySelector(".spline-hero");
const particleCanvas = document.querySelector("#particle-whisp-canvas");
const heroContent = document.querySelector(".hero-content");
const heroActions = document.querySelector(".hero-actions");
const portalChapter = document.querySelector(".portal-chapter");

let targetProgress = 0;
let currentProgress = 0;

let mouseTargetX = 0;
let mouseTargetY = 0;
let mouseX = 0;
let mouseY = 0;

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutCubic(t) {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* HEADER */

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 40);
}

/* SPLINE SCROLL FIX */

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

/* SUBTLE CAMERA DRIFT */

window.addEventListener(
  "pointermove",
  (event) => {
    mouseTargetX = event.clientX / window.innerWidth - 0.5;
    mouseTargetY = event.clientY / window.innerHeight - 0.5;
  },
  { passive: true }
);

/* PORTAL PARTICLE FIELD */

let ctx;
let particles = [];
let width = 0;
let height = 0;
let dpr = 1;

function setupParticles() {
  if (!particleCanvas) return;

  ctx = particleCanvas.getContext("2d", { alpha: true });

  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;

  particleCanvas.width = Math.floor(width * dpr);
  particleCanvas.height = Math.floor(height * dpr);
  particleCanvas.style.width = `${width}px`;
  particleCanvas.style.height = `${height}px`;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(220, Math.floor((width * height) / 7500));

  particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random();

    return {
      angle,
      radius,
      speed: 0.15 + Math.random() * 0.5,
      size: 0.45 + Math.random() * 1.35,
      alpha: 0.12 + Math.random() * 0.5,
      spin: Math.random() > 0.5 ? 1 : -1,
    };
  });
}

function drawPortalParticles(progress) {
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const portalStart = clamp((progress - 0.18) / 0.74, 0, 1);
  const tunnel = easeInOutCubic(portalStart);

  const cx = width * 0.5 + mouseX * 34;
  const cy = height * 0.48 + mouseY * 24;

  const baseRadius = Math.min(width, height) * (0.08 + tunnel * 0.42);
  const pull = 1 + tunnel * 5.5;
  const swirl = tunnel * 2.8;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  particles.forEach((p) => {
    p.angle += 0.002 * p.spin + tunnel * 0.006 * p.speed;

    const depth = Math.pow(p.radius, 1.9);
    const distance = baseRadius + depth * Math.max(width, height) * 0.72 / pull;

    const x = cx + Math.cos(p.angle + swirl * depth) * distance;
    const y = cy + Math.sin(p.angle + swirl * depth) * distance * 0.62;

    const stretch = 1 + tunnel * 18 * (1 - depth);
    const alpha = p.alpha * (0.12 + tunnel * 0.88);
    const size = p.size * (1 + tunnel * 1.7);

    ctx.translate(x, y);
    ctx.rotate(p.angle + Math.PI / 2);

    const gradient = ctx.createLinearGradient(0, -stretch, 0, stretch);
    gradient.addColorStop(0, `rgba(255,255,255,0)`);
    gradient.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
    gradient.addColorStop(1, `rgba(255,255,255,0)`);

    ctx.fillStyle = gradient;
    ctx.fillRect(-size * 0.35, -stretch, size * 0.7, stretch * 2);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  });

  ctx.restore();

  const vignette = ctx.createRadialGradient(
    cx,
    cy,
    Math.min(width, height) * (0.04 + tunnel * 0.08),
    cx,
    cy,
    Math.max(width, height) * (0.18 + tunnel * 0.55)
  );

  vignette.addColorStop(0, `rgba(255,255,255,${0.04 * tunnel})`);
  vignette.addColorStop(0.34, `rgba(255,255,255,${0.015 * tunnel})`);
  vignette.addColorStop(0.72, `rgba(3,3,5,${0.12 + tunnel * 0.32})`);
  vignette.addColorStop(1, `rgba(3,3,5,${0.82})`);

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);
}

/* CINEMATIC PORTAL */

function calculateProgress() {
  const vh = window.innerHeight || 1;
  const scrollY = window.scrollY || 0;

  targetProgress = clamp(scrollY / (vh * 1.35), 0, 1);
}

function render() {
  currentProgress = lerp(currentProgress, targetProgress, 0.072);

  mouseX = lerp(mouseX, mouseTargetX, 0.035);
  mouseY = lerp(mouseY, mouseTargetY, 0.035);

  const progress = currentProgress;
  const eased = easeOutCubic(progress);
  const soft = easeInOutCubic(progress);

  const enterOrb = clamp(progress / 0.64, 0, 1);
  const tunnelTakeover = clamp((progress - 0.52) / 0.34, 0, 1);
  const textOut = clamp(progress / 0.42, 0, 1);
  const chapterIn = clamp((progress - 0.68) / 0.26, 0, 1);

  const enterEased = easeOutCubic(enterOrb);
  const tunnelEased = easeInOutCubic(tunnelTakeover);
  const textEased = easeOutCubic(textOut);
  const chapterEased = easeOutCubic(chapterIn);

  const driftX = mouseX * (14 - tunnelEased * 10);
  const driftY = mouseY * (10 - tunnelEased * 7);

  if (splineHero) {
    /*
      Important:
      This does NOT over-zoom the embedded Spline.
      The Spline stays crisp, then the coded tunnel takes over.
    */
    const splineScale = 1.06 + enterEased * 1.42;
    const splineOpacity = 0.98 - tunnelEased * 0.78;
    const splineBlur = soft * 0.75 + tunnelEased * 1.2;
    const splineBrightness = 1.04 - tunnelEased * 0.18;

    splineHero.style.transform = `
      translate3d(${driftX}px, ${driftY}px, 0)
      scale(${splineScale})
    `;

    splineHero.style.opacity = splineOpacity.toFixed(3);
    splineHero.style.filter = `
      blur(${splineBlur}px)
      brightness(${splineBrightness})
      saturate(${1.06 + soft * 0.08})
    `;
  }

  if (particleCanvas) {
    particleCanvas.style.opacity = (0.18 + tunnelEased * 0.82).toFixed(3);
    particleCanvas.style.transform = `
      translate3d(${-driftX * 0.4}px, ${-driftY * 0.4}px, 0)
      scale(${1 + tunnelEased * 0.16})
    `;

    drawPortalParticles(progress);
  }

  if (heroContent) {
    heroContent.style.opacity = (1 - textEased).toFixed(3);
    heroContent.style.transform = `
      translateX(-50%)
      translateY(${-textEased * 64}px)
      scale(${1 - textEased * 0.035})
    `;
  }

  if (heroActions) {
    heroActions.style.opacity = (1 - textEased).toFixed(3);
    heroActions.style.transform = `
      translateY(${textEased * 34}px)
      scale(${1 - textEased * 0.025})
    `;
  }

  if (portalChapter) {
    portalChapter.style.opacity = chapterEased.toFixed(3);
    portalChapter.style.transform = `
      translateY(${90 - chapterEased * 90}px)
      scale(${0.955 + chapterEased * 0.045})
    `;
  }

  document.documentElement.style.setProperty(
    "--portal-progress",
    progress.toFixed(4)
  );

  requestAnimationFrame(render);
}

window.addEventListener(
  "scroll",
  () => {
    calculateProgress();
    updateHeader();
  },
  { passive: true }
);

window.addEventListener("resize", () => {
  setupParticles();
  calculateProgress();
});

setupParticles();
calculateProgress();
updateHeader();
requestAnimationFrame(render);

console.log("BIM Labs portal transition loaded");
