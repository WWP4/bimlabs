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
    stage.querySelector(
      '.programs-stage'
    );

  const kicker =
    stage.querySelector(
      '.programs-kicker'
    );

  const mlsBack =
    stage.querySelector(
      '.programs-mls-back'
    );

  const mlsFront =
    stage.querySelector(
      '.programs-mls-front'
    );

  const athlete =
    stage.querySelector(
      '.programs-athlete'
    );

  const copy =
    stage.querySelector(
      '.programs-copy'
    );

  const copyLine =
    copy?.querySelector('i');

  const cta =
    stage.querySelector(
      '.programs-cta'
    );

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

    return (
      x *
      x *
      (3 - 2 * x)
    );
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let lastTime =
    performance.now();

  function readProgress() {
    const rect =
      stage.getBoundingClientRect();

    const travel =
      Math.max(
        1,
        stage.offsetHeight -
        window.innerHeight
      );

    target = clamp(
      -rect.top / travel
    );

    if (!raf) {
      lastTime =
        performance.now();

      raf =
        requestAnimationFrame(
          render
        );
    }
  }

  function render(now) {
    /*
      Smooth visual easing so mouse-wheel
      movement doesn't make the section snap.
    */
    const dt =
      Math.min(
        (now - lastTime) /
        1000,
        0.05
      );

    lastTime = now;

    const damping =
      1 -
      Math.exp(
        -5.0 * dt
      );

    current +=
      (
        target -
        current
      ) *
      damping;

    if (
      Math.abs(
        target -
        current
      ) <
      0.0004
    ) {
      current = target;
    }

    const p = current;

    /* ==============================
       PROGRAMS LABEL
    ============================== */

    if (kicker) {
      const reveal =
        smoothstep(
          0.04,
          0.18,
          p
        );

      kicker.style.opacity =
        String(reveal);

      kicker.style.filter =
        `blur(${(1 - reveal) * 5}px)`;
    }

    /* ==============================
       SOLID MLS — BACK LAYER
    ============================== */

    if (mlsBack) {
      const typeIn =
        smoothstep(
          0.08,
          0.42,
          p
        );

      const settle =
        smoothstep(
          0.18,
          0.56,
          p
        );

      const scale =
        0.985 +
        settle * 0.015;

      const spacing =
        0.018 -
        settle * 0.038;

      mlsBack.style.opacity =
        String(typeIn);

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

    /* ==============================
       ATHLETE DISSOLVE
       NO MOVEMENT
    ============================== */

    if (athlete) {
      const athleteIn =
        smoothstep(
          0.30,
          0.66,
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

      const scale =
        0.997 +
        athleteIn *
        0.003;

      athlete.style.opacity =
        String(athleteIn);

      athlete.style.filter =
        `
        blur(${blur}px)
        saturate(${saturation})
        contrast(${contrast})
        `;

      athlete.style.transform =
        `translate3d(
          -50%,
          0,
          0
        )
        scale(${scale})`;
    }

    /* ==============================
       FRONT HOLLOW MLS

       CSS masks this to the athlete PNG,
       so the white hollow outline only
       appears over his body.
    ============================== */

    if (mlsFront) {
      const outlineIn =
        smoothstep(
          0.38,
          0.64,
          p
        );

      mlsFront.style.opacity =
        String(outlineIn);
    }

    /* ==============================
       COPY
    ============================== */

    if (copy) {
      const copyIn =
        smoothstep(
          0.64,
          0.86,
          p
        );

      const blur =
        (1 - copyIn) *
        7;

      copy.style.opacity =
        String(copyIn);

      copy.style.filter =
        `blur(${blur}px)`;
    }

    if (copyLine) {
      const lineIn =
        smoothstep(
          0.72,
          0.90,
          p
        );

      copyLine.style.transform =
        `scaleX(${lineIn})`;
    }

    /* ==============================
       CTA
    ============================== */

    if (cta) {
      const ctaIn =
        smoothstep(
          0.75,
          0.94,
          p
        );

      const blur =
        (1 - ctaIn) *
        6;

      cta.style.opacity =
        String(ctaIn);

      cta.style.filter =
        `blur(${blur}px)`;
    }

    /* ==============================
       OPTIONAL CSS PROGRESS VALUE
    ============================== */

    if (sticky) {
      sticky.style.setProperty(
        '--programs-progress',
        p.toFixed(4)
      );
    }

    /* ==============================
       CONTINUE RAF LOOP
    ============================== */

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
