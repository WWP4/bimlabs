// sections/process-scroll.js

import {
  prepareProcessCards,
  addProcessCardMotion,
  clearProcessCardsForReducedMotion,
  fadeProcessCardsBeforeHandoff
} from "./process-cards-motion.js";

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const worldInside = section.querySelector(".process-world-inside");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    prepareReducedState({
      gsap,
      section,
      word,
      voidTarget,
      worldInside,
      copy,
      cardTrack,
      cards
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

  addProcessCardMotion({
    timeline,
    cards,
    config: {
      phaseStart: 0.3,
      phaseEnd: 0.76
    }
  });

  addProcessHandoff({
    timeline,
    section,
    word,
    voidTarget,
    worldInside,
    cards
  });

  const refreshOnResize = () => ScrollTrigger.refresh();
  window.addEventListener("resize", refreshOnResize);

  return timeline;
}

function addProcessIntro({ timeline, section, word, copy }) {
  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(word, {
      autoAlpha: 0.92,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.2
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.12
    }, 0.08)

    .to(word, {
      scale: 1.22,
      duration: 0.22
    }, 0.2)

    .to(copy, {
      autoAlpha: 0,
      y: -26,
      duration: 0.14
    }, 0.26);
}

function addProcessHandoff({
  timeline,
  section,
  word,
  voidTarget,
  worldInside,
  cards
}) {
  fadeProcessCardsBeforeHandoff({
    timeline,
    cards,
    at: 0.78,
    duration: 0.08
  });

  timeline
    .to(word, {
      scale: 1.5,
      autoAlpha: 0.78,
      duration: 0.12
    }, 0.76)

    .to(voidTarget, {
      autoAlpha: 0.92,
      scale: 1,
      duration: 0.055
    }, 0.79)

    .to(worldInside, {
      autoAlpha: 0,
      clipPath: "circle(7% at var(--process-c-x) var(--process-c-y))",
      y: 26,
      scale: 0.86,
      filter: "blur(10px)",
      duration: 0.06
    }, 0.805)

    .to(word, {
      scale: 3.15,
      xPercent: -3.8,
      autoAlpha: 0.88,
      filter: "blur(0.8px)",
      duration: 0.07
    }, 0.83)

    .to(voidTarget, {
      scale: 3.7,
      autoAlpha: 0.86,
      duration: 0.07
    }, 0.83)

    .to(worldInside, {
      autoAlpha: 0.42,
      clipPath: "circle(28% at var(--process-c-x) var(--process-c-y))",
      y: 8,
      scale: 0.94,
      filter: "blur(5px)",
      duration: 0.075
    }, 0.855)

    .to(word, {
      scale: 12.5,
      xPercent: -13.5,
      autoAlpha: 0,
      filter: "blur(14px)",
      duration: 0.14
    }, 0.89)

    .to(voidTarget, {
      scale: 18,
      autoAlpha: 0,
      duration: 0.13
    }, 0.89)

    .to(worldInside, {
      autoAlpha: 1,
      clipPath: "circle(150% at var(--process-c-x) var(--process-c-y))",
      scale: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.16
    }, 0.89)

    .to(section, {
      "--process-section-intensity": 0.08,
      duration: 0.1
    }, 0.9);
}

function prepareInitialState({
  gsap,
  section,
  sceneMount,
  word,
  voidTarget,
  worldInside,
  copy,
  cardTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", 0);

  gsap.set(sceneMount, {
    scale: 1,
    xPercent: 0,
    transformOrigin: "52% 50%"
  });

  gsap.set(word, {
    autoAlpha: 0.28,
    scale: 0.46,
    xPercent: 0,
    yPercent: 28,
    transformOrigin: "52% 50%",
    filter: "blur(0px)",
    letterSpacing: "-0.06em"
  });

  gsap.set(voidTarget, {
    autoAlpha: 0,
    scale: 0.14,
    transformOrigin: "50% 50%"
  });

  gsap.set(worldInside, {
    autoAlpha: 0,
    clipPath: "circle(0% at var(--process-c-x) var(--process-c-y))",
    y: 44,
    scale: 0.8,
    filter: "blur(12px)",
    transformOrigin: "var(--process-c-x) var(--process-c-y)"
  });

  gsap.set(copy, {
    autoAlpha: 0,
    y: 28
  });

  prepareProcessCards({
    gsap,
    cards,
    cardTrack
  });
}

function prepareReducedState({
  gsap,
  section,
  word,
  voidTarget,
  worldInside,
  copy,
  cardTrack,
  cards
}) {
  section.style.setProperty("--process-section-intensity", 1);

  gsap.set(word, {
    clearProps: "all"
  });

  gsap.set(voidTarget, {
    autoAlpha: 0
  });

  gsap.set(worldInside, {
    autoAlpha: 0,
    filter: "none"
  });

  gsap.set(copy, {
    autoAlpha: 1,
    y: 0
  });

  clearProcessCardsForReducedMotion({
    gsap,
    cards,
    cardTrack
  });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.8);
  const handoff = mapRange(progress, 0.8, 1);

  scene.setProgress({
    intro,
    cards,
    handoff
  });

  ui.setCardsProgress(cards);
  ui.softenForHandoff(handoff);
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;

  return (value - start) / (end - start);
}
