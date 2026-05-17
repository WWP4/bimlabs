const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const header = document.getElementById('siteHeader');
const sections = [...document.querySelectorAll('[data-orb]')];
const revealItems = [...document.querySelectorAll('.reveal')];
const quadrantBoard = document.querySelector('.quadrant-board');
const showcase = document.querySelector('.showcase');
const showcaseTrack = document.getElementById('showcaseTrack');

function updateHeader() {
  header.classList.toggle('is-scrolled', window.scrollY > 24);
}

function updateOrbMode() {
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

  document.body.dataset.orbMode = active;
}

function updateShowcase() {
  if (!showcase || !showcaseTrack || window.innerWidth < 981) return;

  const rect = showcase.getBoundingClientRect();
  const total = showcase.offsetHeight - window.innerHeight;
  const progress = clamp((-rect.top) / Math.max(total, 1), 0, 1);
  const maxTranslate = showcaseTrack.scrollWidth - window.innerWidth + window.innerWidth * 0.12;

  showcaseTrack.style.transform = `translate3d(${-maxTranslate * progress}px, 0, 0)`;
}

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

for (const btn of document.querySelectorAll('.btn')) {
  btn.addEventListener('pointermove', (event) => {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    btn.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
}

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    updateHeader();
    updateOrbMode();
    updateShowcase();
    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
window.addEventListener('load', () => {
  updateHeader();
  updateOrbMode();
  updateShowcase();
});

onScroll();
