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
  const cardCount = safeCards.length;

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
        Fast entrance.
        Long enough middle and handoff to remove the snappy/buggy feeling.
      */
      end: () => {
        const introDistance = window.innerHeight * 0.65;
        const cardDistance = Math.max(cardCount, 4) * window.innerHeight * 1.25;
        const handoffDistance = window.innerHeight * 1.85;

        return `+=${Math.max(introDistance + cardDistance + handoffDistance, 5400)}`;
      },

      pin: true,

      /*
        Smooth, but not lazy.
        true = too snappy.
        1.15+ = too delayed.
        0.85 is the better balance for your section.
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
    Fast entry into PROCESS, but eased enough to avoid a slap.
    =========================================================
  */

  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.55
    }, 0)

    .to(word, {
      autoAlpha: 0.56,
      scale: 0.76,
      xPercent: 0,
      yPercent: 10,
      letterSpacing: "-0.068em",
      filter: "blur(0px)",
      duration: 0.55,
      ease: "power2.out"
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out"
    }, 0.1)

    .to(word, {
      autoAlpha: 0.9,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.7,
      ease: "power2.out"
    }, 0.45)

    .to(word, {
      scale: 1.08,
      autoAlpha: 0.92,
      duration: 0.65,
      ease: "power1.inOut"
    }, 1.05)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      duration: 0.5,
      ease: "power1.inOut"
    }, 1.2);

  /*
    =========================================================
    CARDS
    Smooth vertical flow.
    No tiny hard jumps.
    Each card gets a real approach, readable pass, and exit.
    =========================================================
  */

  const cardsStart = 1.45;
  const cardUnit = 1.65;

  safeCards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardsStart + index * cardUnit;

    timeline
      .set(card, {
        zIndex: safeCards.length + index,
        pointerEvents: "auto"
      }, 0)

      .fromTo(card,
        {
          autoAlpha: 0,
          x: side * 90,
          yPercent: 96,
          scale: 0.94,
          rotateX: 0,
          filter: "blur(3px)"
        },
        {
          autoAlpha: 1,
          x: side * 46,
          yPercent: 46,
          scale: 0.975,
          filter: "blur(1.5px)",
          duration: 0.5,
          ease: "power2.out"
        },
        start
      )

      .to(card, {
        x: 0,
        yPercent: -50,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.76,
        ease: "power2.inOut",
        onStart: () => activateCard(safeCards, card),
        onReverseComplete: () => card.classList.remove("is-active")
      }, start + 0.46)

      /*
        Tiny readable drift.
        Not a frozen hold, because frozen holds feel snappy when scrubbed.
      */
      .to(card, {
        x: 0,
        yPercent: -58,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.42,
        ease: "none"
      }, start + 1.2)

      .to(card, {
        x: side * -18,
        yPercent: -108,
        scale: 0.985,
        filter: "blur(1px)",
        duration: 0.58,
        ease: "power1.inOut"
      }, start + 1.62)

      .to(card, {
        autoAlpha: 0,
        x: side * -46,
        yPercent: -154,
        scale: 0.96,
        filter: "blur(3px)",
        duration: 0.38,
        ease: "power1.in",
        onComplete: () => card.classList.remove("is-active")
      }, start + 2.06);
  });

  /*
    =========================================================
    HANDOFF
    Smooth camera push through the C.
    The old version jumped too hard from small scale to huge scale.
    This breaks the zoom into smaller steps.
    =========================================================
  */

  const handoffStart = cardsStart + cardCount * cardUnit + 0.45;

  timeline
    .to(cardTrack, {
      autoAlpha: 0,
      duration: 1.05,
      ease: "power1.inOut"
    }, handoffStart)

    .to(word, {
      scale: 1.18,
      xPercent: 0,
      autoAlpha: 0.82,
      filter: "blur(0px)",
      duration: 1.05,
      ease: "power1.inOut"
    }, handoffStart)

    .to(voidTarget, {
      autoAlpha: 0.36,
      scale: 0.72,
      duration: 0.95,
      ease: "power1.inOut"
    }, handoffStart + 0.25)

    .to(worldInside, {
      autoAlpha: 0.08,
      clipPath: "circle(4% at 51.8% 50%)",
      y: 28,
      scale: 0.86,
      filter: "blur(8px)",
      duration: 0.95,
      ease: "power1.inOut"
    }, handoffStart + 0.25)

    /*
      First push toward C.
    */
    .to(word, {
      scale: 1.75,
      xPercent: -1.8,
      autoAlpha: 0.88,
      filter: "blur(0px)",
      duration: 1.05,
      ease: "power2.inOut"
    }, handoffStart + 1.05)

    .to(voidTarget, {
      autoAlpha: 0.7,
      scale: 1.85,
      duration: 1.05,
      ease: "power2.inOut"
    }, handoffStart + 1.05)

    .to(worldInside, {
      autoAlpha: 0.22,
      clipPath: "circle(13% at 51.8% 50%)",
      y: 18,
      scale: 0.9,
      filter: "blur(6px)",
      duration: 1.05,
      ease: "power2.inOut"
    }, handoffStart + 1.08)

    /*
      Middle push.
    */
    .to(word, {
      scale: 3.35,
      xPercent: -4.8,
      autoAlpha: 0.82,
      filter: "blur(0.5px)",
      duration: 1.15,
      ease: "power2.inOut"
    }, handoffStart + 2.0)

    .to(voidTarget, {
      autoAlpha: 0.82,
      scale: 4.15,
      duration: 1.15,
      ease: "power2.inOut"
    }, handoffStart + 2.0)

    .to(worldInside, {
      autoAlpha: 0.44,
      clipPath: "circle(34% at 51.8% 50%)",
      y: 8,
      scale: 0.94,
      filter: "blur(3px)",
      duration: 1.15,
      ease: "power2.inOut"
    }, handoffStart + 2.05)

    /*
      Deep push.
    */
    .to(word, {
      scale: 6.8,
      xPercent: -9.2,
      autoAlpha: 0.36,
      filter: "blur(4px)",
      duration: 1.15,
      ease: "power2.inOut"
    }, handoffStart + 3.05)

    .to(voidTarget, {
      autoAlpha: 0.54,
      scale: 9,
      duration: 1.15,
      ease: "power2.inOut"
    }, handoffStart + 3.05)

    .to(worldInside, {
      autoAlpha: 0.72,
      clipPath: "circle(78% at 51.8% 50%)",
      y: 2,
      scale: 0.985,
      filter: "blur(1.5px)",
      duration: 1.15,
      ease: "power2.inOut"
    }, handoffStart + 3.12)

    /*
      Final pass through C.
    */
    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(12px)",
      duration: 1.25,
      ease: "power2.inOut"
    }, handoffStart + 4.05)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 1.25,
      ease: "power2.inOut"
    }, handoffStart + 4.05)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.25,
      ease: "power2.inOut"
    }, handoffStart + 4.1)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 1,
      ease: "power1.out"
    }, handoffStart + 4.55);

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
    autoAlpha: 0.18,
    scale: 0.42,
    xPercent: 0,
    yPercent: 34,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.052em",
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
    y: 32,
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
      x: side * 90,
      yPercent: 96,
      scale: 0.94,
      rotateX: 0,
      filter: "blur(3px)",
      transformOrigin: "50% 52%",
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
  /*
    This tells your other process modules where we are.
    Intro is quicker now.
    Cards still get the main scroll space.
    Handoff starts late and has room to breathe.
  */

  const intro = mapRange(progress, 0.02, 0.18);
  const cards = mapRange(progress, 0.16, 0.76);
  const handoff = mapRange(progress, 0.74, 1);

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
