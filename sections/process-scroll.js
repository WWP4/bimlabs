// js/process-scroll.js

export function initProcessScroll({ section, scene, ui, cards }) {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const overlay = section.querySelector(".process-overlay");
  const copy = section.querySelector(".process-copy");

  prepareInitialState({
    gsap,
    section,
    overlay,
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
      end: "+=5200",
      pin: true,
      scrub: 1.15,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        updateSceneByProgress({
          progress: self.progress,
          scene,
          ui,
          cards
        });
      },
      onEnter: () => {
        section.classList.add("is-process-active");
      },
      onLeave: () => {
        section.classList.remove("is-process-active");
        section.classList.add("is-process-complete");
      },
      onEnterBack: () => {
        section.classList.add("is-process-active");
        section.classList.remove("is-process-complete");
      },
      onLeaveBack: () => {
        section.classList.remove("is-process-active");
      }
    }
  });

  timeline
    .to(section, {
      "--process-section-intensity": 1,
      duration: 0.12
    }, 0)

    .to(copy, {
      autoAlpha: 1,
      y: 0,
      duration: 0.14
    }, 0.04)

    .to(cards[0], {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.13
    }, 0.18)

    .to(cards[1], {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.13
    }, 0.31)

    .to(cards[2], {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.13
    }, 0.44)

    .to(cards[3], {
      autoAlpha: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      duration: 0.13
    }, 0.57)

    .to(copy, {
      autoAlpha: 0,
      y: -24,
      duration: 0.12
    }, 0.72)

    .to(cards, {
      autoAlpha: 0,
      y: -70,
      scale: 0.96,
      stagger: 0.025,
      duration: 0.16
    }, 0.76)

    .to(section, {
      "--process-exit-darkness": 1,
      duration: 0.2
    }, 0.82);

  createBookingReveal({
    gsap,
    ScrollTrigger,
    section
  });

  window.addEventListener("resize", () => {
    ScrollTrigger.refresh();
  });

  return timeline;
}

function prepareInitialState({ gsap, section, overlay, copy, cards }) {
  section.style.setProperty("--process-section-intensity", 0);
  section.style.setProperty("--process-exit-darkness", 0);
  section.style.setProperty("--process-handoff", 0);

  gsap.set(overlay, {
    autoAlpha: 1
  });

  gsap.set(copy, {
    autoAlpha: 0,
    y: 28
  });

  gsap.set(cards, {
    autoAlpha: 0,
    y: 80,
    rotateX: -8,
    scale: 0.965,
    transformPerspective: 1000,
    transformOrigin: "center bottom"
  });
}

function updateSceneByProgress({ progress, scene, ui }) {
  const intro = mapRange(progress, 0.02, 0.24);
  const cards = mapRange(progress, 0.18, 0.68);
  const handoff = mapRange(progress, 0.72, 1.0);

  scene.setProgress({
    intro,
    cards,
    handoff
  });

  ui.setCardsProgress(cards);
  ui.softenForHandoff(handoff);
}

function createBookingReveal({ gsap, ScrollTrigger, section }) {
  const nextSection =
    document.querySelector("#booking") ||
    document.querySelector("#contact") ||
    section.nextElementSibling;

  if (!nextSection) return;

  gsap.set(nextSection, {
    position: "relative",
    zIndex: 3
  });

  gsap.fromTo(
    nextSection,
    {
      autoAlpha: 0.25,
      y: -90,
      scale: 0.985,
      filter: "blur(16px)"
    },
    {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      ease: "power3.out",
      scrollTrigger: {
        trigger: section,
        start: "bottom bottom",
        end: "bottom top",
        scrub: 1
      }
    }
  );
}

function mapRange(value, start, end) {
  if (value <= start) return 0;
  if (value >= end) return 1;

  return (value - start) / (end - start);
}
