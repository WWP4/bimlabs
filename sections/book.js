/* ==========================================================
   BIM LABS — BOOK WITH US
   Small interaction only.
   No heavy scroll animation.
========================================================== */

(() => {
  "use strict";

  const section = document.querySelector(".book-with-us");
  if (!section) return;

  const card = section.querySelector("[data-book-card]");
  if (!card) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  function setCardLight(x = "50%", y = "50%") {
    card.style.setProperty("--book-x", x);
    card.style.setProperty("--book-y", y);
  }

  function moveLight(event) {
    if (prefersReducedMotion) return;

    const rect = card.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setCardLight(`${x}%`, `${y}%`);
  }

  function resetLight() {
    setCardLight("50%", "50%");
  }

  card.addEventListener("mousemove", moveLight, { passive: true });
  card.addEventListener("mouseleave", resetLight);
  card.addEventListener("blur", resetLight, true);

  resetLight();
})();
