(() => {
  const stage = document.querySelector('[data-hero-transition]');
  if (!stage) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const hero = stage.querySelector('.gway-hero');
  const bg = stage.querySelector('.gway-hero-bg');
  const overlay = stage.querySelector('.gway-hero-overlay');
  const content = stage.querySelector('.gway-hero-content');
  const titleLines = [...stage.querySelectorAll('.gway-hero h1 span')];
  const support = stage.querySelector('.gway-hero-bottom');
  const reveal = stage.querySelector('.gway-section-reveal');
  const revealLabel = stage.querySelector('.gway-reveal-label');
  const revealPhoto = stage.querySelector('.gway-reveal-photo');
  const revealPhotoImg = revealPhoto?.querySelector('img');
  const revealTicker = stage.querySelector('.gway-reveal-ticker');
  const revealTickerTrack = stage.querySelector('.gway-reveal-ticker-track');
  const header = document.querySelector('.gway-header');

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

  function readProgress() {
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(1, stage.offsetHeight - innerHeight);
    target = clamp(-rect.top / travel);

    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    current += (target - current) * (1 - Math.exp(-7.0 * dt));
    if (Math.abs(target - current) < 0.0004) current = target;

    const p = current;
    const heroExit = smooth(0.16, 0.58, p);
    const wipe = smooth(0.34, 0.76, p);
    const mediaIn = smooth(0.54, 0.93, p);
    const labelIn = smooth(0.62, 0.86, p);
    const tickerIn = smooth(0.66, 0.91, p);

    if (bg) {
      bg.style.transform =
        `translate3d(0, ${heroExit * 1.2}%, 0) scale(${1.015 + heroExit * 0.045})`;
    }

    if (content) {
      content.style.opacity = String(1 - heroExit);
      content.style.transform =
        `translate3d(0, ${-22 * heroExit}px, 0) scale(${1 - heroExit * 0.014})`;
      content.style.transformOrigin = 'left center';
    }

    if (support) {
      const q = smooth(0.18, 0.48, p);
      support.style.opacity = String(1 - q);
      support.style.transform = `translate3d(0, ${-8 * q}px, 0)`;
    }

    titleLines.forEach((line, index) => {
      const q = smooth(0.21 + index * 0.025, 0.53 + index * 0.025, p);
      line.style.opacity = String(1 - q);
      line.style.transform = `translate3d(0, ${-10 * q * (index + 1)}px, 0)`;
    });

    if (header) {
      const q = smooth(0.14, 0.42, p);
      header.style.opacity = String(1 - q);
      header.style.transform = `translate3d(0, ${-10 * q}px, 0)`;
      header.style.pointerEvents = q > 0.95 ? 'none' : '';
    }

    if (overlay) {
      overlay.style.opacity = String(1 - smooth(0.16, 0.66, p) * 0.14);
    }

    if (reveal) {
      reveal.style.transform =
        `translate3d(0, ${(1 - wipe) * 101}%, 0)`;
    }

    if (revealPhoto) {
      const cut = 100 - mediaIn * 92; // finish on Section 2's 8% opening
      const x = (1 - mediaIn) * 12;
      const y = (1 - mediaIn) * 18;

      revealPhoto.style.setProperty('--handoff-photo-cut', `${cut}%`);
      revealPhoto.style.setProperty('--handoff-photo-x', `${x}vw`);
      revealPhoto.style.setProperty('--handoff-photo-y', `${y}px`);
      revealPhoto.style.setProperty(
        '--handoff-photo-scale',
        String(1.02 - mediaIn * 0.02)
      );
    }

    if (revealPhotoImg) {
      revealPhotoImg.style.setProperty(
        '--handoff-image-scale',
        String(1.08 - mediaIn * 0.025)
      );
      revealPhotoImg.style.setProperty(
        '--handoff-image-y',
        `${-8 * mediaIn}px`
      );
    }

    if (revealLabel) {
      revealLabel.style.setProperty('--handoff-label-opacity', String(labelIn));
      revealLabel.style.setProperty('--handoff-label-y', `${(1 - labelIn) * 12}px`);
    }

    if (revealTicker) {
      revealTicker.style.setProperty(
        '--handoff-ticker-y',
        `${(1 - tickerIn) * 101}%`
      );
    }

    if (revealTickerTrack) {
      revealTickerTrack.style.setProperty(
        '--handoff-ticker-x',
        `${-150 * smooth(0.56, 1.0, p)}px`
      );
    }

    if (hero) {
      hero.style.setProperty('--hero-scroll-progress', p.toFixed(4));
    }

    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  }

  addEventListener('scroll', readProgress, { passive: true });
  addEventListener('resize', readProgress, { passive: true });
  readProgress();
})();
