/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Performance Remake
   - Lighter trust bridge
   - Smooth accordion without height measurement
   - Transform-only hover preview
   - Soft click/hover signal instead of heavy glitch
   - Count-up animation
   - Focus-word camera blur
   - No drawer
   - No scroll lock
========================================================== */

(() => {
  "use strict";

  const archive = document.querySelector(".work-archive");
  const trust = document.querySelector(".work-trust");
  const trustTrack = document.querySelector("[data-work-trust-track]");

  if (!archive && !trustTrack) return;

  const projects = [
    {
      title: "Wonder World Portal",
      client: "Wonder World Playsets",
      type: "CRM / Portal System",
      role: "Commercial playground distributor",
      summary:
        "A CRM-style portal built to organize customer records, quote requests, project notes, follow-up, and internal project movement inside one cleaner operating system.",
      proof: "Customer records, quote flow, admin dashboard, and sales follow-up structure.",
      tags: ["CRM", "Quote Flow", "Admin Portal"]
    },
    {
      title: "Orynd AI",
      client: "Orynd AI",
      type: "AI Software System",
      role: "AI product and customer portal",
      summary:
        "An AI software experience shaped into a clearer product flow, making the offer easier to understand, present, and use without overcomplicating the customer experience.",
      proof: "AI interface direction, portal flow, product positioning, and customer-facing structure.",
      tags: ["AI Interface", "Portal Flow", "Offer Clarity"]
    },
    {
      title: "Momentum Athlete",
      client: "Momentum Athlete",
      type: "Course Credit Platform",
      role: "Athlete education and performance system",
      summary:
        "A 21-course credit system designed to make the program feel more structured, easier to move through, and easier to present as a complete digital product.",
      proof: "Course structure, user flow, progress clarity, and platform presentation.",
      tags: ["21 Courses", "User Flow", "Course Platform"]
    },
    {
      title: "3D Installation Manual",
      client: "Wonder World Playsets",
      type: "Interactive Install Guide",
      role: "3D installation support system",
      summary:
        "A 3D installation manual created to help customers, installers, and internal teams visualize how a playset comes together before and during the build.",
      proof: "3D visual guidance, installation support, customer clarity, and project explanation.",
      tags: ["3D Guide", "Install Support", "Visual Manual"]
    }
  ];

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  const state = {
    preview: null,
    activeProject: null,
    previewX: 0,
    previewY: 0,
    previewTargetX: 0,
    previewTargetY: 0,
    previewRaf: null,

    trustCurrent: 0,
    trustTarget: 0,
    trustRaf: null,
    trustMaxMove: 0
  };

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getProject(index) {
    return projects[index] || projects[0];
  }

  function createPreview() {
    if (state.preview || !archive) return;

    const preview = document.createElement("div");
    preview.className = "work-archive-preview";
    preview.setAttribute("aria-hidden", "true");

    preview.innerHTML = `
      <div class="work-archive-preview__inner">
        <p class="work-archive-preview__client"></p>
        <h3 class="work-archive-preview__title"></h3>
        <p class="work-archive-preview__type"></p>
        <p class="work-archive-preview__summary"></p>
        <div class="work-archive-preview__tags"></div>
      </div>
    `;

    document.body.appendChild(preview);
    state.preview = preview;
  }

  function updatePreviewContent(project) {
    if (!state.preview || !project) return;

    const client = state.preview.querySelector(".work-archive-preview__client");
    const title = state.preview.querySelector(".work-archive-preview__title");
    const type = state.preview.querySelector(".work-archive-preview__type");
    const summary = state.preview.querySelector(".work-archive-preview__summary");
    const tags = state.preview.querySelector(".work-archive-preview__tags");

    client.textContent = project.client;
    title.textContent = project.title;
    type.textContent = project.type;
    summary.textContent = project.summary;

    tags.innerHTML = project.tags
      .map((tag) => `<span>${escapeHtml(tag)}</span>`)
      .join("");
  }

  function showPreview(event, project) {
    if (!state.preview || mobileQuery.matches || prefersReducedMotion) return;

    state.activeProject = project;
    updatePreviewContent(project);

    state.previewTargetX = event.clientX + 26;
    state.previewTargetY = event.clientY + 26;
    state.previewX = state.previewTargetX;
    state.previewY = state.previewTargetY;

    state.preview.classList.add("is-visible");
    movePreview();
  }

  function hidePreview() {
    state.activeProject = null;

    if (state.preview) {
      state.preview.classList.remove("is-visible");
    }

    if (state.previewRaf) {
      cancelAnimationFrame(state.previewRaf);
      state.previewRaf = null;
    }
  }

  function handlePreviewMove(event) {
    if (!state.preview || !state.activeProject || mobileQuery.matches) return;

    state.previewTargetX = event.clientX + 26;
    state.previewTargetY = event.clientY + 26;

    if (!state.previewRaf) {
      movePreview();
    }
  }

  function movePreview() {
    if (!state.preview || !state.activeProject) {
      state.previewRaf = null;
      return;
    }

    state.previewX = lerp(state.previewX, state.previewTargetX, 0.18);
    state.previewY = lerp(state.previewY, state.previewTargetY, 0.18);

    const previewRect = state.preview.getBoundingClientRect();
    const safeX = clamp(state.previewX, 16, window.innerWidth - previewRect.width - 16);
    const safeY = clamp(state.previewY, 16, window.innerHeight - previewRect.height - 16);

    state.preview.style.transform = `translate3d(${safeX}px, ${safeY}px, 0)`;

    state.previewRaf = requestAnimationFrame(movePreview);
  }

  function hydrateArchiveItems() {
    if (!archive) return;

    const items = archive.querySelectorAll(
      "[data-project-index], [data-work-project], .work-archive__item"
    );

    items.forEach((item, index) => {
      const projectIndex = Number(item.dataset.projectIndex ?? index);
      const project = getProject(projectIndex);

      item.dataset.projectIndex = String(projectIndex);

      const title = item.querySelector("[data-project-title]");
      const client = item.querySelector("[data-project-client]");
      const type = item.querySelector("[data-project-type]");
      const summary = item.querySelector("[data-project-summary]");
      const proof = item.querySelector("[data-project-proof]");

      if (title) title.textContent = project.title;
      if (client) client.textContent = project.client;
      if (type) type.textContent = project.type;
      if (summary) summary.textContent = project.summary;
      if (proof) proof.textContent = project.proof;

      item.addEventListener("mouseenter", (event) => {
        showPreview(event, project);
      });

      item.addEventListener("mousemove", handlePreviewMove);
      item.addEventListener("mouseleave", hidePreview);

      item.addEventListener("focusin", () => {
        item.classList.add("is-focused");
      });

      item.addEventListener("focusout", () => {
        item.classList.remove("is-focused");
      });
    });
  }

  function hydrateTrustCards() {
    if (!trustTrack) return;

    const cards = trustTrack.querySelectorAll(".work-trust-card");

    cards.forEach((card, index) => {
      const project = getProject(index);

      const logo = card.querySelector(".work-trust-card__logo");
      const label = card.querySelector(".work-trust-card__top span");
      const heading = card.querySelector("h3");
      const body = card.querySelector(".work-trust-card__body");
      const meta = card.querySelector(".work-trust-card__meta");

      if (logo) logo.textContent = project.client;
      if (label) label.textContent = project.type;
      if (heading) heading.textContent = project.title;
      if (body) body.textContent = project.summary;

      if (meta) {
        meta.innerHTML = project.tags
          .map((tag) => `<span>${escapeHtml(tag)}</span>`)
          .join("");
      }
    });
  }

  function measureTrustTrack() {
    if (!trust || !trustTrack || mobileQuery.matches) {
      state.trustMaxMove = 0;

      if (trustTrack) {
        trustTrack.style.transform = "";
      }

      return;
    }

    const sticky = trust.querySelector(".work-trust__sticky");
    if (!sticky) return;

    const trackWidth = trustTrack.scrollWidth;
    const viewportWidth = window.innerWidth;
    const padding = Math.max(24, viewportWidth * 0.06);

    state.trustMaxMove = Math.max(0, trackWidth - viewportWidth + padding);

    if (state.trustMaxMove > 0) {
      trust.style.minHeight = `${window.innerHeight + state.trustMaxMove * 1.15}px`;
    }
  }

  function updateTrustTarget() {
    if (!trust || !trustTrack || mobileQuery.matches || prefersReducedMotion) return;

    const rect = trust.getBoundingClientRect();
    const scrollable = trust.offsetHeight - window.innerHeight;

    if (scrollable <= 0) return;

    const progress = clamp(Math.abs(rect.top) / scrollable, 0, 1);
    state.trustTarget = -state.trustMaxMove * progress;

    if (!state.trustRaf) {
      animateTrustTrack();
    }
  }

  function animateTrustTrack() {
    state.trustCurrent = lerp(state.trustCurrent, state.trustTarget, 0.12);

    if (trustTrack) {
      trustTrack.style.transform = `translate3d(${state.trustCurrent}px, 0, 0)`;
    }

    if (Math.abs(state.trustCurrent - state.trustTarget) > 0.35) {
      state.trustRaf = requestAnimationFrame(animateTrustTrack);
    } else {
      state.trustCurrent = state.trustTarget;

      if (trustTrack) {
        trustTrack.style.transform = `translate3d(${state.trustCurrent}px, 0, 0)`;
      }

      state.trustRaf = null;
    }
  }

  function resetMotionForMobile() {
    if (!mobileQuery.matches) return;

    hidePreview();

    if (trustTrack) {
      trustTrack.style.transform = "";
    }

    if (trust) {
      trust.style.minHeight = "";
    }

    state.trustCurrent = 0;
    state.trustTarget = 0;
    state.trustMaxMove = 0;
  }

  function init() {
    createPreview();
    hydrateArchiveItems();
    hydrateTrustCards();
    measureTrustTrack();
    updateTrustTarget();
    resetMotionForMobile();
  }

  window.addEventListener("scroll", updateTrustTarget, { passive: true });

  window.addEventListener("resize", () => {
    measureTrustTrack();
    updateTrustTarget();
    resetMotionForMobile();
  });

  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", () => {
      measureTrustTrack();
      updateTrustTarget();
      resetMotionForMobile();
    });
  }

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(() => {
      measureTrustTrack();
      updateTrustTarget();
    });

    if (trustTrack) observer.observe(trustTrack);
    if (trust) observer.observe(trust);
  }

  init();
})();

  /* ==========================================================
     PERFORMANCE CSS PATCH
     This lets the JS file fix the lag without needing HTML changes.
  ========================================================== */

  function injectPerformanceStyles() {
    if (document.getElementById("bim-work-performance-js-styles")) return;

    const style = document.createElement("style");
    style.id = "bim-work-performance-js-styles";

    style.textContent = `
      .work-project__panel {
        display: grid !important;
        grid-template-rows: 0fr;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        opacity: 1 !important;
        padding: 0 !important;
        overflow: hidden !important;
        transform: none !important;
        transition:
          grid-template-rows 620ms var(--work-ease, cubic-bezier(0.19, 1, 0.22, 1)),
          padding-bottom 620ms var(--work-ease, cubic-bezier(0.19, 1, 0.22, 1));
        will-change: grid-template-rows;
        contain: layout;
      }

      .work-project__panel-inner {
        min-height: 0;
        overflow: hidden;
        opacity: 0;
        transform: translate3d(0, -0.45rem, 0);
        transition:
          opacity 260ms ease,
          transform 620ms var(--work-ease, cubic-bezier(0.19, 1, 0.22, 1));
      }

      .work-project.is-open .work-project__panel,
      .work-project.is-opening .work-project__panel,
      .work-project[open].is-open .work-project__panel,
      .work-project[open].is-opening .work-project__panel {
        grid-template-rows: 1fr;
        padding-bottom: clamp(1.5rem, 3vh, 2.2rem) !important;
        overflow: hidden !important;
      }

      .work-project.is-open .work-project__panel-inner,
      .work-project.is-opening .work-project__panel-inner {
        opacity: 1;
        transform: translate3d(0, 0, 0);
      }

      .work-project.is-closing .work-project__panel {
        grid-template-rows: 0fr;
        padding-bottom: 0 !important;
      }

      .work-project.is-closing .work-project__panel-inner {
        opacity: 0;
        transform: translate3d(0, -0.35rem, 0);
      }

      .work-project__preview,
      .work-project__hover-image {
        left: 0 !important;
        top: 0 !important;
        right: auto !important;
        contain: layout paint;
        transform:
          translate3d(var(--preview-x, -999px), var(--preview-y, -999px), 0)
          scale(0.96)
          rotate(-1deg) !important;
        will-change: transform, opacity;
      }

      .work-project.is-previewing .work-project__preview,
      .work-project.is-previewing .work-project__hover-image {
        transform:
          translate3d(var(--preview-x, -999px), var(--preview-y, -999px), 0)
          scale(1)
          rotate(-1deg) !important;
      }

      .work-project.is-soft-signal .work-project__name {
        color: rgba(255, 255, 255, 0.98);
        transform: translate3d(0.22rem, 0, 0) skewX(-1.5deg);
      }

      .work-project.is-soft-signal .work-project__summary {
        filter: contrast(1.04);
      }

      @media (prefers-reduced-motion: reduce) {
        .work-project__panel,
        .work-project__panel-inner,
        .work-project__preview,
        .work-project__hover-image {
          transition: none !important;
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  /* ==========================================================
     CLEAN OLD STATES
  ========================================================== */

  function cleanOldStates() {
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");

    document.querySelectorAll(".work-detail").forEach((node) => node.remove());

    /*
      Your HTML already had a .work-trust section.
      This removes that old/static version so we do not render two trust sections.
    */
    document.querySelectorAll(".work-trust").forEach((node) => node.remove());

    document.querySelectorAll(".bim-trust").forEach((node, index) => {
      if (index > 0) node.remove();
    });

    archive.classList.remove(
      "has-open-detail",
      "has-open-project",
      "is-forming",
      "is-formed",
      "is-previewing"
    );
  }

  /* ==========================================================
     TRUST BRIDGE
  ========================================================== */

  function injectTrustBridge() {
    if (document.querySelector(".bim-trust")) return;

    const section = document.createElement("section");
    section.className = "bim-trust";
    section.setAttribute("aria-label", "Client trust");

    const cards = projects
      .map((project, index) => {
        return `
          <article class="bim-trust-card" data-bim-trust-card="${index}">
            <p class="bim-trust-card__logo">${escapeHtml(project.client)}</p>

            <blockquote>
              “${escapeHtml(project.review)}”
            </blockquote>

            <footer>
              <strong>${escapeHtml(project.title)}</strong>
              <span>${escapeHtml(project.role)}</span>
            </footer>
          </article>
        `;
      })
      .join("");

    section.innerHTML = `
      <div class="bim-trust__sticky">
        <h2 class="bim-trust__headline" aria-hidden="true">
          GOOD WORK<br>
          IS BUILT<br>
          WITH TRUST.
        </h2>

        <div class="bim-trust__copy">
          <p>
            We build with clients who need more than a nice-looking website.
            They need clearer systems, sharper presentation, and digital work
            that makes the business easier to understand.
          </p>
        </div>

        <div class="bim-trust__stage">
          ${cards}
        </div>
      </div>
    `;

    archive.parentNode.insertBefore(section, archive);
  }

  function setupTrustCards() {
    const section = document.querySelector(".bim-trust");
    const cards = Array.from(document.querySelectorAll("[data-bim-trust-card]"));
    const headline = document.querySelector(".bim-trust__headline");
    const copy = document.querySelector(".bim-trust__copy");

    if (!section || !cards.length) return;

    if (prefersReducedMotion || mobileQuery.matches) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.transform = "none";
      });

      return;
    }

    const settings = [
      {
        startX: 118,
        midX: 46,
        endX: -58,
        startY: 24,
        peakY: 3,
        endY: 18,
        startRotate: 7,
        midRotate: -2,
        endRotate: -9,
        delay: 0,
        span: 0.94,
        depth: 0
      },
      {
        startX: 136,
        midX: 58,
        endX: -46,
        startY: 17,
        peakY: -5,
        endY: 9,
        startRotate: 5,
        midRotate: 1,
        endRotate: -6,
        delay: 0.055,
        span: 0.94,
        depth: 18
      },
      {
        startX: 154,
        midX: 70,
        endX: -34,
        startY: 18,
        peakY: -7,
        endY: 8,
        startRotate: 3,
        midRotate: -1,
        endRotate: -5,
        delay: 0.11,
        span: 0.94,
        depth: 32
      },
      {
        startX: 172,
        midX: 82,
        endX: -22,
        startY: 25,
        peakY: 3,
        endY: 16,
        startRotate: 7,
        midRotate: 2,
        endRotate: -3,
        delay: 0.165,
        span: 0.94,
        depth: 10
      }
    ];

    function easeInOutCubic(value) {
      return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function bezier3(p0, p1, p2, t) {
      const a = lerp(p0, p1, t);
      const b = lerp(p1, p2, t);
      return lerp(a, b, t);
    }

    function getProgress() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);

      return clamp(-rect.top / travel, 0, 1);
    }

    function render(progress) {
      cards.forEach((card, index) => {
        const item = settings[index] || settings[settings.length - 1];
        const raw = clamp((progress - item.delay) / item.span, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier3(item.startX, item.midX, item.endX, t);
        const y = bezier3(item.startY, item.peakY, item.endY, t);
        const rotate = bezier3(item.startRotate, item.midRotate, item.endRotate, t);

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(30 + index);
        card.style.transform = `
          translate3d(${x}vw, ${y}vh, ${item.depth}px)
          rotate(${rotate}deg)
        `;
      });

      if (headline) {
        headline.style.opacity = String(lerp(0.92, 0.55, progress));
        headline.style.transform = `translate3d(0, ${lerp(0, -3, progress)}vh, 0)`;
      }

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.78, progress));
        copy.style.transform = `translate3d(0, ${lerp(0, -1.5, progress)}vh, 0)`;
      }
    }

    function animate() {
      state.trustCurrent = lerp(state.trustCurrent, state.trustTarget, 0.075);
      render(state.trustCurrent);

      if (Math.abs(state.trustTarget - state.trustCurrent) > 0.001) {
        state.trustRaf = window.requestAnimationFrame(animate);
      } else {
        state.trustCurrent = state.trustTarget;
        render(state.trustCurrent);
        state.trustRaf = null;
      }
    }

    function requestUpdate() {
      state.trustTarget = getProgress();

      if (!state.trustRaf) {
        state.trustRaf = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
    window.addEventListener("orientationchange", requestUpdate, { passive: true });

    state.trustTarget = getProgress();
    state.trustCurrent = state.trustTarget;
    render(state.trustCurrent);
  }

  /* ==========================================================
     RESULT COUNT-UP
  ========================================================== */

  function formatCountValue(value, decimals, suffix) {
    const safeDecimals = Number.isFinite(decimals) ? decimals : 0;
    const rounded = Number(value).toFixed(safeDecimals);

    return `${rounded}${suffix || ""}`;
  }

  function resetProjectCounts(item) {
    const counters = Array.from(item.querySelectorAll("[data-count]"));

    counters.forEach((counter) => {
      const suffix = counter.dataset.suffix || "";

      counter.dataset.counted = "false";
      counter.classList.remove("is-counting", "is-counted");
      counter.textContent = `0${suffix}`;
    });
  }

  function animateProjectCounts(item) {
    const counters = Array.from(item.querySelectorAll("[data-count]"));
    if (!counters.length) return;

    counters.forEach((counter, index) => {
      if (counter.dataset.counted === "true") return;

      counter.dataset.counted = "true";

      const target = Number(counter.dataset.count || 0);
      const suffix = counter.dataset.suffix || "";
      const decimals = counter.dataset.decimals
        ? Number(counter.dataset.decimals)
        : 0;

      if (prefersReducedMotion) {
        counter.textContent = formatCountValue(target, decimals, suffix);
        counter.classList.add("is-counted");
        return;
      }

      const duration = 950 + index * 70;
      const delay = index * 55;
      const startTime = performance.now() + delay;

      counter.classList.add("is-counting");

      function easeOutExpo(t) {
        return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      }

      function tick(now) {
        if (now < startTime) {
          window.requestAnimationFrame(tick);
          return;
        }

        const progress = Math.min((now - startTime) / duration, 1);
        const current = target * easeOutExpo(progress);

        counter.textContent = formatCountValue(current, decimals, suffix);

        if (progress < 1) {
          window.requestAnimationFrame(tick);
          return;
        }

        counter.textContent = formatCountValue(target, decimals, suffix);
        counter.classList.remove("is-counting");
        counter.classList.add("is-counted");
      }

      window.requestAnimationFrame(tick);
    });
  }

  /* ==========================================================
     SOFT SIGNAL
     Replaces the heavy physical-letter glitch.
  ========================================================== */

  function triggerSoftSignal(item) {
    if (!item || prefersReducedMotion) return;

    window.clearTimeout(item._softSignalTimer);

    item.classList.remove("is-soft-signal");
    item.offsetWidth;
    item.classList.add("is-soft-signal");

    item._softSignalTimer = window.setTimeout(() => {
      item.classList.remove("is-soft-signal");
    }, 260);
  }

  /* ==========================================================
     FOCUS WORDS
  ========================================================== */

  function setupFocusWords() {
    const words = Array.from(archive.querySelectorAll(".focus-word"));

    words.forEach((word) => {
      if (word.dataset.focusReady === "true") return;

      word.dataset.focusReady = "true";
      word.setAttribute("tabindex", "0");

      const item = word.closest(".work-project");
      if (!item) return;

      function activate() {
        item.classList.add("is-word-focusing");
        word.classList.add("is-focused");
      }

      function deactivate() {
        word.classList.remove("is-focused");

        if (!item.querySelector(".focus-word.is-focused")) {
          item.classList.remove("is-word-focusing");
        }
      }

      word.addEventListener("mouseenter", activate);
      word.addEventListener("mouseleave", deactivate);
      word.addEventListener("focus", activate);
      word.addEventListener("blur", deactivate);
    });
  }

  /* ==========================================================
     ACCORDION DETAILS
     No scrollHeight measuring.
     No height animation.
  ========================================================== */

  function setupArchiveDetails() {
    const items = Array.from(archive.querySelectorAll(".work-project"));
    const DURATION = prefersReducedMotion ? 0 : 640;

    if (!items.length) return;

    function getDirectPanel(item) {
      const children = Array.from(item.children);

      let panel = children.find((child) =>
        child.classList && child.classList.contains("work-project__panel")
      );

      if (panel) return panel;

      const summary = item.querySelector(".work-project__summary");
      const content = children.filter((child) => child !== summary);

      if (!content.length) return null;

      panel = document.createElement("div");
      panel.className = "work-project__panel";

      content.forEach((child) => panel.appendChild(child));
      item.appendChild(panel);

      return panel;
    }

    function wrapPanelContent(panel) {
      if (!panel || panel.querySelector(":scope > .work-project__panel-inner")) {
        return panel ? panel.querySelector(":scope > .work-project__panel-inner") : null;
      }

      const inner = document.createElement("div");
      inner.className = "work-project__panel-inner";

      while (panel.firstChild) {
        inner.appendChild(panel.firstChild);
      }

      panel.appendChild(inner);
      return inner;
    }

    function updateArchiveState() {
      const hasOpen = items.some(
        (item) =>
          item.open ||
          item.classList.contains("is-opening") ||
          item.classList.contains("is-open")
      );

      archive.classList.toggle("has-open-project", hasOpen);
    }

    function finishOpen(item) {
      if (!item.open) return;

      item.classList.remove("is-opening", "is-closing");
      item.classList.add("is-open");

      updateArchiveState();

      if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
        window.ScrollTrigger.refresh();
      }
    }

    function finishClose(item) {
      item.open = false;
      item.removeAttribute("open");

      item.classList.remove(
        "is-opening",
        "is-closing",
        "is-open",
        "is-word-focusing",
        "is-soft-signal"
      );

      const summary = item.querySelector(".work-project__summary");
      if (summary) summary.setAttribute("aria-expanded", "false");

      resetProjectCounts(item);
      updateArchiveState();

      if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
        window.ScrollTrigger.refresh();
      }
    }

    function closeProject(item) {
      const summary = item.querySelector(".work-project__summary");

      if (!summary || !item.open || item.classList.contains("is-closing")) {
        return;
      }

      window.clearTimeout(item._accordionTimer);

      item.classList.remove("is-opening", "is-open");
      item.classList.add("is-closing");

      summary.setAttribute("aria-expanded", "false");

      item._accordionTimer = window.setTimeout(() => {
        finishClose(item);
      }, DURATION);

      updateArchiveState();
    }

    function openProject(item) {
      const summary = item.querySelector(".work-project__summary");
      const panel = getDirectPanel(item);

      if (!summary || !panel) return;

      items.forEach((other) => {
        if (other !== item && other.open) closeProject(other);
      });

      window.clearTimeout(item._accordionTimer);

      item.open = true;
      item.setAttribute("open", "");

      item.classList.remove("is-closing");
      item.classList.add("is-opening");

      summary.setAttribute("aria-expanded", "true");

      window.requestAnimationFrame(() => {
        item.classList.add("is-open");
      });

      window.setTimeout(() => {
        animateProjectCounts(item);
      }, 150);

      item._accordionTimer = window.setTimeout(() => {
        finishOpen(item);
      }, DURATION);

      updateArchiveState();
    }

    items.forEach((item, index) => {
      if (item.dataset.workAccordionReady === "true") return;

      item.dataset.workAccordionReady = "true";
      item.dataset.workProjectItem = String(index);

      item.removeAttribute("name");

      const summary = item.querySelector(".work-project__summary");
      const panel = getDirectPanel(item);

      if (!summary || !panel) return;

      wrapPanelContent(panel);

      summary.setAttribute("role", "button");
      summary.setAttribute("aria-expanded", item.open ? "true" : "false");

      if (item.open) {
        item.classList.add("is-open");
        animateProjectCounts(item);
      } else {
        item.classList.remove("is-open", "is-opening", "is-closing");
        item.removeAttribute("open");
        item.open = false;
        resetProjectCounts(item);
      }

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        triggerSoftSignal(item);

        if (item.open && !item.classList.contains("is-closing")) {
          closeProject(item);
        } else {
          openProject(item);
        }
      });

      summary.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();
        triggerSoftSignal(item);

        if (item.open && !item.classList.contains("is-closing")) {
          closeProject(item);
        } else {
          openProject(item);
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;

      const openItem = items.find((item) => item.open);
      if (!openItem) return;

      event.preventDefault();
      closeProject(openItem);
    });

    updateArchiveState();
  }

  function closeAllArchiveProjects() {
    const details = Array.from(archive.querySelectorAll(".work-project"));

    details.forEach((item) => {
      if (!item || item.tagName.toLowerCase() !== "details") return;

      const summary = item.querySelector(".work-project__summary");

      window.clearTimeout(item._accordionTimer);
      window.clearTimeout(item._softSignalTimer);

      item.removeAttribute("open");
      item.open = false;

      item.classList.remove(
        "is-open",
        "is-opening",
        "is-closing",
        "is-previewing",
        "is-glitching",
        "is-soft-signal",
        "is-word-focusing"
      );

      if (summary) {
        summary.setAttribute("aria-expanded", "false");
      }

      resetProjectCounts(item);
    });

    archive.classList.remove("has-open-project");
  }

  /* ==========================================================
     TRANSFORM-ONLY HOVER PREVIEW
  ========================================================== */

 function setupArchiveHover() {
  const rows = Array.from(archive.querySelectorAll(".work-project"));

  if (!rows.length || mobileQuery.matches) return;

  let preview = document.querySelector(".work-archive-floating-preview");

  if (!preview) {
    preview = document.createElement("div");
    preview.className = "work-archive-floating-preview";
    preview.setAttribute("aria-hidden", "true");
    preview.innerHTML = `<img alt="" />`;
    document.body.appendChild(preview);
  }

  const previewImg = preview.querySelector("img");

  const motion = {
    currentX: 0,
    currentY: 0,
    targetX: 0,
    targetY: 0,
    visible: false,
    raf: null
  };

  function getImageFromRow(row) {
    const image = row.querySelector(".work-project__preview img");
    return image ? image.getAttribute("src") : "";
  }

  function render() {
    motion.currentX = lerp(motion.currentX, motion.targetX, 0.18);
    motion.currentY = lerp(motion.currentY, motion.targetY, 0.18);

    preview.style.transform = `
      translate3d(${motion.currentX}px, ${motion.currentY}px, 0)
      scale(${motion.visible ? 1 : 0.96})
      rotate(-1deg)
    `;

    const stillMoving =
      Math.abs(motion.currentX - motion.targetX) > 0.2 ||
      Math.abs(motion.currentY - motion.targetY) > 0.2;

    if (motion.visible || stillMoving) {
      motion.raf = window.requestAnimationFrame(render);
    } else {
      motion.raf = null;
    }
  }

  function move(event) {
    const width = 190;
    const height = 130;

    motion.targetX = clamp(
      event.clientX + 28,
      20,
      window.innerWidth - width - 20
    );

    motion.targetY = clamp(
      event.clientY - height * 0.45,
      20,
      window.innerHeight - height - 20
    );

    if (!motion.currentX) motion.currentX = motion.targetX;
    if (!motion.currentY) motion.currentY = motion.targetY;

    if (!motion.raf) {
      motion.raf = window.requestAnimationFrame(render);
    }
  }

  function show(row, event) {
    if (row.open) return;

    const src = getImageFromRow(row);
    if (!src) return;

    if (previewImg.getAttribute("src") !== src) {
      previewImg.setAttribute("src", src);
    }

    rows.forEach((item) => item.classList.remove("is-previewing"));
    row.classList.add("is-previewing");

    motion.visible = true;
    preview.classList.add("is-visible");

    move(event);
  }

  function hide(row) {
    row.classList.remove("is-previewing");

    motion.visible = false;
    preview.classList.remove("is-visible");
  }

  rows.forEach((row) => {
    const summary = row.querySelector(".work-project__summary");
    if (!summary) return;

    summary.addEventListener("mouseenter", (event) => {
      triggerSoftSignal(row);
      show(row, event);
    });

    summary.addEventListener("mousemove", (event) => {
      show(row, event);
    });

    summary.addEventListener("mouseleave", () => {
      hide(row);
    });

    summary.addEventListener("focus", () => {
      const rect = summary.getBoundingClientRect();

      triggerSoftSignal(row);

      show(row, {
        clientX: rect.right - 170,
        clientY: rect.top + rect.height / 2
      });
    });

    summary.addEventListener("blur", () => {
      hide(row);
    });
  });
}

  /* ==========================================================
     ARCHIVE REVEAL
     Lighter than before: no blur filters.
  ========================================================== */
function setupArchiveReveal() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const label = archive.querySelector(".work-archive__label");
  const kicker = archive.querySelector(".work-archive__kicker");
  const title = archive.querySelector(".work-archive__title");
  const intro = archive.querySelector(".work-archive__intro");
  const rows = Array.from(archive.querySelectorAll(".work-project"));

  if (!rows.length) return;

  if (ScrollTrigger && typeof ScrollTrigger.getAll === "function") {
    ScrollTrigger.getAll().forEach((trigger) => {
      const id = trigger.vars && trigger.vars.id;
      const triggerEl = trigger.vars && trigger.vars.trigger;

      if (
        id === "workArchivePresence" ||
        id === "workArchiveCenterLines" ||
        triggerEl === archive
      ) {
        trigger.kill();
      }
    });
  }

  rows.forEach((row) => {
    row.style.setProperty("--row-line", "0");
  });

  if (!gsap || !ScrollTrigger || prefersReducedMotion) {
    archive.classList.add("is-formed");

    rows.forEach((row) => {
      row.style.setProperty("--row-line", "1");
    });

    [label, kicker, title, intro].filter(Boolean).forEach((node) => {
      node.style.opacity = "1";
      node.style.transform = "none";
    });

    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const rowPieces = rows.map((row) =>
    Array.from(
      row.querySelectorAll(
        ".work-project__index, .work-project__name, .work-project__meta, .work-project__year, .work-project__arrow"
      )
    )
  );

  gsap.set([label, kicker, title, intro].filter(Boolean), {
    autoAlpha: 0,
    y: 34
  });

  rows.forEach((row, index) => {
    gsap.set(row, {
      "--row-line": 0,
      autoAlpha: 1
    });

    gsap.set(rowPieces[index], {
      autoAlpha: 0,
      y: 24
    });
  });

  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      id: "workArchivePresence",
      trigger: archive,
      start: "top 82%",
      end: "bottom 38%",
      scrub: 0.9
    }
  });

  tl.to(
    archive,
    {
      "--archive-presence-scale": 0.84,
      "--archive-presence-opacity": 0.18,
      "--archive-bg-scale": 1.08,
      "--archive-bg-opacity": 1,
      duration: 1
    },
    0
  );

  tl.to(
    [label, kicker].filter(Boolean),
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.18
    },
    0.05
  );

  tl.to(
    title,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.28
    },
    0.1
  );

  tl.to(
    intro,
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.22
    },
    0.18
  );

  tl.to(
    archive,
    {
      "--archive-header-y": "-4vh",
      "--archive-header-scale": 0.985,
      "--archive-list-y": "-3vh",
      duration: 1
    },
    0
  );

  rows.forEach((row, index) => {
    const start = 0.28 + index * 0.08;

    tl.to(
      row,
      {
        "--row-line": 1,
        duration: 0.22
      },
      start
    );

    tl.to(
      rowPieces[index],
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.18,
        stagger: 0.015
      },
      start + 0.04
    );

    tl.to(
      row,
      {
        "--row-drift": `${-10 - index * 3}px`,
        duration: 0.7
      },
      start
    );
  });

  tl.add(() => {
    archive.classList.add("is-formed");
  }, 0.95);
}

  /* ==========================================================
     IMAGE FALLBACKS
  ========================================================== */

  function setupImageFallbacks() {
    const images = archive.querySelectorAll("img");

    images.forEach((image) => {
      image.addEventListener(
        "error",
        () => {
          const holder = image.closest(
            ".work-project__preview, .work-project__media"
          );

          if (holder) {
            holder.classList.add("is-missing-image");
          }

          image.style.display = "none";
        },
        { once: true }
      );
    });
  }

  /* ==========================================================
     INIT
  ========================================================== */

  function init() {
    injectPerformanceStyles();
    cleanOldStates();
    injectTrustBridge();
    closeAllArchiveProjects();
    setupTrustCards();
    setupArchiveDetails();
    setupFocusWords();
    setupArchiveHover();
    setupArchiveReveal();
    setupImageFallbacks();

    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
      window.ScrollTrigger.refresh();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
