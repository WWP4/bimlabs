(() => {
  const section = document.querySelector('[data-programs-transition]');
  if (!section) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  const stage = section.querySelector('.programs-stage');
  const kicker = section.querySelector('.programs-kicker');

  const backMLS = section.querySelector('.bloom-text-back');
  const athlete = section.querySelector('.bloom-athlete');

  const silverOutline = section.querySelector(
    '.bloom-text-outline--silver'
  );

  const whiteOutline = section.querySelector(
    '.bloom-text-outline--white'
  );

  const copy = section.querySelector('.programs-copy');
  const copyLine = copy?.querySelector('i');
  const cta = section.querySelector('.programs-cta');

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

  function getProgress() {
    const rect = section.getBoundingClientRect();

    const travel = Math.max(
      1,
      section.offsetHeight - window.innerHeight
    );

    return clamp(
      -rect.top / travel
    );
  }

  function requestRender() {
    target = getProgress();

    if (!raf) {
      lastTime = performance.now();

      raf = requestAnimationFrame(render);
    }
  }

  function render(now) {
    const dt = Math.min(
      (now - lastTime) / 1000,
      0.05
    );

    lastTime = now;

    /*
      Smooth the scroll animation.

      IMPORTANT:

      JS is NOT controlling which layer is
      in front or behind.

      The HTML/SVG physically uses this order:

      1. SOLID CREAM MLS
      2. ATHLETE PNG
      3. SILVER MLS OUTLINE
      4. WHITE MLS OUTLINE

      That means the athlete is actually
      sandwiched between the two MLS layers.
    */

    const damping =
      1 - Math.exp(-5.6 * dt);

    current +=
      (target - current) *
      damping;

    if (
      Math.abs(target - current) <
      0.00035
    ) {
      current = target;
    }

    const p = current;

    /* =========================================
       01 — PROGRAMS LABEL
    ========================================= */

    if (kicker) {
      const amount = smoothstep(
        0.02,
        0.13,
        p
      );

      kicker.style.opacity =
        String(amount);

      kicker.style.filter =
        `blur(${(1 - amount) * 5}px)`;
    }

    /* =========================================
       02 — BASE MLS

       SOLID CREAM WORD
       PHYSICALLY BEHIND ATHLETE
    ========================================= */

    if (backMLS) {
      const amount = smoothstep(
        0.055,
        0.24,
        p
      );

      const settle = smoothstep(
        0.055,
        0.31,
        p
      );

      const scale =
        0.986 +
        settle * 0.014;

      backMLS.style.opacity =
        String(amount);

      backMLS.style.transform =
        `scale(${scale})`;
    }

    /* =========================================
       03 — ATHLETE

       Athlete appears OVER the solid MLS.

       No slide.
       No left/right movement.

       Just blur -> sharp.
    ========================================= */

    const athleteIn = smoothstep(
      0.18,
      0.47,
      p
    );

    if (athlete) {
      const blur =
        (1 - athleteIn) * 14;

      const saturation =
        0.92 +
        athleteIn * 0.08;

      const contrast =
        0.99 +
        athleteIn * 0.01;

      const scale =
        1.008 -
        athleteIn * 0.008;

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
       04 — FRONT MLS OUTLINE

       FULL MLS OUTLINE.

       This is NOT masked to the athlete.

       It physically sits ABOVE the athlete
       because these SVG elements come after
       the athlete image.

       SILVER = thicker outside edge
       WHITE  = crisp inner edge
    ========================================= */

    const outlineIn = smoothstep(
      0.25,
      0.50,
      p
    );

    if (silverOutline) {
      silverOutline.style.opacity =
        String(outlineIn * 0.98);
    }

    if (whiteOutline) {
      const whiteIn = smoothstep(
        0.30,
        0.54,
        p
      );

      whiteOutline.style.opacity =
        String(whiteIn);
    }

    /* =========================================
       05 — PROGRAM COPY
    ========================================= */

    if (copy) {
      const amount = smoothstep(
        0.52,
        0.73,
        p
      );

      copy.style.opacity =
        String(amount);

      copy.style.filter =
        `blur(${(1 - amount) * 7}px)`;
    }

    /* RED LINE */

    if (copyLine) {
      const amount = smoothstep(
        0.61,
        0.78,
        p
      );

      copyLine.style.transform =
        `scaleX(${amount})`;
    }

    /* =========================================
       06 — CTA
    ========================================= */

    if (cta) {
      const amount = smoothstep(
        0.67,
        0.82,
        p
      );

      cta.style.opacity =
        String(amount);

      cta.style.filter =
        `blur(${(1 - amount) * 6}px)`;
    }

    /* =========================================
       STORE PROGRESS
    ========================================= */

    if (stage) {
      stage.style.setProperty(
        '--programs-progress',
        p.toFixed(4)
      );
    }

    /* =========================================
       CONTINUE ANIMATION UNTIL SETTLED
    ========================================= */

    if (current !== target) {
      raf =
        requestAnimationFrame(render);
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
