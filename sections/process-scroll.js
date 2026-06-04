// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger }) {
  const sceneMount = section?.querySelector("[data-process-scene]");
  const word = section?.querySelector(".process-word");
  const tunnel = section?.querySelector(".process-void");
  const worldInside = section?.querySelector(".process-world-inside");
  const workTrack = section?.querySelector("[data-work-track]");
  const copy = section?.querySelector(".process-copy");
  const overlay = section?.querySelector(".process-overlay");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    lockedInsideWork: false,
    previousProgress: 0,
    lastAppliedMode: ""
  };

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
      workTrack,
      copy,
      overlay
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
    workTrack,
    copy,
    overlay
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
        const minimumDistance = window.innerHeight * 6.4;

        return `+=${Math.max(naturalDistance, minimumDistance, 6100)}`;
      },
      pin: false,

      /*
        This is the camera glide.
        Lower = more direct.
        Higher = smoother but can feel delayed.
      */
      scrub: 1.05,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        updateByProgress({
          gsap,
          section,
          sceneMount,
          word,
          tunnel,
          worldInside,
          workTrack,
          overlay,
          progress: self.progress,
          direction: self.direction,
          scene,
          ui,
          state
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

        state.lockedInsideWork = true;

        applyLockedWorkState({
          gsap,
          section,
          word,
          tunnel,
          worldInside,
          workTrack,
          overlay,
          state
        });
      },

      onLeaveBack: () => {
        state.lockedInsideWork = false;
        state.lastAppliedMode = "";

        section.classList.remove(
          "is-process-active",
          "is-work-visible",
          "is-work-interactive",
          "is-work-mode",
          "is-inside-work"
        );

        releaseLockedWorkState({
          gsap,
          word,
          tunnel,
          worldInside,
          overlay,
          state
        });
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
    tunnel,
    worldInside,
    overlay
  });

  const refreshOnResize = debounce(() => {
    ScrollTrigger.refresh();
  }, 160);

  window.addEventListener("resize", refreshOnResize);

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", refreshOnResize);
    state.lockedInsideWork = false;
    state.lastAppliedMode = "";
  });

  return timeline;
}

/* =========================================================
   INTRO
========================================================= */

function addProcessIntro({ timeline, section, word, copy }) {
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.14
    }, 0)

    .to(word, {
      autoAlpha: 0.72,
      scale: 0.64,
      xPercent: 0,
      yPercent: 15,
      letterSpacing: "-0.068em",
      force3D: true,
      duration: 0.14
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      force3D: true,
      duration: 0.14
    }, 0.055)

    .to(word, {
      autoAlpha: 0.9,
      scale: 0.96,
      xPercent: 0,
      yPercent: 0,
      letterSpacing: "-0.085em",
      force3D: true,
      duration: 0.23
    }, 0.13)

    .to(word, {
      scale: 1.06,
      autoAlpha: 0.88,
      force3D: true,
      duration: 0.26
    }, 0.36)

    .to(copy, {
      autoAlpha: 0,
      y: -22,
      force3D: true,
      duration: 0.17
    }, 0.43);
}

/* =========================================================
   C / TUNNEL HANDOFF
========================================================= */

