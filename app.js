/* =========================================================
   BIM LABS — FIXED APP.JS
   Fixes:
   - Prevents duplicate requestAnimationFrame loops
   - Stops body data-orb-mode from being rewritten every frame
   - Smooths hero hover with requestAnimationFrame
   - Removes orb-interacting automatically when leaving hero mode
   - Reduces layout reads during orb animation
========================================================= */

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

const smoothStep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const header = document.getElementById("siteHeader");
const sections = [...document.querySelectorAll("[data-orb]")];
const revealItems = [...document.querySelectorAll(".reveal")];
const quadrantBoard = document.querySelector(".quadrant-board");
const servicesSection = document.getElementById("services");
const showcase = document.querySelector(".showcase");
const showcaseTrack = document.getElementById("showcaseTrack");
const orbStage = document.querySelector(".orb-stage");
const hero = document.querySelector(".hero");
const orb = document.querySelector(".bim-orb");

/* ---------------------------------
   shared state
--------------------------------- */

let currentOrb = {
  x: 0,
  y: 0,
  scale: 1,
  opacity: 0.95,
  rotate: 0,
  blur: 0
};

let activeOrbMode = "";
let orbLoopStarted = false;
let latestTargetOrb = null;

/* ---------------------------------
   helpers
--------------------------------- */

function setOrbMode(mode) {
  if (!mode || activeOrbMode === mode) return;

  activeOrbMode = mode;
  document.body.dataset.orbMode = mode;

  if (mode !== "hero") {
    document.body.classList.remove("orb-interacting");

    if (orb) {
      orb.style.setProperty("--orb-tilt-x", "0deg");
      orb.style.setProperty("--orb-tilt-y", "0deg");
    }
  }
}

function updateHeader() {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function updateShowcase() {
  if (!showcase || !showcaseTrack || window.innerWidth < 981) return;

  const rect = showcase.getBoundingClientRect();
  const total = showcase.offsetHeight - window.innerHeight;
  const progress = clamp((-rect.top) / Math.max(total, 1), 0, 1);
  const maxTranslate =
    showcaseTrack.scrollWidth - window.innerWidth + window.innerWidth * 0.12;

  showcaseTrack.style.transform = `translate3d(${-maxTranslate * progress}px, 0, 0)`;
}

function getElementCenterOffset(element) {
  if (!element) return { x: 0, y: 0 };

  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2 - window.innerWidth / 2,
    y: rect.top + rect.height / 2 - window.innerHeight / 2
  };
}

function mixStates(a, b, progress) {
  return {
    x: lerp(a.x, b.x, progress),
    y: lerp(a.y, b.y, progress),
    scale: lerp(a.scale, b.scale, progress),
    opacity: lerp(a.opacity, b.opacity, progress),
    rotate: lerp(a.rotate, b.rotate, progress),
    blur: lerp(a.blur, b.blur, progress)
  };
}

function getSectionProgress(section, startOffset = 0, endOffset = 0) {
  if (!section) return 0;

  const start = section.offsetTop - window.innerHeight * startOffset;
  const end = section.offsetTop + section.offsetHeight - window.innerHeight * endOffset;

  return smoothStep(
    clamp((window.scrollY - start) / Math.max(end - start, 1), 0, 1)
  );
}

function getActiveMode() {
  const center = window.scrollY + window.innerHeight * 0.5;
  let active = sections[0]?.dataset.orb || "hero";

  for (const section of sections) {
    const top = section.offsetTop;
    const bottom = top + section.offsetHeight;

    if (center >= top && center < bottom) {
      active = section.dataset.orb;
      break;
    }
  }

  return active;
}

/* ---------------------------------
   orb states
--------------------------------- */

function getHeroState() {
  const isMobile = window.innerWidth < 781;

  return {
    x: 0,
    y: -window.innerHeight * 0.02,
    scale: isMobile ? 0.94 : 1,
    opacity: isMobile ? 0.5 : 0.95,
    rotate: 0,
    blur: 0
  };
}

