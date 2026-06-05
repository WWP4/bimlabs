// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger }) {
  if (!section || !gsap || !ScrollTrigger) {
    console.warn("[Process] Missing required process setup.");
    return null;
  }

  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!sceneMount || !word) {
    console.warn("[Process] Missing scene or PROCESS word.");
    return null;
  }

  if (prefersReducedMotion) {
    prepareReducedState({
      gsap,
      section,
      word,
      voidTarget,
      worldInside,
      copy,
      
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
    copy,
    workTrack
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "bottom bottom",

      /*
        IMPORTANT:
        Do NOT pin this section.

        The PROCESS scene is already sticky in CSS.
        The cards are normal HTML/CSS content.
        Pinning the whole section stops the cards from naturally scrolling.
      */
      pin: false,

      scrub: 1.05,
      invalidateOnRefresh: true,

      onUpdate: (self) => {
        updateByProgress({
          progress: self.progress,
          section,
          worldInside,
          scene,
          ui
        });
      },

      onEnter: () => {
        section.classList.add("is-process-active");
        section.classList.remove("is-inside-work");
      },

      onEnterBack: () => {
        section.classList.add("is-process-active");

        section.classList.remove(
          "is-work-interactive",
          "is-inside-work"
        );

        if (worldInside) {
          worldInside.classList.remove("is-interactive");
          worldInside.style.pointerEvents = "none";
        }
      },

    onLeave: () => {
  section.classList.remove("is-process-active");
  section.classList.add("is-work-visible");
  section.classList.remove("is-work-interactive", "is-inside-work");

  if (worldInside) {
    worldInside.removeAttribute("aria-hidden");
    worldInside.classList.add("is-visible");
    worldInside.classList.remove("is-interactive");
    worldInside.style.pointerEvents = "none";
  }
},

        if (workTrack) {
          workTrack.style.setProperty("--work-scroll-progress", "0");
        }
      },

      onLeaveBack: () => {
        section.classList.remove(
          "is-process-active",
          "is-work-visible",
          "is-work-interactive",
          "is-inside-work"
        );

        if (worldInside) {
          worldInside.setAttribute("aria-hidden", "true");
          worldInside.classList.remove("is-visible", "is-interactive");
          worldInside.style.pointerEvents = "none";
        }

        if (workTrack) {
          workTrack.style.setProperty("--work-scroll-progress", "0");
        }
      }
    }
  });

  /*
    INTRO ONLY
    This file does not select, hide, move, fade, or animate cards.
    Cards stay normal HTML/CSS.
  */
  timeline
    .to(
      section,
      {
        "--process-section-intensity": 1,
        duration: 0.14
      },
      0
    )

    .to(
      word,
      {
        autoAlpha: 0.9,
        scale: 1,
        xPercent: 0,
        yPercent: 0,
        letterSpacing: "-0.085em",
        filter: "blur(0px)",
        force3D: true,
        duration: 0.24
      },
      0
    )

    .to(
      copy,
      {
        autoAlpha: 1,
        y: 0,
        force3D: true,
        duration: 0.14
      },
      0.08
    )

    .to(
      word,
      {
        scale: 1.1,
        autoAlpha: 0.92,
        force3D: true,
        duration: 0.24
      },
      0.22
    )

    .to(
      copy,
      {
        autoAlpha: 0,
        y: -24,
        force3D: true,
        duration: 0.16
      },
      0.31
    );

  /*
    HANDOFF
    Only controls PROCESS word, aperture, and Our Work reveal.
    No card logic.
  */
  timeline
    .to(
      section,
      {
        "--process-handoff": 0.08,
        duration: 0.05
      },
      0.855
    )

    .to(
      word,
      {
        scale: 1.32,
        xPercent: -0.2,
        autoAlpha: 0.92,
        filter: "blur(0px)",
        force3D: true,
        duration: 0.1
      },
      0.875
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0.48,
        scale: 0.78,
        force3D: true,
        duration: 0.08
      },
      0.89
    )

    .to(
      worldInside,
      {
        autoAlpha: 1,
        visibility: "visible",
        clipPath: "circle(2.5% at 51.8% 50%)",
        webkitClipPath: "circle(2.5% at 51.8% 50%)",
        y: 26,
        scale: 0.9,
        filter: "blur(7px)",
        force3D: true,
        duration: 0.08
      },
      0.905
    )

    .to(
      section,
      {
        "--process-handoff": 0.32,
        duration: 0.08
      },
      0.925
    )

    .to(
      word,
      {
        scale: 2.25,
        xPercent: -2.1,
        autoAlpha: 0.9,
        filter: "blur(0.35px)",
        force3D: true,
        duration: 0.09
      },
      0.94
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0.76,
        scale: 2.45,
        force3D: true,
        duration: 0.09
      },
      0.94
    )

    .to(
      worldInside,
      {
        autoAlpha: 1,
        clipPath: "circle(13% at 51.8% 50%)",
        webkitClipPath: "circle(13% at 51.8% 50%)",
        y: 12,
        scale: 0.955,
        filter: "blur(3.5px)",
        force3D: true,
        duration: 0.09
      },
      0.955
    )

    .to(
      section,
      {
        "--process-handoff": 0.68,
        duration: 0.08
      },
      0.975
    )

    .to(
      word,
      {
        scale: 5.35,
        xPercent: -6.25,
        autoAlpha: 0.42,
        filter: "blur(4px)",
        force3D: true,
        duration: 0.1
      },
      0.99
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0.58,
        scale: 7.2,
        force3D: true,
        duration: 0.1
      },
      0.99
    )

    .to(
      worldInside,
      {
        autoAlpha: 1,
        clipPath: "circle(48% at 51.8% 50%)",
        webkitClipPath: "circle(48% at 51.8% 50%)",
        y: 2,
        scale: 0.992,
        filter: "blur(1.1px)",
        force3D: true,
        duration: 0.1
      },
      0.997
    )

    .to(
      section,
      {
        "--process-handoff": 1,
        "--process-section-intensity": 0.08,
        duration: 0.1
      },
      1.045
    )

    .to(
      word,
      {
        scale: 10.8,
        xPercent: -12.4,
        autoAlpha: 0,
        filter: "blur(12px)",
        force3D: true,
        duration: 0.13
      },
      1.055
    )

    .to(
      voidTarget,
      {
        autoAlpha: 0,
        scale: 15.5,
        force3D: true,
        duration: 0.13
      },
      1.055
    )

    .to(
      worldInside,
      {
        autoAlpha: 1,
        clipPath: "circle(155% at 51.8% 50%)",
        webkitClipPath: "circle(155% at 51.8% 50%)",
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        force3D: true,
        duration: 0.16
      },
      1.065
    );

  const refresh = debounce(() => {
    ScrollTrigger.refresh();
  }, 180);

  window.addEventListener("resize", refresh);

  timeline.eventCallback("onKill", () => {
    window.removeEventListener("resize", refresh);
  });

  return timeline;
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
  copy,
}) {
  section.classList.remove(
    "is-process-active",
    "is-work-visible",
    "is-work-interactive",
    "is-inside-work"
  );

  section.style.setProperty("--process-section-intensity", "0");
  section.style.setProperty("--process-intro", "0");
  section.style.setProperty("--process-handoff", "0");

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    yPercent: 0,
    transformOrigin: "52% 50%",
    force3D: true
  });

  gsap.set(word, {
    autoAlpha: 0.28,
    scale: 0.46,
    xPercent: 0,
    yPercent: 28,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.06em",
    force3D: true,
    clearProps: "visibility,pointerEvents"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0,
      scale: 0.14,
      transformOrigin: "50% 50%",
      force3D: true
    });
  }

  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");
    worldInside.style.pointerEvents = "none";

    gsap.set(worldInside, {
      autoAlpha: 0,
      visibility: "hidden",
      clipPath: "circle(0% at 51.8% 50%)",
      webkitClipPath: "circle(0% at 51.8% 50%)",
      y: 44,
      scale: 0.88,
      filter: "blur(10px)",
      transformOrigin: "51.8% 50%",
      force3D: true
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
  copy,
  
}) {
  section.style.setProperty("--process-section-intensity", "1");
  section.style.setProperty("--process-intro", "1");
  section.style.setProperty("--process-handoff", "0");

  section.classList.remove(
    "is-inside-work",
    "is-work-visible",
    "is-work-interactive"
  );

  gsap.set(word, {
    clearProps: "all"
  });

  if (voidTarget) {
    gsap.set(voidTarget, {
      autoAlpha: 0
    });
  }

  if (worldInside) {
    worldInside.setAttribute("aria-hidden", "true");
    worldInside.classList.remove("is-visible", "is-interactive");

    gsap.set(worldInside, {
      autoAlpha: 0,
      visibility: "hidden",
      pointerEvents: "none",
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
   PROGRESS HOOKS
========================================================= */

function updateByProgress({
  progress,
  section,
  worldInside,
  scene,
  ui
}) {
  const intro = mapRange(progress, 0.02, 0.22);
  const handoff = mapRange(progress, 0.86, 1);

  section.style.setProperty("--process-intro", intro.toFixed(4));
  section.style.setProperty("--process-handoff", handoff.toFixed(4));

const workVisible = progress >= 0.895;

section.classList.toggle("is-work-visible", workVisible);
section.classList.remove("is-work-interactive");

  /*
    Do not add is-inside-work during scrub.
    That class has hard CSS states and can create jumps.
  */
  section.classList.remove("is-inside-work");

  if (worldInside) {
    worldInside.classList.toggle("is-visible", workVisible);
worldInside.classList.remove("is-interactive");

    if (workVisible) {
      worldInside.removeAttribute("aria-hidden");
    } else {
      worldInside.setAttribute("aria-hidden", "true");
    }

    worldInside.style.pointerEvents = "none";
  }

  if (workTrack) {
    workTrack.style.setProperty("--work-scroll-progress", "0");
  }

  if (scene?.setProgress) {
    scene.setProgress({
      intro,
      handoff
    });
  }

  if (ui?.softenForHandoff) {
    ui.softenForHandoff(handoff);
  }

  if (ui?.setProgress) {
    ui.setProgress({
      intro,
      handoff,
      workZoom: handoff,
      workReveal: mapRange(progress, 0.895, 1),
      workScroll: 0,
      insideWork: false
    });
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
