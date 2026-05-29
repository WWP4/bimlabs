// js/process-scroll.js

export function initProcessScroll({ section, scene, ui, cards }) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const copy = section.querySelector(".process-copy");

  prepareInitialState({
    gsap,
    section,
    copy,
    cards
  });

  const timeline = gsap.timeline({
    defaults: {
      ease: "none"
    },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: "+=4200",
      pin: true,
      scrub: 1.05,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        updateSceneByProgress({
          progress: self.progress,
          scene,
          ui
        });
      },
      onEnter: () => section.classList.add("is-process-active"),
      onLeave: () => {
        section.classList.remove("is-process-active");
        section.classList.add("is-process-complete");
      },
      onEnterBack: () => {
        section.classList.add("is-process-active");
        section.classList.remove("is-process-complete");
      },
      onLeaveBack: () => section.classList.remove("is-process-active")
    }
  });

  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.16
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.14
    }, 0.04)

    .to(cards[0], {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.12
    }, 0.16)

    .to(cards[1], {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.12
    }, 0.29)

    .to(cards[2], {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.12
    }, 0.42)

    .to(cards[3], {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      duration: 0.12
    }, 0.55)

    .to(copy, {
      autoAlpha: 0,
      y: -18,
      duration: 0.12
    }, 0.76)

    .to(cards, {
      autoAlpha: 0,
      y: -42,
      scale: 0.985,
      stagger: 0.018,
      duration: 0.14
    }, 0.78)

    .to(section, {
      "--process-exit-darkness": 1,
      duration: 0.18
    }, 0.84);

  window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });

  return timeline;
}

function prepareInitialState({ gsap, section, copy, cards }) {
  section.style.setProperty("--process-section-intensity", 0);
  section.style.setProperty("--process-exit-darkness", 0);
  section.style.setProperty("--process-handoff", 0);

  gsap.set(copy, {
    autoAlpha: 0,
    y: 24
  });

  gsap.set(cards, {
    autoAlpha: 0,
    y: 54,
    scale: 0.975,
    transformOrigin: "center bottom"
  });
}

function updateSceneByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.24);
  const cards = mapRange(progress, 0.16, 0.7);
  const handoff = mapRange(progress, 0.76, 1);

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
