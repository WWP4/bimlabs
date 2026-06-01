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

      /*
        Longer pinned distance = smoother process flow.
        This gives the cards enough scroll space to feel like
        the user is moving down through the page.
      */
      end: () => `+=${Math.max(window.innerHeight * 7.1, 7000)}`,

      pin: true,
      scrub: 1,
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
    PROCESS enters and becomes the anchored background word.
  */
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.88,
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
      scale: 1.16,
      autoAlpha: 0.92,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      duration: 0.14
    }, 0.27);

  /*
    CARDS
    Page-flow motion:
    - cards begin below the reading area
    - move into center/readable zone
    - linger briefly
    - continue upward and out
    - next card enters softly after the previous card starts leaving

    This gives the user the feeling of scrolling down through the process,
    not watching cards pop in and out.
  */
  const cardStart = 0.3;
  const cardGap = 0.14;

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardStart + index * cardGap;

    timeline
      .set(card, {
        zIndex: cards.length + index
      }, 0)

      /*
        Enter from below.
        Low opacity makes the next card feel like it is approaching,
        but it is not readable yet.
      */
      .to(card, {
        autoAlpha: 0.18,
        x: side * 34,
        yPercent: 34,
        scale: 0.965,
        rotateX: 0,
        duration: 0.045,
        ease: "power2.out"
      }, start)

      /*
        Move into the reading zone.
      */
      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -50,
        scale: 1,
        rotateX: 0,
        duration: 0.085,
        ease: "power2.out"
      }, start + 0.045)

      /*
        Hold in the reading zone.
        This is what makes the card feel important.
      */
      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -55,
        scale: 1,
        rotateX: 0,
        duration: 0.085,
        ease: "none"
      }, start + 0.13)

      /*
        Continue upward.
        This creates the feeling that the user is moving down the page.
      */
      .to(card, {
        autoAlpha: 0.16,
        x: side * -18,
        yPercent: -122,
        scale: 0.975,
        rotateX: 0,
        duration: 0.095,
        ease: "power2.inOut"
      }, start + 0.215)

      /*
        Fully clear the card.
      */
      .to(card, {
        autoAlpha: 0,
        x: side * -28,
        yPercent: -155,
        scale: 0.96,
        rotateX: 0,
        duration: 0.045,
        ease: "none"
      }, start + 0.31);
  });

  /*
    HANDOFF
    Kept intact, but starts after the card flow has finished.
    This preserves your zoom-through-C transition.
  */
  timeline
    .to(word, {
      scale: 1.42,
      autoAlpha: 0.76,
      filter: "blur(0px)",
      duration: 0.12
    }, 0.91)

    .to(cards, {
      autoAlpha: 0,
      duration: 0.06
    }, 0.915)

    .to(voidTarget, {
      autoAlpha: 0.92,
      scale: 1,
      duration: 0.055
    }, 0.925)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at 51.8% 50%)",
      y: 26,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.06
    }, 0.935)

    .to(word, {
      scale: 3.15,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.8px)",
      duration: 0.07
    }, 0.955)

    .to(voidTarget, {
      scale: 3.7,
      autoAlpha: 0.86,
      duration: 0.07
    }, 0.955)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at 51.8% 50%)",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.075
    }, 0.975)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.14
    }, 1)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13
    }, 1)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.16
    }, 1)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 1.01);

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

  /*
    Cards start below the reading zone.
    This is what makes the sequence feel like the user is moving down the page.
  */
  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 34,
      yPercent: 34,
      scale: 0.965,
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
