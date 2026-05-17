const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

const smoothStep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const header = document.getElementById('siteHeader');
const sections = [...document.querySelectorAll('[data-orb]')];
const revealItems = [...document.querySelectorAll('.reveal')];
const quadrantBoard = document.querySelector('.quadrant-board');
const showcase = document.querySelector('.showcase');
const showcaseTrack = document.getElementById('showcaseTrack');
const orbStage = document.querySelector('.orb-stage');

function updateHeader() {
  if (!header) return;
  header.classList.toggle('is-scrolled', window.scrollY > 24);
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

/* =========================
   REVEALS
========================= */

const revealObserver = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  }
}, { threshold: 0.18 });

revealItems.forEach((item) => revealObserver.observe(item));

if (quadrantBoard) {
  const boardObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        entry.target.dataset.ready = 'true';
      }
    }
  }, { threshold: 0.36 });

  boardObserver.observe(quadrantBoard);
}

/* =========================
   BUTTON HOVER
========================= */

for (const btn of document.querySelectorAll('.btn')) {
  btn.addEventListener('pointermove', (event) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    btn.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

/* =========================
   SMOOTH GLOBAL ORB SYSTEM
========================= */

let currentOrb = {
  x: 0,
  y: 0,
  scale: 1,
  opacity: 0.95,
  rotate: 0,
  blur: 0
};

function getElementCenterOffset(element) {
  if (!element) {
    return { x: 0, y: 0 };
  }

  const rect = element.getBoundingClientRect();

  return {
    x: rect.left + rect.width / 2 - window.innerWidth / 2,
    y: rect.top + rect.height / 2 - window.innerHeight / 2
  };
}

function getOrbStateForMode(mode) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const isMobile = vw < 781;

  if (mode === 'grid') {
    const boardCenter = getElementCenterOffset(quadrantBoard);

    return {
      x: boardCenter.x,
      y: boardCenter.y,
      scale: isMobile ? 0.86 : 0.54,
      opacity: isMobile ? 0.34 : 0.58,
      rotate: 82,
      blur: 0
    };
  }

  if (mode === 'showcase') {
    return {
      x: -vw * 0.32,
      y: -vh * 0.01,
      scale: isMobile ? 0.74 : 0.58,
      opacity: isMobile ? 0.24 : 0.5,
      rotate: 145,
      blur: 0
    };
  }

  if (mode === 'support') {
    return {
      x: vw * 0.3,
      y: vh * 0.01,
      scale: isMobile ? 0.72 : 0.62,
      opacity: isMobile ? 0.22 : 0.48,
      rotate: 220,
      blur: 0
    };
  }

  if (mode === 'process') {
    return {
      x: 0,
      y: -vh * 0.26,
      scale: isMobile ? 0.72 : 0.48,
      opacity: isMobile ? 0.2 : 0.42,
      rotate: 300,
      blur: 0
    };
  }

  if (mode === 'cta') {
    return {
      x: 0,
      y: -vh * 0.02,
      scale: isMobile ? 0.9 : 1.05,
      opacity: isMobile ? 0.18 : 0.28,
      rotate: 360,
      blur: 1
    };
  }

  return {
    x: 0,
    y: -vh * 0.02,
    scale: isMobile ? 0.94 : 1,
    opacity: isMobile ? 0.5 : 0.95,
    rotate: 0,
    blur: 0
  };
}

function mixOrbStates(a, b, progress) {
  return {
    x: lerp(a.x, b.x, progress),
    y: lerp(a.y, b.y, progress),
    scale: lerp(a.scale, b.scale, progress),
    opacity: lerp(a.opacity, b.opacity, progress),
    rotate: lerp(a.rotate, b.rotate, progress),
    blur: lerp(a.blur, b.blur, progress)
  };
}

function getActiveMode() {
  const center = window.scrollY + window.innerHeight * 0.5;
  let active = sections[0]?.dataset.orb || 'hero';

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

function getTargetOrbState() {
  const heroState = getOrbStateForMode('hero');
  const gridState = getOrbStateForMode('grid');

  const services = document.getElementById('services');

  if (services) {
    const servicesTop = services.offsetTop;

    /*
      This is the key:
      start moving the orb BEFORE the grid fully arrives.
      That makes it feel like one continuous story object.
    */
    const transitionStart = servicesTop - window.innerHeight * 0.92;
    const transitionEnd = servicesTop + window.innerHeight * 0.08;

    const rawProgress =
      (window.scrollY - transitionStart) /
      Math.max(transitionEnd - transitionStart, 1);

    const progress = smoothStep(rawProgress);

    if (progress > 0 && progress < 1) {
      document.body.dataset.orbMode = 'hero-to-grid';
      return mixOrbStates(heroState, gridState, progress);
    }
  }

  const activeMode = getActiveMode();
  document.body.dataset.orbMode = activeMode;

  return getOrbStateForMode(activeMode);
}

function applyOrbState(state) {
  if (!orbStage) return;

  orbStage.style.setProperty('--orb-x', `${state.x}px`);
  orbStage.style.setProperty('--orb-y', `${state.y}px`);
  orbStage.style.setProperty('--orb-scale', state.scale.toFixed(4));
  orbStage.style.setProperty('--orb-opacity', state.opacity.toFixed(4));
  orbStage.style.setProperty('--orb-rotate', `${state.rotate.toFixed(2)}deg`);
  orbStage.style.setProperty('--orb-blur', `${state.blur.toFixed(2)}px`);
}

function animateOrb() {
  const targetOrb = getTargetOrbState();

  /*
    Lower = slower / smoother.
    Higher = faster / snappier.
    0.055 is smooth without feeling delayed.
  */
  const followSpeed = 0.055;

  currentOrb = {
    x: lerp(currentOrb.x, targetOrb.x, followSpeed),
    y: lerp(currentOrb.y, targetOrb.y, followSpeed),
    scale: lerp(currentOrb.scale, targetOrb.scale, followSpeed),
    opacity: lerp(currentOrb.opacity, targetOrb.opacity, followSpeed),
    rotate: lerp(currentOrb.rotate, targetOrb.rotate, followSpeed),
    blur: lerp(currentOrb.blur, targetOrb.blur, followSpeed)
  };

  applyOrbState(currentOrb);

  requestAnimationFrame(animateOrb);
}

/* =========================
   EVENTS
========================= */

function onScrollOrResize() {
  updateHeader();
  updateShowcase();
}

window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);

window.addEventListener('load', () => {
  updateHeader();
  updateShowcase();

  currentOrb = getTargetOrbState();
  applyOrbState(currentOrb);

  requestAnimationFrame(animateOrb);
});

updateHeader();
updateShowcase();
currentOrb = getTargetOrbState();
applyOrbState(currentOrb);
requestAnimationFrame(animateOrb);