function addProcessTunnelHandoff({
  timeline,
  section,
  sceneMount,
  word,
  tunnel,
  worldInside,
  overlay
}) {
  if (tunnel) {
    timeline.set(tunnel, {
      autoAlpha: 0,
      scale: 0.14,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  if (worldInside) {
    timeline.set(worldInside, {
      autoAlpha: 0,
      scale: 1,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  /*
    Important:
    The word starts moving earlier and keeps moving longer.
    The final lock happens only after the aperture has visually filled the screen.
  */

  timeline
    .to(word, {
      scale: 1.14,
      xPercent: -0.18,
      yPercent: 0,
      autoAlpha: 0.91,
      force3D: true,
      duration: 0.16
    }, 0.52)

    .to(section, {
      "--work-zoom-progress": 0.08,
      "--work-reveal-progress": 0,
      "--work-aperture-progress": 0.02,
      duration: 0.16
    }, 0.52)

    .to(word, {
      scale: 1.46,
      xPercent: -0.72,
      autoAlpha: 0.95,
      force3D: true,
      duration: 0.16
    }, 0.64)

    .to(section, {
      "--work-zoom-progress": 0.18,
      "--work-reveal-progress": 0.015,
      "--work-aperture-progress": 0.07,
      duration: 0.16
    }, 0.64)

    .to(word, {
      scale: 2,
      xPercent: -1.45,
      autoAlpha: 0.98,
      force3D: true,
      duration: 0.15
    }, 0.75)

    .to(section, {
      "--work-zoom-progress": 0.34,
      "--work-reveal-progress": 0.08,
      "--work-aperture-progress": 0.2,
      duration: 0.15
    }, 0.75)

    .to(word, {
      scale: 3.05,
      xPercent: -3.1,
      autoAlpha: 1,
      force3D: true,
      duration: 0.13
    }, 0.845)

    .to(section, {
      "--work-zoom-progress": 0.56,
      "--work-reveal-progress": 0.28,
      "--work-aperture-progress": 0.46,
      duration: 0.13
    }, 0.845)

    .to(word, {
      scale: 4.8,
      xPercent: -5.8,
      autoAlpha: 0.9,
      force3D: true,
      duration: 0.1
    }, 0.925)

    .to(section, {
      "--work-zoom-progress": 0.78,
      "--work-reveal-progress": 0.62,
      "--work-aperture-progress": 0.78,
      duration: 0.1
    }, 0.925)

    .to(word, {
      scale: 7.2,
      xPercent: -8.9,
      autoAlpha: 0.18,
      force3D: true,
      duration: 0.065
    }, 0.975)

    .to(section, {
      "--work-zoom-progress": 1,
      "--work-reveal-progress": 1,
      "--work-aperture-progress": 1,
      "--work-scroll-progress": 0,
      "--process-section-intensity": 0.12,
      duration: 0.065
    }, 0.975)

    .to(word, {
      autoAlpha: 0,
      force3D: true,
      duration: 0.02
    }, 0.995);

  if (tunnel) {
    timeline
      .to(tunnel, {
        autoAlpha: 0.12,
        scale: 0.52,
        force3D: true,
        duration: 0.13
      }, 0.7)

      .to(tunnel, {
        autoAlpha: 0.46,
        scale: 1.25,
        force3D: true,
        duration: 0.14
      }, 0.82)

      .to(tunnel, {
        autoAlpha: 0.78,
        scale: 2.7,
        force3D: true,
        duration: 0.11
      }, 0.915)

      .to(tunnel, {
        autoAlpha: 0,
        scale: 5.4,
        force3D: true,
        duration: 0.055
      }, 0.975);
  }

  if (worldInside) {
    timeline
      .to(worldInside, {
        autoAlpha: 0.1,
        scale: 1,
        force3D: true,
        duration: 0.14
      }, 0.74)

      .to(worldInside, {
        autoAlpha: 0.42,
        scale: 1,
        force3D: true,
        duration: 0.14
      }, 0.88)

      .to(worldInside, {
        autoAlpha: 1,
        scale: 1,
        force3D: true,
        duration: 0.09
      }, 0.955);
  }

  if (overlay) {
    timeline.to(overlay, {
      autoAlpha: 0,
      force3D: true,
      duration: 0.16
    }, 0.84);
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
  workTrack,
  copy,
  overlay
}) {
  section.classList.remove(
    "is-process-active",
    "is-work-visible",
    "is-work-interactive",
    "is-work-mode",
    "is-inside-work"
  );

  setProcessVar(section, "--process-section-intensity", "0");
  setProcessVar(section, "--process-intro", "0");
  setProcessVar(section, "--process-cards", "0");
  setProcessVar(section, "--process-handoff", "0");
  setProcessVar(section, "--work-zoom-progress", "0");
  setProcessVar(section, "--work-reveal-progress", "0");
  setProcessVar(section, "--work-scroll-progress", "0");
  setProcessVar(section, "--work-aperture-progress", "0");

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
    force3D: true,
    clearProps: "visibility,pointerEvents"
  });

  if (tunnel) {
    gsap.set(tunnel, {
      autoAlpha: 0,
      scale: 0.14,
      transformOrigin: "50% 50%",
      force3D: true,
      clearProps: "visibility,pointerEvents"
    });
  }

  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 0,
      scale: 1,
      force3D: true,
      clearProps: "pointerEvents"
    });
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 0,
      y: 28,
      force3D: true
    });
  }

  if (overlay) {
    gsap.set(overlay, {
      autoAlpha: 1,
      force3D: true,
      clearProps: "visibility,pointerEvents"
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
  workTrack,
  copy,
  overlay
}) {
  setProcessVar(section, "--process-section-intensity", "1");
  setProcessVar(section, "--process-intro", "1");
  setProcessVar(section, "--process-cards", "1");
  setProcessVar(section, "--process-handoff", "0");
  setProcessVar(section, "--work-zoom-progress", "1");
  setProcessVar(section, "--work-reveal-progress", "1");
  setProcessVar(section, "--work-scroll-progress", "0");
  setProcessVar(section, "--work-aperture-progress", "1");

  section.classList.remove("is-process-active");
  section.classList.add(
    "is-work-visible",
    "is-work-interactive",
    "is-work-mode",
    "is-inside-work"
  );

  gsap.set(sceneMount, {
    clearProps: "all"
  });

  gsap.set(word, {
    autoAlpha: 0,
    visibility: "hidden",
    pointerEvents: "none"
  });

  if (tunnel) {
    gsap.set(tunnel, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none"
    });
  }

  if (worldInside) {
    worldInside.removeAttribute("aria-hidden");
    worldInside.classList.add("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 1,
      scale: 1,
      visibility: "visible",
      pointerEvents: "auto"
    });
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  if (copy) {
    gsap.set(copy, {
      autoAlpha: 1,
      y: 0
    });
  }

  if (overlay) {
    gsap.set(overlay, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none"
    });
  }
}

