// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const sceneMount = section.querySelector("[data-process-scene]");
  const word = section.querySelector(".process-word");
  const voidTarget = section.querySelector(".process-void");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion) {
    prepareReducedState({ gsap, section, word, voidTarget, copy, cardTrack, cards });
    return null;
  }

  prepareInitialState({ gsap, section, sceneMount, word, voidTarget, copy, cardTrack, cards });

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
      onUpdate: (self) => updateByProgress({ progress: self.progress, scene, ui }),
      onEnter: () => section.classList.add("is-process-active"),
      onEnterBack: () => section.classList.add("is-process-active"),
      onLeave: () => section.classList.remove("is-process-active"),
      onLeaveBack: () => section.classList.remove("is-process-active")
    }
  });

  timeline
    .to(section, { "--process-section-intensity": 1, duration: 0.12 }, 0)
    .to(word, {
      autoAlpha: 0.92,
      scale: 1,
      yPercent: 0,
      letterSpacing: "-0.085em",
      duration: 0.2
    }, 0)
    .to(copy, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.08)
    .to(word, { scale: 1.22, duration: 0.22 }, 0.2)
    .to(copy, { autoAlpha: 0, y: -26, duration: 0.14 }, 0.26);

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const start = 0.3 + index * 0.13;

    timeline
      .to(card, {
        autoAlpha: 1,
        yPercent: 0,
        x: 0,
        scale: 1,
        rotateX: 0,
        duration: 0.075
      }, start)
      .to(card, {
        yPercent: -10,
        scale: 1.015,
        duration: 0.045
      }, start + 0.075)
      .to(card, {
        autoAlpha: 0,
        yPercent: -86,
        x: side * -28,
        scale: 0.95,
        rotateX: -7,
        duration: 0.095
      }, start + 0.13);
  });

  timeline
    .to(word, {
      scale: 1.42,
      autoAlpha: 0.72,
      duration: 0.14
    }, 0.76)
    .to(cards, {
      autoAlpha: 0,
      duration: 0.08
    }, 0.8)
    .to(voidTarget, {
      autoAlpha: 1,
      scale: 1,
      duration: 0.08
    }, 0.82)
    .to(word, {
      scale: 7.2,
      xPercent: -6,
      autoAlpha: 0.12,
      filter: "blur(7px)",
      duration: 0.18
    }, 0.84)
    .to(voidTarget, {
      scale: 7,
      autoAlpha: 1,
      duration: 0.18
    }, 0.84)
    .to(sceneMount, {
      scale: 1.18,
      xPercent: -3,
      duration: 0.16
    }, 0.86)
    .to(section, { "--process-section-intensity": 0.45, duration: 0.12 }, 0.9);

  window.addEventListener("resize", () => ScrollTrigger.refresh());

  return timeline;
}

function prepareInitialState({ gsap, section, sceneMount, word, voidTarget, copy, cardTrack, cards }) {
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

  gsap.set(copy, { autoAlpha: 0, y: 28 });
  gsap.set(cardTrack, { autoAlpha: 1 });

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 46,
      yPercent: 86,
      scale: 0.94,
      rotateX: 8,
      transformOrigin: "50% 70%"
    });
  });
}

function prepareReducedState({ gsap, section, word, voidTarget, copy, cardTrack, cards }) {
  section.style.setProperty("--process-section-intensity", 1);

  gsap.set(word, { clearProps: "all" });
  gsap.set(voidTarget, { autoAlpha: 0 });
  gsap.set(copy, { autoAlpha: 1, y: 0 });
  gsap.set(cardTrack, { autoAlpha: 1 });
  gsap.set(cards, { autoAlpha: 1, x: 0, yPercent: 0, scale: 1, rotateX: 0 });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.22);
  const cards = mapRange(progress, 0.28, 0.8);
  const handoff = mapRange(progress, 0.8, 1);

  scene.setProgress({ intro, cards, handoff });
  ui.setCardsProgress(cards);
  ui.softenForHandoff(handoff);
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}
