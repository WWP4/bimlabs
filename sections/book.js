/* ==========================================================
   BIM LABS — BOOK WITH US
   Homepage booking gateway.
========================================================== */

(() => {
  "use strict";

  const section = document.querySelector(".book-with-us");
  if (!section) return;

  const link = section.querySelector(".book-with-us__button");
  if (!link) return;

  if (!summary || !link) return;

  const state = {
    type: "Website",
    budget: "$3k-$7k",
  };

  function updateSummary() {
    const text = `${state.type} / ${state.budget}`;
    summary.textContent = text;

    const params = new URLSearchParams({
      type: state.type,
      budget: state.budget,
    });

    link.href = `/book.html?${params.toString()}`;
  }

  function handleClick(event) {
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

  section.addEventListener("click", handleClick);
  updateSummary();
})();