/* =========================================================
   PROGRESS + REAL WORK LOCK
========================================================= */

function updateByProgress({
  gsap,
  section,
  word,
  tunnel,
  worldInside,
  workTrack,
  overlay,
  progress,
  direction,
  scene,
  ui,
  state
}) {
  /*
    Lock very late.
    The transition should already look complete before this fires.
  */
  const ENTER_WORK_AT = 0.998;
  const EXIT_WORK_AT = 0.88;

  const goingBackward = direction < 0;

  if (!state.lockedInsideWork && progress >= ENTER_WORK_AT) {
    state.lockedInsideWork = true;
  }

  if (state.lockedInsideWork && goingBackward && progress <= EXIT_WORK_AT) {
    state.lockedInsideWork = false;
    state.lastAppliedMode = "";

    releaseLockedWorkState({
      gsap,
      word,
      tunnel,
      worldInside,
      overlay,
      state
    });
  }

  const locked = state.lockedInsideWork;
  const effectiveProgress = locked ? 1 : progress;

  const intro = mapRange(effectiveProgress, 0.02, 0.3);
  const cards = locked ? 1 : mapRange(effectiveProgress, 0.18, 0.62);

  /*
    Handoff begins earlier but finishes later.
    This creates travel instead of a quick switch.
  */
  const handoff = locked ? 1 : mapRange(effectiveProgress, 0.52, 1);

  const workZoom = locked ? 1 : mapRange(effectiveProgress, 0.54, 0.995);
  const workReveal = locked ? 1 : mapRange(effectiveProgress, 0.72, 0.996);
  const workAperture = locked ? 1 : mapRange(effectiveProgress, 0.68, 0.997);
  const workScroll = locked ? 0 : mapRange(effectiveProgress, 0.975, 1);

  setProcessVar(section, "--process-intro", intro.toFixed(4));
  setProcessVar(section, "--process-cards", cards.toFixed(4));
  setProcessVar(section, "--process-handoff", handoff.toFixed(4));
  setProcessVar(section, "--work-zoom-progress", workZoom.toFixed(4));
  setProcessVar(section, "--work-reveal-progress", workReveal.toFixed(4));
  setProcessVar(section, "--work-aperture-progress", workAperture.toFixed(4));
  setProcessVar(section, "--work-scroll-progress", workScroll.toFixed(4));

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", workScroll.toFixed(4));
  }

  const workVisible = locked || workReveal > 0.015;
  const workInteractive = locked || effectiveProgress >= 0.997;
  const workMode = locked || effectiveProgress >= 0.999;
  const insideWork = locked;

  section.classList.toggle("is-work-visible", workVisible);
  section.classList.toggle("is-work-interactive", workInteractive);
  section.classList.toggle("is-work-mode", workMode);
  section.classList.toggle("is-inside-work", insideWork);

  if (worldInside) {
    worldInside.classList.toggle("is-visible", workVisible);
    worldInside.classList.toggle("is-interactive", workInteractive);

    if (workVisible) {
      worldInside.removeAttribute("aria-hidden");
    } else {
      worldInside.setAttribute("aria-hidden", "true");
    }
  }

  if (locked) {
    applyLockedWorkState({
      gsap,
      section,
      word,
      tunnel,
      worldInside,
      workTrack,
      overlay,
      state
    });
  } else {
    applyUnlockedState({
      gsap,
      word,
      tunnel,
      worldInside,
      overlay,
      state
    });
  }

  if (scene?.setProgress) {
    scene.setProgress({
      intro,
      cards,
      handoff
    });
  }

  if (ui?.setProgress) {
    ui.setProgress({
      intro,
      cards,
      handoff,
      workZoom,
      workReveal,
      workScroll,
      insideWork
    });
  }

  state.previousProgress = progress;
}

