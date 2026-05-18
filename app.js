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
const servicesSection = document.getElementById('services');
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

/* ---------------------------------
   reveal observer
--------------------------------- */

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
  }, { threshold: 0.2 });

  boardObserver.observe(quadrantBoard);
}

/* ---------------------------------
   button hover
--------------------------------- */

for (const btn of document.querySelectorAll('.btn')) {
  btn.addEventListener('pointermove', (event) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    btn.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

/* ---------------------------------
   orb system
--------------------------------- */

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

  /* progress while inside the services section */
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
  const gridState = getGridState();

  /*
    Start the travel before services fully arrives.
    This is the key to making it feel continuous.
  */
  if (servicesSection) {
    const transitionStart = servicesSection.offsetTop - window.innerHeight * 0.92;
    const transitionEnd = servicesSection.offsetTop + window.innerHeight * 0.14;

    const transitionProgress = smoothStep(
      clamp(
        (window.scrollY - transitionStart) /
          Math.max(transitionEnd - transitionStart, 1),
        0,
        1
      )
    );

    if (transitionProgress > 0 && transitionProgress < 1) {
      document.body.dataset.orbMode = 'hero-to-grid';
      return mixStates(heroState, gridState, transitionProgress);
    }
  }

  const activeMode = getActiveMode();
  document.body.dataset.orbMode = activeMode;

  if (activeMode === 'grid') return gridState;
  if (activeMode === 'showcase') return getShowcaseState();
  if (activeMode === 'support') return getSupportState();
  if (activeMode === 'process') return getProcessState();
  if (activeMode === 'cta') return getCtaState();

  return heroState;
}

function updateServicesLines() {
  if (!quadrantBoard || !servicesSection) return;

  /*
    This drives the divider-line expansion from the center.
    It begins while the section is entering, not after.
  */
  const start = servicesSection.offsetTop - window.innerHeight * 0.45;
  const end = servicesSection.offsetTop + window.innerHeight * 0.55;

  const progress = smoothStep(
    clamp((window.scrollY - start) / Math.max(end - start, 1), 0, 1)
  );

  quadrantBoard.style.setProperty('--services-progress', progress.toFixed(4));
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
    lower = smoother / slower
    higher = quicker / snappier
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
  updateServicesLines();

  requestAnimationFrame(animateOrb);
}

/* ---------------------------------
   events
--------------------------------- */

function onScrollOrResize() {
  updateHeader();
  updateShowcase();
  updateServicesLines();
}

window.addEventListener('scroll', onScrollOrResize, { passive: true });
window.addEventListener('resize', onScrollOrResize);

window.addEventListener('load', () => {
  updateHeader();
  updateShowcase();
  updateServicesLines();

  currentOrb = getTargetOrbState();
  applyOrbState(currentOrb);

  requestAnimationFrame(animateOrb);
});

updateHeader();
updateShowcase();
updateServicesLines();
currentOrb = getTargetOrbState();
applyOrbState(currentOrb);
requestAnimationFrame(animateOrb);

const hero = document.querySelector(".hero");
const orb = document.querySelector(".bim-orb");

if (hero && orb) {
  let leaveTimer;

  hero.addEventListener("pointermove", (event) => {
    if (document.body.dataset.orbMode !== "hero") return;

    clearTimeout(leaveTimer);

    const rect = hero.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    document.body.classList.add("orb-interacting");

    orb.style.setProperty("--orb-tilt-x", `${x * 7}deg`);
    orb.style.setProperty("--orb-tilt-y", `${y * -7}deg`);
  });

  hero.addEventListener("pointerleave", () => {
    leaveTimer = setTimeout(() => {
      document.body.classList.remove("orb-interacting");
      orb.style.setProperty("--orb-tilt-x", "0deg");
      orb.style.setProperty("--orb-tilt-y", "0deg");
    }, 120);
  });
}
