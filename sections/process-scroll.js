// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || !gsap || !ScrollTrigger) return null;

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
      end: () => `+=${Math.max(window.innerHeight * 6.6, 6400)}`,
      pin: true,
      scrub: 0.95,
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
    INTRO
    PROCESS word grows into the scene.
    Copy appears briefly, then clears so cards own the space.
  */
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.9,
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
      scale: 1.18,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      duration: 0.14
    }, 0.27);

  /*
    CARDS
    This is the fix.

    Each card gets a clean non-overlapping slot:
    - enters
    - holds
    - exits
    - gets reset hidden

    No lingering stack.
    No 0.34 ghost opacity.
    No two huge cards sitting loudly together.
  */
  const cardStart = 0.31;
  const cardWindow = 0.135;

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    const start = cardStart + index * cardWindow;
    const enterAt = start;
    const holdAt = start + 0.035;
    const exitAt = start + 0.095;
    const goneAt = start + 0.128;

    timeline
      .set(card, {
        zIndex: cards.length + index
      }, 0)

      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -50,
        scale: 1,
        rotateX: 0,
        duration: 0.035,
        ease: "power2.out"
      }, enterAt)

      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -50,
        scale: 1,
        rotateX: 0,
        duration: 0.06,
        ease: "none"
      }, holdAt)

      .to(card, {
        autoAlpha: 0,
        x: side * -22,
        yPercent: -52,
        scale: 0.985,
        rotateX: 0,
        duration: 0.033,
        ease: "power2.inOut"
      }, exitAt)

      .set(card, {
        autoAlpha: 0,
        x: side * 28,
        yPercent: -48,
        scale: 0.99,
        rotateX: 0
      }, goneAt);
  });

  /*
    HANDOFF
    Kept your PROCESS / void / worldInside zoom idea.
    Starts after cards finish so it does not fight the card sequence.
  */
  timeline
    .to(word, {
      scale: 1.42,
      autoAlpha: 0.76,
      filter: "blur(0px)",
      duration: 0.12
    }, 0.9)

    .to(cards, {
      autoAlpha: 0,
      duration: 0.06
    }, 0.905)

    .to(voidTarget, {
      autoAlpha: 0.92,
      scale: 1,
      duration: 0.055
    }, 0.915)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at 51.8% 50%)",
      y: 26,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.06
    }, 0.925)

    .to(word, {
      scale: 3.15,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.8px)",
      duration: 0.07
    }, 0.945)

    .to(voidTarget, {
      scale: 3.7,
      autoAlpha: 0.86,
      duration: 0.07
    }, 0.945)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at 51.8% 50%)",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.075
    }, 0.965)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.14
    }, 0.99)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13
    }, 0.99)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.16
    }, 0.99)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 1);

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
    autoAlpha: 0.28,
    scale: 0.46,
    xPercent: 0,
    yPercent: 28,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.06em"
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
    y: 28
  });

  gsap.set(cardTrack, {
    autoAlpha: 1
  });

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 28,
      yPercent: -48,
      scale: 0.99,
      rotateX: 0,
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
    rotateX: 0
  });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.88);
  const handoff = mapRange(progress, 0.88, 1);

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
