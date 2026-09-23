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
  const header = document.querySelector('.gway-header');

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const smoothstep = (from, to, value) => {
    const x = clamp((value - from) / (to - from));
    return x * x * (3 - 2 * x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let lastTime = performance.now();

  function readProgress() {
    const rect = stage.getBoundingClientRect();
    const travel = Math.max(1, stage.offsetHeight - innerHeight);
    target = clamp(-rect.top / travel);

    if (!raf) {
      lastTime = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    current += (target - current) * (1 - Math.exp(-7.2 * dt));

    if (Math.abs(target - current) < 0.00045) {
      current = target;
    }

    const p = current;

    // Keep the hero alive longer, then clear it quickly into the next chapter.
    const heroExit = smoothstep(0.22, 0.76, p);

    if (bg) {
      bg.style.transform =
        `translate3d(0, ${heroExit * 1.2}%, 0) scale(${1.015 + heroExit * 0.038})`;
    }

    if (content) {
      content.style.transform =
        `translate3d(0, ${-18 * heroExit}px, 0) scale(${1 - heroExit * 0.012})`;
      content.style.transformOrigin = 'left center';
      content.style.opacity = String(1 - heroExit * 0.96);
    }

    if (support) {
      const supportExit = smoothstep(0.26, 0.62, p);
      support.style.opacity = String(1 - supportExit);
      support.style.transform =
        `translate3d(0, ${-8 * supportExit}px, 0)`;
    }

    titleLines.forEach((line, index) => {
      const lineExit = smoothstep(
        0.30 + index * 0.025,
        0.70 + index * 0.025,
        p
      );

      line.style.opacity = String(1 - lineExit);
      line.style.transform =
        `translate3d(0, ${-10 * lineExit * (index + 1)}px, 0)`;
    });

    if (header) {
      const headerExit = smoothstep(0.22, 0.58, p);
      header.style.opacity = String(1 - headerExit);
      header.style.transform =
        `translate3d(0, ${-10 * headerExit}px, 0)`;
      header.style.pointerEvents = headerExit > 0.95 ? 'none' : '';
    }

    if (overlay) {
      overlay.style.opacity =
        String(1 - smoothstep(0.20, 0.72, p) * 0.16);
    }

    // The cream sheet only completes at the very end of the hero runway,
    // so there is no blank "title-card" screen between hero and section 2.
    const wipe = smoothstep(0.47, 1.00, p);

    if (reveal) {
      reveal.style.transform =
        `translate3d(0, ${(1 - wipe) * 101}%, 0)`;

      reveal.style.setProperty(
        '--gway-reveal-edge',
        String(smoothstep(0.48, 0.78, p))
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
