// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const svg = section?.querySelector(".process-svg");
  const svgWord = section?.querySelector("[data-process-word]");
  const svgWorld = section?.querySelector(".process-svg-world");
  const apertureShape = section?.querySelector("[data-process-aperture-shape]");
  const copy = section?.querySelector(".process-copy");
  const cardTrack = section?.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || !svg || !svgWord || !svgWorld || !apertureShape) {
    console.warn("[process-scroll] Missing required SVG process elements.", {
      section,
      svg,
      svgWord,
      svgWorld,
      apertureShape
    });

    return null;
  }

  if (prefersReducedMotion) {
    prepareReducedState({
      gsap,
      section,
      svg,
      svgWord,
      svgWorld,
      apertureShape,
      copy,
      cardTrack,
      cards
    });

    return null;
  }

  prepareInitialState({
    gsap,
    section,
    svg,
    svgWord,
    svgWorld,
    apertureShape,
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
    PHASE 1:
    Bring PROCESS forward.
    Since PROCESS is SVG text now, we animate the SVG word directly.
  */
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(svgWord, {
      autoAlpha: 0.94,
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.2
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12
    }, 0.08)

    .to(svgWord, {
      scale: 1.16,
      autoAlpha: 0.9,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.14
    }, 0.26);

  /*
    PHASE 2:
    Process cards move through the scene.
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
    PHASE 3:
    Open the SVG aperture.
    This is the real fix: we animate the SVG circle radius inside the same
    viewBox as PROCESS, instead of guessing screen x/y points.
  */
  timeline
    .to(svgWord, {
      scale: 1.34,
      autoAlpha: 0.82,
      filter: "blur(0px)",
      duration: 0.12
    }, 0.76)

    .to(cardTrack, {
      autoAlpha: 0,
      duration: 0.08
    }, 0.78)

    .to(svgWorld, {
      autoAlpha: 1,
      filter: "blur(8px)",
      duration: 0.04
    }, 0.795)

    .to(apertureShape, {
      attr: { r: 28 },
      duration: 0.055
    }, 0.805)

    .to(svgWord, {
      scale: 2.05,
      autoAlpha: 0.7,
      filter: "blur(0.8px)",
      duration: 0.075
    }, 0.835)

    .to(apertureShape, {
      attr: { r: 115 },
      duration: 0.075
    }, 0.85)

    .to(svgWorld, {
      filter: "blur(3px)",
      duration: 0.075
    }, 0.85)

    .to(svgWord, {
      scale: 3.7,
      autoAlpha: 0.46,
      filter: "blur(3px)",
      duration: 0.075
    }, 0.875)

    .to(apertureShape, {
      attr: { r: 420 },
      duration: 0.075
    }, 0.875)

    .to(svgWorld, {
      filter: "blur(1px)",
      duration: 0.075
    }, 0.875)

    .to(svgWord, {
      scale: 11.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.15
    }, 0.91)

    .to(apertureShape, {
      attr: { r: 1900 },
      duration: 0.15
    }, 0.91)

    .to(svgWorld, {
      autoAlpha: 1,
      filter: "blur(0px)",
      duration: 0.15
    }, 0.91)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.9);

  const handleResize = debounce(() => {
    ScrollTrigger.refresh();
  }, 120);

  window.addEventListener("resize", handleResize);

  document.fonts?.ready?.then(() => {
    ScrollTrigger.refresh();
  });

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", handleResize);
  });

  return timeline;
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
  cards
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
    scale: 0.46,
    x: 0,
    y: 70,
    filter: "blur(0px)",
    transformOrigin: "680px 450px"
  });

  gsap.set(svgWorld, {
    autoAlpha: 0,
    filter: "blur(10px)"
  });

  gsap.set(apertureShape, {
    attr: { r: 0 },
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
  cards
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
    transformOrigin: "680px 450px"
  });

  gsap.set(svgWorld, {
    autoAlpha: 0,
    filter: "none"
  });

  gsap.set(apertureShape, {
    attr: { r: 0 }
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
