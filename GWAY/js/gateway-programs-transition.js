(() => {
  const stage = document.querySelector(
    '[data-programs-transition]'
  );

  if (!stage) return;

  const reducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (reducedMotion.matches) return;

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
      Smooth visual damping.

      The physical page can move quickly
      when the mouse wheel is used, but
      the animation eases toward that
      position instead of snapping.
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

    /* ==========================================
       PROGRAMS LABEL
       Soft dissolve. No movement.
    ========================================== */

    if (kicker) {
      const intro =
        smoothstep(
          0.04,
          0.18,
          p
        );

      kicker.style.opacity =
        String(intro);

      kicker.style.filter =
        `blur(${(1 - intro) * 5}px)`;
    }

    /* ==========================================
       GIANT HOLLOW MLS

       Typography slowly resolves from
       faint + loose into crisp.
    ========================================== */

    const typeIn =
      smoothstep(
        0.08,
        0.44,
        p
      );

    const typeResolve =
      smoothstep(
        0.28,
        0.62,
        p
      );

    if (mlsBack) {
      const opacity =
        0.14 +
        typeIn *
        0.86;

      const scale =
        0.975 +
        typeResolve *
        0.025;

      /*
        Letters start slightly spaced out
        then close into the final word.
      */
      const spacing =
        0.055 -
        typeResolve *
        0.075;

      const strokeAlpha =
        0.08 +
        typeResolve *
        0.78;

      mlsBack.style.opacity =
        String(opacity);

      mlsBack.style.transform =
        `translate3d(
          -50%,
          -50%,
          0
        )
        scale(${scale})`;

      mlsBack.style.letterSpacing =
        `${spacing}em`;

      mlsBack.style.webkitTextStrokeColor =
        `rgba(
          10,
          10,
          10,
          ${strokeAlpha}
        )`;
    }

    /* ==========================================
       ATHLETE DISSOLVE

       No sliding.
       No rising.
       No horizontal movement.

       Athlete simply materializes in place.
    ========================================== */

    if (athlete) {
      const athleteIn =
        smoothstep(
          0.34,
          0.70,
          p
        );

      const blur =
        (1 - athleteIn) *
        14;

      const saturation =
        0.82 +
        athleteIn *
        0.18;

      const contrast =
        0.96 +
        athleteIn *
        0.04;

      /*
        Almost zero scale movement.
        Only 0.995 -> 1.0.
      */
      const scale =
        0.995 +
        athleteIn *
        0.005;

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

    /* ==========================================
       FRONT MLS OUTLINE

       Very subtle duplicate outline over
       the athlete for layered depth.
    ========================================== */

    if (mlsFront) {
      const frontIn =
        smoothstep(
          0.54,
          0.78,
          p
        );

      mlsFront.style.opacity =
        String(
          frontIn *
          0.16
        );

      mlsFront.style.letterSpacing =
        `-0.02em`;

      mlsFront.style.transform =
        `translate3d(
          -50%,
          -50%,
          0
        )
        scale(1)`;
    }

    /* ==========================================
       COPY

       Copy dissolves into focus.
       No slide animation.
    ========================================== */

    if (copy) {
      const copyIn =
        smoothstep(
          0.66,
          0.88,
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

    /* Red copy rule */
    if (copyLine) {
      const lineIn =
        smoothstep(
          0.74,
          0.92,
          p
        );

      copyLine.style.transform =
        `scaleX(${lineIn})`;
    }

    /* ==========================================
       CTA
       Comes in last.
    ========================================== */

    if (cta) {
      const ctaIn =
        smoothstep(
          0.76,
          0.96,
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

    /* Optional CSS progress variable */
    if (sticky) {
      sticky.style.setProperty(
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
