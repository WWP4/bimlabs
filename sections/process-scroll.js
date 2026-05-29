// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const sceneMount = section?.querySelector("[data-process-scene]");
  const word = section?.querySelector(".process-word");
  const aperture = section?.querySelector(".process-c-aperture");
  const worldInside = section?.querySelector(".process-world-inside");
  const apertureLetter = section?.querySelector("[data-process-aperture-letter]");
  const copy = section?.querySelector(".process-copy");
  const cardTrack = section?.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || !sceneMount || !word || !aperture || !worldInside || !apertureLetter) {
    console.warn("[process-scroll] Missing required elements.", {
      section,
      sceneMount,
      word,
      aperture,
      worldInside,
      apertureLetter
    });

    return null;
  }

  if (prefersReducedMotion) {
    syncApertureAnchor({ section, sceneMount, word, apertureLetter });
    prepareReducedState({
      gsap,
      section,
      word,
      aperture,
      worldInside,
      copy,
      cardTrack,
      cards
    });

    return null;
  }

  syncApertureAnchor({ section, sceneMount, word, apertureLetter });

  prepareInitialState({
    gsap,
    section,
    sceneMount,
    word,
    aperture,
    worldInside,
    copy,
    cardTrack,
    cards
  });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 5.4, 5200)}`,
      pin: true,
      scrub: 0.85,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onRefreshInit: () => {
        clearWordForMeasurement(word);
      },

      onRefresh: () => {
        restoreWordAfterMeasurement(word);
        syncApertureAnchor({ section, sceneMount, word, apertureLetter });
      },

      onUpdate: (self) => {
        updateByProgress({ progress: self.progress, scene, ui });
      },

      onEnter: () => section.classList.add("is-process-active"),
      onEnterBack: () => section.classList.add("is-process-active"),
      onLeave: () => section.classList.remove("is-process-active"),
      onLeaveBack: () => section.classList.remove("is-process-active")
    }
  });

  /*
    PHASE 1
    PROCESS comes forward and becomes the background world.
  */
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.94,
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
      autoAlpha: 0.9,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.14
    }, 0.26);

  /*
    PHASE 2
    Cards pass across the PROCESS word.
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
    PHASE 3
    The aperture opens from the hollow of the C.
    No dark fake orb. No floating extra circle.
  */
  timeline
    .to(word, {
      scale: 1.38,
      autoAlpha: 0.82,
      filter: "blur(0px)",
      duration: 0.12
    }, 0.76)

    .to(cards, {
      autoAlpha: 0,
      duration: 0.08
    }, 0.78)

    .to(aperture, {
      autoAlpha: 1,
      width: "2.6vmax",
      height: "2.6vmax",
      filter: "blur(4px)",
      duration: 0.055
    }, 0.805)

    .to(word, {
      scale: 2.05,
      autoAlpha: 0.7,
      filter: "blur(0.8px)",
      duration: 0.075
    }, 0.835)

    .to(aperture, {
      width: "10vmax",
      height: "10vmax",
      filter: "blur(2px)",
      duration: 0.075
    }, 0.85)

    .to(word, {
      scale: 3.7,
      autoAlpha: 0.46,
      filter: "blur(3px)",
      duration: 0.075
    }, 0.875)

    .to(aperture, {
      width: "42vmax",
      height: "42vmax",
      filter: "blur(1px)",
      duration: 0.075
    }, 0.875)

    .to(word, {
      scale: 11.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.15
    }, 0.91)

    .to(aperture, {
      width: "240vmax",
      height: "240vmax",
      filter: "blur(0px)",
      autoAlpha: 1,
      duration: 0.15
    }, 0.91)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.9);

  const handleResize = debounce(() => {
    syncApertureAnchor({ section, sceneMount, word, apertureLetter });
    ScrollTrigger.refresh();
  }, 120);

  window.addEventListener("resize", handleResize);

  document.fonts?.ready?.then(() => {
    syncApertureAnchor({ section, sceneMount, word, apertureLetter });
    ScrollTrigger.refresh();
  });

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", handleResize);
  });

  return timeline;
}

/*
  Measures the C and places the aperture in the visual hollow.

  Important:
  The C's DOM bounding box is not the same as the visual hole.
  A value around 0.46-0.52 usually hits the inner hollow.
  Higher values push the aperture toward the open mouth / E.
*/
function syncApertureAnchor({ section, sceneMount, word, apertureLetter }) {
  if (!section || !sceneMount || !word || !apertureLetter) return;

  const previous = saveInlineWordState(word);

  clearWordForMeasurement(word);

  const sceneRect = sceneMount.getBoundingClientRect();
  const wordRect = word.getBoundingClientRect();
  const letterRect = apertureLetter.getBoundingClientRect();

  /*
    TUNING VALUES:

    If aperture is too far right: lower apertureFactorX.
    If aperture is too far left: raise apertureFactorX.
    If aperture is too low: lower apertureFactorY.
    If aperture is too high: raise apertureFactorY.

    For your screenshot, 0.46 / 0.47 should pull it inside the C hollow.
  */
  const apertureFactorX = 0.46;
  const apertureFactorY = 0.47;

  const apertureX = letterRect.left - sceneRect.left + letterRect.width * apertureFactorX;
  const apertureY = letterRect.top - sceneRect.top + letterRect.height * apertureFactorY;

  const originX = letterRect.left - wordRect.left + letterRect.width * apertureFactorX;
  const originY = letterRect.top - wordRect.top + letterRect.height * apertureFactorY;

  section.style.setProperty("--process-c-x", `${apertureX.toFixed(2)}px`);
  section.style.setProperty("--process-c-y", `${apertureY.toFixed(2)}px`);
  section.style.setProperty("--process-word-origin-x", `${originX.toFixed(2)}px`);
  section.style.setProperty("--process-word-origin-y", `${originY.toFixed(2)}px`);

  restoreInlineWordState(word, previous);
}

function prepareInitialState({
  gsap,
  section,
  sceneMount,
  word,
  aperture,
  worldInside,
  copy,
  cardTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", 0);
  section.style.setProperty("--process-intro", 0);
  section.style.setProperty("--process-cards", 0);
  section.style.setProperty("--process-handoff", 0);

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
    letterSpacing: "-0.06em",
    transformOrigin: "var(--process-word-origin-x) var(--process-word-origin-y)"
  });

  gsap.set(aperture, {
    autoAlpha: 0,
    width: "0vmax",
    height: "0vmax",
    filter: "blur(8px)",
    xPercent: 0,
    yPercent: 0,
    transformOrigin: "50% 50%"
  });

  gsap.set(worldInside, {
    autoAlpha: 1,
    clearProps: "width,height,left,top,right,bottom,transform,filter"
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
  aperture,
  worldInside,
  copy,
  cardTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", 1);
  section.style.setProperty("--process-intro", 1);
  section.style.setProperty("--process-cards", 1);
  section.style.setProperty("--process-handoff", 0);

  gsap.set(word, {
    clearProps: "all"
  });

  gsap.set(aperture, {
    autoAlpha: 0,
    width: "0vmax",
    height: "0vmax",
    filter: "none"
  });

  gsap.set(worldInside, {
    autoAlpha: 0
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
    rotateX: 0,
    filter: "none"
  });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.8);
  const handoff = mapRange(progress, 0.8, 1);

  scene?.setProgress?.({ intro, cards, handoff });
  ui?.setCardsProgress?.(cards);
  ui?.softenForHandoff?.(handoff);
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;

  return (value - start) / (end - start);
}

function debounce(fn, wait = 100) {
  let timeout;

  return function debounced(...args) {
    window.clearTimeout(timeout);

    timeout = window.setTimeout(() => {
      fn.apply(this, args);
    }, wait);
  };
}

function saveInlineWordState(word) {
  return {
    transform: word.style.transform,
    letterSpacing: word.style.letterSpacing,
    transformOrigin: word.style.transformOrigin,
    opacity: word.style.opacity,
    visibility: word.style.visibility,
    filter: word.style.filter
  };
}

function restoreInlineWordState(word, state) {
  word.style.transform = state.transform;
  word.style.letterSpacing = state.letterSpacing;
  word.style.transformOrigin = state.transformOrigin;
  word.style.opacity = state.opacity;
  word.style.visibility = state.visibility;
  word.style.filter = state.filter;
}

function clearWordForMeasurement(word) {
  word.style.transform = "translate3d(0, 0, 0) scale(1)";
  word.style.letterSpacing = "-0.085em";
  word.style.transformOrigin = "50% 50%";
  word.style.opacity = "1";
  word.style.visibility = "visible";
  word.style.filter = "none";
}

function restoreWordAfterMeasurement(word) {
  word.style.transformOrigin = "var(--process-word-origin-x) var(--process-word-origin-y)";
}
