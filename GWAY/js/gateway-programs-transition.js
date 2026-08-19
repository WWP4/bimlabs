(() => {
  const stage = document.querySelector(
    '[data-programs-transition]'
  );

  if (!stage) return;

  if (
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  ) {
    return;
  }

  const sticky =
    stage.querySelector('.programs-stage');

  const kicker =
    stage.querySelector('.programs-kicker');

  const mlsBack =
    stage.querySelector('.programs-mls-back');

  const mlsFront =
    stage.querySelector('.programs-mls-front');

  const athlete =
    stage.querySelector('.programs-athlete');

  const copy =
    stage.querySelector('.programs-copy');

  const copyLine =
    copy?.querySelector('i');

  const cta =
    stage.querySelector('.programs-cta');

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
      (value - from) /
      (to - from)
    );

    return x * x * (3 - 2 * x);
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let lastTime = performance.now();

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
      lastTime = performance.now();

      raf =
        requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min(
      (now - lastTime) / 1000,
      0.05
    );

    lastTime = now;

    /*
      Smooths the animation so wheel scrolling
      does not instantly snap through the section.
    */
    const damping =
      1 - Math.exp(-5.0 * dt);

    current +=
      (target - current) * damping;

    if (
      Math.abs(target - current) <
      0.0004
    ) {
      current = target;
    }

    const p = current;

    /* ==========================================
       PROGRAMS LABEL
    ========================================== */

    if (kicker) {
      const show =
        smoothstep(
          0.04,
          0.18,
          p
        );

      kicker.style.opacity =
        String(show);

      kicker.style.filter =
        `blur(${(1 - show) * 5}px)`;
    }

    /* ==========================================
       SOLID MLS — BACK LAYER
    ========================================== */

    if (mlsBack) {
      const show =
        smoothstep(
          0.08,
          0.40,
          p
        );

      const settle =
        smoothstep(
          0.16,
          0.54,
          p
        );

      const scale =
        0.985 +
        settle * 0.015;

      const spacing =
        0.018 -
        settle * 0.038;

      mlsBack.style.opacity =
        String(show);

      mlsBack.style.letterSpacing =
        `${spacing}em`;

      mlsBack.style.transform =
        `translate3d(
          -50%,
          -50%,
          0
        )
        scale(${scale})`;
    }

    /* ==========================================
       ATHLETE

       No sliding.
       No rising.
       No left/right movement.

       He only dissolves into focus.
    ========================================== */

    let athleteIn = 0;

    if (athlete) {
      athleteIn =
        smoothstep(
          0.28,
          0.64,
          p
        );

      const blur =
        (1 - athleteIn) *
        12;

      const saturation =
        0.88 +
        athleteIn *
        0.12;

      const contrast =
        0.97 +
        athleteIn *
        0.03;

      athlete.style.opacity =
        String(athleteIn);

      athlete.style.filter =
        `
          blur(${blur}px)
          saturate(${saturation})
          contrast(${contrast})
        `;
    }

    /* ==========================================
       FRONT BLOOM MLS

       IMPORTANT:

       JS is NOT creating the BLOOM effect.

       CSS is masking this layer using:
       transparent.png

       That means the white hollow MLS only
       exists inside the athlete silhouette.

       Here we only reveal that already-masked
       layer at the same rate as the athlete.
    ========================================== */

    if (mlsFront) {
      mlsFront.style.opacity =
        String(athleteIn);
    }

    /* ==========================================
       COPY
    ========================================== */

    if (copy) {
      const show =
        smoothstep(
          0.62,
          0.84,
          p
        );

      const blur =
        (1 - show) *
        7;

      copy.style.opacity =
        String(show);

      copy.style.filter =
        `blur(${blur}px)`;
    }

    /* RED LINE */

    if (copyLine) {
      const show =
        smoothstep(
          0.70,
          0.88,
          p
        );

      copyLine.style.transform =
        `scaleX(${show})`;
    }

    /* ==========================================
       CTA
    ========================================== */

    if (cta) {
      const show =
        smoothstep(
          0.74,
          0.93,
          p
        );

      const blur =
        (1 - show) *
        6;

      cta.style.opacity =
        String(show);

      cta.style.filter =
        `blur(${blur}px)`;
    }

    /* ==========================================
       OPTIONAL CSS PROGRESS VALUE
    ========================================== */

    if (sticky) {
      sticky.style.setProperty(
        '--programs-progress',
        p.toFixed(4)
      );
    }

    /* ==========================================
       KEEP ANIMATION RUNNING
    ========================================== */

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
