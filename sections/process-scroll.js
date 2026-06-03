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
        const minimumDistance = window.innerHeight * 5.2;

        return `+=${Math.max(naturalDistance, minimumDistance, 5200)}`;
      },
      pin: false,
      scrub: 0.22,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        updateByProgress({
          section,
          worldInside,
          workTrack,
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
   This file now owns the full transition into Our Work.
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
      scale: 0.18,
      transformOrigin: "50% 50%",
      force3D: true
    }, 0);
  }

  if (worldInside) {
    timeline.set(worldInside, {
      autoAlpha: 0,
      force3D: true
    }, 0);
  }

  /*
    Important:
    Do not make the final zoom happen in a tiny violent burst.
    The old file jumped to very large scales too quickly.
    This version stretches the handoff so it feels more like a camera push.
  */

  timeline
    .to(word, {
      scale: 1.28,
      xPercent: -0.8,
      yPercent: 0,
      autoAlpha: 0.94,
      force3D: true,
      duration: 0.07
    }, 0.735)

    .to(section, {
      "--work-zoom-progress": 0.12,
      "--work-reveal-progress": 0,
      duration: 0.07
    }, 0.735)

    .to(word, {
      scale: 2.15,
      xPercent: -2.35,
      autoAlpha: 0.98,
      force3D: true,
      duration: 0.09
    }, 0.805)

    .to(section, {
      "--work-zoom-progress": 0.32,
      "--work-reveal-progress": 0.06,
      duration: 0.09
    }, 0.805)

    .to(word, {
      scale: 3.9,
      xPercent: -5.1,
      autoAlpha: 1,
      force3D: true,
      duration: 0.085
    }, 0.885)

    .to(section, {
      "--work-zoom-progress": 0.62,
      "--work-reveal-progress": 0.34,
      duration: 0.085
    }, 0.885)

    .to(word, {
      scale: 6.9,
      xPercent: -8.6,
      autoAlpha: 1,
      force3D: true,
      duration: 0.055
    }, 0.945)

    .to(section, {
      "--work-zoom-progress": 0.86,
      "--work-reveal-progress": 0.74,
      duration: 0.055
    }, 0.945)

    .to(word, {
      scale: 8.8,
      xPercent: -10.4,
      autoAlpha: 0,
      force3D: true,
      duration: 0.035
    }, 0.982)

    .to(section, {
      "--work-zoom-progress": 1,
      "--work-reveal-progress": 1,
      "--work-scroll-progress": 0,
      "--process-section-intensity": 0.12,
      duration: 0.035
    }, 0.982);

  if (tunnel) {
    timeline
      .to(tunnel, {
        autoAlpha: 0.24,
        scale: 0.85,
        force3D: true,
        duration: 0.075
      }, 0.83)

      .to(tunnel, {
        autoAlpha: 0.72,
        scale: 2.35,
        force3D: true,
        duration: 0.105
      }, 0.9)

      .to(tunnel, {
        autoAlpha: 1,
        scale: 4.8,
        force3D: true,
        duration: 0.055
      }, 0.955)

      .to(tunnel, {
        autoAlpha: 0,
        scale: 5.8,
        force3D: true,
        duration: 0.035
      }, 0.985);
  }

  if (worldInside) {
    timeline
      .to(worldInside, {
        autoAlpha: 0.16,
        force3D: true,
        duration: 0.08
      }, 0.875)

      .to(worldInside, {
        autoAlpha: 0.62,
        force3D: true,
        duration: 0.085
      }, 0.93)

      .to(worldInside, {
        autoAlpha: 1,
        force3D: true,
        duration: 0.04
      }, 0.975);
  }

  if (overlay) {
    timeline.to(overlay, {
      autoAlpha: 0,
      force3D: true,
      duration: 0.08
    }, 0.91);
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
    "is-work-mode",
    "is-work-visible",
    "is-work-interactive",
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
    force3D: true
  });

  if (tunnel) {
    gsap.set(tunnel, {
      autoAlpha: 0,
      scale: 0.18,
      transformOrigin: "50% 50%",
      force3D: true
    });
  }

  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 0,
      force3D: true
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
    "is-work-mode",
    "is-work-visible",
    "is-work-interactive",
    "is-inside-work"
  );

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

    gsap.set(worldInside, {
      autoAlpha: 1,
      clearProps: "transform"
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
      autoAlpha: 1
    });
  }
}

/* =========================================================
   PROGRESS VARIABLES
   This is now the single scroll source for PROCESS + Our Work.
========================================================= */

function updateByProgress({ section, worldInside, workTrack, progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.34);
  const cards = mapRange(progress, 0.22, 0.76);
  const handoff = mapRange(progress, 0.735, 1);

  const workZoom = mapRange(progress, 0.735, 0.985);
  const workReveal = mapRange(progress, 0.86, 0.99);

  /*
    This is intentionally small. The archive should not fake-scroll hard
    during the handoff. Once inside Our Work, it should feel stable and ready
    for continuation.
  */
  const workScroll = mapRange(progress, 0.965, 1);

  setProcessVar(section, "--process-intro", intro.toFixed(4));
  setProcessVar(section, "--process-cards", cards.toFixed(4));
  setProcessVar(section, "--process-handoff", handoff.toFixed(4));

  setProcessVar(section, "--work-zoom-progress", workZoom.toFixed(4));
  setProcessVar(section, "--work-reveal-progress", workReveal.toFixed(4));
  setProcessVar(section, "--work-scroll-progress", workScroll.toFixed(4));

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", workScroll.toFixed(4));
  }

  const workVisible = workReveal > 0.02;
  const workInteractive = workReveal >= 0.96;
  const workMode = progress >= 0.972;
  const insideWork = progress >= 0.99;

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
      workScroll
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