function getGridState() {
  const isMobile = window.innerWidth < 781;
  const center = getElementCenterOffset(quadrantBoard);
  const innerProgress = getSectionProgress(servicesSection, -0.05, 0.55);

  return {
    x: center.x,
    y: center.y,
    scale: lerp(isMobile ? 0.8 : 0.58, isMobile ? 0.62 : 0.4, innerProgress),
    opacity: lerp(isMobile ? 0.34 : 0.62, isMobile ? 0.26 : 0.46, innerProgress),
    rotate: lerp(12, 84, innerProgress),
    blur: 0
  };
}

function getShowcaseState() {
  const isMobile = window.innerWidth < 781;

  return {
    x: -window.innerWidth * 0.32,
    y: -window.innerHeight * 0.01,
    scale: isMobile ? 0.72 : 0.56,
    opacity: isMobile ? 0.2 : 0.42,
    rotate: 145,
    blur: 0
  };
}

function getSupportState() {
  const isMobile = window.innerWidth < 781;

  return {
    x: window.innerWidth * 0.28,
    y: window.innerHeight * 0.01,
    scale: isMobile ? 0.72 : 0.58,
    opacity: isMobile ? 0.18 : 0.38,
    rotate: 220,
    blur: 0
  };
}

function getProcessState() {
  const isMobile = window.innerWidth < 781;

  return {
    x: 0,
    y: -window.innerHeight * 0.24,
    scale: isMobile ? 0.68 : 0.46,
    opacity: isMobile ? 0.16 : 0.34,
    rotate: 300,
    blur: 0
  };
}

function getCtaState() {
  const isMobile = window.innerWidth < 781;

  return {
    x: 0,
    y: -window.innerHeight * 0.02,
    scale: isMobile ? 0.86 : 1.02,
    opacity: isMobile ? 0.12 : 0.22,
    rotate: 360,
    blur: 1
  };
}

function getTargetOrbState() {
  const heroState = getHeroState();

  /*
    Only calculate the grid target while we are close to the services section.
    This avoids unnecessary getBoundingClientRect reads on every frame.
  */
  if (servicesSection) {
    const transitionStart = servicesSection.offsetTop - window.innerHeight * 0.92;
    const transitionEnd = servicesSection.offsetTop + window.innerHeight * 0.14;

    const rawProgress =
      (window.scrollY - transitionStart) /
      Math.max(transitionEnd - transitionStart, 1);

    const transitionProgress = smoothStep(clamp(rawProgress, 0, 1));

    if (transitionProgress > 0 && transitionProgress < 1) {
      const gridState = getGridState();
      setOrbMode("hero-to-grid");
      return mixStates(heroState, gridState, transitionProgress);
    }
  }

  const activeMode = getActiveMode();
  setOrbMode(activeMode);

  if (activeMode === "grid") return getGridState();
  if (activeMode === "showcase") return getShowcaseState();
  if (activeMode === "support") return getSupportState();
  if (activeMode === "process") return getProcessState();
  if (activeMode === "cta") return getCtaState();

  return heroState;
}

function applyOrbState(state) {
  if (!orbStage) return;

  orbStage.style.setProperty("--orb-x", `${state.x.toFixed(2)}px`);
  orbStage.style.setProperty("--orb-y", `${state.y.toFixed(2)}px`);
  orbStage.style.setProperty("--orb-scale", state.scale.toFixed(4));
  orbStage.style.setProperty("--orb-opacity", state.opacity.toFixed(4));
  orbStage.style.setProperty("--orb-rotate", `${state.rotate.toFixed(2)}deg`);
  orbStage.style.setProperty("--orb-blur", `${state.blur.toFixed(2)}px`);
}

function updateServicesLines() {
  if (!quadrantBoard || !servicesSection) return;

  const start = servicesSection.offsetTop - window.innerHeight * 0.45;
  const end = servicesSection.offsetTop + window.innerHeight * 0.55;

  const progress = smoothStep(
    clamp((window.scrollY - start) / Math.max(end - start, 1), 0, 1)
  );

  quadrantBoard.style.setProperty("--services-progress", progress.toFixed(4));
}

