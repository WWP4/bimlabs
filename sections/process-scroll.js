// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!section || !sceneMount || !word) {
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
        This now respects the real height of the section.
        Since cards are normal scrolling content, the PROCESS animation should
        stretch across the actual card scroll instead of finishing too early.
      */
      end: () => {
        const naturalDistance = section.scrollHeight - window.innerHeight;
        const cinematicMinimum = window.innerHeight * 7.2;

        return `+=${Math.max(naturalDistance, cinematicMinimum, 7200)}`;
      },

      pin: false,
      scrub: 0.9,
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

  window.addEventListener("resize", () => ScrollTrigger.refresh());

  return timeline;
}

function addProcessIntro({ timeline, section, word, copy }) {
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.18
    }, 0)

    /*
      Slower PROCESS arrival.
      It no longer rushes to full size before the longer cards have room to breathe.
    */
    .to(word, {
      autoAlpha: 0.82,
      scale: 0.78,
      yPercent: 12,
      letterSpacing: "-0.072em",
      duration: 0.18
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.16
    }, 0.08)

    .to(word, {
      autoAlpha: 0.92,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.24
    }, 0.18)

    .to(word, {
      scale: 1.14,
      duration: 0.24
    }, 0.42)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.16
    }, 0.46);
}

function addProcessHandoff({
  timeline,
  section,
  word,
  voidTarget,
  worldInside
}) {
  /*
    Handoff now starts later.
    The cards get the middle of the section. The C zoom only takes the final stretch.
  */
  timeline
    .to(word, {
      scale: 1.42,
      autoAlpha: 0.78,
      duration: 0.1
    }, 0.84)

    .to(voidTarget, {
      autoAlpha: 0.88,
      scale: 1,
      duration: 0.055
    }, 0.865)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at var(--process-c-x) var(--process-c-y))",
      y: 26,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.06
    }, 0.875)

    .to(word, {
      scale: 3.05,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.8px)",
      duration: 0.075
    }, 0.895)

    .to(voidTarget, {
      scale: 3.7,
      autoAlpha: 0.84,
      duration: 0.075
    }, 0.895)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at var(--process-c-x) var(--process-c-y))",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.08
    }, 0.915)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.13
    }, 0.95)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13
    }, 0.95)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at var(--process-c-x) var(--process-c-y))",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.15
    }, 0.95)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.965);
}

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
    yPercent: 30,
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

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.46);
  const cards = mapRange(progress, 0.28, 0.84);
  const handoff = mapRange(progress, 0.84, 1);

  scene.setProgress({
    intro,
    cards,
    handoff
  });

  if (ui?.softenForHandoff) {
    ui.softenForHandoff(handoff);
  }
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;

  return (value - start) / (end - start);
}
