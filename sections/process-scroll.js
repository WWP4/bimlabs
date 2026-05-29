// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const svg = section?.querySelector(".process-svg");
  const svgWord = section?.querySelector("[data-process-word]");
  const cLetter = section?.querySelector("[data-process-c-letter]");
  const svgWorld = section?.querySelector(".process-svg-world");
  const apertureShape = section?.querySelector("[data-process-aperture-shape]");
  const copy = section?.querySelector(".process-copy");
  const cardTrack = section?.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const safeCards = Array.isArray(cards)
    ? cards
    : Array.from(section?.querySelectorAll("[data-process-card]") || []);

  if (!section || !svg || !svgWord || !cLetter || !svgWorld || !apertureShape) {
    console.warn("[process-scroll] Missing required process elements.", {
      section,
      svg,
      svgWord,
      cLetter,
      svgWorld,
      apertureShape
    });

    return null;
  }

  let apertureCenter = { cx: 800, cy: 465 };

  const sync = () => {
    apertureCenter = syncApertureToRealC({
      svg,
      svgWord,
      cLetter,
      apertureShape,
      gsap
    });

    return apertureCenter;
  };

  if (prefersReducedMotion) {
    sync();

    prepareReducedState({
      gsap,
      section,
      svg,
      svgWord,
      svgWorld,
      apertureShape,
      copy,
      cardTrack,
      cards: safeCards,
      apertureCenter
    });

    return null;
  }

  sync();

  prepareInitialState({
    gsap,
    section,
    svg,
    svgWord,
    svgWorld,
    apertureShape,
    copy,
    cardTrack,
    cards: safeCards,
    apertureCenter
  });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 5.6, 5400)}`,
      pin: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,

      onRefreshInit: () => {
        sync();

        gsap.set(svgWord, {
          transformOrigin: `${apertureCenter.cx}px ${apertureCenter.cy}px`
        });
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
    PROCESS comes forward and locks around the real C.
  */
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(svgWord, {
      autoAlpha: 0.94,
      scale: 0.74,
      y: 0,
      filter: "blur(0px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.18
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12
    }, 0.06)

    .to(svgWord, {
      scale: 1,
      autoAlpha: 0.92,
      filter: "blur(0px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.18
    }, 0.18)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.12
    }, 0.26);

  /*
    PHASE 2
    Cards pass in front while PROCESS stays as the background anchor.
  */
  safeCards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = 0.32 + index * 0.125;

    timeline
      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 0.075
      }, start)

      .to(card, {
        yPercent: -8,
        scale: 1.012,
        duration: 0.05
      }, start + 0.075)

      .to(card, {
        autoAlpha: 0,
        yPercent: -84,
        x: side * -30,
        scale: 0.955,
        rotateX: -7,
        filter: "blur(3px)",
        duration: 0.095
      }, start + 0.13);
  });

  /*
    PHASE 3
    Real C handoff.

    Important:
    The aperture center is not guessed.
    It is measured from [data-process-c-letter].
  */
  timeline
    .to(svgWord, {
      scale: 1.18,
      autoAlpha: 0.86,
      filter: "blur(0px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.08
    }, 0.77)

    .to(cardTrack, {
      autoAlpha: 0,
      duration: 0.07
    }, 0.78)

    .to(svgWorld, {
      autoAlpha: 0,
      filter: "blur(12px)",
      duration: 0.04
    }, 0.79)

    .to(apertureShape, {
      attr: () => ({
        cx: apertureCenter.cx,
        cy: apertureCenter.cy,
        r: 8
      }),
      duration: 0.035
    }, 0.8)

    .to(svgWord, {
      scale: 1.55,
      autoAlpha: 0.78,
      filter: "blur(0.6px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.065
    }, 0.825)

    .to(apertureShape, {
      attr: () => ({
        cx: apertureCenter.cx,
        cy: apertureCenter.cy,
        r: 34
      }),
      duration: 0.065
    }, 0.825)

    .to(svgWorld, {
      autoAlpha: 0.55,
      filter: "blur(8px)",
      duration: 0.055
    }, 0.84)

    .to(svgWord, {
      scale: 2.35,
      autoAlpha: 0.58,
      filter: "blur(1.5px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.07
    }, 0.875)

    .to(apertureShape, {
      attr: () => ({
        cx: apertureCenter.cx,
        cy: apertureCenter.cy,
        r: 125
      }),
      duration: 0.07
    }, 0.875)

    .to(svgWorld, {
      autoAlpha: 0.82,
      filter: "blur(4px)",
      duration: 0.07
    }, 0.875)

    .to(svgWord, {
      scale: 4.8,
      autoAlpha: 0.3,
      filter: "blur(5px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.075
    }, 0.91)

    .to(apertureShape, {
      attr: () => ({
        cx: apertureCenter.cx,
        cy: apertureCenter.cy,
        r: 430
      }),
      duration: 0.075
    }, 0.91)

    .to(svgWorld, {
      autoAlpha: 1,
      filter: "blur(1.5px)",
      duration: 0.075
    }, 0.91)

    .to(svgWord, {
      scale: 13.5,
      autoAlpha: 0,
      filter: "blur(18px)",
      transformOrigin: () => `${apertureCenter.cx}px ${apertureCenter.cy}px`,
      duration: 0.14
    }, 0.945)

    .to(apertureShape, {
      attr: () => ({
        cx: apertureCenter.cx,
        cy: apertureCenter.cy,
        r: 2100
      }),
      duration: 0.14
    }, 0.945)

    .to(svgWorld, {
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: 0.14
    }, 0.945)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.92);

  const handleResize = debounce(() => {
    sync();

    gsap.set(svgWord, {
      transformOrigin: `${apertureCenter.cx}px ${apertureCenter.cy}px`
    });

    ScrollTrigger.refresh();
  }, 120);

  window.addEventListener("resize", handleResize);

  document.fonts?.ready?.then(() => {
    sync();

    gsap.set(svgWord, {
      transformOrigin: `${apertureCenter.cx}px ${apertureCenter.cy}px`
    });

    ScrollTrigger.refresh();
  });

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", handleResize);
  });

  return timeline;
}

function syncApertureToRealC({ svg, svgWord, cLetter, apertureShape, gsap }) {
  let cx = 800;
  let cy = 465;

  try {
    const cBox = cLetter.getBBox();

    cx = cBox.x + cBox.width / 2;
    cy = cBox.y + cBox.height / 2;
  } catch (error) {
    try {
      const processText = svgWord.textContent || "PROCESS";
      const cIndex = processText.indexOf("C");
      const charBox = svgWord.getExtentOfChar(Math.max(cIndex, 0));

      cx = charBox.x + charBox.width / 2;
      cy = charBox.y + charBox.height / 2;
    } catch (fallbackError) {
      console.warn("[process-scroll] Could not measure the C. Falling back to SVG center.", {
        error,
        fallbackError
      });
    }
  }

  gsap.set(apertureShape, {
    attr: {
      cx,
      cy
    }
  });

  gsap.set(svgWord, {
    transformBox: "view-box",
    transformOrigin: `${cx}px ${cy}px`
  });

  return { cx, cy };
}

function prepareInitialState({
  gsap,
  section,
  svg,
  svgWord,
  svgWorld,
  apertureShape,
  copy,
  cardTrack,
  cards,
  apertureCenter
}) {
  section.style.setProperty("--process-section-intensity", 0);
  section.style.setProperty("--process-intro", 0);
  section.style.setProperty("--process-cards", 0);
  section.style.setProperty("--process-handoff", 0);

  gsap.set(svg, {
    scale: 1,
    xPercent: 0,
    yPercent: 0,
    transformOrigin: "50% 50%",
    filter: "none"
  });

  gsap.set(svgWord, {
    autoAlpha: 0.28,
    scale: 0.5,
    x: 0,
    y: 70,
    filter: "blur(0px)",
    transformBox: "view-box",
    transformOrigin: `${apertureCenter.cx}px ${apertureCenter.cy}px`
  });

  gsap.set(svgWorld, {
    autoAlpha: 0,
    filter: "blur(12px)"
  });

  gsap.set(apertureShape, {
    attr: {
      cx: apertureCenter.cx,
      cy: apertureCenter.cy,
      r: 0
    },
    transformOrigin: "50% 50%"
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
      filter: "blur(0px)",
      transformOrigin: "50% 70%"
    });
  });
}

function prepareReducedState({
  gsap,
  section,
  svg,
  svgWord,
  svgWorld,
  apertureShape,
  copy,
  cardTrack,
  cards,
  apertureCenter
}) {
  section.style.setProperty("--process-section-intensity", 1);
  section.style.setProperty("--process-intro", 1);
  section.style.setProperty("--process-cards", 1);
  section.style.setProperty("--process-handoff", 0);

  gsap.set(svg, {
    clearProps: "all"
  });

  gsap.set(svgWord, {
    autoAlpha: 1,
    scale: 1,
    x: 0,
    y: 0,
    filter: "none",
    transformBox: "view-box",
    transformOrigin: `${apertureCenter.cx}px ${apertureCenter.cy}px`
  });

  gsap.set(svgWorld, {
    autoAlpha: 0,
    filter: "none"
  });

  gsap.set(apertureShape, {
    attr: {
      cx: apertureCenter.cx,
      cy: apertureCenter.cy,
      r: 0
    }
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
