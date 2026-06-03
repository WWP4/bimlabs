// sections/process-cards-motion.js

/*
  PROCESS CARD MOTION
  Octotek-inspired pinned portfolio motion.

  Goal:
  - Panels feel like large work/case-study panels moving through a camera.
  - Slower drift.
  - More overlap.
  - Less "pop in, pop out."
  - One main ScrollTrigger still controls everything from process-scroll.js.
*/

const DEFAULT_CARD_CONFIG = {
  phaseStart: 0.28,
  phaseEnd: 0.78,

  enterDuration: 0.14,
  holdDuration: 0.13,
  exitDuration: 0.16,

  sideOffset: 120,
  exitSideOffset: 90,

  enterY: 74,
  holdY: -4,
  exitY: -78,

  enterScale: 0.84,
  activeScale: 1,
  holdScale: 1.035,
  exitScale: 0.92,

  enterRotateX: 9,
  activeRotateX: 0,
  exitRotateX: -8,

  enterRotateZ: 1.8,
  exitRotateZ: -1.4,

  enterBlur: 10,
  activeBlur: 0,
  exitBlur: 8
};

export function prepareProcessCards({ gsap, cards, cardTrack }) {
  if (!gsap || !cards?.length) return;

  if (cardTrack) {
    gsap.set(cardTrack, {
      autoAlpha: 1,
      transformPerspective: 1200,
      transformStyle: "preserve-3d"
    });
  }

  cards.forEach((card, index) => {
    const side = getCardSide(index);
    const depth = getDepth(index);

    gsap.set(card, {
      autoAlpha: 0,
      x: side * DEFAULT_CARD_CONFIG.sideOffset,
      yPercent: DEFAULT_CARD_CONFIG.enterY,
      z: depth,
      scale: DEFAULT_CARD_CONFIG.enterScale,
      rotateX: DEFAULT_CARD_CONFIG.enterRotateX,
      rotateZ: side * DEFAULT_CARD_CONFIG.enterRotateZ,
      filter: `blur(${DEFAULT_CARD_CONFIG.enterBlur}px)`,
      transformOrigin: "50% 64%",
      willChange: "transform, opacity, filter"
    });
  });
}

export function addProcessCardMotion({
  timeline,
  cards,
  config = {}
}) {
  if (!timeline || !cards?.length) return;

  const settings = {
    ...DEFAULT_CARD_CONFIG,
    ...config
  };

  const totalCards = cards.length;
  const phaseLength = settings.phaseEnd - settings.phaseStart;

  /*
    Important:
    We intentionally use overlap.
    Octotek-style motion feels more like panels passing through a scene,
    not one isolated card fully finishing before the next begins.
  */
  const stepGap = totalCards > 1
    ? phaseLength / Math.max(totalCards - 0.35, 1)
    : phaseLength;

  cards.forEach((card, index) => {
    const side = getCardSide(index);
    const depth = getDepth(index);
    const start = settings.phaseStart + index * stepGap;

    timeline
      /*
        Enter from below/side, slightly blurred.
        This is the "coming into the camera" moment.
      */
      .to(card, {
        autoAlpha: 1,
        x: side * 20,
        yPercent: 16,
        z: depth + 80,
        scale: 0.94,
        rotateX: 4,
        rotateZ: side * 0.65,
        filter: `blur(${settings.enterBlur * 0.38}px)`,
        duration: settings.enterDuration,
        ease: "power3.out"
      }, start)

      /*
        Hero moment.
        The card becomes the main panel.
      */
      .to(card, {
        autoAlpha: 1,
        x: 0,
        yPercent: settings.holdY,
        z: depth + 140,
        scale: settings.activeScale,
        rotateX: settings.activeRotateX,
        rotateZ: 0,
        filter: `blur(${settings.activeBlur}px)`,
        duration: settings.holdDuration,
        ease: "power2.out"
      }, start + settings.enterDuration * 0.72)

      /*
        Slight push forward.
        This makes it feel more like a portfolio/work section instead of a card carousel.
      */
      .to(card, {
        yPercent: -18,
        z: depth + 210,
        scale: settings.holdScale,
        duration: settings.holdDuration,
        ease: "none"
      }, start + settings.enterDuration + settings.holdDuration * 0.4)

      /*
        Exit upward and away.
        It should feel like the camera keeps moving past the panel.
      */
      .to(card, {
        autoAlpha: 0,
        x: side * -settings.exitSideOffset,
        yPercent: settings.exitY,
        z: depth - 120,
        scale: settings.exitScale,
        rotateX: settings.exitRotateX,
        rotateZ: side * settings.exitRotateZ,
        filter: `blur(${settings.exitBlur}px)`,
        duration: settings.exitDuration,
        ease: "power3.in"
      }, start + settings.enterDuration + settings.holdDuration);
  });
}

export function clearProcessCardsForReducedMotion({ gsap, cards, cardTrack }) {
  if (!gsap) return;

  if (cardTrack) {
    gsap.set(cardTrack, {
      autoAlpha: 1,
      clearProps: "transformPerspective,transformStyle"
    });
  }

  if (cards?.length) {
    gsap.set(cards, {
      autoAlpha: 1,
      x: 0,
      yPercent: 0,
      z: 0,
      scale: 1,
      rotateX: 0,
      rotateZ: 0,
      filter: "none",
      clearProps: "willChange"
    });
  }
}

export function fadeProcessCardsBeforeHandoff({
  timeline,
  cards,
  at = 0.79,
  duration = 0.08
}) {
  if (!timeline || !cards?.length) return;

  timeline.to(cards, {
    autoAlpha: 0,
    filter: "blur(8px)",
    scale: 0.96,
    duration,
    ease: "power2.out"
  }, at);
}

function getCardSide(index) {
  return index % 2 === 0 ? -1 : 1;
}

function getDepth(index) {
  /*
    Small alternating depth keeps the movement from feeling flat,
    but avoids fake/cheesy 3D.
  */
  return index % 2 === 0 ? -60 : -110;
}
