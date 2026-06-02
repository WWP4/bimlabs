// sections/process-main.js

import { ProcessScene } from "./process-scene.js";
import { initProcessUI } from "./process-ui.js";

function bootProcessExperience() {
  const section = document.querySelector("#process");
  const sceneMount = document.querySelector("[data-process-scene]");

  if (!section || !sceneMount) {
    console.warn("[Process] Missing #process or [data-process-scene].");
    return;
  }

  const cards = [...section.querySelectorAll("[data-process-card]")];
  const scene = new ProcessScene({ mount: sceneMount });
  const ui = initProcessUI({ section, cards });

  scene.init();
  section.classList.add("is-process-normal-scroll");
  initNormalProcessScroll({ section, scene, ui, cards });

  window.addEventListener("beforeunload", () => {
    scene.destroy();
  });
}

function initNormalProcessScroll({ section, scene, ui, cards }) {
  if (!cards.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visibleEntry) return;

      const activeIndex = cards.indexOf(visibleEntry.target);
      ui.setActiveCard(activeIndex);
      scene.setProgress({
        intro: 1,
        cards: (activeIndex + 1) / cards.length,
        handoff: 0
      });
    },
    {
      root: null,
      rootMargin: "-28% 0px -34% 0px",
      threshold: [0.2, 0.45, 0.7]
    }
  );

  ui.setActiveCard(0);
  scene.setProgress({ intro: 1, cards: 1 / cards.length, handoff: 0 });

  cards.forEach((card) => observer.observe(card));

  const updateSectionProgress = () => {
    const rect = section.getBoundingClientRect();
    const scrollable = Math.max(1, rect.height - window.innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / scrollable));
    section.style.setProperty("--process-section-intensity", (0.72 + progress * 0.28).toFixed(4));
  };

  updateSectionProgress();
  window.addEventListener("scroll", updateSectionProgress, { passive: true });
  window.addEventListener("resize", updateSectionProgress);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootProcessExperience);
} else {
  bootProcessExperience();
}
