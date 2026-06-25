(() => {
  "use strict";

  const flow = document.querySelector("[data-booking-flow]");
  if (!flow) return;

  const STUDIO_TIME_ZONE = "America/Chicago";
  const SLOT_MINUTES = 15;

  const studioSlots = [
    { label: "9:00 AM", hour: 9, minute: 0 },
    { label: "10:30 AM", hour: 10, minute: 30 },
    { label: "12:00 PM", hour: 12, minute: 0 },
    { label: "1:30 PM", hour: 13, minute: 30 },
    { label: "3:00 PM", hour: 15, minute: 0 },
    { label: "4:30 PM", hour: 16, minute: 30 },
  ];

  const form = flow.querySelector("[data-booking-form]");
  const steps = Array.from(flow.querySelectorAll("[data-step]"));
  const progressBar = flow.querySelector("[data-progress-bar]");
  const progressCurrent = flow.querySelector("[data-progress-current]");
  const backButton = flow.querySelector("[data-back]");
  const nextButton = flow.querySelector("[data-next]");
  const submitButton = flow.querySelector("[data-submit]");
  const error = flow.querySelector("[data-booking-error]");
  const success = flow.querySelector("[data-booking-success]");
  const successClientTime = flow.querySelector("[data-success-client-time]");
  const successStudioTime = flow.querySelector("[data-success-studio-time]");
  const reviewList = flow.querySelector("[data-review-list]");
  const timezoneLabel = flow.querySelector("[data-client-timezone]");

  const projectTypes = [
    {
      value: "Website",
      label: "Website",
      description: "A sharp public-facing site, landing page, or brand experience.",
    },
    {
      value: "CRM",
      label: "CRM",
      description: "A client portal, dashboard, pipeline, or business operating system.",
    },
    {
      value: "AI System",
      label: "AI System",
      description: "An assistant, intake tool, parser, router, or automated workflow.",
    },
    {
      value: "Automation",
      label: "Automation",
      description: "Booking flows, emails, lead routing, forms, payments, or backend cleanup.",
    },
    {
      value: "Custom Package",
      label: "Custom Package",
      description: "Bundle multiple pieces together or describe exactly what you need.",
    },
  ];

  const customServices = [
    "Website / landing page",
    "CRM / dashboard",
    "Client portal",
    "Booking flow",
    "Lead intake form",
    "Automated emails",
    "AI assistant",
    "Payments / Stripe",
    "Internal admin system",
    "Not sure yet",
  ];

  const projectTypeValues = projectTypes.map((type) => type.value);

  const budgets = [
    "$1k-$3k",
    "$3k-$7k",
    "$7k-$15k",
    "$15k+",
    "Not sure",
  ];

  const params = new URLSearchParams(window.location.search);
  const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const functionUrl =
    window.BIM_LABS_BOOKING_FUNCTION_URL || "/functions/v1/create-booking-request";

  const state = {
    step: 0,
    type: projectTypeValues.includes(params.get("type")) ? params.get("type") : "Website",
    budget: budgets.includes(params.get("budget")) ? params.get("budget") : "$3k-$7k",
    customServices: [],
    slot: null,
  };

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => {
      const replacements = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      };

      return replacements[character];
    });
  }

  function zonedParts(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .reduce((acc, part) => {
        if (part.type !== "literal") acc[part.type] = Number(part.value);
        return acc;
      }, {});

    if (parts.hour === 24) parts.hour = 0;

    return parts;
  }

  function zonedTimeToUtc({ year, month, day, hour, minute }, timeZone) {
    let utc = Date.UTC(year, month - 1, day, hour, minute, 0);

    for (let index = 0; index < 3; index += 1) {
      const parts = zonedParts(new Date(utc), timeZone);

      const asUtc = Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second || 0
      );

      utc += Date.UTC(year, month - 1, day, hour, minute, 0) - asUtc;
    }

    return new Date(utc);
  }

  function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  function displayDate(date, timeZone) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  function displayTime(date, timeZone) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  function displayFull(date, timeZone) {
    return new Intl.DateTimeFormat(undefined, {
      timeZone,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  }

  function nextStudioBusinessDays(count) {
    const days = [];
    const nowParts = zonedParts(new Date(), STUDIO_TIME_ZONE);

    const cursor = {
      year: nowParts.year,
      month: nowParts.month,
      day: nowParts.day,
    };

    while (days.length < count) {
      const noonUtc = zonedTimeToUtc(
        { ...cursor, hour: 12, minute: 0 },
        STUDIO_TIME_ZONE
      );

      noonUtc.setUTCDate(noonUtc.getUTCDate() + 1);

      const next = zonedParts(noonUtc, STUDIO_TIME_ZONE);

      cursor.year = next.year;
      cursor.month = next.month;
      cursor.day = next.day;

      const studioNoon = zonedTimeToUtc(
        { ...cursor, hour: 12, minute: 0 },
        STUDIO_TIME_ZONE
      );

      const weekday = new Intl.DateTimeFormat("en-US", {
        timeZone: STUDIO_TIME_ZONE,
        weekday: "short",
      }).format(studioNoon);

      if (weekday !== "Sat" && weekday !== "Sun") {
        days.push({ ...cursor });
      }
    }

    return days;
  }

  function buildSlots() {
    return nextStudioBusinessDays(10).map((day, dayIndex) => {
      const studioNoonUtc = zonedTimeToUtc(
        { ...day, hour: 12, minute: 0 },
        STUDIO_TIME_ZONE
      );

      return {
        key: `${day.year}-${String(day.month).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
        dateLabel: displayDate(studioNoonUtc, clientTimeZone),
        studioDateLabel: displayDate(studioNoonUtc, STUDIO_TIME_ZONE),
        times: studioSlots.map((slot) => {
          const start = zonedTimeToUtc(
            { ...day, hour: slot.hour, minute: slot.minute },
            STUDIO_TIME_ZONE
          );

          const end = addMinutes(start, SLOT_MINUTES);

          return {
            id: `${dayIndex}-${slot.hour}-${slot.minute}`,
            startAtUtc: start.toISOString(),
            endAtUtc: end.toISOString(),
            clientDisplayTime: displayFull(start, clientTimeZone),
            studioDisplayTime: displayFull(start, STUDIO_TIME_ZONE),
            clientTimeLabel: displayTime(start, clientTimeZone),
            studioSlotLabel: slot.label,
          };
        }),
      };
    });
  }

  const availability = buildSlots();
  state.slot = availability[0]?.times[0] || null;

  function renderChoices(group, values) {
    const node = flow.querySelector(`[data-choice-group="${group}"]`);
    if (!node) return;

    node.innerHTML = values
      .map((item) => {
        const value = typeof item === "string" ? item : item.value;
        const label = typeof item === "string" ? item : item.label;
        const description = typeof item === "string" ? "" : item.description;

        return `
          <button
            type="button"
            class="choice-button"
            data-choice="${group}"
            data-value="${escapeHTML(value)}"
            aria-pressed="false"
          >
            <span>${escapeHTML(label)}</span>
            ${description ? `<small>${escapeHTML(description)}</small>` : ""}
          </button>
        `;
      })
      .join("");
  }

  function renderCustomServices() {
    const node = flow.querySelector("[data-custom-services]");
    if (!node) return;

    node.innerHTML = customServices
      .map((service) => {
        return `
          <button
            type="button"
            class="custom-service-button"
            data-custom-service="${escapeHTML(service)}"
            aria-pressed="false"
          >
            ${escapeHTML(service)}
          </button>
        `;
      })
      .join("");
  }

  function renderDates() {
    const dateList = flow.querySelector("[data-date-list]");
    if (!dateList) return;

    dateList.innerHTML = availability
      .map((day) => {
        return `
          <button
            type="button"
            class="date-button"
            data-date-key="${day.key}"
            aria-selected="false"
          >
            <span>${day.dateLabel}</span>
            <small>BIM Labs: ${day.studioDateLabel}</small>
          </button>
        `;
      })
      .join("");
  }

  function renderTimes() {
    const timeList = flow.querySelector("[data-time-list]");
    if (!timeList) return;

    const selectedDay =
      availability.find((day) =>
        day.times.some((slot) => slot.id === state.slot?.id)
      ) || availability[0];

    timeList.innerHTML = selectedDay.times
      .map((slot) => {
        return `
          <button
            type="button"
            class="time-button"
            data-slot-id="${slot.id}"
            aria-selected="false"
          >
            <span>${slot.clientTimeLabel}</span>
            <small>BIM Labs ${slot.studioSlotLabel}</small>
          </button>
        `;
      })
      .join("");
  }

  function selectedDayKey() {
    return availability.find((day) =>
      day.times.some((slot) => slot.id === state.slot?.id)
    )?.key;
  }

  function syncHiddenFields() {
    form.querySelector('[data-field="type"]').value = state.type;
    form.querySelector('[data-field="budget"]').value = state.budget;
    form.querySelector('[data-field="start"]').value = state.slot?.startAtUtc || "";
    form.querySelector('[data-field="end"]').value = state.slot?.endAtUtc || "";
    form.querySelector('[data-field="client-timezone"]').value = clientTimeZone;
    form.querySelector('[data-field="studio-timezone"]').value = STUDIO_TIME_ZONE;
    form.querySelector('[data-field="client-display-time"]').value =
      state.slot?.clientDisplayTime || "";
    form.querySelector('[data-field="studio-display-time"]').value =
      state.slot?.studioDisplayTime || "";
  }

  function getProjectContextValue() {
    const data = new FormData(form);
    const rawContext = String(data.get("projectContext") || "").trim();
    const customNote = String(data.get("customPackageNote") || "").trim();

    if (state.type !== "Custom Package") {
      return rawContext;
    }

    const servicesLine = state.customServices.length
      ? `Custom package selections: ${state.customServices.join(", ")}`
      : "Custom package selections: Needs discussion";

    const customNoteLine = customNote
      ? `Custom package details: ${customNote}`
      : "Custom package details: Not provided";

    return [
      servicesLine,
      customNoteLine,
      "",
      `Project context: ${rawContext}`,
    ].join("\n");
  }

  function updateReview() {
    const data = new FormData(form);
    const customNote = String(data.get("customPackageNote") || "").trim();

    const rows = [["Project direction", state.type]];

    if (state.type === "Custom Package") {
      rows.push(
        [
          "Custom services",
          state.customServices.length ? state.customServices.join(", ") : "Needs discussion",
        ],
        [
          "Custom details",
          customNote || "—",
        ]
      );
    }

    rows.push(
      ["Budget range", state.budget],
      ["Your time", state.slot?.clientDisplayTime || "—"],
      ["BIM Labs time", state.slot?.studioDisplayTime || "—"],
      ["Name", data.get("name") || "—"],
      ["Email", data.get("email") || "—"],
      ["Phone", data.get("phone") || "—"],
      ["Business", data.get("businessName") || "—"],
      ["Project context", data.get("projectContext") || "—"]
    );

    reviewList.innerHTML = rows
      .map(([term, desc]) => {
        return `
          <div>
            <dt>${escapeHTML(term)}</dt>
            <dd>${escapeHTML(desc)}</dd>
          </div>
        `;
      })
      .join("");
  }

  function updateUI() {
    steps.forEach((step, index) => {
      const active = index === state.step;

      step.hidden = !active;
      step.classList.toggle("is-active", active);

      if (active) {
        step.setAttribute("aria-current", "step");
      } else {
        step.removeAttribute("aria-current");
      }
    });

    flow.querySelectorAll("[data-choice]").forEach((button) => {
      const active = state[button.dataset.choice] === button.dataset.value;

      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const customBuilder = flow.querySelector("[data-custom-builder]");
    if (customBuilder) {
      customBuilder.hidden = state.type !== "Custom Package";
    }

    flow.querySelectorAll("[data-custom-service]").forEach((button) => {
      const active = state.customServices.includes(button.dataset.customService);

      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });

    flow.querySelectorAll("[data-date-key]").forEach((button) => {
      const active = selectedDayKey() === button.dataset.dateKey;

      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-selected", String(active));
    });

    flow.querySelectorAll("[data-slot-id]").forEach((button) => {
      const active = state.slot?.id === button.dataset.slotId;

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

    if (state.step === steps.length - 1) {
      updateReview();
    }
  }

  function validContact() {
    const name = form.elements.name.value.trim();
    const email = form.elements.email.value.trim();
    const context = form.elements.projectContext.value.trim();
    const customNote = form.elements.customPackageNote
      ? form.elements.customPackageNote.value.trim()
      : "";

    if (!name) return "Please enter your name.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Please enter a valid email.";
    if (!context) return "Please add a short project context.";

    if (
      state.type === "Custom Package" &&
      !state.customServices.length &&
      !customNote
    ) {
      return "Please select at least one custom service or describe the custom package.";
    }

    return "";
  }

  function canAdvance() {
    if (state.step === 0 && !state.type) {
      return "Please choose what you need built.";
    }

    if (state.step === 1 && !state.budget) {
      return "Please choose a budget range.";
    }

    if (state.step === 2 && !state.slot) {
      return "Please choose a date and time.";
    }

    if (state.step === 3) {
      return validContact();
    }

    return "";
  }

  flow.addEventListener("click", (event) => {
    const choice = event.target.closest("[data-choice]");
    const customService = event.target.closest("[data-custom-service]");
    const date = event.target.closest("[data-date-key]");
    const time = event.target.closest("[data-slot-id]");

    if (choice) {
      state[choice.dataset.choice] = choice.dataset.value;
    }

    if (customService) {
      const value = customService.dataset.customService;

      if (state.customServices.includes(value)) {
        state.customServices = state.customServices.filter((item) => item !== value);
      } else {
        state.customServices.push(value);
      }
    }

    if (date) {
      const day = availability.find((item) => item.key === date.dataset.dateKey);
      state.slot = day?.times[0] || state.slot;
      renderTimes();
    }

    if (time) {
      const slots = availability.flatMap((day) => day.times);
      state.slot = slots.find((slot) => slot.id === time.dataset.slotId) || state.slot;
    }

    updateUI();
  });

  nextButton.addEventListener("click", () => {
    const message = canAdvance();

    if (message) {
      error.textContent = message;
      return;
    }

    state.step = Math.min(state.step + 1, steps.length - 1);
    updateUI();
  });

  backButton.addEventListener("click", () => {
    state.step = Math.max(state.step - 1, 0);
    updateUI();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = validContact() || canAdvance();

    if (message) {
      error.textContent = message;
      return;
    }

    syncHiddenFields();

    submitButton.disabled = true;
    submitButton.textContent = "Sending request…";

    const data = new FormData(form);

    const payload = {
      project_type: state.type,
      budget_range: state.budget,
      start_at_utc: state.slot.startAtUtc,
      end_at_utc: state.slot.endAtUtc,
      client_timezone: clientTimeZone,
      studio_timezone: STUDIO_TIME_ZONE,
      client_display_time: state.slot.clientDisplayTime,
      studio_display_time: state.slot.studioDisplayTime,
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      business_name: String(data.get("businessName") || "").trim(),
      project_context: getProjectContextValue(),
      source: "bim-labs-booking-page",
    };

    try {
      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Unable to submit this booking request.");
      }

      successClientTime.textContent = payload.client_display_time;
      successStudioTime.textContent = payload.studio_display_time;

      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (requestError) {
      error.textContent =
        requestError.message || "Unable to submit this booking request. Please try again.";

      submitButton.disabled = false;
      submitButton.textContent = "Confirm intro call.";
    }
  });

  timezoneLabel.textContent = clientTimeZone;

  renderChoices("type", projectTypes);
  renderChoices("budget", budgets);
  renderCustomServices();
  renderDates();
  renderTimes();
  updateUI();
})();
