const header = document.querySelector(".site-header");
const splineHero = document.querySelector(".spline-hero");
const particleCanvas = document.querySelector("#particle-whisp-canvas");
const heroContent = document.querySelector(".hero-content");
const heroActions = document.querySelector(".hero-actions");
const portalChapter = document.querySelector(".portal-chapter");

let headerTicking = false;
let portalTicking = false;

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

/* HEADER */

function updateHeader() {
  if (!header) return;

  if (window.scrollY > 40) {
    header.classList.add("is-scrolled");
  } else {
    header.classList.remove("is-scrolled");
  }

  headerTicking = false;
}

window.addEventListener("scroll", () => {
  if (!headerTicking) {
    window.requestAnimationFrame(updateHeader);
    headerTicking = true;
  }
}, { passive: true });

/* SPLINE LAZY LOAD */

const lazySplines = document.querySelectorAll(".lazy-spline");

if (lazySplines.length) {
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
}

/* PREVENT SPLINE FROM BLOCKING SCROLL */

if (splineHero) {
  splineHero.addEventListener("wheel", (event) => {
    event.stopPropagation();

    window.scrollBy({
      top: event.deltaY,
      left: 0,
      behavior: "auto"
    });
  }, { passive: false });
}

/* PORTAL ZOOM SYSTEM */

function updatePortalTransition() {
  const vh = window.innerHeight || 1;
  const scrollY = window.scrollY || 0;

  const progress = clamp(scrollY / (vh * 0.95), 0, 1);

  const splineScale = 1.15 + progress * 3.6;
  const particleScale = 1 + progress * 3;

  const splineOpacity = 0.94 - progress * 0.55;
  const particleOpacity = 0.9 - progress * 0.65;

  const splineBlur = progress * 10;
  const particleBlur = progress * 4;

  const textOpacity = clamp(1 - progress * 1.45, 0, 1);

  if (splineHero) {
    splineHero.style.transform = `scale(${splineScale})`;
    splineHero.style.opacity = splineOpacity.toFixed(3);
    splineHero.style.filter = `blur(${splineBlur}px)`;
  }

  if (particleCanvas) {
    particleCanvas.style.transform = `scale(${particleScale})`;
    particleCanvas.style.opacity = particleOpacity.toFixed(3);
    particleCanvas.style.filter = `blur(${particleBlur}px)`;
  }

  if (heroContent) {
    heroContent.style.opacity = textOpacity.toFixed(3);
    heroContent.style.transform =
      `translateX(-50%) translateY(${-progress * 90}px)`;
  }

  if (heroActions) {
    heroActions.style.opacity = textOpacity.toFixed(3);
    heroActions.style.transform =
      `translateY(${progress * 40}px)`;
  }

  if (portalChapter) {
    const chapterIn = clamp((progress - 0.58) / 0.32, 0, 1);

    portalChapter.style.opacity = chapterIn.toFixed(3);
    portalChapter.style.transform =
      `translateY(${80 - chapterIn * 80}px) scale(${0.96 + chapterIn * 0.04})`;
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

window.addEventListener("resize", updatePortalTransition);

updateHeader();
updatePortalTransition();

console.log("BIM Labs loaded");
