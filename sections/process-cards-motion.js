// sections/process-cards-motion.js

/*
  PROCESS CARD MOTION
  Clean Octotek-inspired panel motion.

  Goal:
  - One main panel at a time.
  - Slight cinematic overlap, but no stacked mess.
  - Cards feel like large work/info panels moving through a pinned scene.
  - Still controlled by the single main process-scroll.js timeline.
*/

const DEFAULT_CARD_CONFIG = {
  phaseStart: 0.28,
  phaseEnd: 0.78,

  sideOffset: 140,
  exitSideOffset: 110,

  enterY: 78,
  activeY: -4,
  exitY: -84,

  enterScale: 0.9,
  activeScale: 1,
  exitScale: 0.94,

  enterRotateX: 5,
  exitRotateX: -5,

  enterBlur: 8,
  activeBlur: 0,
  exitBlur: 7
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

    gsap.set(card, {
      autoAlpha: 0,
      x: side * DEFAULT_CARD_CONFIG.sideOffset,
      yPercent: DEFAULT_CARD_CONFIG.enterY,
      z: -120,
      scale: DEFAULT_CARD_CONFIG.enterScale,
      rotateX: DEFAULT_CARD_CONFIG.enterRotateX,
      rotateZ: side * 1.2,
      filter: `blur(${DEFAULT_CARD_CONFIG.enterBlur}px)`,
      zIndex: 1,
      transformOrigin: "50% 62%",
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
  const slot = phaseLength / totalCards;

  cards.forEach((card, index) => {
    const side = getCardSide(index);

    const slotStart = settings.phaseStart + index * slot;
    const slotEnd = slotStart + slot;

    const enterStart = slotStart;
    const activeStart = slotStart + slot * 0.24;
    const exitStart = slotStart + slot * 0.66;

    /*
      Hard reset before this card's moment.
      This prevents earlier/next cards from staying visible and stacking.
    */
    timeline.set(card, {
      autoAlpha: 0,
      zIndex: 2
    }, Math.max(0, enterStart - 0.015));

    /*
      Soft pre-entry.
      Card enters from the side and below, still blurred.
    */
    timeline.to(card, {
      autoAlpha: 0.42,
      x: side * 48,
      yPercent: 34,
      z: -40,
      scale: 0.94,
      rotateX: 3,
      rotateZ: side * 0.5,
      filter: `blur(${settings.enterBlur * 0.55}px)`,
      duration: slot * 0.24,
      ease: "power3.out"
    }, enterStart);

    /*
      Main active panel.
      This is the only moment the card should feel fully readable.
    */
    timeline.to(card, {
      autoAlpha: 1,
      x: 0,
      yPercent: settings.activeY,
      z: 80,
      scale: settings.activeScale,
      rotateX: 0,
      rotateZ: 0,
      filter: `blur(${settings.activeBlur}px)`,
      zIndex: 5,
      duration: slot * 0.34,
      ease: "power3.out"
    }, activeStart);

    /*
      Drift upward while still readable.
      This gives the Octotek/work-section feeling without stacking everything.
    */
    timeline.to(card, {
      autoAlpha: 0.86,
      yPercent: -22,
      z: 110,
      scale: 1.015,
      duration: slot * 0.22,
      ease: "none"
    }, activeStart + slot * 0.28);

    /*
      Exit cleanly.
      By the end of this card's slot, it is fully gone.
    */
    timeline.to(card, {
      autoAlpha: 0,
      x: side * -settings.exitSideOffset,
      yPercent: settings.exitY,
      z: -130,
      scale: settings.exitScale,
      rotateX: settings.exitRotateX,
      rotateZ: side * -1,
      filter: `blur(${settings.exitBlur}px)`,
      zIndex: 1,
      duration: slot * 0.34,
      ease: "power3.in"
    }, exitStart);

    /*
      Hard hide at the end of the slot.
      This is the safety lock that stops the stacked-card issue.
    */
    timeline.set(card, {
      autoAlpha: 0,
      zIndex: 1
    }, slotEnd);
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
      zIndex: "auto",
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
