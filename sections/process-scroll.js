// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const tunnel = section.querySelector(".process-void");
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
      sceneMount,
      word,
      tunnel,
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
    tunnel,
    worldInside,
    copy
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => {
        const naturalDistance = Math.max(section.offsetHeight - window.innerHeight, 1);
        const minimumDistance = window.innerHeight * 4.8;

        return `+=${Math.max(naturalDistance, minimumDistance, 4600)}`;
      },
      pin: false,
      scrub: true,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        updateByProgress({
          section,
          progress: self.progress,
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
      },

      onLeaveBack: () => {
        section.classList.remove("is-process-active");
      }
    }
  });

  addProcessIntro({
    timeline,
    section,
    word,
    copy
  });

  addProcessTunnelHandoff({
    timeline,
    section,
    sceneMount,
    word,
    tunnel
  });

  const refreshOnResize = debounce(() => {
    ScrollTrigger.refresh();
  }, 160);

  window.addEventListener("resize", refreshOnResize);

  return timeline;
}

/* =========================================================
   INTRO
   PROCESS comes forward, then holds while the cards scroll.
========================================================= */

function addProcessIntro({ timeline, section, word, copy }) {
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.78,
      scale: 0.7,
      xPercent: 0,
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
      xPercent: 0,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.22
    }, 0.12)

    .to(word, {
      scale: 1.1,
      autoAlpha: 0.9,
      duration: 0.24
    }, 0.34)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      duration: 0.16
    }, 0.39);
}

/* =========================================================
   TUNNEL HANDOFF
   PROCESS does not visibly fade away.
   It scales past camera while the tunnel bridges into Our Work.
========================================================= */

function addProcessTunnelHandoff({
  timeline,
  section,
  sceneMount,
  word,
  tunnel
}) {
  if (tunnel) {
    timeline.set(tunnel, {
      autoAlpha: 0,
      scale: 0.2,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  /*
    Important:
    The CSS handles the actual Our Work reveal through:
    --work-zoom-progress
    --work-reveal-progress
    --work-scroll-progress

    This file handles:
    --process-handoff
    PROCESS word scale
    dark tunnel bridge
  */

  timeline
    .to(word, {
      scale: 1.34,
      xPercent: -1.2,
      yPercent: 0,
      autoAlpha: 0.94,
      duration: 0.08
    }, 0.76)

    .to(word, {
      scale: 2.8,
      xPercent: -3.8,
      autoAlpha: 0.98,
      duration: 0.08
    }, 0.84)

    .to(word, {
      scale: 6.2,
      xPercent: -8.8,
      autoAlpha: 1,
      duration: 0.07
    }, 0.895);

  if (tunnel) {
    timeline
      .to(tunnel, {
        autoAlpha: 0.5,
        scale: 1.15,
        duration: 0.05
      }, 0.875)

      .to(tunnel, {
        autoAlpha: 0.94,
        scale: 3.15,
        duration: 0.075
      }, 0.915)

      .to(tunnel, {
        autoAlpha: 1,
        scale: 6.4,
        duration: 0.025
      }, 0.955);
  }

  timeline
    .to(word, {
      scale: 11.5,
      xPercent: -14.5,
      autoAlpha: 1,
      duration: 0.025
    }, 0.96)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.03
    }, 0.965)

    /*
      Cleanup only after the word has already gone past camera.
      This should not feel like a visible fade.
    */
    .to(word, {
      autoAlpha: 0,
      duration: 0.008
    }, 0.99);

  if (tunnel) {
    timeline.to(tunnel, {
      autoAlpha: 0,
      scale: 7.2,
      duration: 0.018
    }, 0.98);
  }

  timeline.set(sceneMount, {
    clearProps: "filter"
  }, 1);
}

/* =========================================================
   INITIAL STATE
========================================================= */

function prepareInitialState({
  gsap,
  section,
  sceneMount,
  word,
  tunnel,
  worldInside,
  copy
}) {
  section.classList.remove("is-work-mode");

  section.style.setProperty("--process-section-intensity", "0");
  section.style.setProperty("--process-intro", "0");
  section.style.setProperty("--process-cards", "0");
  section.style.setProperty("--process-handoff", "0");

  section.style.setProperty("--work-zoom-progress", "0");
  section.style.setProperty("--work-reveal-progress", "0");
  section.style.setProperty("--work-scroll-progress", "0");

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    yPercent: 0,
    transformOrigin: "52% 50%",
    force3D: true
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

  if (tunnel) {
    gsap.set(tunnel, {
      autoAlpha: 0,
      scale: 0.2,
      transformOrigin: "50% 50%",
      force3D: true
    });
  }

  /*
    Do not clear all props on .process-world-inside.
    The CSS + our-work.js need its clip-path, opacity, transform,
    visibility, and custom properties to stay intact.
  */
  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");
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
  sceneMount,
  word,
  tunnel,
  worldInside,
  copy
}) {
  section.style.setProperty("--process-section-intensity", "1");
  section.style.setProperty("--process-intro", "1");
  section.style.setProperty("--process-cards", "1");
  section.style.setProperty("--process-handoff", "0");

  section.style.setProperty("--work-zoom-progress", "1");
  section.style.setProperty("--work-reveal-progress", "1");
  section.style.setProperty("--work-scroll-progress", "0");

  section.classList.remove("is-process-active");
  section.classList.remove("is-work-mode");

  gsap.set(sceneMount, {
    clearProps: "all"
  });

  gsap.set(word, {
    clearProps: "all"
  });

  if (tunnel) {
    gsap.set(tunnel, {
      autoAlpha: 0,
      scale: 0
    });
  }

  if (worldInside) {
    worldInside.removeAttribute("aria-hidden");
    worldInside.classList.add("is-visible", "is-interactive");
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
   CSS and external UI now receive the same scroll signal.
========================================================= */

function updateByProgress({ section, progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.36);
  const cards = mapRange(progress, 0.24, 0.82);
  const handoff = mapRange(progress, 0.76, 1);

  section.style.setProperty("--process-intro", intro.toFixed(4));
  section.style.setProperty("--process-cards", cards.toFixed(4));
  section.style.setProperty("--process-handoff", handoff.toFixed(4));

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

/* =========================================================
   HELPERS
========================================================= */

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
