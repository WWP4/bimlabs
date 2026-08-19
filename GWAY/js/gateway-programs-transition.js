(() => {
  const section = document.querySelector(
    '[data-programs-transition]'
  );

  if (!section) return;

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

  if (reducedMotion.matches) return;

  const stage =
    section.querySelector(
      '.programs-stage'
    );

  const kicker =
    section.querySelector(
      '.programs-kicker'
    );

  const bloomBack =
    section.querySelector(
      '.bloom-text-back'
    );

  const athlete =
    section.querySelector(
      '.bloom-athlete'
    );

  const bloomFront =
    section.querySelector(
      '.bloom-text-front'
    );

  const copy =
    section.querySelector(
      '.programs-copy'
    );

  const copyLine =
    copy?.querySelector('i');

  const cta =
    section.querySelector(
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
    const x =
      clamp(
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

  function getProgress() {
    const rect =
      section.getBoundingClientRect();

    const scrollable =
      Math.max(
        1,
        section.offsetHeight -
        window.innerHeight
      );

    return clamp(
      -rect.top /
      scrollable
    );
  }

  function requestRender() {
    target =
      getProgress();

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
    const dt =
      Math.min(
        (now - lastTime) /
        1000,
        0.05
      );

    lastTime = now;

    /*
      Smooth scroll following.

      This does NOT create the BLOOM effect.
      The SVG mask creates the actual intersection.
    */
    const easing =
      1 -
      Math.exp(
        -5.2 * dt
      );

    current +=
      (
        target -
        current
      ) *
      easing;

    if (
      Math.abs(
        target -
        current
      ) <
      0.00035
    ) {
      current = target;
    }

    const p = current;

    /* ==========================================
       01 — PROGRAMS LABEL
    ========================================== */

    if (kicker) {
      const amount =
        smoothstep(
          0.035,
          0.15,
          p
        );

      kicker.style.opacity =
        String(amount);

      kicker.style.filter =
        `blur(${(1 - amount) * 5}px)`;
    }

    /* ==========================================
       02 — SOLID MLS APPEARS FIRST
    ========================================== */

    if (bloomBack) {
      const amount =
        smoothstep(
          0.07,
          0.31,
          p
        );

      const settle =
        smoothstep(
          0.08,
          0.38,
          p
        );

      const scale =
        0.985 +
        settle *
        0.015;

      bloomBack.style.opacity =
        String(amount);

      bloomBack.style.transform =
        `scale(${scale})`;
    }

    /* ==========================================
       03 — ATHLETE + BLOOM OUTLINE

       They reveal together.

       The foreground MLS is already clipped
       to the athlete by the SVG mask.
    ========================================== */

    const athleteIn =
      smoothstep(
        0.26,
        0.58,
        p
      );

    if (athlete) {
      const blur =
        (1 - athleteIn) *
        13;

      const saturation =
        0.88 +
        athleteIn *
        0.12;

      const contrast =
        0.98 +
        athleteIn *
        0.02;

      const scale =
        0.998 +
        athleteIn *
        0.002;

      athlete.style.opacity =
        String(athleteIn);

      athlete.style.filter =
        `
          blur(${blur}px)
          saturate(${saturation})
          contrast(${contrast})
        `;

      athlete.style.transform =
        `scale(${scale})`;
    }

    if (bloomFront) {
      /*
        No independent position or scale.

        Both MLS layers use the same SVG
        coordinates, so they stay registered.
      */
      bloomFront.style.opacity =
        String(athleteIn);
    }

    /* ==========================================
       04 — COPY
    ========================================== */

    if (copy) {
      const amount =
        smoothstep(
          0.56,
          0.76,
          p
        );

      copy.style.opacity =
        String(amount);

      copy.style.filter =
        `blur(${(1 - amount) * 7}px)`;
    }

    /* RED LINE */

    if (copyLine) {
      const amount =
        smoothstep(
          0.63,
          0.80,
          p
        );

      copyLine.style.transform =
        `scaleX(${amount})`;
    }

    /* ==========================================
       05 — CTA
    ========================================== */

    if (cta) {
      const amount =
        smoothstep(
          0.67,
          0.83,
          p
        );

      cta.style.opacity =
        String(amount);

      cta.style.filter =
        `blur(${(1 - amount) * 6}px)`;
    }

    /* ==========================================
       06 — HOLD

       Nothing changes after roughly 83%.
       The finished composition sits there
       before the sticky section releases.
    ========================================== */

    if (stage) {
      stage.style.setProperty(
        '--programs-progress',
        p.toFixed(4)
      );
    }

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
    requestRender,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    requestRender,
    {
      passive: true
    }
  );

  requestRender();
})();
