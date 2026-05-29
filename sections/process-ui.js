// js/process-ui.js

export function initProcessUI({ section, cards }) {
  const state = {
    activeIndex: -1
  };

  setupReducedMotion(section);

  function setActiveCard(index) {
    if (state.activeIndex === index) return;

    state.activeIndex = index;

    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === index);
      card.classList.toggle("is-past", cardIndex < index);
    });
  }

  function setCardsProgress(progress) {
    const count = cards.length;

    if (!count || progress <= 0.02) {
      setActiveCard(-1);
      return;
    }

    const active = Math.min(count - 1, Math.floor(progress * count));
    setActiveCard(active);
  }

  function softenForHandoff(progress) {
    section.style.setProperty("--process-handoff", progress.toFixed(4));

    cards.forEach((card, index) => {
      const delay = index * 0.06;
      const local = clamp01((progress - delay) / 0.72);
      card.style.setProperty("--handoff-soften", local.toFixed(4));
    });
  }

  return {
    setActiveCard,
    setCardsProgress,
    softenForHandoff
  };
}

function setupReducedMotion(section) {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduced) {
    section.classList.add("prefers-reduced-motion");
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
