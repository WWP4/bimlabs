// sections/process-cards-motion.js

export function prepareProcessCards({ gsap, cards, cardTrack }) {
  if (!gsap || !cards?.length) return;

  gsap.set(cardTrack, { autoAlpha: 1 });

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;

    gsap.set(card, {
      autoAlpha: 0,
      x: side * 80,
      yPercent: 70,
      scale: 0.96,
      rotateX: 0,
      filter: "blur(0px)",
      transformOrigin: "50% 50%",
      willChange: "transform, opacity"
    });
  });
}

export function addProcessCardMotion({ timeline, cards, config = {} }) {
  if (!timeline || !cards?.length) return;

  const start = config.phaseStart ?? 0.3;
  const end = config.phaseEnd ?? 0.78;
  const phase = end - start;
  const slot = phase / cards.length;

  cards.forEach((card, index) => {
    const side = index % 2 === 0 ? -1 : 1;
    const cardStart = start + index * slot;
    const cardMid = cardStart + slot * 0.28;
    const cardExit = cardStart + slot * 0.68;
    const cardEnd = cardStart + slot;

    timeline.set(card, { autoAlpha: 0 }, cardStart);

    timeline.to(card, {
      autoAlpha: 1,
      x: 0,
      yPercent: 0,
      scale: 1,
      duration: slot * 0.28,
      ease: "power2.out"
    }, cardStart);

    timeline.to(card, {
      yPercent: -8,
      duration: slot * 0.4,
      ease: "none"
    }, cardMid);

    timeline.to(card, {
      autoAlpha: 0,
      x: side * -60,
      yPercent: -70,
      scale: 0.96,
      duration: slot * 0.32,
      ease: "power2.in"
    }, cardExit);

    timeline.set(card, { autoAlpha: 0 }, cardEnd);
  });
}

export function clearProcessCardsForReducedMotion({ gsap, cards, cardTrack }) {
  if (!gsap) return;

  gsap.set(cardTrack, { autoAlpha: 1 });

  gsap.set(cards, {
    autoAlpha: 1,
    x: 0,
    yPercent: 0,
    scale: 1,
    rotateX: 0,
    filter: "none",
    clearProps: "willChange"
  });
}

export function fadeProcessCardsBeforeHandoff({ timeline, cards, at = 0.79, duration = 0.08 }) {
  if (!timeline || !cards?.length) return;

  timeline.to(cards, {
    autoAlpha: 0,
    duration,
    ease: "power1.out"
  }, at);
}
