(() => {
  const stage = document.querySelector('[data-hero-transition]');
  if (!stage) return;

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (reduceMotion.matches) return;

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

  const revealLine =
    revealIntro?.querySelector('i');

  const header =
    document.querySelector('.gway-header');

  const clamp = (
    value,
    min = 0,
    max = 1
  ) => {
    return Math.min(
      max,
      Math.max(min, value)
    );
  };

  const smoothstep = (
    from,
    to,
    value
  ) => {
    const x = clamp(
      (value - from) / (to - from)
    );

    return x * x * (3 - 2 * x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;

  function readProgress() {
    const rect =
      stage.getBoundingClientRect();

    const travel = Math.max(
      1,
      stage.offsetHeight -
        window.innerHeight
    );

    target = clamp(
      -rect.top / travel
    );

    if (!raf) {
      raf =
        requestAnimationFrame(render);
    }
  }

  function render() {
    /*
      Slight smoothing without making
      the page feel slow or detached
      from the user's scroll.
    */
    current +=
      (target - current) * 0.18;

    if (
      Math.abs(target - current) <
      0.0008
    ) {
      current = target;
    }

    const p = current;

    /*
      -------------------------
      HERO EXIT
      -------------------------
    */

    const copyFade =
      1 -
      smoothstep(
        0.05,
        0.38,
        p
      );

    const headerFade =
      1 -
      smoothstep(
        0.02,
        0.24,
        p
      );

    /*
      White panel now starts much
      earlier and finishes earlier.
    */
    const panelP =
      smoothstep(
        0.16,
        0.68,
        p
      );

    /*
      Background push-in.
    */
    if (bg) {
      const scale =
        1.015 +
        p * 0.055;

      const y =
        p * 1.7;

      bg.style.transform =
        `translate3d(
          0,
          ${y}%,
          0
        )
        scale(${scale})`;
    }

    /*
      Hero darkness.
    */
    if (overlay) {
      overlay.style.opacity =
        String(
          1 - p * 0.12
        );
    }

    /*
      Main hero content gently
      moves away from us.
    */
    if (content) {
      const contentScale =
        1 - p * 0.018;

      content.style.transform =
        `translate3d(
          0,
          ${-28 * p}px,
          0
        )
        scale(${contentScale})`;

      content.style.transformOrigin =
        'left center';
    }

    /*
      Headline disappears
      line-by-line.
    */
    titleLines.forEach(
      (line, index) => {
        const stagger =
          index * 0.025;

        const fade =
          1 -
          smoothstep(
            0.10 + stagger,
            0.43 + stagger,
            p
          );

        line.style.opacity =
          String(fade);

        line.style.transform =
          `translate3d(
            0,
            ${
              -14 *
              p *
              (index + 1)
            }px,
            0
          )`;
      }
    );

    /*
      Supporting copy leaves first.
    */
    if (support) {
      support.style.opacity =
        String(copyFade);

      support.style.transform =
        `translate3d(
          ${-14 * p}px,
          ${-6 * p}px,
          0
        )`;
    }

    /*
      Header quickly disappears.
    */
    if (header) {
      header.style.opacity =
        String(headerFade);

      header.style.transform =
        `translate3d(
          0,
          ${
            -14 *
            smoothstep(
              0,
              0.28,
              p
            )
          }px,
          0
        )`;

      header.style.pointerEvents =
        headerFade < 0.08
          ? 'none'
          : '';
    }

    /*
      -------------------------
      WHITE REVEAL
      -------------------------
    */

    if (reveal) {
      reveal.style.transform =
        `translate3d(
          0,
          ${
            (1 - panelP) *
            100
          }%,
          0
        )`;

      reveal.style.setProperty(
        '--reveal-line-opacity',
        String(
          1 -
          smoothstep(
            0.72,
            0.92,
            p
          )
        )
      );
    }

    /*
      -------------------------
      WHY GSA PREP
      -------------------------

      Sequence:

      1. appears
      2. grows with scroll
      3. holds briefly
      4. fades away
      5. real Section 2 arrives
    */

    if (revealIntro) {
      const introIn =
        smoothstep(
          0.30,
          0.44,
          p
        );

      const introGrow =
        smoothstep(
          0.34,
          0.70,
          p
        );

      const introOut =
        1 -
        smoothstep(
          0.72,
          0.88,
          p
        );

      const opacity =
        introIn *
        introOut;

      /*
        Starts around 92% size
        and slowly grows to 116%.
      */
      const scale =
        0.92 +
        introGrow * 0.24;

      /*
        Slight upward movement
        makes the growth feel
        editorial rather than zoomy.
      */
      const y =
        (1 - introIn) * 18 -
        introGrow * 5;

      revealIntro.style.opacity =
        String(opacity);

      revealIntro.style.transform =
        `translate3d(
          -50%,
          calc(-50% + ${y}px),
          0
        )
        scale(${scale})`;
    }

    /*
      Red line grows underneath
      WHY GSA PREP.
    */
    if (revealLine) {
      const lineGrow =
        smoothstep(
          0.35,
          0.58,
          p
        );

      revealLine.style.transform =
        `scaleX(${lineGrow})`;
    }

    /*
      Make progress available
      to CSS if needed later.
    */
    if (hero) {
      hero.style.setProperty(
        '--hero-scroll-progress',
        p.toFixed(4)
      );
    }

    /*
      Continue easing until
      current catches target.
    */
    if (current !== target) {
      raf =
        requestAnimationFrame(
          render
        );
    } else {
      raf = 0;
    }
  }

  window.addEventListener(
    'scroll',
    readProgress,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    readProgress,
    {
      passive: true
    }
  );

  readProgress();
})();