function animateOrb() {
  latestTargetOrb = getTargetOrbState();

  /*
    Lower = smoother/slower.
    This value keeps the orb cinematic without feeling delayed.
  */
  const followSpeed = 0.075;

  currentOrb = {
    x: lerp(currentOrb.x, latestTargetOrb.x, followSpeed),
    y: lerp(currentOrb.y, latestTargetOrb.y, followSpeed),
    scale: lerp(currentOrb.scale, latestTargetOrb.scale, followSpeed),
    opacity: lerp(currentOrb.opacity, latestTargetOrb.opacity, followSpeed),
    rotate: lerp(currentOrb.rotate, latestTargetOrb.rotate, followSpeed),
    blur: lerp(currentOrb.blur, latestTargetOrb.blur, followSpeed)
  };

  applyOrbState(currentOrb);
  updateServicesLines();

  requestAnimationFrame(animateOrb);
}

function startOrbLoop() {
  if (orbLoopStarted) return;
  orbLoopStarted = true;

  currentOrb = getTargetOrbState();
  applyOrbState(currentOrb);
  requestAnimationFrame(animateOrb);
}

/* ---------------------------------
   reveal observer
--------------------------------- */

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    }
  }, { threshold: 0.18 });

  revealItems.forEach((item) => revealObserver.observe(item));

  if (quadrantBoard) {
    const boardObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          entry.target.dataset.ready = "true";
        }
      }
    }, { threshold: 0.2 });

    boardObserver.observe(quadrantBoard);
  }
} else {
  revealItems.forEach((item) => item.classList.add("in-view"));
  if (quadrantBoard) quadrantBoard.classList.add("in-view");
}

/* ---------------------------------
   button hover
--------------------------------- */

for (const btn of document.querySelectorAll(".btn")) {
  btn.addEventListener("pointermove", (event) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    btn.style.setProperty("--my", `${event.clientY - rect.top}px`);
  }, { passive: true });
}

/* ---------------------------------
   stable hero-only orb hover
--------------------------------- */

if (hero && orb) {
  let hoverRafId = null;
  let leaveTimer = null;

  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  function renderOrbHover() {
    hoverRafId = null;

    currentTiltX = lerp(currentTiltX, targetTiltX, 0.14);
    currentTiltY = lerp(currentTiltY, targetTiltY, 0.14);

    orb.style.setProperty("--orb-tilt-x", `${(currentTiltX * 5).toFixed(3)}deg`);
    orb.style.setProperty("--orb-tilt-y", `${(currentTiltY * -5).toFixed(3)}deg`);

    if (
      Math.abs(currentTiltX - targetTiltX) > 0.001 ||
      Math.abs(currentTiltY - targetTiltY) > 0.001
    ) {
      hoverRafId = requestAnimationFrame(renderOrbHover);
    }
  }

  function requestHoverRender() {
    if (!hoverRafId) hoverRafId = requestAnimationFrame(renderOrbHover);
  }

  hero.addEventListener("pointermove", (event) => {
    if (document.body.dataset.orbMode !== "hero") return;

    clearTimeout(leaveTimer);

    const rect = hero.getBoundingClientRect();

    targetTiltX = (event.clientX - rect.left) / rect.width - 0.5;
    targetTiltY = (event.clientY - rect.top) / rect.height - 0.5;

    document.body.classList.add("orb-interacting");
    requestHoverRender();
  }, { passive: true });

  hero.addEventListener("pointerleave", () => {
    targetTiltX = 0;
    targetTiltY = 0;
    requestHoverRender();

    leaveTimer = setTimeout(() => {
      document.body.classList.remove("orb-interacting");
      orb.style.setProperty("--orb-tilt-x", "0deg");
      orb.style.setProperty("--orb-tilt-y", "0deg");
    }, 180);
  }, { passive: true });
}

/* ---------------------------------
   events
--------------------------------- */

let scrollRafId = null;

function onScrollOrResize() {
  if (scrollRafId) return;

  scrollRafId = requestAnimationFrame(() => {
    scrollRafId = null;
    updateHeader();
    updateShowcase();
    updateServicesLines();
  });
}

window.addEventListener("scroll", onScrollOrResize, { passive: true });
window.addEventListener("resize", onScrollOrResize);

window.addEventListener("load", () => {
  updateHeader();
  updateShowcase();
  updateServicesLines();
  startOrbLoop();
});

updateHeader();
updateShowcase();
updateServicesLines();
startOrbLoop();
