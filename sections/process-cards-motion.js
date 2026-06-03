// sections/process-cards-motion.js

const DEFAULT_CARD_CONFIG = {
  phaseStart: 0.3,
  phaseEnd: 0.76,
  enterDuration: 0.085,
  holdDuration: 0.075,
  exitDuration: 0.115,
  sideOffset: 46,
  exitSideOffset: 28,
  enterY: 86,
  activeY: 0,
  holdY: -10,
  exitY: -86
};

export function prepareProcessCards({ gsap, cards, cardTrack }) {
  if (!gsap || !cards?.length) return;

  if (cardTrack) {
    gsap.set(cardTrack, { autoAlpha: 1 });
  }

  cards.forEach((card, index) => {
    const side = getCardSide(index);

    gsap.set(card, {
      autoAlpha: 0,
      x: side * DEFAULT_CARD_CONFIG.sideOffset,
      yPercent: DEFAULT_CARD_CONFIG.enterY,
      scale: 0.94,
      rotateX: 8,
      transformOrigin: "50% 70%",
      willChange: "transform, opacity"
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
  const stepGap = totalCards > 1 ? phaseLength / totalCards : phaseLength;

  cards.forEach((card, index) => {
    const side = getCardSide(index);
    const start = settings.phaseStart + index * stepGap;

    timeline
      .to(card, {
        autoAlpha: 1,
        yPercent: settings.activeY,
        x: 0,
        scale: 1,
        rotateX: 0,
        duration: settings.enterDuration
      }, start)

      .to(card, {
        yPercent: settings.holdY,
        scale: 1.015,
        duration: settings.holdDuration
      }, start + settings.enterDuration)

      .to(card, {
        autoAlpha: 0,
        yPercent: settings.exitY,
        x: side * -settings.exitSideOffset,
        scale: 0.95,
        rotateX: -7,
        duration: settings.exitDuration
      }, start + settings.enterDuration + settings.holdDuration);
  });
}

export function clearProcessCardsForReducedMotion({ gsap, cards, cardTrack }) {
  if (!gsap) return;

  if (cardTrack) {
    gsap.set(cardTrack, { autoAlpha: 1 });
  }

  if (cards?.length) {
    gsap.set(cards, {
      autoAlpha: 1,
      x: 0,
      yPercent: 0,
      scale: 1,
      rotateX: 0,
      clearProps: "willChange"
    });
  }
}

export function fadeProcessCardsBeforeHandoff({
  timeline,
  cards,
  at = 0.78,
  duration = 0.08
}) {
  if (!timeline || !cards?.length) return;

  timeline.to(cards, {
    autoAlpha: 0,
    duration
  }, at);
}

function getCardSide(index) {
  return index % 2 === 0 ? -1 : 1;
}
