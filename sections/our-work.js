/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Clean JS
   - Trust bridge flying cards
   - Work archive accordion
   - Noomo-style center-growing row lines
   - Mouse preview
   - Physical letter glitch
   - Results count-up
   - Focus-word camera blur
   - No drawer
   - No scroll lock
========================================================== */

(() => {
  "use strict";

  const projects = [
    {
      number: "01",
      title: "Wonder World Portal",
      client: "Wonder World Playsets",
      role: "Commercial playground distributor",
      review:
        "The portal made our process feel organized, easier to manage, and easier to present to customers."
    },
    {
      number: "02",
      title: "Momentum Athlete",
      client: "Momentum Athlete",
      role: "Athlete performance platform",
      review:
        "The platform finally felt clear, premium, and easier to present to partners."
    },
    {
      number: "03",
      title: "Orynd AI",
      client: "Orynd AI",
      role: "AI platform",
      review:
        "The site made the product easier to explain without making the idea feel smaller."
    },
    {
      number: "04",
      title: "3D Install Tool",
      client: "BIM Labs Studio",
      role: "Interactive project system",
      review:
        "The visual tool made the project easier to explain and easier for people to understand quickly."
    }
  ];

  const archive = document.querySelector(".work-archive");
  if (!archive) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  let glitchTimer = null;

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

  /* ==========================================================
     CLEAN OLD STATES
  ========================================================== */

  function cleanOldStates() {
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");

    document.querySelectorAll(".work-detail").forEach((node) => node.remove());
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

    const cardSettings = [
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

    let targetProgress = 0;
    let currentProgress = 0;
    let raf = null;

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
        const settings =
          cardSettings[index] || cardSettings[cardSettings.length - 1];

        const raw = clamp((progress - settings.delay) / settings.span, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier3(settings.startX, settings.midX, settings.endX, t);
        const y = bezier3(settings.startY, settings.peakY, settings.endY, t);
        const rotate = bezier3(
          settings.startRotate,
          settings.midRotate,
          settings.endRotate,
          t
        );

        const float = Math.sin(progress * Math.PI * 2 + index * 0.85) * 0.22;

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(30 + index);
        card.style.transform = `
          translate3d(${x}vw, calc(${y}vh + ${float}rem), ${settings.depth}px)
          rotate(${rotate}deg)
          scale(1)
        `;
      });

      if (headline) {
        headline.style.opacity = String(lerp(0.92, 0.5, progress));
        headline.style.transform = `translate3d(0, ${lerp(0, -3.5, progress)}vh, 0)`;
      }

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.76, progress));
        copy.style.transform = `translate3d(0, ${lerp(0, -1.8, progress)}vh, 0)`;
      }
    }

    function animate() {
      currentProgress = lerp(currentProgress, targetProgress, 0.045);
      render(currentProgress);

      if (Math.abs(targetProgress - currentProgress) > 0.0004) {
        raf = window.requestAnimationFrame(animate);
      } else {
        currentProgress = targetProgress;
        render(currentProgress);
        raf = null;
      }
    }

    function requestUpdate() {
      targetProgress = getProgress();

      if (!raf) {
        raf = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("orientationchange", requestUpdate);

    targetProgress = getProgress();
    currentProgress = targetProgress;
    render(currentProgress);
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
      counter.classList.remove("is-counting");
      counter.textContent = `0${suffix}`;
      counter.removeAttribute("data-ghost-before");
      counter.removeAttribute("data-ghost-after");
    });
  }

  function animateProjectCounts(item) {
    const counters = Array.from(item.querySelectorAll("[data-count]"));

    if (!counters.length) return;

    if (prefersReducedMotion) {
      counters.forEach((counter) => {
        const target = Number(counter.dataset.count || 0);
        const suffix = counter.dataset.suffix || "";
        const decimals = counter.dataset.decimals
          ? Number(counter.dataset.decimals)
          : 0;

        counter.textContent = formatCountValue(target, decimals, suffix);
      });

      return;
    }

    counters.forEach((counter, index) => {
      if (counter.dataset.counted === "true") return;

      counter.dataset.counted = "true";

      const target = Number(counter.dataset.count || 0);
      const suffix = counter.dataset.suffix || "";
      const decimals = counter.dataset.decimals
        ? Number(counter.dataset.decimals)
        : 0;

      const duration = 920 + index * 90;
      const delay = index * 90;
      const startTime = performance.now() + delay;

      counter.classList.add("is-counting");

      function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
      }

      function tick(now) {
        if (now < startTime) {
          window.requestAnimationFrame(tick);
          return;
        }

        const progress = Math.min((now - startTime) / duration, 1);
        const eased = easeOutCubic(progress);
        const current = target * eased;

        const before = Math.max(0, current - target * 0.08);
        const after = Math.min(target, current + target * 0.08);

        counter.textContent = formatCountValue(current, decimals, suffix);
        counter.dataset.ghostBefore = formatCountValue(before, decimals, suffix);
        counter.dataset.ghostAfter = formatCountValue(after, decimals, suffix);

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        } else {
          counter.textContent = formatCountValue(target, decimals, suffix);
          counter.dataset.ghostBefore = "";
          counter.dataset.ghostAfter = "";

          window.setTimeout(() => {
            counter.classList.remove("is-counting");
          }, 260);
        }
      }

      window.requestAnimationFrame(tick);
    });
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
  ========================================================== */

  function setupArchiveDetails() {
    const items = Array.from(archive.querySelectorAll(".work-project"));
    const DURATION = prefersReducedMotion ? 0 : 680;

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

    function updateArchiveState() {
      const hasOpen = items.some(
        (item) =>
          item.open ||
          item.classList.contains("is-opening") ||
          item.classList.contains("is-open")
      );

      archive.classList.toggle("has-open-project", hasOpen);
    }

    function clearPanelTimer(panel) {
      if (!panel) return;

      window.clearTimeout(panel._workAccordionTimer);
      panel._workAccordionTimer = null;
    }

    function finishOpen(item, panel) {
      if (!item.open) return;

      item.classList.remove("is-opening", "is-closing");
      item.classList.add("is-open");

      panel.style.height = "auto";
      panel.style.opacity = "1";
      panel.style.transform = "translate3d(0, 0, 0)";
      panel.style.overflow = "visible";

      updateArchiveState();

      if (window.ScrollTrigger && typeof window.ScrollTrigger.update === "function") {
        window.ScrollTrigger.update();
      }
    }

    function finishClose(item, panel) {
      item.open = false;
      item.removeAttribute("open");

      item.classList.remove(
        "is-opening",
        "is-closing",
        "is-open",
        "is-word-focusing"
      );

      const summary = item.querySelector(".work-project__summary");
      if (summary) summary.setAttribute("aria-expanded", "false");

      resetProjectCounts(item);

      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.transform = "translate3d(0, -0.35rem, 0)";
      panel.style.overflow = "hidden";

      updateArchiveState();

      if (window.ScrollTrigger && typeof window.ScrollTrigger.update === "function") {
        window.ScrollTrigger.update();
      }
    }

    function openProject(item) {
      const summary = item.querySelector(".work-project__summary");
      const panel = getDirectPanel(item);

      if (!summary || !panel) return;

      items.forEach((other) => {
        if (other !== item && other.open) {
          closeProject(other);
        }
      });

      clearPanelTimer(panel);

      item.open = true;
      item.setAttribute("open", "");
      item.classList.remove("is-closing", "is-open");
      item.classList.add("is-opening");

      summary.setAttribute("aria-expanded", "true");

      panel.classList.add("work-project__detail-scroll");
      panel.style.overflow = "hidden";
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.transform = "translate3d(0, -0.35rem, 0)";

      panel.getBoundingClientRect();

      const targetHeight = panel.scrollHeight;

      window.requestAnimationFrame(() => {
        panel.style.height = `${targetHeight}px`;
        panel.style.opacity = "1";
        panel.style.transform = "translate3d(0, 0, 0)";
      });

      window.setTimeout(() => {
        animateProjectCounts(item);
      }, 180);

      panel._workAccordionTimer = window.setTimeout(() => {
        finishOpen(item, panel);
      }, DURATION + 80);

      updateArchiveState();
    }

    function closeProject(item) {
      const summary = item.querySelector(".work-project__summary");
      const panel = getDirectPanel(item);

      if (!summary || !panel) return;

      clearPanelTimer(panel);

      const startHeight = panel.getBoundingClientRect().height || panel.scrollHeight;

      item.classList.remove("is-opening", "is-open");
      item.classList.add("is-closing");

      summary.setAttribute("aria-expanded", "false");

      panel.style.overflow = "hidden";
      panel.style.height = `${startHeight}px`;
      panel.style.opacity = "1";
      panel.style.transform = "translate3d(0, 0, 0)";

      panel.getBoundingClientRect();

      window.requestAnimationFrame(() => {
        panel.style.height = "0px";
        panel.style.opacity = "0";
        panel.style.transform = "translate3d(0, -0.35rem, 0)";
      });

      panel._workAccordionTimer = window.setTimeout(() => {
        finishClose(item, panel);
      }, DURATION + 80);
    }

    items.forEach((item, index) => {
      if (item.dataset.workAccordionReady === "true") return;

      item.dataset.workAccordionReady = "true";
      item.dataset.workProjectItem = String(index);

      item.removeAttribute("name");

      const summary = item.querySelector(".work-project__summary");
      const panel = getDirectPanel(item);

      if (!summary || !panel) return;

      panel.classList.add("work-project__detail-scroll");

      summary.setAttribute("role", "button");
      summary.setAttribute("aria-expanded", item.open ? "true" : "false");

      if (item.open) {
        item.classList.add("is-open");
        panel.style.height = "auto";
        panel.style.opacity = "1";
        panel.style.overflow = "visible";
        panel.style.transform = "translate3d(0, 0, 0)";
        animateProjectCounts(item);
      } else {
        panel.style.height = "0px";
        panel.style.opacity = "0";
        panel.style.overflow = "hidden";
        panel.style.transform = "translate3d(0, -0.35rem, 0)";
        resetProjectCounts(item);
      }

      summary.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        triggerProjectGlitch(item);

        if (item.open && !item.classList.contains("is-closing")) {
          closeProject(item);
        } else {
          openProject(item);
        }
      });

      summary.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;

        event.preventDefault();

        triggerProjectGlitch(item);

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
  }

  function setupArchiveDetailScrollGuards() {
    return;
  }

  function closeAllArchiveProjects() {
    const details = Array.from(archive.querySelectorAll(".work-project"));

    details.forEach((item) => {
      if (!item || item.tagName.toLowerCase() !== "details") return;

      const summary = item.querySelector(".work-project__summary");
      const panel = item.querySelector(".work-project__panel");

      item.removeAttribute("open");
      item.open = false;

      item.classList.remove(
        "is-open",
        "is-opening",
        "is-closing",
        "is-previewing",
        "is-glitching",
        "is-word-focusing"
      );

      if (summary) {
        summary.setAttribute("aria-expanded", "false");
      }

      if (panel) {
        window.clearTimeout(panel._workAccordionTimer);
        panel.style.height = "0px";
        panel.style.opacity = "0";
        panel.style.transform = "translate3d(0, -0.35rem, 0)";
        panel.style.overflow = "hidden";
      }

      resetProjectCounts(item);
    });

    archive.classList.remove("has-open-project");
  }

  /* ==========================================================
     GLITCH STYLE INJECTION
  ========================================================== */

  function injectGlitchStyles() {
    if (document.getElementById("bim-work-glitch-styles")) return;

    const style = document.createElement("style");
    style.id = "bim-work-glitch-styles";

    style.textContent = `
      .work-project__name {
        position: relative;
      }

      .glitch-word__base,
      .glitch-word__layer {
        display: inline-flex;
        align-items: baseline;
        white-space: inherit;
      }

      .glitch-word__base {
        position: relative;
        z-index: 1;
      }

      .glitch-word__layer {
        position: absolute;
        inset: 0;
        z-index: 2;
        opacity: 0;
        pointer-events: none;
        mix-blend-mode: screen;
      }

      .glitch-word__layer--a {
        color: rgba(255, 255, 255, 0.98);
        clip-path: inset(0 0 62% 0);
      }

      .glitch-word__layer--b {
        color: rgba(180, 190, 205, 0.7);
        clip-path: inset(34% 0 34% 0);
      }

      .glitch-word__layer--c {
        color: rgba(255, 255, 255, 0.55);
        clip-path: inset(62% 0 0 0);
      }

      .glitch-letter {
        display: inline-block;
        position: relative;
        transform-origin: 50% 55%;
        will-change: transform, filter, opacity;
      }

      .glitch-letter--space {
        min-width: 0.34em;
      }

      .is-live-glitch .glitch-word__layer {
        opacity: 1;
      }

      .is-live-glitch .glitch-word__layer--a {
        animation: bimGlitchLayerA 520ms steps(2, end) both;
      }

      .is-live-glitch .glitch-word__layer--b {
        animation: bimGlitchLayerB 520ms steps(2, end) both;
      }

      .is-live-glitch .glitch-word__layer--c {
        animation: bimGlitchLayerC 520ms steps(2, end) both;
      }

      .is-live-glitch .glitch-word__base .glitch-letter {
        animation: bimLetterWarp 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        animation-delay: calc(var(--i, 0) * 8ms);
      }

      .is-live-glitch .glitch-letter--heavy {
        filter: blur(0.35px) contrast(1.18);
      }

      .work-project.is-glitching .work-project__summary {
        filter: contrast(1.08);
      }

      @keyframes bimGlitchLayerA {
        0% {
          transform: translate3d(0, 0, 0);
          opacity: 0;
        }

        14% {
          transform: translate3d(var(--glitch-x1, 7px), var(--glitch-y1, -1px), 0);
          opacity: 0.95;
        }

        36% {
          transform: translate3d(calc(var(--glitch-x1, 7px) * -0.45), 0, 0);
          opacity: 0.6;
        }

        58% {
          transform: translate3d(var(--glitch-x3, 3px), var(--glitch-y2, 2px), 0);
          opacity: 0.9;
        }

        100% {
          transform: translate3d(0, 0, 0);
          opacity: 0;
        }
      }

      @keyframes bimGlitchLayerB {
        0% {
          transform: translate3d(0, 0, 0);
          opacity: 0;
        }

        10% {
          transform: translate3d(var(--glitch-x2, -10px), var(--glitch-y2, 2px), 0);
          opacity: 0.75;
        }

        28% {
          transform: translate3d(calc(var(--glitch-x2, -10px) * -0.35), var(--glitch-y1, -1px), 0);
          opacity: 0.95;
        }

        48% {
          transform: translate3d(var(--glitch-x1, 7px), 0, 0);
          opacity: 0.45;
        }

        100% {
          transform: translate3d(0, 0, 0);
          opacity: 0;
        }
      }

      @keyframes bimGlitchLayerC {
        0% {
          transform: translate3d(0, 0, 0);
          opacity: 0;
        }

        18% {
          transform: translate3d(var(--glitch-x3, 3px), 0, 0);
          opacity: 0.58;
        }

        42% {
          transform: translate3d(var(--glitch-x2, -10px), var(--glitch-y2, 2px), 0);
          opacity: 0.82;
        }

        68% {
          transform: translate3d(calc(var(--glitch-x1, 7px) * -0.5), var(--glitch-y1, -1px), 0);
          opacity: 0.45;
        }

        100% {
          transform: translate3d(0, 0, 0);
          opacity: 0;
        }
      }

      @keyframes bimLetterWarp {
        0% {
          transform: translate3d(0, 0, 0) skew(0deg) rotate(0deg) scale(1);
        }

        18% {
          transform:
            translate3d(calc(var(--warp-x, 0px) * 0.65), var(--warp-y, 0px), 0)
            skew(var(--warp-skew, 0deg))
            rotate(var(--warp-rotate, 0deg))
            scale(var(--warp-scale-x, 1), var(--warp-scale-y, 1));
        }

        38% {
          transform:
            translate3d(calc(var(--warp-x, 0px) * -0.35), calc(var(--warp-y, 0px) * -0.6), 0)
            skew(calc(var(--warp-skew, 0deg) * -0.55))
            rotate(calc(var(--warp-rotate, 0deg) * -0.45))
            scale(1.02, 0.98);
        }

        58% {
          transform:
            translate3d(calc(var(--warp-x, 0px) * 0.18), calc(var(--warp-y, 0px) * 0.35), 0)
            skew(calc(var(--warp-skew, 0deg) * 0.25))
            rotate(calc(var(--warp-rotate, 0deg) * 0.3))
            scale(0.98, 1.02);
        }

        100% {
          transform: translate3d(0, 0, 0) skew(0deg) rotate(0deg) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .is-live-glitch .glitch-word__layer,
        .is-live-glitch .glitch-letter {
          animation: none !important;
        }
      }
    `;

    document.head.appendChild(style);
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function buildGlitchText(el) {
    if (!el || el.dataset.glitchBuilt === "true") return;

    const text = el.textContent.trim();
    if (!text) return;

    el.dataset.text = text;
    el.dataset.glitchBuilt = "true";

    const letters = Array.from(text)
      .map((char, index) => {
        if (char === " ") {
          return `<span class="glitch-letter glitch-letter--space" style="--i:${index}">&nbsp;</span>`;
        }

        return `
          <span class="glitch-letter" style="--i:${index}">
            ${escapeHTML(char)}
          </span>
        `;
      })
      .join("");

    el.innerHTML = `
      <span class="glitch-word__base">${letters}</span>
      <span class="glitch-word__layer glitch-word__layer--a" aria-hidden="true">${letters}</span>
      <span class="glitch-word__layer glitch-word__layer--b" aria-hidden="true">${letters}</span>
      <span class="glitch-word__layer glitch-word__layer--c" aria-hidden="true">${letters}</span>
    `;
  }

  function setLetterWarpVariables(el) {
    if (!el) return;

    const letters = Array.from(
      el.querySelectorAll(".glitch-word__base .glitch-letter:not(.glitch-letter--space)")
    );

    letters.forEach((letter, index) => {
      const direction = index % 2 === 0 ? 1 : -1;
      const strength = 0.7 + (index % 5) * 0.16;

      letter.style.setProperty("--warp-x", `${direction * strength * 1.7}px`);
      letter.style.setProperty("--warp-y", `${direction * -0.55}px`);
      letter.style.setProperty("--warp-skew", `${direction * (3 + index % 4)}deg`);
      letter.style.setProperty("--warp-rotate", `${direction * 1.5}deg`);
      letter.style.setProperty("--warp-scale-x", `${1 + strength * 0.025}`);
      letter.style.setProperty("--warp-scale-y", `${1 - strength * 0.012}`);

      if (index % 4 === 0) {
        letter.classList.add("glitch-letter--heavy");
      } else {
        letter.classList.remove("glitch-letter--heavy");
      }
    });

    el.style.setProperty("--glitch-x1", `${5 + Math.random() * 6}px`);
    el.style.setProperty("--glitch-x2", `${-8 - Math.random() * 7}px`);
    el.style.setProperty("--glitch-x3", `${2 + Math.random() * 4}px`);
    el.style.setProperty("--glitch-y1", `${-1 - Math.random() * 2}px`);
    el.style.setProperty("--glitch-y2", `${1 + Math.random() * 2}px`);
  }

  function triggerProjectGlitch(row) {
    if (prefersReducedMotion) return;

    const name = row.querySelector(".work-project__name");
    if (!name) return;

    buildGlitchText(name);
    setLetterWarpVariables(name);

    window.clearTimeout(glitchTimer);

    row.classList.add("is-glitching");
    name.classList.remove("is-live-glitch");

    name.getBoundingClientRect();

    name.classList.add("is-live-glitch");

    glitchTimer = window.setTimeout(() => {
      name.classList.remove("is-live-glitch");
      row.classList.remove("is-glitching");
    }, 560);
  }

  function buildAllGlitchText() {
    archive.querySelectorAll(".work-project__name").forEach(buildGlitchText);
  }

  /* ==========================================================
     PREVIEW HOVER
  ========================================================== */

  function setupArchiveHover() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));

    if (!rows.length || mobileQuery.matches) return;

    const previewState = new WeakMap();

    function getPreview(row) {
      let state = previewState.get(row);
      if (state) return state;

      const preview = row.querySelector(".work-project__preview");
      if (!preview) return null;

      state = {
        preview,
        currentX: 0,
        currentY: 0,
        targetX: 0,
        targetY: 0,
        raf: null
      };

      previewState.set(row, state);

      return state;
    }

    function renderPreview(row) {
      const state = getPreview(row);
      if (!state) return;

      state.currentX = lerp(state.currentX, state.targetX, 0.18);
      state.currentY = lerp(state.currentY, state.targetY, 0.18);

      state.preview.style.left = `${state.currentX}px`;
      state.preview.style.top = `${state.currentY}px`;
      state.preview.style.right = "auto";

      if (
        Math.abs(state.currentX - state.targetX) > 0.1 ||
        Math.abs(state.currentY - state.targetY) > 0.1
      ) {
        state.raf = window.requestAnimationFrame(() => renderPreview(row));
      } else {
        state.raf = null;
      }
    }

    function showPreview(row, event) {
      const state = getPreview(row);
      if (!state || row.open) return;

      row.classList.add("is-previewing");

      const width = state.preview.offsetWidth || 180;
      const height = state.preview.offsetHeight || 120;

      state.targetX = clamp(
        event.clientX + 28,
        20,
        window.innerWidth - width - 20
      );

      state.targetY = clamp(
        event.clientY - height * 0.45,
        20,
        window.innerHeight - height - 20
      );

      if (!state.currentX) state.currentX = state.targetX;
      if (!state.currentY) state.currentY = state.targetY;

      if (!state.raf) {
        state.raf = window.requestAnimationFrame(() => renderPreview(row));
      }
    }

    function hidePreview(row) {
      const state = getPreview(row);
      if (!state) return;

      row.classList.remove("is-previewing");

      if (state.raf) {
        window.cancelAnimationFrame(state.raf);
        state.raf = null;
      }
    }

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");
      if (!summary) return;

      summary.addEventListener("mouseenter", (event) => {
        triggerProjectGlitch(row);
        showPreview(row, event);
      });

      summary.addEventListener("mousemove", (event) => {
        showPreview(row, event);
      });

      summary.addEventListener("mouseleave", () => {
        hidePreview(row);
      });

      summary.addEventListener("focus", () => {
        const rect = summary.getBoundingClientRect();

        triggerProjectGlitch(row);

        showPreview(row, {
          clientX: rect.right - 160,
          clientY: rect.top + rect.height / 2
        });
      });

      summary.addEventListener("blur", () => {
        hidePreview(row);
      });
    });
  }

  /* ==========================================================
     ARCHIVE CENTER-LINE REVEAL
     Normal scroll. Once only. No pin. No scrub.
  ========================================================== */

  function setupArchiveNoomoReveal() {
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
          id === "workArchiveReveal" ||
          id === "workArchiveFormation" ||
          id === "workArchiveNoomo" ||
          id === "workArchiveCenterLines" ||
          triggerEl === archive
        ) {
          trigger.kill();
        }
      });
    }

    archive.classList.remove("is-forming", "is-formed");

    rows.forEach((row) => {
      row.style.setProperty("--row-line", "0");
      row.style.setProperty("--row-fill", "0");
    });

    if (!gsap || !ScrollTrigger || prefersReducedMotion) {
      archive.classList.add("is-formed");

      rows.forEach((row) => {
        row.style.setProperty("--row-line", "1");
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

    gsap.set(archive, {
      "--archive-reveal": 1,
      "--archive-glow": 0,
      "--archive-top-line": 1
    });

    gsap.set([label, kicker, title, intro].filter(Boolean), {
      autoAlpha: 0,
      y: 22,
      filter: "blur(8px)"
    });

    gsap.set(title, {
      y: 34,
      filter: "blur(14px)"
    });

    rows.forEach((row, index) => {
      gsap.set(row, {
        "--row-line": 0,
        "--row-fill": 0,
        autoAlpha: 1
      });

      gsap.set(rowPieces[index], {
        autoAlpha: 0,
        y: 24,
        filter: "blur(10px)"
      });
    });

    const tl = gsap.timeline({
      defaults: {
        ease: "power3.out"
      },
      scrollTrigger: {
        id: "workArchiveCenterLines",
        trigger: archive,
        start: "top 68%",
        once: true,
        toggleActions: "play none none none"
      }
    });

    tl.add(() => {
      archive.classList.add("is-forming");
    }, 0);

    tl.to(
      [label, kicker].filter(Boolean),
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.7,
        stagger: 0.07
      },
      0.05
    );

    tl.to(
      title,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.05,
        ease: "power4.out"
      },
      0.12
    );

    tl.to(
      intro,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8
      },
      0.36
    );

    rows.forEach((row, index) => {
      const start = 0.72 + index * 0.14;

      tl.to(
        row,
        {
          "--row-line": 1,
          duration: 0.9,
          ease: "power2.inOut"
        },
        start
      );

      tl.to(
        rowPieces[index],
        {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.62,
          stagger: 0.035,
          ease: "power4.out"
        },
        start + 0.16
      );
    });

    tl.add(() => {
      archive.classList.remove("is-forming");
      archive.classList.add("is-formed");
    });
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
    injectGlitchStyles();
    cleanOldStates();
    injectTrustBridge();
    closeAllArchiveProjects();
    setupTrustCards();
    setupArchiveDetails();
    setupFocusWords();
    setupArchiveDetailScrollGuards();
    buildAllGlitchText();
    setupArchiveHover();
    setupArchiveNoomoReveal();
    setupImageFallbacks();

    if (window.ScrollTrigger) {
      window.ScrollTrigger.refresh();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
