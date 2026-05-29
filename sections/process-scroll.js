// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || !sceneMount || !word || !voidTarget || !worldInside) {
    console.warn("[Process] Missing required process elements.");
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
      cards
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
    cards
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 5.6, 5400)}`,
      pin: true,
      scrub: 0.85,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        updateByProgress({
          progress: self.progress,
          scene,
          ui
        });
      },

      onEnter: () => section.classList.add("is-process-active"),
      onEnterBack: () => section.classList.add("is-process-active"),
      onLeave: () => section.classList.remove("is-process-active"),
      onLeaveBack: () => section.classList.remove("is-process-active")
    }
  });

  /*
    PHASE 1:
    Bring PROCESS into the scene.
  */
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.92,
      scale: 1,
      xPercent: 0,
      yPercent: 0,
      letterSpacing: "-0.085em",
      filter: "blur(0px)",
      duration: 0.2
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12
    }, 0.08)

    .to(word, {
      scale: 1.22,
      xPercent: 0,
      yPercent: 0,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.14
    }, 0.26);

  /*
    PHASE 2:
    Process cards pass in front.
  */
  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = 0.3 + index * 0.13;

    timeline
      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.075
      }, start)

      .to(card, {
        yPercent: -10,
        scale: 1.015,
        duration: 0.045
      }, start + 0.075)

      .to(card, {
        autoAlpha: 0,
        yPercent: -86,
        x: side * -28,
        scale: 0.95,
        rotateX: -7,
        duration: 0.095
      }, start + 0.13);
  });

  /*
    PHASE 3:
    C aperture handoff.

    Critical rules:
    - Do not move PROCESS sideways during zoom.
    - Do not move worldInside vertically.
    - The aperture location is controlled by CSS.
    - JS only grows the aperture and pushes the word through scale/blur.
  */
  timeline
    .to(word, {
      scale: 1.52,
      xPercent: 0,
      yPercent: 0,
      autoAlpha: 0.78,
      filter: "blur(0px)",
      duration: 0.12
    }, 0.76)

    .to(cards, {
      autoAlpha: 0,
      duration: 0.08
    }, 0.78)

    .to(voidTarget, {
      autoAlpha: 0.88,
      scale: 0.72,
      duration: 0.055
    }, 0.79)

    .to(worldInside, {
      autoAlpha: 0.18,
      width: "5.8vmax",
      height: "5.8vmax",
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(12px)",
      duration: 0.06
    }, 0.805)

    .to(word, {
      scale: 2.45,
      xPercent: 0,
      yPercent: 0,
      autoAlpha: 0.62,
      filter: "blur(1px)",
      duration: 0.07
    }, 0.83)

    .to(voidTarget, {
      scale: 2.4,
      autoAlpha: 0.82,
      duration: 0.07
    }, 0.83)

    .to(worldInside, {
      autoAlpha: 0.46,
      width: "14vmax",
      height: "14vmax",
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(6px)",
      duration: 0.075
    }, 0.855)

    .to(word, {
      scale: 4.7,
      xPercent: 0,
      yPercent: 0,
      autoAlpha: 0.34,
      filter: "blur(5px)",
      duration: 0.08
    }, 0.875)

    .to(voidTarget, {
      scale: 5.4,
      autoAlpha: 0.58,
      duration: 0.08
    }, 0.875)

    .to(worldInside, {
      autoAlpha: 0.82,
      width: "44vmax",
      height: "44vmax",
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(2px)",
      duration: 0.08
    }, 0.875)

    .to(word, {
      scale: 12.5,
      xPercent: 0,
      yPercent: 0,
      autoAlpha: 0,
      filter: "blur(16px)",
      duration: 0.13
    }, 0.91)

    .to(voidTarget, {
      scale: 16,
      autoAlpha: 0,
      duration: 0.13
    }, 0.91)

    .to(worldInside, {
      autoAlpha: 1,
      width: "245vmax",
      height: "245vmax",
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      duration: 0.14
    }, 0.91)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.92);

  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("resize", refresh);

  return timeline;
}

function prepareInitialState({
  gsap,
  section,
  sceneMount,
  word,
  voidTarget,
  worldInside,
  copy,
  cardTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", 0);

  /*
    Scene stays centered.
    The aperture target itself is handled in CSS with:
    --process-aperture-x / --process-aperture-y.
  */
  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    yPercent: 0,
    transformOrigin: "50% 50%"
  });

  gsap.set(word, {
    autoAlpha: 0.28,
    scale: 0.46,
    xPercent: 0,
    yPercent: 28,
    filter: "blur(0px)",
    letterSpacing: "-0.06em"
  });

  gsap.set(voidTarget, {
    autoAlpha: 0,
    scale: 0.14,
    x: 0,
    y: 0,
    transformOrigin: "50% 50%"
  });

  /*
    This must start at x/y 0.
    The old y:44 was causing the section inside the C to sit too low.
  */
  gsap.set(worldInside, {
    autoAlpha: 0,
    width: "0vmax",
    height: "0vmax",
    x: 0,
    y: 0,
    scale: 1,
    filter: "blur(12px)",
    transformOrigin: "50% 50%"
  });

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 0,
      y: 28
    });
  }

  if (cardTrack) {
    gsap.set(cardTrack, {
      autoAlpha: 1
    });
  }

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 46,
      yPercent: 86,
      scale: 0.94,
      rotateX: 8,
      transformOrigin: "50% 70%"
    });
  });
}

function prepareReducedState({
  gsap,
  section,
  word,
  voidTarget,
  worldInside,
  copy,
  cardTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", 1);

  gsap.set(word, {
    clearProps: "all"
  });

  gsap.set(voidTarget, {
    autoAlpha: 0
  });

  gsap.set(worldInside, {
    autoAlpha: 0,
    width: "0vmax",
    height: "0vmax",
    x: 0,
    y: 0,
    filter: "none"
  });

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 1,
      y: 0
    });
  }

  if (cardTrack) {
    gsap.set(cardTrack, {
      autoAlpha: 1
    });
  }

  gsap.set(cards, {
    autoAlpha: 1,
    x: 0,
    yPercent: 0,
    scale: 1,
    rotateX: 0
  });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.8);
  const handoff = mapRange(progress, 0.8, 1);

  scene.setProgress({
    intro,
    cards,
    handoff
  });

  ui.setCardsProgress(cards);
  ui.softenForHandoff(handoff);
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;

  return (value - start) / (end - start);
}
