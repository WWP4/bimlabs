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
    lastAppliedMode: "",
    previousProgress: 0
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
        const cinematicDistance = window.innerHeight * 7.15;

        return `+=${Math.max(naturalDistance, cinematicDistance, 6800)}`;
      },

      /*
        Do not pin here if the parent section already handles the sticky/pinned structure.
        This file controls the camera, not layout ownership.
      */
      pin: false,

      /*
        0.8 - 0.95 is the sweet spot:
        smooth enough to remove frame-by-frame scroll,
        not so delayed that it feels disconnected.
      */
      scrub: 0.88,
      invalidateOnRefresh: true,
      anticipatePin: 1,

      onUpdate: (self) => {
        updateByProgress({
          gsap,
          section,
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
  }, 180);

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
      autoAlpha: 0.64,
      scale: 0.58,
      xPercent: 0,
      yPercent: 18,
      letterSpacing: "-0.062em",
      force3D: true,
      duration: 0.14
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      force3D: true,
      duration: 0.16
    }, 0.055)

    .to(word, {
      autoAlpha: 0.9,
      scale: 0.92,
      xPercent: 0,
      yPercent: 0,
      letterSpacing: "-0.083em",
      force3D: true,
      duration: 0.24
    }, 0.14)

    .to(word, {
      scale: 1.04,
      autoAlpha: 0.92,
      force3D: true,
      duration: 0.22
    }, 0.38)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      force3D: true,
      duration: 0.18
    }, 0.46);
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
      scale: 0.16,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  if (worldInside) {
    timeline.set(worldInside, {
      autoAlpha: 0,
      scale: 1.035,
      xPercent: 0,
      yPercent: 0,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  /*
    The handoff is intentionally stretched.
    The important fix:
    - Our Work starts appearing earlier, but quietly.
    - It does not become "the section" until the camera has already passed through.
    - The word fades only at the very end.
  */

  timeline
    .to(word, {
      scale: 1.1,
      xPercent: -0.12,
      yPercent: 0,
      autoAlpha: 0.96,
      force3D: true,
      duration: 0.16
    }, 0.54)

    .to(section, {
      "--work-zoom-progress": 0.06,
      "--work-reveal-progress": 0,
      "--work-aperture-progress": 0.01,
      duration: 0.16
    }, 0.54)

    .to(word, {
      scale: 1.34,
      xPercent: -0.48,
      yPercent: 0,
      autoAlpha: 1,
      force3D: true,
      duration: 0.15
    }, 0.66)

    .to(section, {
      "--work-zoom-progress": 0.14,
      "--work-reveal-progress": 0.01,
      "--work-aperture-progress": 0.045,
      duration: 0.15
    }, 0.66)

    .to(word, {
      scale: 1.76,
      xPercent: -1.05,
      yPercent: 0,
      autoAlpha: 1,
      force3D: true,
      duration: 0.14
    }, 0.765)

    .to(section, {
      "--work-zoom-progress": 0.26,
      "--work-reveal-progress": 0.045,
      "--work-aperture-progress": 0.14,
      duration: 0.14
    }, 0.765)

    .to(word, {
      scale: 2.48,
      xPercent: -2.1,
      yPercent: 0,
      autoAlpha: 1,
      force3D: true,
      duration: 0.12
    }, 0.855)

    .to(section, {
      "--work-zoom-progress": 0.44,
      "--work-reveal-progress": 0.16,
      "--work-aperture-progress": 0.34,
      duration: 0.12
    }, 0.855)

    .to(word, {
      scale: 3.72,
      xPercent: -4.0,
      yPercent: 0,
      autoAlpha: 0.96,
      force3D: true,
      duration: 0.085
    }, 0.928)

    .to(section, {
      "--work-zoom-progress": 0.68,
      "--work-reveal-progress": 0.46,
      "--work-aperture-progress": 0.68,
      duration: 0.085
    }, 0.928)

    .to(word, {
      scale: 5.7,
      xPercent: -6.9,
      yPercent: 0,
      autoAlpha: 0.54,
      force3D: true,
      duration: 0.052
    }, 0.972)

    .to(section, {
      "--work-zoom-progress": 0.9,
      "--work-reveal-progress": 0.86,
      "--work-aperture-progress": 0.94,
      duration: 0.052
    }, 0.972)

    .to(word, {
      scale: 7.8,
      xPercent: -9.6,
      yPercent: 0,
      autoAlpha: 0,
      force3D: true,
      duration: 0.024
    }, 0.993)

    .to(section, {
      "--work-zoom-progress": 1,
      "--work-reveal-progress": 1,
      "--work-aperture-progress": 1,
      "--work-scroll-progress": 0,
      "--process-section-intensity": 0.08,
      duration: 0.024
    }, 0.993);

  if (tunnel) {
    timeline
      .to(tunnel, {
        autoAlpha: 0.08,
        scale: 0.44,
        force3D: true,
        duration: 0.12
      }, 0.69)

      .to(tunnel, {
        autoAlpha: 0.28,
        scale: 0.95,
        force3D: true,
        duration: 0.13
      }, 0.82)

      .to(tunnel, {
        autoAlpha: 0.62,
        scale: 2.05,
        force3D: true,
        duration: 0.1
      }, 0.925)

      .to(tunnel, {
        autoAlpha: 0,
        scale: 4.8,
        force3D: true,
        duration: 0.058
      }, 0.972);
  }

  if (worldInside) {
    timeline
      .to(worldInside, {
        autoAlpha: 0.04,
        scale: 1.03,
        force3D: true,
        duration: 0.11
      }, 0.76)

      .to(worldInside, {
        autoAlpha: 0.16,
        scale: 1.022,
        force3D: true,
        duration: 0.12
      }, 0.875)

      .to(worldInside, {
        autoAlpha: 0.58,
        scale: 1.01,
        force3D: true,
        duration: 0.09
      }, 0.945)

      .to(worldInside, {
        autoAlpha: 1,
        scale: 1,
        force3D: true,
        duration: 0.045
      }, 0.985);
  }

  if (overlay) {
    timeline
      .to(overlay, {
        autoAlpha: 0.72,
        force3D: true,
        duration: 0.08
      }, 0.7)

      .to(overlay, {
        autoAlpha: 0.18,
        force3D: true,
        duration: 0.13
      }, 0.89)

      .to(overlay, {
        autoAlpha: 0,
        force3D: true,
        duration: 0.05
      }, 0.97);
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
      scale: 0.16,
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
      scale: 1.035,
      xPercent: 0,
      yPercent: 0,
      force3D: true,
      pointerEvents: "none"
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
  setProcessVar(section, "--process-handoff", "1");
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
    This is the biggest fix.

    Before, the lock/interactivity happened at basically 99.9%,
    but the visual state was fighting it. That made it feel like a snap.

    Now:
    - Visual reveal starts around 72%.
    - Handoff camera finishes from 96% to 100%.
    - Real pointer interaction only turns on at the final landing.
    - When scrolling back up, we release earlier so it feels reversible.
  */

  const ENTER_WORK_AT = 0.9988;
  const EXIT_WORK_AT = 0.905;
  const WORK_MODE_AT = 0.992;
  const WORK_INTERACTIVE_AT = 0.9988;

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
  const handoff = locked ? 1 : smooth(mapRange(effectiveProgress, 0.52, 1));

  const workZoom = locked ? 1 : smooth(mapRange(effectiveProgress, 0.54, 0.998));
  const workReveal = locked ? 1 : smooth(mapRange(effectiveProgress, 0.72, 0.997));
  const workAperture = locked ? 1 : smooth(mapRange(effectiveProgress, 0.68, 0.999));
  const workScroll = locked ? 0 : mapRange(effectiveProgress, 0.982, 1);

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

  const workVisible = locked || workReveal > 0.02;
  const workMode = locked || effectiveProgress >= WORK_MODE_AT;
  const workInteractive = locked || effectiveProgress >= WORK_INTERACTIVE_AT;
  const insideWork = locked;

  section.classList.toggle("is-work-visible", workVisible);
  section.classList.toggle("is-work-mode", workMode);
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

    if (!workInteractive && !locked) {
      gsap.set(worldInside, {
        pointerEvents: "none"
      });
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
      pointerEvents: "none",
      clearProps: "visibility"
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
      pointerEvents: "none",
      clearProps: "visibility"
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

function smooth(value) {
  const t = Math.min(Math.max(value, 0), 1);
  return t * t * (3 - 2 * t);
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