/* =========================================================
   LOCKED / UNLOCKED VISUAL STATES
========================================================= */

function applyLockedWorkState({
  gsap,
  section,
  word,
  tunnel,
  worldInside,
  workTrack,
  overlay,
  state
}) {
  if (state.lastAppliedMode === "locked") return;

  state.lastAppliedMode = "locked";

  section.classList.add(
    "is-work-visible",
    "is-work-interactive",
    "is-work-mode",
    "is-inside-work"
  );

  setProcessVar(section, "--work-aperture-progress", "1");
  setProcessVar(section, "--work-reveal-progress", "1");
  setProcessVar(section, "--work-zoom-progress", "1");
  setProcessVar(section, "--work-scroll-progress", "0");

  if (worldInside) {
    worldInside.removeAttribute("aria-hidden");
    worldInside.classList.add("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 1,
      scale: 1,
      xPercent: 0,
      yPercent: 0,
      visibility: "visible",
      pointerEvents: "auto",
      force3D: true
    });
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  if (word) {
    gsap.set(word, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none"
    });
  }

  if (tunnel) {
    gsap.set(tunnel, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none"
    });
  }

  if (overlay) {
    gsap.set(overlay, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none"
    });
  }
}

function applyUnlockedState({
  gsap,
  word,
  tunnel,
  worldInside,
  overlay,
  state
}) {
  if (state.lastAppliedMode !== "locked") return;

  state.lastAppliedMode = "unlocked";

  if (worldInside) {
    gsap.set(worldInside, {
      clearProps: "pointerEvents"
    });
  }

  if (word) {
    gsap.set(word, {
      clearProps: "visibility,pointerEvents"
    });
  }

  if (tunnel) {
    gsap.set(tunnel, {
      clearProps: "visibility,pointerEvents"
    });
  }

  if (overlay) {
    gsap.set(overlay, {
      clearProps: "visibility,pointerEvents"
    });
  }
}

function releaseLockedWorkState({
  gsap,
  word,
  tunnel,
  worldInside,
  overlay,
  state
}) {
  state.lastAppliedMode = "";

  if (worldInside) {
    worldInside.classList.remove("is-interactive");

    gsap.set(worldInside, {
      clearProps: "pointerEvents"
    });
  }

  if (word) {
    gsap.set(word, {
      clearProps: "visibility,pointerEvents"
    });
  }

  if (tunnel) {
    gsap.set(tunnel, {
      clearProps: "visibility,pointerEvents"
    });
  }

  if (overlay) {
    gsap.set(overlay, {
      clearProps: "visibility,pointerEvents"
    });
  }
}

/* =========================================================
   HELPERS
========================================================= */

const processVarCache = new WeakMap();

function setProcessVar(element, name, value) {
  if (!element) return;

  let cache = processVarCache.get(element);

  if (!cache) {
    cache = new Map();
    processVarCache.set(element, cache);
  }

  const stringValue = String(value);

  if (cache.get(name) === stringValue) return;

  cache.set(name, stringValue);
  element.style.setProperty(name, stringValue);
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
