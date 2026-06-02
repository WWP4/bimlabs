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

  const cardCount = cards?.length || 0;

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

      /*
        Keep the sequence cinematic without trapping the page.
        The section has enough scroll distance to breathe, while a moderate
        scrub keeps motion fluid instead of feeling jumpy or locked.
      */
      end: () => {
        const introDistance = window.innerHeight * 1.32;
        const cardDistance = Math.max(cardCount, 4) * window.innerHeight * 1.62;
        const handoffDistance = window.innerHeight * 1.22;

        return `+=${Math.max(introDistance + cardDistance + handoffDistance, 7600)}`;
      },

      pin: true,

      /*
        Moderate scrub softens wheel/touch input so the cards flow between
        beats without snapping to every scroll tick.
      */
      scrub: 1.15,

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
    =========================================================
    INTRO
    PROCESS should not slap the user immediately.
    It should come forward, settle, and become the background.
    =========================================================
  */

  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.65
    }, 0)

    .to(word, {
      autoAlpha: 0.52,
      scale: 0.72,
      xPercent: 0,
      yPercent: 12,
      letterSpacing: "-0.068em",
      filter: "blur(0px)",
      duration: 0.7
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.55
    }, 0.18)

    .to(word, {
      autoAlpha: 0.88,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.95
    }, 0.75)

    .to(word, {
      scale: 1.09,
      autoAlpha: 0.92,
      duration: 0.95
    }, 1.55)

    .to(copy, {
      autoAlpha: 0,
      y: -32,
      duration: 0.65
    }, 1.85);

  /*
    =========================================================
    CARDS
    Real page-flow sequence.

    Important:
    We are no longer using tiny decimal timeline points like 0.3 / 0.14.
    That made the section feel mechanically timed.

    Each card now gets:
    - approach
    - enter
    - readable hold
    - long upward drift
    - soft exit

    This is what makes the user feel like they are scrolling down the page.
    =========================================================
  */

  const cardsStart = 2.5;
  const cardUnit = 1.78;

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardsStart + index * cardUnit;

    timeline
      .set(card, {
        zIndex: cards.length + index
      }, 0)

      /*
        Card begins below the viewport at full opacity as soon as its
        sequence starts, so there is no opacity wait before it reads.
      */
      .set(card, {
        autoAlpha: 1
      }, start)

      .fromTo(card,
        {
          x: side * 72,
          yPercent: 88,
          scale: 0.94,
          rotateX: 0,
          filter: "blur(8px)"
        },
        {
          x: side * 44,
          yPercent: 48,
          scale: 0.965,
          filter: "blur(4px)",
          duration: 0.42,
          ease: "power1.out"
        },
        start
      )

      /*
        Card enters the readable zone.
      */
      .to(card, {
        x: 0,
        yPercent: -50,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.62,
        ease: "power2.out"
      }, start + 0.42)

      /*
        Readable hold with enough time to feel the flow.
      */
      .to(card, {
        x: 0,
        yPercent: -56,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.44,
        ease: "none"
      }, start + 1.06)

      /*
        Slow upward movement.
        This is the page-flow part.
      */
      .to(card, {
        x: side * -10,
        yPercent: -94,
        scale: 0.992,
        filter: "blur(0px)",
        duration: 0.42,
        ease: "power1.inOut"
      }, start + 1.5)

      /*
        Soft clear keeps the card at full opacity until it leaves, then
        hides it immediately at the end of its travel.
      */
      .to(card, {
        x: side * -42,
        yPercent: -148,
        scale: 0.955,
        filter: "blur(7px)",
        duration: 0.4,
        ease: "power1.in"
      }, start + 1.88)

      .set(card, {
        autoAlpha: 0
      }, start + 2.28);
  });

  /*
    =========================================================
    HANDOFF
    Starts only after all cards finish.
    No more early C zoom.
    =========================================================
  */

  const handoffStart = cardsStart + cardCount * cardUnit + 0.42;

  timeline
    .to(word, {
      scale: 1.26,
      autoAlpha: 0.78,
      filter: "blur(0px)",
      duration: 0.65,
      ease: "power1.inOut"
    }, handoffStart)

    .to(cardTrack, {
      autoAlpha: 0,
      duration: 0.42,
      ease: "power1.out"
    }, handoffStart + 0.1)

    .to(voidTarget, {
      autoAlpha: 0.86,
      scale: 1,
      duration: 0.5,
      ease: "power1.out"
    }, handoffStart + 0.26)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at 51.8% 50%)",
      y: 28,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.48,
      ease: "power1.out"
    }, handoffStart + 0.36)

    /*
      First camera push.
    */
    .to(word, {
      scale: 2.8,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.6px)",
      duration: 0.72,
      ease: "power2.inOut"
    }, handoffStart + 0.9)

    .to(voidTarget, {
      scale: 3.5,
      autoAlpha: 0.82,
      duration: 0.72,
      ease: "power2.inOut"
    }, handoffStart + 0.9)

    .to(worldInside, {
      autoAlpha: 0.4,
      clipPath: "circle(28% at 51.8% 50%)",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.72,
      ease: "power2.inOut"
    }, handoffStart + 1.03)

    /*
      Deep zoom through the C.
    */
    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 1.05,
      ease: "power3.inOut"
    }, handoffStart + 1.72)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 1,
      ease: "power3.inOut"
    }, handoffStart + 1.72)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.05,
      ease: "power3.inOut"
    }, handoffStart + 1.78)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.7,
      ease: "power1.out"
    }, handoffStart + 2.15);

  const refresh = () => ScrollTrigger.refresh();

  window.addEventListener("resize", refresh);

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", refresh);
  });

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

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    transformOrigin: "52% 50%"
  });

  gsap.set(word, {
    autoAlpha: 0.18,
    scale: 0.42,
    xPercent: 0,
    yPercent: 34,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.052em"
  });

  gsap.set(voidTarget, {
    autoAlpha: 0,
    scale: 0.14,
    transformOrigin: "50% 50%"
  });

  gsap.set(worldInside, {
    autoAlpha: 0,
    clipPath: "circle(0% at 51.8% 50%)",
    y: 44,
    scale: 0.8,
    filter: "blur(12px)",
    transformOrigin: "51.8% 50%"
  });

  gsap.set(copy, {
    autoAlpha: 0,
    y: 32
  });

  gsap.set(cardTrack, {
    autoAlpha: 1
  });

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 72,
      yPercent: 88,
      scale: 0.94,
      rotateX: 0,
      filter: "blur(8px)",
      transformOrigin: "50% 52%"
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
    These values now match the slower section structure.

    Intro gets more room.
    Cards get most of the section.
    Handoff waits until the end.
  */

  const intro = mapRange(progress, 0.03, 0.24);
  const cards = mapRange(progress, 0.24, 0.82);
  const handoff = mapRange(progress, 0.82, 1);

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
