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
    voidTarget
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
   This file now ONLY animates the PROCESS word and void.
   Our Work is controlled by sections/our-work.js.
   Do not animate .process-world-inside here.
========================================================= */

function addProcessHandoff({
  timeline,
  section,
  word,
  voidTarget
}) {
  /*
    Tunnel handoff:
    PROCESS scales past camera.
    A dark aperture bridges the moment before Our Work fully opens.
    This avoids the cheap fade AND avoids giant white letter chunks sitting on screen.
  */

  if (voidTarget) {
    timeline.set(voidTarget, {
      autoAlpha: 0,
      scale: 0.2,
      transformOrigin: "50% 50%"
    }, 0);
  }

  timeline
    .to(word, {
      scale: 1.32,
      xPercent: -1.5,
      autoAlpha: 0.94,
      duration: 0.08
    }, 0.82)

    .to(word, {
      scale: 2.7,
      xPercent: -4,
      autoAlpha: 0.96,
      duration: 0.08
    }, 0.875)

    .to(word, {
      scale: 5.8,
      xPercent: -8.5,
      autoAlpha: 1,
      duration: 0.09
    }, 0.925)

    /* Dark tunnel begins while PROCESS is still readable/physical */
    .to(voidTarget, {
      autoAlpha: 0.92,
      scale: 2.8,
      duration: 0.08
    }, 0.935)

    .to(word, {
      scale: 12,
      xPercent: -16,
      autoAlpha: 1,
      duration: 0.1
    }, 0.965)

    .to(voidTarget, {
      autoAlpha: 1,
      scale: 8,
      duration: 0.1
    }, 0.965)

    /*
      Cleanup after PROCESS is already beyond the camera.
      This should not look like a visible fade.
    */
    .to(word, {
      autoAlpha: 0,
      duration: 0.01
    }, 0.995)

    .to(voidTarget, {
      autoAlpha: 0,
      scale: 12,
      duration: 0.04
    }, 0.995)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.08
    }, 0.97);
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
    filter: "none",
    letterSpacing: "-0.06em",
    force3D: true
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0,
      scale: 0.14,
      transformOrigin: "50% 50%",
      force3D: true
    });
  }

  /*
    Important:
    Do not set clipPath/filter/scale/opacity on .process-world-inside here.
    sections/our-work.css and sections/our-work.js own that layer.
  */
  if (worldInside) {
    gsap.set(worldInside, {
      clearProps: "all"
    });
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 0,
      y: 28,
      force3D: true
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
      clearProps: "all"
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
   They do not animate cards or Our Work.
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
