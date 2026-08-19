(() => {
  const stage = document.querySelector('[data-programs-transition]');
  if (!stage) return;

  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }

  const sticky = stage.querySelector('.programs-stage');
  const kicker = stage.querySelector('.programs-kicker');

  const mlsBack = stage.querySelector('.programs-mls-back');
  const mlsFront = stage.querySelector('.programs-mls-front');

  const athlete = stage.querySelector('.programs-athlete');
  const ball = stage.querySelector('.programs-ball');

  const copy = stage.querySelector('.programs-copy');
  const copyLine = copy?.querySelector('i');

  const index = stage.querySelector('.programs-index');

  const clamp = (value, min = 0, max = 1) =>
    Math.min(max, Math.max(min, value));

  const smoothstep = (from, to, value) => {
    const x = clamp((value - from) / (to - from));
    return x * x * (3 - 2 * x);
  };

  const hold = (inStart, inEnd, outStart, outEnd, value) => {
    const enter = smoothstep(inStart, inEnd, value);
    const exit = 1 - smoothstep(outStart, outEnd, value);

    return enter * exit;
  };

  let target = 0;
  let current = 0;
  let raf = 0;
  let lastTime = performance.now();

  function updateTarget() {
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
    const dt = Math.min(
      (now - lastTime) / 1000,
      0.05
    );

    lastTime = now;

    /*
      Lower damping = heavier/smoother movement.

      This intentionally trails the physical scroll position
      so the transition doesn't feel like a jump cut.
    */
    const damping =
      1 - Math.exp(-5.4 * dt);

    current +=
      (target - current) * damping;

    if (
      Math.abs(target - current) <
      0.0004
    ) {
      current = target;
    }

    const p = current;

    /* --------------------------------
       PROGRAMS LABEL
    -------------------------------- */

    if (kicker) {
      const opacity = hold(
        0.05,
        0.16,
        0.86,
        0.98,
        p
      );

      const y =
        (1 -
          smoothstep(
            0.05,
            0.20,
            p
          )) *
        18;

      kicker.style.opacity =
        String(opacity);

      kicker.style.transform =
        `translate3d(-50%, ${y}px, 0)`;
    }

    /* --------------------------------
       GIANT HOLLOW MLS
    -------------------------------- */

    const mlsIn =
      smoothstep(
        0.10,
        0.39,
        p
      );

    const mlsSettle =
      smoothstep(
        0.30,
        0.58,
        p
      );

    if (mlsBack) {
      /*
        Starts a little left.
        Slowly settles into center.
      */
      const x =
        -50 +
        (1 - mlsIn) * -7;

      const scale =
        0.92 +
        mlsIn * 0.08;

      /*
        Outline darkens as it settles.
      */
      const strokeAlpha =
        0.12 +
        mlsSettle * 0.72;

      mlsBack.style.opacity =
        String(
          0.20 +
          mlsIn * 0.80
        );

      mlsBack.style.transform =
        `translate3d(
          ${x}%,
          -46%,
          0
        ) scale(${scale})`;

      mlsBack.style.webkitTextStrokeColor =
        `rgba(
          8,
          8,
          8,
          ${strokeAlpha}
        )`;
    }

    /* --------------------------------
       FRONT MLS OUTLINE

       Very faint second copy sits
       over the athlete.
    -------------------------------- */

    if (mlsFront) {
      const frontIn =
        smoothstep(
          0.48,
          0.68,
          p
        );

      mlsFront.style.opacity =
        String(
          frontIn * 0.22
        );

      mlsFront.style.transform =
        `translate3d(
          -50%,
          -46%,
          0
        ) scale(1)`;
    }

    /* --------------------------------
       ATHLETE
    -------------------------------- */

    if (athlete) {
      const athleteIn =
        smoothstep(
          0.38,
          0.70,
          p
        );

      const y =
        (1 - athleteIn) *
        120;

      const scale =
        0.955 +
        athleteIn * 0.045;

      athlete.style.opacity =
        String(athleteIn);

      athlete.style.transform =
        `translate3d(
          -50%,
          ${y}px,
          0
        ) scale(${scale})`;
    }

    /* --------------------------------
       OPTIONAL SEPARATE BALL

       Later, if we export the Adidas
       ball separately, it can push
       toward the camera independently.
    -------------------------------- */

    if (ball) {
      const ballIn =
        smoothstep(
          0.49,
          0.75,
          p
        );

      const ballPush =
        smoothstep(
          0.62,
          0.92,
          p
        );

      const scale =
        0.90 +
        ballIn * 0.10 +
        ballPush * 0.07;

      const y =
        (1 - ballIn) *
        32;

      ball.style.opacity =
        String(ballIn);

      ball.style.transform =
        `translate3d(
          -50%,
          calc(-50% + ${y}px),
          0
        ) scale(${scale})`;
    }

    /* --------------------------------
       COPY ARRIVES LAST
    -------------------------------- */

    if (copy) {
      const copyIn =
        smoothstep(
          0.66,
          0.88,
          p
        );

      const y =
        (1 - copyIn) *
        34;

      copy.style.opacity =
        String(copyIn);

      copy.style.transform =
        `translate3d(
          0,
          ${y}px,
          0
        )`;
    }

    if (copyLine) {
      const lineIn =
        smoothstep(
          0.74,
          0.93,
          p
        );

      copyLine.style.transform =
        `scaleX(${lineIn})`;
    }

    if (index) {
      const indexIn =
        smoothstep(
          0.72,
          0.92,
          p
        );

      index.style.opacity =
        String(indexIn);

      index.style.transform =
        `translate3d(
          0,
          ${(1 - indexIn) * 16}px,
          0
        )`;
    }

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
    updateTarget,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    updateTarget,
    {
      passive: true
    }
  );

  updateTarget();
})();
