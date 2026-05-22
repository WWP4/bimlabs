const header = document.querySelector(".site-header");

let ticking = false;

function updateHeader() {
  if (window.scrollY > 40) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }

  ticking = false;
}

window.addEventListener("scroll", () => {
  if (!ticking) {
    window.requestAnimationFrame(updateHeader);
    ticking = true;
  }
}, { passive: true });

/* SPLINE LAZY LOAD */

const lazySplines = document.querySelectorAll(".lazy-spline");

const splineObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    const spline = entry.target;
    const url = spline.dataset.url;

    if (url && !spline.getAttribute("url")) {
      spline.setAttribute("url", url);
    }

    splineObserver.unobserve(spline);
  });
}, {
  rootMargin: "500px 0px"
});

lazySplines.forEach((spline) => splineObserver.observe(spline));

console.log("BIM Labs loaded");

/* PREVENT SPLINE FROM EATING SCROLL */

const splineHero = document.querySelector(".spline-hero");

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

/* PORTAL ZOOM SYSTEM */

const particleCanvas = document.querySelector("#particle-whisp-canvas");
const heroContent = document.querySelector(".hero-content");
const heroActions = document.querySelector(".hero-actions");

let portalTicking = false;

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function updatePortalTransition() {
  const vh = window.innerHeight || 1;

  const progress = clamp(
    window.scrollY / (vh * 0.95),
    0,
    1
  );

  const splineScale = 1.15 + progress * 3.6;
  const particleScale = 1 + progress * 3;

  const blurAmount = progress * 10;
  const particleBlur = progress * 4;

  const textOpacity = clamp(
    1 - progress * 1.45,
    0,
    1
  );

  if (splineHero) {
    splineHero.style.transform = `scale(${splineScale})`;

    splineHero.style.opacity =
      `${0.94 - progress * 0.55}`;

    splineHero.style.filter =
      `blur(${blurAmount}px)`;
  }

  if (particleCanvas) {
    particleCanvas.style.transform =
      `scale(${particleScale})`;

    particleCanvas.style.opacity =
      `${0.9 - progress * 0.65}`;

    particleCanvas.style.filter =
      `blur(${particleBlur}px)`;
  }

  if (heroContent) {
    heroContent.style.opacity = textOpacity;

    heroContent.style.transform =
      `translateX(-50%) translateY(${-progress * 90}px)`;
  }

  if (heroActions) {
    heroActions.style.opacity = textOpacity;

    heroActions.style.transform =
      `translateY(${progress * 40}px)`;
  }

  document.documentElement.style.setProperty(
    "--portal-progress",
    progress.toFixed(4)
  );

  portalTicking = false;
}

window.addEventListener("scroll", () => {
  if (!portalTicking) {
    window.requestAnimationFrame(updatePortalTransition);
    portalTicking = true;
  }
}, { passive: true });

window.addEventListener(
  "resize",
  updatePortalTransition
);

updatePortalTransition();
