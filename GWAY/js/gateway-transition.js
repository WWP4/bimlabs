(() => {
  const stage = document.querySelector('[data-hero-transition]');
  if (!stage) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (reducedMotion.matches) return;

  const hero = stage.querySelector('.gway-hero');
  const bg = stage.querySelector('.gway-hero-bg');
  const overlay = stage.querySelector('.gway-hero-overlay');
  const content = stage.querySelector('.gway-hero-content');

  const titleLines = [
    ...stage.querySelectorAll('.gway-hero h1 span')
  ];

  const support = stage.querySelector('.gway-hero-bottom');

  const reveal = stage.querySelector(
    '.gway-section-reveal'
  );

  const revealIntro = stage.querySelector(
    '.gway-section-reveal-intro'
  );

  const revealLine = revealIntro?.querySelector('i');

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

    const travel = Math.max(
      1,
      stage.offsetHeight - window.innerHeight
    );

    target = clamp(-rect.top / travel);

    if (!raf) {
      lastTime = performance.now();
      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    const smoothing = 1 - Math.exp(-6.3 * dt);

    current += (target - current) * smoothing;

    if (Math.abs(target - current) < 0.00045) {
      current = target;
    }

    const p = current;

    if (bg) {
      const bgP = smoothstep(0.00, 0.72, p);

      const scale = 1.015 + bgP * 0.055;
      const y = bgP * 1.45;

      bg.style.transform =
        `translate3d(0, ${y}%, 0) scale(${scale})`;
    }

    const contentExit = smoothstep(0.11, 0.48, p);

    if (content) {
      const scale = 1 - contentExit * 0.021;
      const y = -24 * contentExit;

      content.style.transform =
        `translate3d(0, ${y}px, 0) scale(${scale})`;

      content.style.transformOrigin = 'left center';
    }

    if (support) {
      const supportExit = smoothstep(0.12, 0.38, p);

      support.style.opacity =
        String(1 - supportExit);

      support.style.transform =
        `translate3d(${-12 * supportExit}px, ${-6 * supportExit}px, 0)`;
    }

    titleLines.forEach((line, index) => {
      const stagger = index * 0.025;

      const lineExit = smoothstep(
        0.17 + stagger,
        0.50 + stagger,
        p
      );

      line.style.opacity =
        String(1 - lineExit);

      line.style.transform =
        `translate3d(0, ${-15 * lineExit * (index + 1)}px, 0)`;
    });

    if (header) {
      const headerExit = smoothstep(0.07, 0.30, p);

      header.style.opacity =
        String(1 - headerExit);

      header.style.transform =
        `translate3d(0, ${-14 * headerExit}px, 0)`;

      header.style.pointerEvents =
        headerExit > 0.92 ? 'none' : '';
    }

    if (overlay) {
      const overlayP = smoothstep(0.08, 0.64, p);

      overlay.style.opacity =
        String(1 - overlayP * 0.13);
    }

    const panelP = smoothstep(0.20, 0.62, p);

    if (reveal) {
      const y = (1 - panelP) * 100;

      reveal.style.transform =
        `translate3d(0, ${y}%, 0)`;

      const topLineOpacity =
        1 - smoothstep(0.88, 1.00, p);

      reveal.style.setProperty(
        '--reveal-line-opacity',
        String(topLineOpacity)
      );
    }

    if (revealIntro) {
      const introIn = smoothstep(0.45, 0.63, p);
      const introGrow = smoothstep(0.55, 0.98, p);

      const scale =
        0.95 + introGrow * 0.13;

      const y =
        (1 - introIn) * 24 -
        introGrow * 7;

      revealIntro.style.opacity =
        String(introIn);

      revealIntro.style.transform =
        `translate3d(
          -50%,
          calc(-50% + ${y}px),
          0
        ) scale(${scale})`;
    }

    if (revealLine) {
      const lineP = smoothstep(0.52, 0.72, p);

      revealLine.style.transform =
        `scaleX(${lineP})`;
    }

    if (hero) {
      hero.style.setProperty(
        '--hero-scroll-progress',
        p.toFixed(4)
      );
    }

    if (current !== target) {
      raf = requestAnimationFrame(render);
    } else {
      raf = 0;
    }
  }

  window.addEventListener(
    'scroll',
    readProgress,
    { passive: true }
  );

  window.addEventListener(
    'resize',
    readProgress,
    { passive: true }
  );

  readProgress();
})();
