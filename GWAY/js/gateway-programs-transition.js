(() => {
  const section = document.querySelector('[data-programs-transition]');
  if (!section) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  const scrollSpace = section.querySelector('.programs-scroll-space');
  const sticky = section.querySelector('.programs-sticky');
  const track = section.querySelector('[data-story-track]');
  const cards = [...section.querySelectorAll('.story-card')];
  const marquee = section.querySelector('.programs-marquee__track');
  const progressBar = section.querySelector('.programs-progress__bar i');
  const progressCount = section.querySelector('.programs-progress__count');

  if (!scrollSpace || !sticky || !track) return;

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const smooth = (from, to, value) => {
    const x = clamp((value - from) / (to - from));
    return x * x * (3 - 2 * x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let last = performance.now();
  let maxTranslate = 0;

  function measure() {
    if (innerWidth <= 760) {
      maxTranslate = 0;
      return;
    }

    const leftPad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const rightPad = parseFloat(getComputedStyle(track).paddingRight) || 0;

    // End with the final frame comfortably inside the viewport,
    // rather than flying completely off screen.
    maxTranslate = Math.max(
      0,
      track.scrollWidth - innerWidth + leftPad + rightPad
    );
  }

  function getProgress() {
    if (innerWidth <= 760) return 0;

    const rect = scrollSpace.getBoundingClientRect();
    const travel = Math.max(1, scrollSpace.offsetHeight - innerHeight);

    return clamp(-rect.top / travel);
  }

  function activeScene(p) {
    // intro + six photographic moments
    const scene = Math.min(6, Math.max(0, Math.round(p * 6)));
    return scene;
  }

  function requestRender() {
    if (innerWidth <= 760) return;

    target = getProgress();

    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    current += (target - current) * (1 - Math.exp(-7.0 * dt));
    if (Math.abs(target - current) < 0.00035) current = target;

    const p = current;
    const eased = smooth(0, 1, p);
    const x = -maxTranslate * eased;

    track.style.setProperty('--story-x', `${x}px`);

    if (marquee) {
      marquee.style.setProperty('--culture-marquee-x', `${-240 * p}px`);
    }

    if (progressBar) {
      progressBar.style.setProperty('--story-progress', String(p));
    }

    if (progressCount) {
      const scene = Math.max(1, activeScene(p));
      progressCount.textContent =
        `${String(scene).padStart(2, '0')} / 06`;
    }

    // Give every frame a tiny depth response as it crosses the viewport.
    cards.forEach((card, index) => {
      const rect = card.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const distance = Math.abs(center - innerWidth / 2);
      const proximity = 1 - clamp(distance / (innerWidth * 0.78));

      const lift = -10 * proximity;
      const scale = 0.985 + 0.015 * proximity;

      card.style.setProperty('--story-card-y', `${lift}px`);
      card.style.setProperty('--story-card-scale', String(scale));

      const image = card.querySelector('img');
      if (image) {
        const drift = (center - innerWidth / 2) / innerWidth;
        image.style.setProperty('--story-image-x', `${-18 * drift}px`);
        image.style.setProperty('--story-image-scale', String(1.045 + 0.02 * proximity));
      }
    });

    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  }

  function onResize() {
    measure();
    requestRender();
  }

  addEventListener('scroll', requestRender, { passive: true });
  addEventListener('resize', onResize, { passive: true });

  requestAnimationFrame(() => {
    measure();
    requestRender();
  });

  // Re-measure once images settle so the final translation is exact.
  Promise.all(
    [...section.querySelectorAll('img')].map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(resolve => {
        img.addEventListener('load', resolve, { once: true });
        img.addEventListener('error', resolve, { once: true });
      });
    })
  ).then(() => {
    measure();
    requestRender();
  });
})();
