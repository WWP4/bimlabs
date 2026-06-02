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
      ease: "none",
      overwrite: "auto"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",

      /*
        More scroll room = less snapping.
        This is still performance-friendly because it is one pinned timeline,
        not a bunch of separate scroll listeners.
      */
      end: () => {
        const introDistance = window.innerHeight * 1.15;
        const cardDistance = Math.max(cardCount, 4) * window.innerHeight * 1.35;
        const handoffDistance = window.innerHeight * 1.9;

        return `+=${Math.max(introDistance + cardDistance + handoffDistance, 5600)}`;
      },

      pin: true,

      /*
        This is the biggest fix.
        scrub: true is too direct and makes wheel/touchpad jumps feel harsh.
        0.65 gives the camera a small amount of smoothing without feeling laggy.
      */
  scrub: 1.15,

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
    INTRO
    Let PROCESS arrive smoothly instead of snapping into scale.
  */

  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.9
    }, 0)

    .to(word, {
      autoAlpha: 0.5,
      scale: 0.7,
      xPercent: 0,
      yPercent: 14,
      letterSpacing: "-0.068em",
      filter: "blur(0px)",
      duration: 0.9,
      ease: "power1.out"
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.75,
      ease: "power1.out"
    }, 0.22)

    .to(word, {
      autoAlpha: 0.86,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 1.15,
      ease: "power2.out"
    }, 0.85)

    .to(word, {
      scale: 1.08,
      autoAlpha: 0.92,
      duration: 1.1,
      ease: "power1.inOut"
    }, 1.8)

    .to(copy, {
      autoAlpha: 0,
      y: -28,
      duration: 0.85,
      ease: "power1.inOut"
    }, 2.05);

  /*
    CARDS
    Each card now has a longer approach, smoother center pass,
    and no tiny aggressive timing chunks.
  */

  const cardsStart = 2.25;
  const cardUnit = 1.65;

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardsStart + index * cardUnit;

    timeline
      .set(card, {
        zIndex: cards.length + index,
        pointerEvents: "auto"
      }, 0)

      .fromTo(card,
        {
          autoAlpha: 0,
          x: side * 90,
          yPercent: 92,
          scale: 0.94,
          rotateX: 0,
          filter: "blur(3px)"
        },
        {
          autoAlpha: 1,
          x: side * 42,
          yPercent: 42,
          scale: 0.975,
          filter: "blur(1.5px)",
          duration: 0.52,
          ease: "power2.out"
        },
        start
      )

      /*
        Enter readable center.
        Longer duration = flow instead of pop.
      */
      .to(card, {
        x: 0,
        yPercent: -50,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.72,
        ease: "power2.inOut",
        onStart: () => {
          cards.forEach((other) => other.classList.remove("is-active"));
          card.classList.add("is-active");
        },
        onReverseComplete: () => {
          card.classList.remove("is-active");
        }
      }, start + 0.5)

      /*
        Gentle readable drift.
        This gives the user time to understand the card without making it feel stuck.
      */
      .to(card, {
        x: 0,
        yPercent: -58,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.42,
        ease: "none"
      }, start + 1.18)

      /*
        Exit upward.
      */
      .to(card, {
        x: side * -18,
        yPercent: -108,
        scale: 0.985,
        filter: "blur(1px)",
        duration: 0.58,
        ease: "power1.inOut"
      }, start + 1.6)

      .to(card, {
        autoAlpha: 0,
        x: side * -46,
        yPercent: -154,
        scale: 0.96,
        filter: "blur(3px)",
        duration: 0.38,
        ease: "power1.in",
        onComplete: () => {
          card.classList.remove("is-active");
        }
      }, start + 2.05);
  });

/*
  HANDOFF
  Smoother C camera push.
  No giant jump. No sudden reveal.
  The zoom is broken into smaller steps so scrolling up/down feels stable.
*/

const handoffStart = cardsStart + cardCount * cardUnit + 0.45;

timeline
  /*
    Start softening the cards before the C move starts.
    This prevents the handoff from feeling like it suddenly begins.
  */
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
    Camera begins moving toward the C.
    Small scale move. No punch.
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
    Mid push.
    This is where the old version jumped too much.
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
    Still big, but no longer a teleport.
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
    Final pass through the C.
    The word fades while the inside world becomes the page.
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
      yPercent: 92,
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
  const intro = mapRange(progress, 0.03, 0.26);
  const cards = mapRange(progress, 0.23, 0.82);
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
