// js/process-ui.js

export function initProcessUI({ section, cards }) {
  const state = {
    activeIndex: -1
  };

  setupCards(cards);
  setupPointerGlow(section);
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
    const active = Math.min(count - 1, Math.floor(progress * count));

    if (progress <= 0.02) {
      setActiveCard(-1);
      return;
    }

    setActiveCard(active);
  }

  function softenForHandoff(progress) {
    section.style.setProperty("--process-handoff", progress.toFixed(4));

    cards.forEach((card, index) => {
      const delay = index * 0.08;
      const local = clamp01((progress - delay) / 0.6);
      card.style.setProperty("--handoff-soften", local.toFixed(4));
    });
  }

  return {
    setActiveCard,
    setCardsProgress,
    softenForHandoff
  };
}

function setupCards(cards) {
  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();

      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;

      card.style.setProperty("--card-x", `${x}%`);
      card.style.setProperty("--card-y", `${y}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--card-x", "50%");
      card.style.setProperty("--card-y", "50%");
    });
  });
}

function setupPointerGlow(section) {
  section.addEventListener("pointermove", (event) => {
    const rect = section.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    section.style.setProperty("--process-pointer-x", `${x}%`);
    section.style.setProperty("--process-pointer-y", `${y}%`);
  });
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
