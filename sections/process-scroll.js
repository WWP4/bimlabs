// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");

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
      copy
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
    copy
  });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",

      /*
        The cards are normal document content now.
        So this timeline follows the natural height of the section.
        It should not over-pin or create that "stopped" feeling.
      */
      end: () => {
        const naturalDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
        const minimumDistance = window.innerHeight * 4.6;

        return `+=${Math.max(naturalDistance, minimumDistance, 4200)}`;
      },

      pin: false,
      scrub: 0.8,
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

  addProcessIntro({
    timeline,
    section,
    word,
    copy
  });

  addProcessHandoff({
    timeline,
    section,
    word,
    voidTarget,
    worldInside
  });

  const refreshOnResize = debounce(() => {
    ScrollTrigger.refresh();
  }, 160);

  window.addEventListener("resize", refreshOnResize);

  return timeline;
}

/* =========================================================
   INTRO
   PROCESS enters smoothly, then holds as the cards scroll.
========================================================= */

function addProcessIntro({ timeline, section, word, copy }) {
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.8,
      scale: 0.72,
      yPercent: 16,
      letterSpacing: "-0.07em",
      duration: 0.12
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12
    }, 0.055)

    .to(word, {
      autoAlpha: 0.92,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.2
    }, 0.12)

    .to(word, {
      scale: 1.12,
      autoAlpha: 0.86,
      duration: 0.24
    }, 0.34)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      duration: 0.16
    }, 0.38);
}

/* =========================================================
   HANDOFF
   Only starts near the end.
   Cards are normal content, so this just handles PROCESS → C zoom.
========================================================= */

function addProcessHandoff({
  timeline,
  section,
  word,
  voidTarget,
  worldInside
}) {
  if (!voidTarget || !worldInside) return;

  timeline
    .to(word, {
      scale: 1.32,
      autoAlpha: 0.78,
      filter: "blur(0px)",
      duration: 0.08
    }, 0.82)

    .to(voidTarget, {
      autoAlpha: 0.88,
      scale: 1,
      duration: 0.055
    }, 0.845)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at var(--process-c-x) var(--process-c-y))",
      y: 24,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.06
    }, 0.855)

    .to(word, {
      scale: 3.05,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.7px)",
      duration: 0.07
    }, 0.88)

    .to(voidTarget, {
      scale: 3.55,
      autoAlpha: 0.84,
      duration: 0.07
    }, 0.88)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at var(--process-c-x) var(--process-c-y))",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.075
    }, 0.905)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.13
    }, 0.945)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13
    }, 0.945)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at var(--process-c-x) var(--process-c-y))",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.15
    }, 0.945)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.96);
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
  copy
}) {
  section.style.setProperty("--process-section-intensity", 0);

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    transformOrigin: "52% 50%"
  });

  gsap.set(word, {
    autoAlpha: 0.24,
    scale: 0.46,
    xPercent: 0,
    yPercent: 28,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.06em"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0,
      scale: 0.14,
      transformOrigin: "50% 50%"
    });
  }

  if (worldInside) {
    gsap.set(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(0% at var(--process-c-x) var(--process-c-y))",
      y: 44,
      scale: 0.8,
      filter: "blur(12px)",
      transformOrigin: "var(--process-c-x) var(--process-c-y)"
    });
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 0,
      y: 28
    });
  }
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
  copy
}) {
  section.style.setProperty("--process-section-intensity", 1);

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
      filter: "none"
    });
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 1,
      y: 0
    });
  }
}

/* =========================================================
   PROGRESS VARIABLES
   These only update scene/UI softness.
   They do not animate cards.
========================================================= */

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.36);
  const cards = mapRange(progress, 0.24, 0.82);
  const handoff = mapRange(progress, 0.82, 1);

  if (scene?.setProgress) {
    scene.setProgress({
      intro,
      cards,
      handoff
    });
  }

  if (ui?.softenForHandoff) {
    ui.softenForHandoff(handoff);
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
