// sections/process-scroll.js

export function initProcessScroll({ section, scene, ui, gsap, ScrollTrigger, cards }) {
  const word = section.querySelector(".process-word");
  const copy = section.querySelector(".process-copy");
  const cardTrack = section.querySelector(".process-cards");

  prepareInitialState({ gsap, section, word, copy, cardTrack, cards });

  const timeline = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => `+=${Math.max(window.innerHeight * 2.9, 2600)}`,
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
    .to(word, { autoAlpha: 1, scale: 1, yPercent: 0, duration: 0.18 }, 0)
    .to(word, { scale: 2.65, yPercent: -5, letterSpacing: "-0.1em", duration: 0.34 }, 0.12)
    .to(copy, { autoAlpha: 1, y: 0, duration: 0.14 }, 0.26)
    .to(cardTrack, { autoAlpha: 1, y: 0, duration: 0.12 }, 0.31)
    .to(cards, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      stagger: 0.08,
      duration: 0.28
    }, 0.34)
    .to(cardTrack, { xPercent: -36, duration: 0.34 }, 0.48)
    .to(word, { scale: 4.8, autoAlpha: 0.08, filter: "blur(6px)", duration: 0.22 }, 0.72)
    .to(copy, { autoAlpha: 0, y: -18, duration: 0.14 }, 0.76)
    .to(cards, { autoAlpha: 0, x: -120, stagger: 0.035, duration: 0.2 }, 0.78)
    .to(section, { "--process-section-intensity": 0, duration: 0.16 }, 0.84);

  window.addEventListener("resize", () => ScrollTrigger.refresh());

  return timeline;
}

function prepareInitialState({ gsap, section, word, copy, cardTrack, cards }) {
  section.style.setProperty("--process-section-intensity", 0);

  gsap.set(word, {
    autoAlpha: 0.34,
    scale: 0.72,
    yPercent: 12,
    transformOrigin: "50% 50%",
    filter: "blur(0px)"
  });

  gsap.set(copy, { autoAlpha: 0, y: 22 });
  gsap.set(cardTrack, { autoAlpha: 0, y: 28, xPercent: 0 });
  gsap.set(cards, { autoAlpha: 0, x: 160, y: 18, scale: 0.985 });
}

function updateByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.38);
  const cards = mapRange(progress, 0.28, 0.76);
  const handoff = mapRange(progress, 0.72, 1);

  scene.setProgress({ intro, cards, handoff });
  ui.setCardsProgress(cards);
  ui.softenForHandoff(handoff);
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;
  return (value - start) / (end - start);
}
