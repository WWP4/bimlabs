// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards = [] }) {
  const sceneMount = section?.querySelector("[data-process-scene]");
  const word = section?.querySelector(".process-word");
  const voidTarget = section?.querySelector(".process-void");
  const worldInside = section?.querySelector(".process-world-inside");
  const copy = section?.querySelector(".process-copy");
  const cardTrack = section?.querySelector(".process-cards");
  const workTrack = section?.querySelector("[data-work-track]");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || !sceneMount || !word || !gsap || !ScrollTrigger) {
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
      workTrack,
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
    workTrack,
    cards
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 7.15, 7100)}`,
      pin: true,
      scrub: 0.95,
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
      },

      onEnterBack: () => {
        section.classList.add("is-process-active");
      },

      onLeave: () => {
        section.classList.remove("is-process-active");
        section.classList.add("is-inside-work", "is-work-visible", "is-work-interactive");
      },

      onLeaveBack: () => {
        section.classList.remove(
          "is-process-active",
          "is-inside-work",
          "is-work-visible",
          "is-work-interactive"
        );
      }
    }
  });

  /*
    INTRO
    This is close to the old version because that part felt better.
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
      force3D: true,
      duration: 0.2
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      force3D: true,
      duration: 0.12
    }, 0.08)

    .to(word, {
      scale: 1.16,
      autoAlpha: 0.92,
      force3D: true,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      force3D: true,
      duration: 0.14
    }, 0.27);

  /*
    CARDS
    Old flow kept because it felt more like scrolling through the page.
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

      .to(card, {
        autoAlpha: 0.18,
        x: side * 34,
        yPercent: 34,
        scale: 0.965,
        rotateX: 0,
        force3D: true,
        duration: 0.045,
        ease: "power2.out"
      }, start)

      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -50,
        scale: 1,
        rotateX: 0,
        force3D: true,
        duration: 0.085,
        ease: "power2.out"
      }, start + 0.045)

      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -55,
        scale: 1,
        rotateX: 0,
        force3D: true,
        duration: 0.085,
        ease: "none"
      }, start + 0.13)

      .to(card, {
        autoAlpha: 0.16,
        x: side * -18,
        yPercent: -122,
        scale: 0.975,
        rotateX: 0,
        force3D: true,
        duration: 0.095,
        ease: "power2.inOut"
      }, start + 0.215)

      .to(card, {
        autoAlpha: 0,
        x: side * -28,
        yPercent: -155,
        scale: 0.96,
        rotateX: 0,
        force3D: true,
        duration: 0.045,
        ease: "none"
      }, start + 0.31);
  });

  /*
    HANDOFF
    This keeps the old premium-feeling camera move,
    but the destination is now a real full-screen Our Work layer.
  */
  timeline
    .to(section, {
      "--process-handoff": 0.16,
      duration: 0.04
    }, 0.9)

    .to(word, {
      scale: 1.42,
      autoAlpha: 0.78,
      filter: "blur(0px)",
      force3D: true,
      duration: 0.12
    }, 0.91)

    .to(cards, {
      autoAlpha: 0,
      duration: 0.06
    }, 0.915)

    .to(voidTarget, {
      autoAlpha: 0.9,
      scale: 1,
      force3D: true,
      duration: 0.055
    }, 0.925)

    .to(worldInside, {
      autoAlpha: 0,
      visibility: "visible",
      clipPath: "circle(7% at 51.8% 50%)",
      webkitClipPath: "circle(7% at 51.8% 50%)",
      y: 26,
      scale: 0.86,
      filter: "blur(10px)",
      force3D: true,
      duration: 0.06
    }, 0.935)

    .to(section, {
      "--process-handoff": 0.42,
      duration: 0.07
    }, 0.945)

    .to(word, {
      scale: 3.15,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.8px)",
      force3D: true,
      duration: 0.07
    }, 0.955)

    .to(voidTarget, {
      scale: 3.7,
      autoAlpha: 0.86,
      force3D: true,
      duration: 0.07
    }, 0.955)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at 51.8% 50%)",
      webkitClipPath: "circle(28% at 51.8% 50%)",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      force3D: true,
      duration: 0.075
    }, 0.975)

    .to(section, {
      "--process-handoff": 0.84,
      duration: 0.08
    }, 0.985)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      force3D: true,
      duration: 0.14
    }, 1)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      force3D: true,
      duration: 0.13
    }, 1)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at 51.8% 50%)",
      webkitClipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      force3D: true,
      duration: 0.16
    }, 1)

    .to(section, {
      "--process-section-intensity": 0.08,
      "--process-handoff": 1,
      duration: 0.1
    }, 1.01)

    .add(() => {
      section.classList.add("is-work-visible", "is-work-interactive", "is-inside-work");

      if (worldInside) {
        worldInside.removeAttribute("aria-hidden");
        worldInside.classList.add("is-visible", "is-interactive");
      }

      if (workTrack) {
        workTrack.style.setProperty("--work-scroll-progress", "0");
      }
    }, 1.08);

  const refresh = debounce(() => {
    ScrollTrigger.refresh();
  }, 150);

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

  section.style.setProperty("--process-section-intensity", 0);
  section.style.setProperty("--process-handoff", 0);

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

    gsap.set(worldInside, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
      clipPath: "circle(0% at 51.8% 50%)",
      webkitClipPath: "circle(0% at 51.8% 50%)",
      y: 44,
      scale: 0.8,
      filter: "blur(12px)",
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
      autoAlpha: 1
    });
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 34,
      yPercent: 34,
      scale: 0.965,
      rotateX: 0,
      transformOrigin: "50% 52%",
      force3D: true
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
  section.style.setProperty("--process-section-intensity", 1);
  section.style.setProperty("--process-handoff", 1);

  section.classList.add("is-work-visible", "is-work-interactive", "is-inside-work");

  gsap.set(word, {
    clearProps: "all"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0
    });
  }

  if (worldInside) {
    worldInside.removeAttribute("aria-hidden");
    worldInside.classList.add("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 1,
      visibility: "visible",
      pointerEvents: "auto",
      filter: "none",
      clipPath: "circle(150% at 51.8% 50%)",
      webkitClipPath: "circle(150% at 51.8% 50%)",
      scale: 1,
      y: 0
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
      autoAlpha: 1
    });
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  gsap.set(cards, {
    autoAlpha: 1,
    x: 0,
    yPercent: 0,
    scale: 1,
    rotateX: 0
  });
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
  const cards = mapRange(progress, 0.28, 0.88);
  const handoff = mapRange(progress, 0.88, 1);

  section.style.setProperty("--process-intro", intro.toFixed(4));
  section.style.setProperty("--process-cards", cards.toFixed(4));
  section.style.setProperty("--process-handoff", handoff.toFixed(4));

  const workVisible = progress >= 0.935;
  const workInteractive = progress >= 0.995;
  const insideWork = progress >= 0.998;

  section.classList.toggle("is-work-visible", workVisible);
  section.classList.toggle("is-work-interactive", workInteractive);
  section.classList.toggle("is-inside-work", insideWork);

  if (worldInside) {
    worldInside.classList.toggle("is-visible", workVisible);
    worldInside.classList.toggle("is-interactive", workInteractive);

    if (workVisible) {
      worldInside.removeAttribute("aria-hidden");
    } else {
      worldInside.setAttribute("aria-hidden", "true");
    }

    if (!workInteractive) {
      worldInside.style.pointerEvents = "none";
    } else {
      worldInside.style.pointerEvents = "auto";
    }
  }

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
      workReveal: mapRange(progress, 0.935, 1),
      workScroll: 0,
      insideWork
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
