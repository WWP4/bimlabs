// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  if (!section || !gsap || !ScrollTrigger) return null;

  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const safeCards = Array.isArray(cards) ? cards : [];

  if (prefersReducedMotion) {
    prepareReducedState({
      gsap,
      section,
      word,
      voidTarget,
      worldInside,
      copy,
      cardTrack,
      cards: safeCards
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
    cards: safeCards
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none",
      overwrite: "auto"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",

      /*
        This keeps the previous build's faster scroll feel.
        Not too long. Not lazy. Still enough room for the C handoff.
      */
      end: () => {
        const base = window.innerHeight * 5.65;
        return `+=${Math.max(base, 5300)}`;
      },

      pin: true,

      /*
        This matches the previous feel.
        Do not push this too high or the section feels delayed.
      */
      scrub: 0.85,

      anticipatePin: 1,
      invalidateOnRefresh: true,
      fastScrollEnd: false,

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
    =========================================================
    INTRO
    Keep the previous fast entrance.
    PROCESS should arrive quickly.
    =========================================================
  */

  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.92,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      filter: "blur(0px)",
      duration: 0.2,
      ease: "power2.out"
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12,
      ease: "power2.out"
    }, 0.08)

    .to(word, {
      scale: 1.18,
      autoAlpha: 0.9,
      duration: 0.22,
      ease: "power1.inOut"
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.14,
      ease: "power1.inOut"
    }, 0.26);

  /*
    =========================================================
    CARDS
    This keeps the previous build's flow:
    quick vertical pass, not long slow card presentation.

    The old timing was:
    start = 0.3 + index * 0.13
    That felt good, but was a little too compressed.

    This version only opens it slightly.
    =========================================================
  */

  const cardStartBase = 0.31;
  const cardGap = 0.15;

  safeCards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardStartBase + index * cardGap;

    timeline
      .set(card, {
        zIndex: safeCards.length + index,
        pointerEvents: "auto"
      }, 0)

      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.09,
        ease: "power2.out",
        onStart: () => activateCard(safeCards, card),
        onReverseComplete: () => card.classList.remove("is-active")
      }, start)

      .to(card, {
        yPercent: -10,
        scale: 1.012,
        x: side * 4,
        duration: 0.055,
        ease: "none"
      }, start + 0.09)

      .to(card, {
        autoAlpha: 0,
        yPercent: -88,
        x: side * -28,
        scale: 0.95,
        rotateX: -6,
        filter: "blur(1px)",
        duration: 0.11,
        ease: "power1.in",
        onComplete: () => card.classList.remove("is-active")
      }, start + 0.145);
  });

  /*
    =========================================================
    HANDOFF
    Previous build feel, but less snappy.

    The old version jumped:
    scale 1.5 -> 3.15 -> 12.5
    in very tiny durations.

    This keeps the same timing area near the end, but inserts
    one extra camera step so the C zoom feels smoother.
    =========================================================
  */

  timeline
    .to(word, {
      scale: 1.42,
      autoAlpha: 0.78,
      filter: "blur(0px)",
      duration: 0.1,
      ease: "power1.inOut"
    }, 0.755)

    .to(cardTrack, {
      autoAlpha: 0,
      duration: 0.08,
      ease: "power1.out"
    }, 0.775)

    .to(voidTarget, {
      autoAlpha: 0.58,
      scale: 0.82,
      duration: 0.085,
      ease: "power1.inOut"
    }, 0.79)

    .to(worldInside, {
      autoAlpha: 0.18,
      clipPath: "circle(7% at 51.8% 50%)",
      y: 26,
      scale: 0.86,
      filter: "blur(8px)",
      duration: 0.085,
      ease: "power1.inOut"
    }, 0.8)

    /*
      First C push.
    */
    .to(word, {
      scale: 2.45,
      xPercent: -2.7,
      autoAlpha: 0.72,
      filter: "blur(0.6px)",
      duration: 0.095,
      ease: "power2.inOut"
    }, 0.835)

    .to(voidTarget, {
      scale: 2.7,
      autoAlpha: 0.84,
      duration: 0.095,
      ease: "power2.inOut"
    }, 0.835)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(20% at 51.8% 50%)",
      y: 12,
      scale: 0.92,
      filter: "blur(4px)",
      duration: 0.095,
      ease: "power2.inOut"
    }, 0.845)

    /*
      Extra middle step.
      This is what removes the teleport feeling.
    */
    .to(word, {
      scale: 5.1,
      xPercent: -7.2,
      autoAlpha: 0.42,
      filter: "blur(3px)",
      duration: 0.105,
      ease: "power2.inOut"
    }, 0.885)

    .to(voidTarget, {
      scale: 7.2,
      autoAlpha: 0.58,
      duration: 0.105,
      ease: "power2.inOut"
    }, 0.885)

    .to(worldInside, {
      autoAlpha: 0.72,
      clipPath: "circle(62% at 51.8% 50%)",
      y: 4,
      scale: 0.98,
      filter: "blur(1.5px)",
      duration: 0.105,
      ease: "power2.inOut"
    }, 0.892)

    /*
      Final pass through the C.
    */
    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(12px)",
      duration: 0.13,
      ease: "power2.inOut"
    }, 0.94)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13,
      ease: "power2.inOut"
    }, 0.94)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.13,
      ease: "power2.inOut"
    }, 0.94)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1,
      ease: "power1.out"
    }, 0.955);

  let resizeTimer = null;

  const refresh = () => {
    window.clearTimeout(resizeTimer);

    resizeTimer = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 120);
  };

  window.addEventListener("resize", refresh);

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", refresh);
    window.clearTimeout(resizeTimer);
  });

  return timeline;
}

function activateCard(cards, activeCard) {
  cards.forEach((card) => {
    card.classList.toggle("is-active", card === activeCard);
  });
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

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
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
    force3D: true
  });

  gsap.set(voidTarget, {
    autoAlpha: 0,
    scale: 0.14,
    transformOrigin: "50% 50%",
    force3D: true
  });

  gsap.set(worldInside, {
    autoAlpha: 0,
    clipPath: "circle(0% at 51.8% 50%)",
    y: 44,
    scale: 0.8,
    filter: "blur(10px)",
    transformOrigin: "51.8% 50%",
    force3D: true
  });

  gsap.set(copy, {
    autoAlpha: 0,
    y: 28,
    force3D: true
  });

  gsap.set(cardTrack, {
    autoAlpha: 1
  });

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    card.classList.remove("is-active", "is-past");

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 46,
      yPercent: 86,
      scale: 0.94,
      rotateX: 8,
      filter: "blur(0px)",
      transformOrigin: "50% 70%",
      force3D: true
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
    filter: "none"
  });

  gsap.set(copy, {
    autoAlpha: 1,
    y: 0
  });

  gsap.set(cardTrack, {
    autoAlpha: 1
  });

  gsap.set(cards, {
    autoAlpha: 1,
    x: 0,
    yPercent: 0,
    scale: 1,
    rotateX: 0,
    filter: "none"
  });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.8);
  const handoff = mapRange(progress, 0.8, 1);

  if (scene && typeof scene.setProgress === "function") {
    scene.setProgress({
      intro,
      cards,
      handoff
    });
  }

  if (ui && typeof ui.setCardsProgress === "function") {
    ui.setCardsProgress(cards);
  }

  if (ui && typeof ui.softenForHandoff === "function") {
    ui.softenForHandoff(handoff);
  }
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;

  return (value - start) / (end - start);
}
