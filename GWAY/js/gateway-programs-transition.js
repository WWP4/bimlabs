(() => {
  const section =
    document.querySelector(
      '[data-programs-transition]'
    );

  if (!section) return;

  const reducedMotion =
    window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );

  if (reducedMotion.matches) {
    return;
  }

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

    const travel =
      Math.max(
        1,
        section.offsetHeight -
        window.innerHeight
      );

    return clamp(
      -rect.top / travel
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
      Smooth scroll tracking.

      IMPORTANT:
      JS is NOT creating the actual BLOOM effect.

      The SVG does the real layering:
      cream filled MLS
      behind athlete
      +
      cream outline MLS
      masked over athlete.
    */
    const damping =
      1 -
      Math.exp(
        -5.2 * dt
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
      0.00035
    ) {
      current = target;
    }

    const p = current;

    /* =========================================
       01 — PROGRAMS LABEL
    ========================================= */

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

    /* =========================================
       02 — CREAM FILLED MLS
       BEHIND ATHLETE
    ========================================= */

    if (bloomBack) {
      const amount =
        smoothstep(
          0.07,
          0.29,
          p
        );

      const settle =
        smoothstep(
          0.08,
          0.35,
          p
        );

      const scale =
        0.988 +
        settle *
        0.012;

      bloomBack.style.opacity =
        String(amount);

      bloomBack.style.transform =
        `scale(${scale})`;
    }

    /* =========================================
       03 — ATHLETE

       No sliding.
       No rising.
       No horizontal movement.

       Just a soft dissolve into focus.
    ========================================= */

    const athleteIn =
      smoothstep(
        0.25,
        0.56,
        p
      );

    if (athlete) {
      const blur =
        (1 - athleteIn) *
        12;

      const saturation =
        0.90 +
        athleteIn *
        0.10;

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

    /* =========================================
       04 — CREAM OUTLINE MLS
       IN FRONT OF ATHLETE

       SAME color as the filled back MLS.

       The SVG mask clips this layer so
       the outline only shows where the
       letters cross the athlete.
    ========================================= */

    if (bloomFront) {
      const outlineIn =
        smoothstep(
          0.29,
          0.56,
          p
        );

      bloomFront.style.opacity =
        String(outlineIn);
    }

    /* =========================================
       05 — COPY
    ========================================= */

    if (copy) {
      const amount =
        smoothstep(
          0.55,
          0.75,
          p
        );

      copy.style.opacity =
        String(amount);

      copy.style.filter =
        `blur(${(1 - amount) * 7}px)`;
    }

    /* RED RULE */

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

    /* =========================================
       06 — CTA
    ========================================= */

    if (cta) {
      const amount =
        smoothstep(
          0.68,
          0.83,
          p
        );

      cta.style.opacity =
        String(amount);

      cta.style.filter =
        `blur(${(1 - amount) * 6}px)`;
    }

    /* =========================================
       07 — HOLD FINAL COMPOSITION

       After about 83% scroll progress,
       everything stays finished and still.
    ========================================= */

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
