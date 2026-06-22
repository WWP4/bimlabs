(() => {
  "use strict";

  const flow = document.querySelector("[data-booking-flow]");
  if (!flow) return;

  const form = flow.querySelector("[data-booking-form]");
  const steps = Array.from(flow.querySelectorAll("[data-step]"));
  const progressBar = flow.querySelector("[data-progress-bar]");
  const progressCurrent = flow.querySelector("[data-progress-current]");
  const backButton = flow.querySelector("[data-back]");
  const nextButton = flow.querySelector("[data-next]");
  const submitButton = flow.querySelector("[data-submit]");
  const error = flow.querySelector("[data-booking-error]");
  const success = flow.querySelector("[data-booking-success]");
  const reviewList = flow.querySelector("[data-review-list]");

  const projectTypes = ["Website", "Portal", "AI System", "Automation"];
  const budgets = ["$1k-$3k", "$3k-$7k", "$7k-$15k"];
  const times = ["9:00 AM", "10:30 AM", "12:00 PM", "1:30 PM", "3:00 PM", "4:30 PM"];
  const params = new URLSearchParams(window.location.search);

  const state = {
    step: 0,
    type: projectTypes.includes(params.get("type")) ? params.get("type") : "Website",
    budget: budgets.includes(params.get("budget")) ? params.get("budget") : "$3k-$7k",
    date: "",
    time: "",
  };

  function businessDays(count) {
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (days.length < count) {
      cursor.setDate(cursor.getDate() + 1);
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) days.push(new Date(cursor));
    }
    return days;
  }

  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function dateLabel(date) {
    return new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(date);
  }

  function renderChoices(group, values) {
    const node = flow.querySelector(`[data-choice-group="${group}"]`);
    node.innerHTML = values.map((value) => `
      <button type="button" class="choice-button" data-choice="${group}" data-value="${value}" aria-pressed="false">
        <span>${value}</span>
      </button>
    `).join("");
  }

  function renderDates() {
    const dateList = flow.querySelector("[data-date-list]");
    const timeList = flow.querySelector("[data-time-list]");
    const days = businessDays(10);
    if (!state.date) state.date = isoDate(days[0]);
    if (!state.time) state.time = times[0];

    dateList.innerHTML = days.map((date) => `
      <button type="button" class="date-button" data-date="${isoDate(date)}" aria-selected="false">
        <span>${dateLabel(date)}</span>
      </button>
    `).join("");
    timeList.innerHTML = times.map((time) => `
      <button type="button" class="time-button" data-time="${time}" aria-selected="false">${time}</button>
    `).join("");
  }

  function syncHiddenFields() {
    form.querySelector('[data-field="type"]').value = state.type;
    form.querySelector('[data-field="budget"]').value = state.budget;
    form.querySelector('[data-field="date"]').value = state.date;
    form.querySelector('[data-field="time"]').value = state.time;
  }

  function updateReview() {
    const data = new FormData(form);
    const rows = [
      ["Project type", state.type], ["Budget range", state.budget], ["Date", state.date], ["Time", state.time],
      ["Name", data.get("name") || "—"], ["Email", data.get("email") || "—"], ["Phone", data.get("phone") || "—"],
      ["Business", data.get("businessName") || "—"], ["Context", data.get("projectContext") || "—"],
    ];
    reviewList.innerHTML = rows.map(([term, desc]) => `<div><dt>${term}</dt><dd>${desc}</dd></div>`).join("");
  }

  function updateUI() {
    steps.forEach((step, index) => {
      const active = index === state.step;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
      if (active) step.setAttribute("aria-current", "step"); else step.removeAttribute("aria-current");
    });
    flow.querySelectorAll("[data-choice]").forEach((button) => {
      const active = state[button.dataset.choice] === button.dataset.value;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    flow.querySelectorAll("[data-date]").forEach((button) => {
      const active = state.date === button.dataset.date;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-selected", String(active));
    });
    flow.querySelectorAll("[data-time]").forEach((button) => {
      const active = state.time === button.dataset.time;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-selected", String(active));
    });
    backButton.disabled = state.step === 0;
    nextButton.hidden = state.step === steps.length - 1;
    submitButton.hidden = state.step !== steps.length - 1;
    progressCurrent.textContent = String(state.step + 1);
    progressBar.style.width = `${((state.step + 1) / steps.length) * 100}%`;
    error.textContent = "";
    syncHiddenFields();
    if (state.step === steps.length - 1) updateReview();
  }

  function validContact() {
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const context = form.elements.projectContext.value.trim();
    if (!name) return "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
    if (!context) return "Please add a short project context.";
    return "";
  }

  function canAdvance() {
    if (state.step === 2 && (!state.date || !state.time)) return "Please choose a date and time.";
    if (state.step === 3) return validContact();
    return "";
  }

  flow.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-choice]");
    const date = event.target.closest("[data-date]");
    const time = event.target.closest("[data-time]");
    if (choice) state[choice.dataset.choice] = choice.dataset.value;
    if (date) state.date = date.dataset.date;
    if (time) state.time = time.dataset.time;
    updateUI();
  });

  nextButton.addEventListener("click", () => {
    const message = canAdvance();
    if (message) { error.textContent = message; return; }
    state.step = Math.min(state.step + 1, steps.length - 1);
    updateUI();
  });

  backButton.addEventListener("click", () => {
    state.step = Math.max(state.step - 1, 0);
    updateUI();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = validContact();
    if (message) { error.textContent = message; return; }
    syncHiddenFields();
    submitButton.disabled = true;
    submitButton.textContent = "Sending request…";

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch("/.netlify/functions/book-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Function unavailable");
    } catch (_) {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
    }

    form.hidden = true;
    success.hidden = false;
    success.focus();
  });

  renderChoices("type", projectTypes);
  renderChoices("budget", budgets);
  renderDates();
  updateUI();
})();
