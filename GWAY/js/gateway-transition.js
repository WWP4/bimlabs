(() => {
  const stage = document.querySelector(
    '[data-hero-transition]'
  );

  if (!stage) return;

  const reduceMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  );

  if (reduceMotion.matches) return;

  const hero =
    stage.querySelector('.gway-hero');

  const bg =
    stage.querySelector('.gway-hero-bg');

  const overlay =
    stage.querySelector('.gway-hero-overlay');

  const content =
    stage.querySelector('.gway-hero-content');

  const titleLines = [
    ...stage.querySelectorAll(
      '.gway-hero h1 span'
    )
  ];

  const support =
    stage.querySelector('.gway-hero-bottom');

  const reveal =
    stage.querySelector(
      '.gway-section-reveal'
    );

  const revealIntro =
    stage.querySelector(
      '.gway-section-reveal-intro'
    );

  const revealLine =
    revealIntro?.querySelector('i');

  const header =
    document.querySelector('.gway-header');


  /* -----------------------------
     HELPERS
  ----------------------------- */

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


  /* -----------------------------
     READ SCROLL
  ----------------------------- */

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
      raf =
        requestAnimationFrame(
          render
        );
    }
  }


  /* -----------------------------
     RENDER
  ----------------------------- */

  function render() {

    /*
      A little more smoothing than before.

      Previous:
      0.18

      New:
      0.105

      Lower = more cinematic / less twitchy.
    */
    current +=
      (target - current) *
      0.105;


    if (
      Math.abs(
        target - current
      ) < 0.0006
    ) {
      current = target;
    }


    const p = current;


    /* =========================
       PHASE 1
       HERO BREATHES
       0 → .22
    ========================= */


    if (bg) {

      const bgMove =
        smoothstep(
          0,
          0.72,
          p
        );

      const scale =
        1.015 +
        bgMove * 0.055;

      const y =
        bgMove * 1.4;


      bg.style.transform =
        `
        translate3d(
          0,
          ${y}%,
          0
        )
        scale(${scale})
        `;
    }


    /*
      Do not kill the hero immediately.

      It stays readable for the
      beginning of the scroll.
    */

    const heroExit =
      smoothstep(
        0.12,
        0.48,
        p
      );


    if (content) {

      const scale =
        1 -
        heroExit * 0.022;

      const y =
        heroExit * -24;


      content.style.transform =
        `
        translate3d(
          0,
          ${y}px,
          0
        )
        scale(${scale})
        `;

      content.style.transformOrigin =
        'left center';
    }


    /* =========================
       SUPPORT COPY
    ========================= */

    if (support) {

      const fade =
        1 -
        smoothstep(
          0.13,
          0.38,
          p
        );


      support.style.opacity =
        String(fade);


      support.style.transform =
        `
        translate3d(
          ${-12 * heroExit}px,
          ${-5 * heroExit}px,
          0
        )
        `;
    }


    /* =========================
       HERO HEADLINE

       Slower stagger than before.
    ========================= */

    titleLines.forEach(
      (line, index) => {

        const stagger =
          index * 0.028;


        const lineExit =
          smoothstep(
            0.18 + stagger,
            0.51 + stagger,
            p
          );


        line.style.opacity =
          String(
            1 - lineExit
          );


        line.style.transform =
          `
          translate3d(
            0,
            ${
              -16 *
              lineExit *
              (index + 1)
            }px,
            0
          )
          `;
      }
    );


    /* =========================
       HEADER
    ========================= */

    if (header) {

      const headerExit =
        smoothstep(
          0.08,
          0.30,
          p
        );


      header.style.opacity =
        String(
          1 - headerExit
        );


      header.style.transform =
        `
        translate3d(
          0,
          ${-14 * headerExit}px,
          0
        )
        `;


      header.style.pointerEvents =
        headerExit > 0.92
          ? 'none'
          : '';
    }


    /* =========================
       OVERLAY

       Let image gently breathe.
    ========================= */

    if (overlay) {

      const overlayMove =
        smoothstep(
          0.08,
          0.65,
          p
        );


      overlay.style.opacity =
        String(
          1 -
          overlayMove * 0.13
        );
    }


    /* =========================
       PHASE 2
       WHITE PANEL ENTERS

       Slower entrance.
    ========================= */

    const panelProgress =
      smoothstep(
        0.23,
        0.63,
        p
      );


    if (reveal) {

      const panelY =
        (
          1 -
          panelProgress
        ) * 100;


      reveal.style.transform =
        `
        translate3d(
          0,
          ${panelY}%,
          0
        )
        `;


      /*
        Keep top line visible longer.
      */

      const topLineFade =
        1 -
        smoothstep(
          0.80,
          0.98,
          p
        );


      reveal.style.setProperty(
        '--reveal-line-opacity',
        String(topLineFade)
      );
    }


    /* =========================
       PHASE 3
       WHY GSA PREP

       IMPORTANT:
       There is NO exit fade.
    ========================= */

    if (revealIntro) {

      /*
        Wait until white panel is
        substantially visible.
      */

      const introIn =
        smoothstep(
          0.43,
          0.61,
          p
        );


      /*
        Slow growth across a large
        portion of the scroll.
      */

      const introGrow =
        smoothstep(
          0.49,
          0.96,
          p
        );


      /*
        Start understated.

        End only ~13% larger.

        Premium, not gimmicky.
      */

      const scale =
        0.94 +
        introGrow *
        0.13;


      /*
        Very tiny upward drift.

        Almost imperceptible.
      */

      const y =
        (
          1 -
          introIn
        ) *
        20 -
        introGrow *
        7;


      /*
        No fade-out.

        Once visible, it stays visible
        through the end of the pinned
        transition.

        When the transition wrapper
        naturally leaves the viewport,
        the title travels away with it.
      */

      revealIntro.style.opacity =
        String(introIn);


      revealIntro.style.transform =
        `
        translate3d(
          -50%,
          calc(
            -50% + ${y}px
          ),
          0
        )
        scale(${scale})
        `;
    }


    /* =========================
       RED INTRO LINE
    ========================= */

    if (revealLine) {

      const lineGrow =
        smoothstep(
          0.49,
          0.67,
          p
        );


      revealLine.style.transform =
        `
        scaleX(
          ${lineGrow}
        )
        `;
    }


    /* =========================
       CSS PROGRESS VARIABLE
    ========================= */

    if (hero) {

      hero.style.setProperty(
        '--hero-scroll-progress',
        p.toFixed(4)
      );
    }


    /* =========================
       RAF LOOP
    ========================= */

    if (current !== target) {

      raf =
        requestAnimationFrame(
          render
        );

    } else {

      raf = 0;
    }
  }


  /* -----------------------------
     EVENTS
  ----------------------------- */

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
