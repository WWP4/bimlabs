// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    prepareReducedState({ gsap, section, word, voidTarget, worldInside, copy, cardTrack, cards });
    return null;
  }

  prepareInitialState({ gsap, section, sceneMount, word, voidTarget, worldInside, copy, cardTrack, cards });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",

      /*
        Longer section = slower scroll feeling.
        Not crazy long, just enough so cards can breathe.
      */
      end: () => `+=${Math.max(window.innerHeight * 6.35, 6200)}`,

      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => updateByProgress({ progress: self.progress, scene, ui }),
      onEnter: () => section.classList.add("is-process-active"),
      onEnterBack: () => section.classList.add("is-process-active"),
      onLeave: () => section.classList.remove("is-process-active"),
      onLeaveBack: () => section.classList.remove("is-process-active")
    }
  });

  /*
    Intro:
    PROCESS grows into position.
    Copy appears briefly, then clears out so the cards own the scene.
  */
  timeline
    .to(section, { "--process-section-intensity": 1, duration: 0.12 }, 0)
    .to(word, {
      autoAlpha: 0.9,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
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
    Cards:
    Important change:
    - Cards do NOT all remain strongly visible.
    - Active card holds.
    - Past card becomes a quiet ghost.
    - Earlier cards become almost invisible.
    - No huge upward flying fade-out.
  */
  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = 0.31 + index * 0.14;

    timeline
      // Enter from a controlled fixed position.
      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.095
      }, start)

      // Settle larger. This is the "impressive" moment.
      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1.018,
        rotateX: 0,
        duration: 0.13
      }, start + 0.095)

      // Linger without drifting.
      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1.018,
        rotateX: 0,
        duration: 0.085
      }, start + 0.225)

      // Become background, but not a big visible block.
      .to(card, {
        autoAlpha: 0.13,
        yPercent: side === -1 ? -10 : 10,
        x: side * -22,
        scale: 0.955,
        rotateX: 0,
        duration: 0.105
      }, start + 0.31)

      // Fade further once the next card owns the scene.
      .to(card, {
        autoAlpha: 0.04,
        yPercent: side === -1 ? -18 : 18,
        x: side * -34,
        scale: 0.93,
        rotateX: 0,
        duration: 0.095
      }, start + 0.43);
  });

  /*
    Handoff:
    Moved later so cards have time to breathe.
    Kept your same void / worldInside / PROCESS zoom idea.
  */
  timeline
    .to(word, {
      scale: 1.42,
      autoAlpha: 0.76,
      duration: 0.12
    }, 0.86)

    .to(cards, {
      autoAlpha: 0,
      duration: 0.08
    }, 0.865)

    .to(voidTarget, {
      autoAlpha: 0.92,
      scale: 1,
      duration: 0.055
    }, 0.875)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at 51.8% 50%)",
      y: 26,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.06
    }, 0.885)

    .to(word, {
      scale: 3.15,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.8px)",
      duration: 0.07
    }, 0.905)

    .to(voidTarget, {
      scale: 3.7,
      autoAlpha: 0.86,
      duration: 0.07
    }, 0.905)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at 51.8% 50%)",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.075
    }, 0.925)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.14
    }, 0.95)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13
    }, 0.95)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.16
    }, 0.95)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.96);

  window.addEventListener("resize", () => ScrollTrigger.refresh());

  return timeline;
}

function prepareInitialState({ gsap, section, sceneMount, word, voidTarget, worldInside, copy, cardTrack, cards }) {
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

    /*
      Cards start close to their final positions.
      This avoids the floaty "all cards flying through the screen" feeling.
    */
    gsap.set(card, {
      autoAlpha: 0,
      x: side * 30,
      yPercent: 18,
      scale: 0.96,
      rotateX: 0,
      transformOrigin: "50% 60%"
    });
  });
}

function prepareReducedState({ gsap, section, word, voidTarget, worldInside, copy, cardTrack, cards }) {
  section.style.setProperty("--process-section-intensity", 1);

  gsap.set(word, { clearProps: "all" });
  gsap.set(voidTarget, { autoAlpha: 0 });
  gsap.set(worldInside, { autoAlpha: 0, filter: "none" });
  gsap.set(copy, { autoAlpha: 1, y: 0 });
  gsap.set(cardTrack, { autoAlpha: 1 });
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
  const cards = mapRange(progress, 0.28, 0.84);
  const handoff = mapRange(progress, 0.84, 1);

  scene.setProgress({ intro, cards, handoff });
  ui.setCardsProgress(cards);
  ui.softenForHandoff(handoff);
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}
