// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  if (!section || !gsap || !ScrollTrigger) {
    console.warn("[Process] Missing required process setup.");
    return null;
  }

  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const workTrack = section.querySelector("[data-work-track]");

  const cardEls =
    Array.isArray(cards) && cards.length
      ? cards
      : Array.from(section.querySelectorAll(".process-card"));

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!sceneMount || !word) {
    console.warn("[Process] Missing scene or PROCESS word.");
    return null;
  }

  if (prefersReducedMotion) {
    prepareReducedState({
      gsap,
      section,
      word,
      voidTarget,
      worldInside,
      copy,
      cardTrack,
      workTrack,
      cards: cardEls
    });

    return null;
  }

  prepareInitialState({
    gsap,
    section,
    sceneMount,
    word,
    voidTarget,
    worldInside,
    copy,
    cardTrack,
    workTrack,
    cards: cardEls
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 8.4, 7800)}`,
      pin: true,
      scrub: 1.18,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        updateByProgress({
          progress: self.progress,
          section,
          worldInside,
          workTrack,
          scene,
          ui
        });
      },

      onEnter: () => {
        section.classList.add("is-process-active");
        section.classList.remove("is-inside-work");
      },

      onEnterBack: () => {
        section.classList.add("is-process-active");

        section.classList.remove(
          "is-work-interactive",
          "is-inside-work"
        );

        if (worldInside) {
          worldInside.classList.remove("is-interactive");
          worldInside.style.pointerEvents = "none";
        }
      },

      onLeave: () => {
        /*
          Do not add is-inside-work here.
          That class forces CSS !important states and causes the jitter.
        */
        section.classList.remove("is-process-active");
        section.classList.add("is-work-visible", "is-work-interactive");

        if (worldInside) {
          worldInside.removeAttribute("aria-hidden");
          worldInside.classList.add("is-visible", "is-interactive");
          worldInside.style.pointerEvents = "auto";
        }

        if (workTrack) {
          workTrack.style.setProperty("--work-scroll-progress", "0");
        }
      },

      onLeaveBack: () => {
        section.classList.remove(
          "is-process-active",
          "is-work-visible",
          "is-work-interactive",
          "is-inside-work"
        );

        if (worldInside) {
          worldInside.setAttribute("aria-hidden", "true");
          worldInside.classList.remove("is-visible", "is-interactive");
          worldInside.style.pointerEvents = "none";
        }

        if (workTrack) {
          workTrack.style.setProperty("--work-scroll-progress", "0");
        }
      }
    }
  });

  /*
    INTRO
  */
  timeline
    .to(
      section,
      {
        "--process-section-intensity": 1,
        duration: 0.14
      },
      0
    )

    .to(
      word,
      {
        autoAlpha: 0.9,
        scale: 1,
        xPercent: 0,
        yPercent: 0,
        letterSpacing: "-0.085em",
        filter: "blur(0px)",
        force3D: true,
        duration: 0.24
      },
      0
    )

    .to(
      copy,
      {
        autoAlpha: 1,
        y: 0,
        force3D: true,
        duration: 0.14
      },
      0.08
    )

    .to(
      word,
      {
        scale: 1.1,
        autoAlpha: 0.92,
        force3D: true,
        duration: 0.24
      },
      0.22
    )

    .to(
      copy,
      {
        autoAlpha: 0,
        y: -24,
        force3D: true,
        duration: 0.16
      },
      0.31
    );

  /*
    CARDS
  */
  const cardStart = 0.32;
  const cardGap = cardEls.length > 4 ? 0.102 : 0.122;

  cardEls.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardStart + index * cardGap;

    timeline
      .set(
        card,
        {
          zIndex: 20 + index
        },
        0
      )

      .to(
        card,
        {
          autoAlpha: 0.14,
          x: side * 28,
          yPercent: 44,
          scale: 0.965,
          rotateX: 0,
          force3D: true,
          duration: 0.055,
          ease: "power2.out"
        },
        start
      )

      .to(
        card,
        {
          autoAlpha: 1,
          x: 0,
          yPercent: -44,
          scale: 1,
          rotateX: 0,
          force3D: true,
          duration: 0.115,
          ease: "power2.out"
        },
        start + 0.045
      )

      .to(
        card,
        {
          autoAlpha: 1,
          x: 0,
          yPercent: -52,
          scale: 1,
          rotateX: 0,
          force3D: true,
          duration: 0.1,
          ease: "none"
        },
        start + 0.16
      )

      .to(
        card,
        {
          autoAlpha: 0.22,
          x: side * -16,
          yPercent: -116,
          scale: 0.975,
          rotateX: 0,
          force3D: true,
          duration: 0.105,
          ease: "power2.inOut"
        },
        start + 0.26
      )

      .to(
        card,
        {
          autoAlpha: 0,
          x: side * -24,
          yPercent: -148,
          scale: 0.96,
          rotateX: 0,
          force3D: true,
          duration: 0.06,
          ease: "none"
        },
        start + 0.36
      );
  });

  /*
    HANDOFF

    This is the actual fix:
    - Our Work gets opacity 1 early
    - but clip-path keeps it trapped inside the C
    - the aperture expands
    - full screen only happens at the end
    - no is-inside-work class during scroll
  */
  timeline
    .to(
      section,
      {
        "--process-handoff": 0.08,
        duration: 0.05
      },
      0.855
    )

    .to(
      cardTrack,
      {
        autoAlpha: 0,
        duration: 0.08,
        ease: "power1.out"
      },
      0.865
    )

    .to(
      word,
      {
        scale: 1.32,
        xPercent: -0.2,
        autoAlpha: 0.92,
        filter: "blur(0px)",
        force3D: true,
        duration: 0.1
      },
      0.875
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0.48,
        scale: 0.78,
        force3D: true,
        duration: 0.08
      },
      0.89
    )

    /*
      Stage 1:
      Our Work is visible, but only through a tiny aperture.
    */
    .to(
      worldInside,
      {
        autoAlpha: 1,
        visibility: "visible",
        clipPath: "circle(2.5% at 51.8% 50%)",
        webkitClipPath: "circle(2.5% at 51.8% 50%)",
        y: 26,
        scale: 0.9,
        filter: "blur(7px)",
        force3D: true,
        duration: 0.08
      },
      0.905
    )

    .to(
      section,
      {
        "--process-handoff": 0.32,
        duration: 0.08
      },
      0.925
    )

    .to(
      word,
      {
        scale: 2.25,
        xPercent: -2.1,
        autoAlpha: 0.9,
        filter: "blur(0.35px)",
        force3D: true,
        duration: 0.09
      },
      0.94
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0.76,
        scale: 2.45,
        force3D: true,
        duration: 0.09
      },
      0.94
    )

    /*
      Stage 2:
      Still only inside the aperture.
    */
    .to(
      worldInside,
      {
        autoAlpha: 1,
        clipPath: "circle(13% at 51.8% 50%)",
        webkitClipPath: "circle(13% at 51.8% 50%)",
        y: 12,
        scale: 0.955,
        filter: "blur(3.5px)",
        force3D: true,
        duration: 0.09
      },
      0.955
    )

    .to(
      section,
      {
        "--process-handoff": 0.68,
        duration: 0.08
      },
      0.975
    )

    .to(
      word,
      {
        scale: 5.35,
        xPercent: -6.25,
        autoAlpha: 0.42,
        filter: "blur(4px)",
        force3D: true,
        duration: 0.1
      },
      0.99
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0.58,
        scale: 7.2,
        force3D: true,
        duration: 0.1
      },
      0.99
    )

    /*
      Stage 3:
      This is the tunnel moment.
    */
    .to(
      worldInside,
      {
        autoAlpha: 1,
        clipPath: "circle(48% at 51.8% 50%)",
        webkitClipPath: "circle(48% at 51.8% 50%)",
        y: 2,
        scale: 0.992,
        filter: "blur(1.1px)",
        force3D: true,
        duration: 0.1
      },
      0.997
    )

    .to(
      section,
      {
        "--process-handoff": 1,
        "--process-section-intensity": 0.08,
        duration: 0.1
      },
      1.045
    )

    .to(
      word,
      {
        scale: 10.8,
        xPercent: -12.4,
        autoAlpha: 0,
        filter: "blur(12px)",
        force3D: true,
        duration: 0.13
      },
      1.055
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0,
        scale: 15.5,
        force3D: true,
        duration: 0.13
      },
      1.055
    )

    /*
      Stage 4:
      Full screen only here.
    */
    .to(
      worldInside,
      {
        autoAlpha: 1,
        clipPath: "circle(155% at 51.8% 50%)",
        webkitClipPath: "circle(155% at 51.8% 50%)",
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        force3D: true,
        duration: 0.16
      },
      1.065
    );

  const refresh = debounce(() => {
    ScrollTrigger.refresh();
  }, 180);

  window.addEventListener("resize", refresh);

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", refresh);
  });

  return timeline;
}

/* =========================================================
   INITIAL STATE
========================================================= */

function prepareInitialState({
  gsap,
  section,
  sceneMount,
  word,
  voidTarget,
  worldInside,
  copy,
  cardTrack,
  workTrack,
  cards
}) {
  section.classList.remove(
    "is-process-active",
    "is-work-visible",
    "is-work-interactive",
    "is-inside-work"
  );

  section.style.setProperty("--process-section-intensity", "0");
  section.style.setProperty("--process-intro", "0");
  section.style.setProperty("--process-cards", "0");
  section.style.setProperty("--process-handoff", "0");

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    yPercent: 0,
    transformOrigin: "52% 50%",
    force3D: true
  });

  gsap.set(word, {
    autoAlpha: 0.28,
    scale: 0.46,
    xPercent: 0,
    yPercent: 28,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.06em",
    force3D: true,
    clearProps: "visibility,pointerEvents"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0,
      scale: 0.14,
      transformOrigin: "50% 50%",
      force3D: true
    });
  }

  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");
    worldInside.style.pointerEvents = "none";

    gsap.set(worldInside, {
      autoAlpha: 0,
      visibility: "hidden",
      clipPath: "circle(0% at 51.8% 50%)",
      webkitClipPath: "circle(0% at 51.8% 50%)",
      y: 44,
      scale: 0.88,
      filter: "blur(10px)",
      transformOrigin: "51.8% 50%",
      force3D: true
    });
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 0,
      y: 28,
      force3D: true
    });
  }

  if (cardTrack) {
    gsap.set(cardTrack, {
      autoAlpha: 1,
      visibility: "visible",
      pointerEvents: "none"
    });
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      visibility: "visible",
      x: side * 30,
      yPercent: 42,
      scale: 0.965,
      rotateX: 0,
      transformOrigin: "50% 52%",
      force3D: true,
      clearProps: "display"
    });
  });
}

/* =========================================================
   REDUCED MOTION
========================================================= */

function prepareReducedState({
  gsap,
  section,
  word,
  voidTarget,
  worldInside,
  copy,
  cardTrack,
  workTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", "1");
  section.style.setProperty("--process-intro", "1");
  section.style.setProperty("--process-cards", "1");
  section.style.setProperty("--process-handoff", "0");

  section.classList.remove(
    "is-inside-work",
    "is-work-visible",
    "is-work-interactive"
  );

  gsap.set(word, {
    clearProps: "all"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0
    });
  }

  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
      filter: "none"
    });
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 1,
      y: 0
    });
  }

  if (cardTrack) {
    gsap.set(cardTrack, {
      autoAlpha: 1,
      visibility: "visible"
    });
  }

  gsap.set(cards, {
    autoAlpha: 1,
    x: 0,
    yPercent: 0,
    scale: 1,
    rotateX: 0
  });

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }
}

/* =========================================================
   PROGRESS HOOKS
========================================================= */

function updateByProgress({
  progress,
  section,
  worldInside,
  workTrack,
  scene,
  ui
}) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.84);
  const handoff = mapRange(progress, 0.86, 1);

  section.style.setProperty("--process-intro", intro.toFixed(4));
  section.style.setProperty("--process-cards", cards.toFixed(4));
  section.style.setProperty("--process-handoff", handoff.toFixed(4));

  /*
    Visible early, interactive late.
    This prevents hover/click states from firing during the zoom.
  */
  const workVisible = progress >= 0.895;
  const workInteractive = progress >= 0.996;

  section.classList.toggle("is-work-visible", workVisible);
  section.classList.toggle("is-work-interactive", workInteractive);

  /*
    Never allow the hard-lock class during the scrubbed handoff.
    process-scene.css has !important rules for this class, which can create jumps.
  */
  section.classList.remove("is-inside-work");

  if (worldInside) {
    worldInside.classList.toggle("is-visible", workVisible);
    worldInside.classList.toggle("is-interactive", workInteractive);

    if (workVisible) {
      worldInside.removeAttribute("aria-hidden");
    } else {
      worldInside.setAttribute("aria-hidden", "true");
    }

    worldInside.style.pointerEvents = workInteractive ? "auto" : "none";
  }

  /*
    Our Work should not scroll/move itself during the PROCESS camera move.
  */
  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  if (scene?.setProgress) {
    scene.setProgress({
      intro,
      cards,
      handoff
    });
  }

  if (ui?.setCardsProgress) {
    ui.setCardsProgress(cards);
  }

  if (ui?.softenForHandoff) {
    ui.softenForHandoff(handoff);
  }

  if (ui?.setProgress) {
    ui.setProgress({
      intro,
      cards,
      handoff,
      workZoom: handoff,
      workReveal: mapRange(progress, 0.895, 1),
      workScroll: 0,
      insideWork: false
    });
  }
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}

function debounce(fn, wait = 120) {
  let timeout;

  return (...args) => {
    window.clearTimeout(timeout);

    timeout = window.setTimeout(() => {
      fn(...args);
    }, wait);
  };
}
