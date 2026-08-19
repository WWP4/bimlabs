(() => {
  const stage = document.querySelector('[data-hero-transition]');
  if (!stage) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduceMotion.matches) return;

  const hero = stage.querySelector('.gway-hero');
  const bg = stage.querySelector('.gway-hero-bg');
  const overlay = stage.querySelector('.gway-hero-overlay');
  const content = stage.querySelector('.gway-hero-content');
  const titleLines = [...stage.querySelectorAll('.gway-hero h1 span')];
  const support = stage.querySelector('.gway-hero-bottom');

  const reveal = stage.querySelector('.gway-section-reveal');
  const revealIntro = stage.querySelector('.gway-section-reveal-intro');
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

  function readProgress() {
    const rect = stage.getBoundingClientRect();

    const travel = Math.max(
      1,
      stage.offsetHeight - window.innerHeight
    );

    target = clamp(-rect.top / travel);

    if (!raf) {
      raf = requestAnimationFrame(render);
    }
  }

  function render() {
    /*
      Smooth interpolation makes mouse-wheel
      and trackpad scrolling feel more cinematic.
    */
    current += (target - current) * 0.14;

    if (Math.abs(target - current) < 0.0008) {
      current = target;
    }

    const p = current;

    /*
      HERO TIMING
    */
    const copyFade =
      1 - smoothstep(0.08, 0.52, p);

    const headerFade =
      1 - smoothstep(0.02, 0.30, p);

    const panelP =
      smoothstep(0.30, 0.90, p);

    /*
      BACKGROUND PUSH-IN
    */
    if (bg) {
      const scale = 1.015 + p * 0.065;
      const y = p * 2.1;

      bg.style.transform =
        `translate3d(0, ${y}%, 0) scale(${scale})`;
    }

    /*
      HERO OVERLAY
    */
    if (overlay) {
      overlay.style.opacity =
        String(1 - p * 0.16);
    }

    /*
      ENTIRE HERO CONTENT
    */
    if (content) {
      content.style.transform =
        `translate3d(0, ${-34 * p}px, 0)
         scale(${1 - 0.022 * p})`;

      content.style.transformOrigin =
        'left center';
    }

    /*
      HEADLINE LINES
      Each line leaves slightly after the one above it.
    */
    titleLines.forEach((line, index) => {
      const stagger = index * 0.035;

      const localFade =
        1 -
        smoothstep(
          0.15 + stagger,
          0.60 + stagger,
          p
        );

      line.style.opacity =
        String(localFade);

      line.style.transform =
        `translate3d(
          0,
          ${-18 * p * (index + 1)}px,
          0
        )`;
    });

    /*
      SMALL HERO COPY
    */
    if (support) {
      support.style.opacity =
        String(copyFade);

      support.style.transform =
        `translate3d(
          ${-18 * p}px,
          ${-8 * p}px,
          0
        )`;
    }

    /*
      HEADER EXITS FIRST
    */
    if (header) {
      header.style.opacity =
        String(headerFade);

      header.style.transform =
        `translate3d(
          0,
          ${-16 * smoothstep(0, 0.35, p)}px,
          0
        )`;

      header.style.pointerEvents =
        headerFade < 0.08
          ? 'none'
          : '';
    }

    /*
      WHITE SECOND SECTION
      Rises over the hero.
    */
    if (reveal) {
      reveal.style.transform =
        `translate3d(
          0,
          ${(1 - panelP) * 100}%,
          0
        )`;

      reveal.style.setProperty(
        '--reveal-line-opacity',
        String(
          1 - smoothstep(0.90, 1, p)
        )
      );
    }

    /*
      "WHY GSA PREP" INTERSTITIAL
    */
    if (revealIntro) {
      const introIn =
        smoothstep(0.58, 0.77, p);

      const introOut =
        1 -
        smoothstep(0.88, 0.985, p);

      const introOpacity =
        introIn * introOut;

      revealIntro.style.opacity =
        String(introOpacity);

      revealIntro.style.transform =
        `translate3d(
          -50%,
          calc(
            -50% +
            ${(1 - introIn) * 28}px
          ),
          0
        )`;
    }

    /*
      SMALL RED LINE
    */
    if (revealLine) {
      revealLine.style.transform =
        `scaleX(
          ${smoothstep(0.62, 0.82, p)}
        )`;
    }

    /*
      Makes scroll progress available to CSS too.
    */
    if (hero) {
      hero.style.setProperty(
        '--hero-scroll-progress',
        p.toFixed(4)
      );
    }

    /*
      Continue animation until current catches target.
    */
    if (current !== target) {
      raf =
        requestAnimationFrame(render);
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
