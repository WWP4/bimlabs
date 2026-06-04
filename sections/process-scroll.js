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
        const minimumDistance = window.innerHeight * 6;

        return `+=${Math.max(naturalDistance, minimumDistance, 5800)}`;
      },
      pin: false,
      scrub: 0.75,
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

        /*
          If the user reaches the end of the PROCESS section, keep them inside
          Our Work visually instead of letting the timeline flicker backward.
        */
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
   PROCESS comes forward, then holds while the cards scroll.
========================================================= */

function addProcessIntro({ timeline, section, word, copy }) {
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.14
    }, 0)

    .to(word, {
      autoAlpha: 0.74,
      scale: 0.66,
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
      duration: 0.22
    }, 0.13)

    .to(word, {
      scale: 1.06,
      autoAlpha: 0.88,
      force3D: true,
      duration: 0.28
    }, 0.35)

    .to(copy, {
      autoAlpha: 0,
      y: -22,
      force3D: true,
      duration: 0.16
    }, 0.43);
}

/* =========================================================
   C / TUNNEL HANDOFF
   The PROCESS word/tunnel creates the motion.
   Our Work stays full-size behind the scene and fades in.
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
      scale: 1,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  /*
    New timing:
    0.00–0.58  PROCESS/cards phase
    0.58–0.74  slow camera pressure begins
    0.74–0.92  real zoom
    0.92–1.00  Our Work takeover

    This avoids the old issue where almost all zoom happened after 0.88.
  */

  timeline
    .to(word, {
      scale: 1.16,
      xPercent: -0.25,
      yPercent: 0,
      autoAlpha: 0.92,
      force3D: true,
      duration: 0.16
    }, 0.58)

    .to(section, {
      "--work-zoom-progress": 0.08,
      "--work-reveal-progress": 0,
      duration: 0.16
    }, 0.58)

    .to(word, {
      scale: 1.55,
      xPercent: -0.85,
      autoAlpha: 0.96,
      force3D: true,
      duration: 0.14
    }, 0.68)

    .to(section, {
      "--work-zoom-progress": 0.22,
      "--work-reveal-progress": 0.02,
      duration: 0.14
    }, 0.68)

    .to(word, {
      scale: 2.25,
      xPercent: -1.9,
      autoAlpha: 1,
      force3D: true,
      duration: 0.13
    }, 0.78)

    .to(section, {
      "--work-zoom-progress": 0.42,
      "--work-reveal-progress": 0.12,
      duration: 0.13
    }, 0.78)

    .to(word, {
      scale: 3.65,
      xPercent: -4.1,
      autoAlpha: 1,
      force3D: true,
      duration: 0.11
    }, 0.865)

    .to(section, {
      "--work-zoom-progress": 0.68,
      "--work-reveal-progress": 0.42,
      duration: 0.11
    }, 0.865)

    .to(word, {
      scale: 5.7,
      xPercent: -7.2,
      autoAlpha: 0.82,
      force3D: true,
      duration: 0.075
    }, 0.935)

    .to(section, {
      "--work-zoom-progress": 0.9,
      "--work-reveal-progress": 0.78,
      duration: 0.075
    }, 0.935)

    .to(word, {
      scale: 7.8,
      xPercent: -9.4,
      autoAlpha: 0,
      force3D: true,
      duration: 0.05
    }, 0.975)

    .to(section, {
      "--work-zoom-progress": 1,
      "--work-reveal-progress": 1,
      "--work-scroll-progress": 0,
      "--process-section-intensity": 0.12,
      duration: 0.05
    }, 0.975);

  if (tunnel) {
    timeline
      .to(tunnel, {
        autoAlpha: 0.16,
        scale: 0.62,
        force3D: true,
        duration: 0.12
      }, 0.74)

      .to(tunnel, {
        autoAlpha: 0.55,
        scale: 1.55,
        force3D: true,
        duration: 0.13
      }, 0.84)

      .to(tunnel, {
        autoAlpha: 0.92,
        scale: 3.4,
        force3D: true,
        duration: 0.095
      }, 0.925)

      .to(tunnel, {
        autoAlpha: 0,
        scale: 5.4,
        force3D: true,
        duration: 0.045
      }, 0.985);
  }

  if (worldInside) {
    timeline
      .to(worldInside, {
        autoAlpha: 0.12,
        scale: 1,
        force3D: true,
        duration: 0.12
      }, 0.82)

      .to(worldInside, {
        autoAlpha: 0.48,
        scale: 1,
        force3D: true,
        duration: 0.11
      }, 0.91)

      .to(worldInside, {
        autoAlpha: 1,
        scale: 1,
        force3D: true,
        duration: 0.055
      }, 0.968);
  }

  if (overlay) {
    timeline.to(overlay, {
      autoAlpha: 0,
      force3D: true,
      duration: 0.12
    }, 0.86);
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
      scale: 0.18,
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
    This is the lock.
    The section enters Our Work near the end, but does NOT exit immediately
    when the user barely scrolls upward.

    Lower EXIT_WORK_AT if you want it to be harder to leave.
  */
  const ENTER_WORK_AT = 0.985;
  const EXIT_WORK_AT = 0.82;

  const goingForward = direction >= 0;
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

  /*
    If locked, freeze the visual signal at the final state.
    This is the part the previous version did not fully do.
  */
  const effectiveProgress = locked ? 1 : progress;

const intro = mapRange(effectiveProgress, 0.02, 0.3);
const cards = locked ? 1 : mapRange(effectiveProgress, 0.18, 0.64);
const handoff = locked ? 1 : mapRange(effectiveProgress, 0.58, 1);

const workZoom = locked ? 1 : mapRange(effectiveProgress, 0.58, 0.975);
const workReveal = locked ? 1 : mapRange(effectiveProgress, 0.78, 0.985);
const workScroll = locked ? 0 : mapRange(effectiveProgress, 0.955, 1);

  
  setProcessVar(section, "--process-intro", intro.toFixed(4));
  setProcessVar(section, "--process-cards", cards.toFixed(4));
  setProcessVar(section, "--process-handoff", handoff.toFixed(4));
  setProcessVar(section, "--work-zoom-progress", workZoom.toFixed(4));
  setProcessVar(section, "--work-reveal-progress", workReveal.toFixed(4));
  setProcessVar(section, "--work-scroll-progress", workScroll.toFixed(4));

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", workScroll.toFixed(4));
  }

  const workVisible = locked || workReveal > 0.02;
  const workInteractive = locked || workReveal >= 0.96;
  const workMode = locked || effectiveProgress >= 0.972;
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

  /*
    Do not clear transform/opacity here.
    ScrollTrigger will render the timeline at the current scroll position.
    We only clear properties that were manually forced for lock behavior.
  */

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
