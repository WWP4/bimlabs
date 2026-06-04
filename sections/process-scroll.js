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

  /*
    Important:
    Do not depend on another file passing cards in.
    This restores the cards even if the init call only sends section/gsap/ScrollTrigger.
  */
  const cardEls = Array.isArray(cards) && cards.length
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
      end: () => `+=${Math.max(window.innerHeight * 7.4, 7200)}`,
      pin: true,
      scrub: 0.82,
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

  /*
    Important:
    When scrolling back into the pinned PROCESS section,
    remove the hard lock so GSAP can control the reverse animation smoothly.
  */
  section.classList.remove("is-inside-work");
},

onLeave: () => {
  /*
    Only hard-lock after the pinned timeline is fully finished.
    This prevents wheel-notch jitter near the end of the animation.
  */
  section.classList.remove("is-process-active");
  section.classList.add("is-work-visible", "is-work-interactive", "is-inside-work");

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
}
    }
  });

  /*
    INTRO
    PROCESS comes in and becomes the anchor.
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
      scale: 1.12,
      autoAlpha: 0.9,
      force3D: true,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      force3D: true,
      duration: 0.14
    }, 0.28);

  /*
    CARDS
    Restored and made smoother.
    They now take more of the scroll timeline before the handoff starts.
  */
  const cardStart = 0.31;
  const cardGap = cardEls.length > 4 ? 0.105 : 0.13;

  cardEls.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = cardStart + index * cardGap;

    timeline
      .set(card, {
        zIndex: 20 + index
      }, 0)

      .to(card, {
        autoAlpha: 0.18,
        x: side * 30,
        yPercent: 42,
        scale: 0.965,
        rotateX: 0,
        force3D: true,
        duration: 0.05,
        ease: "power2.out"
      }, start)

      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -46,
        scale: 1,
        rotateX: 0,
        force3D: true,
        duration: 0.095,
        ease: "power2.out"
      }, start + 0.05)

      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: -52,
        scale: 1,
        rotateX: 0,
        force3D: true,
        duration: 0.095,
        ease: "none"
      }, start + 0.145)

      .to(card, {
        autoAlpha: 0.2,
        x: side * -16,
        yPercent: -118,
        scale: 0.975,
        rotateX: 0,
        force3D: true,
        duration: 0.1,
        ease: "power2.inOut"
      }, start + 0.24)

      .to(card, {
        autoAlpha: 0,
        x: side * -24,
        yPercent: -150,
        scale: 0.96,
        rotateX: 0,
        force3D: true,
        duration: 0.05,
        ease: "none"
      }, start + 0.34);
  });

  /*
    HANDOFF
    One clean camera move.
    No early overlay kill. No sudden interactivity. No fake scene collapse.
  */
  timeline
    .to(section, {
      "--process-handoff": 0.12,
      duration: 0.04
    }, 0.865)

    .to(cardTrack, {
      autoAlpha: 0,
      duration: 0.08,
      ease: "power1.out"
    }, 0.875)

    .to(word, {
      scale: 1.38,
      xPercent: -0.25,
      autoAlpha: 0.82,
      filter: "blur(0px)",
      force3D: true,
      duration: 0.11
    }, 0.885)

    .to(voidTarget, {
      autoAlpha: 0.42,
      scale: 0.82,
      force3D: true,
      duration: 0.08
    }, 0.9)

    .to(worldInside, {
      autoAlpha: 0.08,
      visibility: "visible",
      clipPath: "circle(5% at 51.8% 50%)",
      webkitClipPath: "circle(5% at 51.8% 50%)",
      y: 28,
      scale: 0.9,
      filter: "blur(8px)",
      force3D: true,
      duration: 0.075
    }, 0.915)

    .to(section, {
      "--process-handoff": 0.38,
      duration: 0.075
    }, 0.925)

    .to(word, {
      scale: 2.45,
      xPercent: -2.35,
      autoAlpha: 0.9,
      filter: "blur(0.4px)",
      force3D: true,
      duration: 0.085
    }, 0.94)

    .to(voidTarget, {
      autoAlpha: 0.78,
      scale: 2.8,
      force3D: true,
      duration: 0.085
    }, 0.94)

    .to(worldInside, {
      autoAlpha: 0.32,
      clipPath: "circle(20% at 51.8% 50%)",
      webkitClipPath: "circle(20% at 51.8% 50%)",
      y: 12,
      scale: 0.96,
      filter: "blur(4px)",
      force3D: true,
      duration: 0.085
    }, 0.955)

    .to(section, {
      "--process-handoff": 0.72,
      duration: 0.075
    }, 0.97)

    .to(word, {
      scale: 5.8,
      xPercent: -6.8,
      autoAlpha: 0.42,
      filter: "blur(4px)",
      force3D: true,
      duration: 0.09
    }, 0.985)

    .to(voidTarget, {
      autoAlpha: 0.64,
      scale: 7.5,
      force3D: true,
      duration: 0.09
    }, 0.985)

    .to(worldInside, {
      autoAlpha: 0.76,
      clipPath: "circle(72% at 51.8% 50%)",
      webkitClipPath: "circle(72% at 51.8% 50%)",
      y: 2,
      scale: 0.995,
      filter: "blur(1.5px)",
      force3D: true,
      duration: 0.09
    }, 0.99)

    .to(section, {
      "--process-handoff": 1,
      "--process-section-intensity": 0.08,
      duration: 0.08
    }, 1.04)

    .to(word, {
      scale: 11.5,
      xPercent: -13,
      autoAlpha: 0,
      filter: "blur(12px)",
      force3D: true,
      duration: 0.12
    }, 1.055)

    .to(voidTarget, {
      autoAlpha: 0,
      scale: 16,
      force3D: true,
      duration: 0.12
    }, 1.055)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(155% at 51.8% 50%)",
      webkitClipPath: "circle(155% at 51.8% 50%)",
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      force3D: true,
      duration: 0.14
    }, 1.06)

   
  const refresh = debounce(() => {
    ScrollTrigger.refresh();
  }, 160);

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
      visibility: "visible"
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

  section.classList.remove("is-inside-work", "is-work-visible", "is-work-interactive");

  gsap.set(word, {
    clearProps: "all"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0
    });
  }

  if (worldInside) {
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
    Important:
    Do NOT toggle is-inside-work here.
    That class is a hard visual lock. If it toggles while the wheel is
    hovering around the end of the pinned section, the scene jumps.
  */
  const workVisible = progress >= 0.91;
  const workInteractive = progress >= 0.985;

  section.classList.toggle("is-work-visible", workVisible);
  section.classList.toggle("is-work-interactive", workInteractive);

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
      workReveal: mapRange(progress, 0.91, 1),
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
