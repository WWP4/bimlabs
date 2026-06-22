/* ==========================================================
   BIM LABS — BOOK WITH US
   Intake chip selection + lightweight spotlight.
========================================================== */

(() => {
  "use strict";

  const section = document.querySelector(".book-with-us");
  if (!section) return;

  const card = section.querySelector("[data-book-card]");
  const summary = section.querySelector("[data-book-summary]");
  const link = section.querySelector("[data-book-link]");

  if (!card || !summary || !link) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const state = {
    type: "Website",
    budget: "$3k-$7k",
    timeline: "This month",
  };

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

  function updateSummary() {
    const text = `${state.type} / ${state.budget} / ${state.timeline}`;
    summary.textContent = text;

    const subject = encodeURIComponent(`Project Inquiry - BIM Labs`);
    const body = encodeURIComponent(
      `Hey BIM Labs,\n\nI want to book an intro call.\n\nProject type: ${state.type}\nEstimated budget: ${state.budget}\nTimeline: ${state.timeline}\n\nA little context:\n`
    );

    link.href = `mailto:bimlabsstudio@gmail.com?subject=${subject}&body=${body}`;
  }

  function handleChipClick(event) {
    const button = event.target.closest("button[data-value]");
    if (!button) return;

    const group = button.closest("[data-book-group]");
    if (!group) return;

    const groupName = group.getAttribute("data-book-group");
    const value = button.getAttribute("data-value");

    if (!groupName || !value) return;

    group.querySelectorAll("button").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    state[groupName] = value;
    updateSummary();
  }

  card.addEventListener("mousemove", moveLight, { passive: true });
  card.addEventListener("mouseleave", resetLight);
  card.addEventListener("blur", resetLight, true);
  card.addEventListener("click", handleChipClick);

  resetLight();
  updateSummary();
})();
