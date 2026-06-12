/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Clean JS rebuild
   - Flying trust-card section
   - Archive details with <details>/<summary>
   - Noomo-style pinned archive reveal
   - Mouse-attached preview
   - Working physical letter glitch on hover/focus
   - No drawer
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
     CLEAN OLD / DUPLICATE STATES
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
      "is-forming",
      "is-formed",
      "is-previewing"
    );
  }

  /* ==========================================================
     TRUST BRIDGE — INJECT ONE FLYING CARD SECTION
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

  /* ==========================================================
     TRUST BRIDGE — FLYING CARD MOTION
  ========================================================== */

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
   ARCHIVE DETAILS — CLEAN SEAMLESS ACCORDION
   Replace old setupArchiveDetails + setupArchiveDetailScrollGuards
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

    item.classList.remove("is-opening", "is-closing", "is-open");

    const summary = item.querySelector(".work-project__summary");
    if (summary) summary.setAttribute("aria-expanded", "false");

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

    /* Do not let native details-name behavior fight the JS accordion */
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
    } else {
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.overflow = "hidden";
      panel.style.transform = "translate3d(0, -0.35rem, 0)";
    }

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (item.open && !item.classList.contains("is-closing")) {
        closeProject(item);
      } else {
        openProject(item);
      }
    });

    summary.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;

      event.preventDefault();

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

/* Keep this function so your existing init() does not break */
function setupArchiveDetailScrollGuards() {
  return;
}




   
function closeAllArchiveProjects() {
  const details = Array.from(archive.querySelectorAll(".work-project"));

  details.forEach((item) => {
    if (!item || item.tagName.toLowerCase() !== "details") return;

    const summary = item.querySelector(".work-project__summary");
    const panel = item.querySelector(
      ".work-project__details, .work-project__detail, .work-project__content, .work-project__body, .work-project__panel, .work-project__detail-scroll"
    );

    item.removeAttribute("open");
    item.open = false;
    item.classList.remove(
      "is-open",
      "is-opening",
      "is-closing",
      "is-previewing",
      "is-glitching"
    );

    if (summary) {
      summary.setAttribute("aria-expanded", "false");
    }

    if (panel) {
      window.clearTimeout(panel._workPanelTimer);
      panel.style.height = "0px";
      panel.style.opacity = "0";
      panel.style.transform = "translate3d(0, -0.45rem, 0)";
      panel.style.paddingBottom = "0px";
      panel.scrollTop = 0;
    }
  });

  archive.classList.remove("has-open-project");
}











  

  /* ==========================================================
     GLITCH STYLE INJECTION
     Keeps the effect self-contained so the file does not crash
     if the CSS was not pasted yet.
  ========================================================== */

  function injectGlitchStyles() {
    if (document.getElementById("bim-work-glitch-styles")) return;

    const style = document.createElement("style");
    style.id = "bim-work-glitch-styles";

    style.textContent = `
      .work-project__name,
      .work-project__number {
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

  /* ==========================================================
     PHYSICAL TEXT SIGNAL GLITCH
     Same text. Real letters warp. No random symbols.
  ========================================================== */

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

  function updateGlitchText(el, text) {
    if (!el) return;

    const cleanText = String(text || "").trim();

    el.dataset.text = cleanText;
    el.dataset.glitchBuilt = "false";
    el.textContent = cleanText;

    buildGlitchText(el);
  }

  function setLetterWarpVariables(el) {
    if (!el) return;

    const letters = Array.from(
      el.querySelectorAll(".glitch-letter:not(.glitch-letter--space)")
    );

    letters.forEach((letter) => {
      const force = Math.random();

      const x = (Math.random() * 18 - 9).toFixed(2);
      const y = (Math.random() * 6 - 3).toFixed(2);
      const skew = (Math.random() * 22 - 11).toFixed(2);
      const rotate = (Math.random() * 5 - 2.5).toFixed(2);
      const scaleX = (0.86 + Math.random() * 0.34).toFixed(2);
      const scaleY = (0.9 + Math.random() * 0.22).toFixed(2);

      letter.style.setProperty("--warp-x", `${x}px`);
      letter.style.setProperty("--warp-y", `${y}px`);
      letter.style.setProperty("--warp-skew", `${skew}deg`);
      letter.style.setProperty("--warp-rotate", `${rotate}deg`);
      letter.style.setProperty("--warp-scale-x", scaleX);
      letter.style.setProperty("--warp-scale-y", scaleY);

      const raw = letter.textContent.trim().toLowerCase();
      const isRoundOrStructural = ["o", "c", "d", "a", "r", "p", "q", "0"].includes(raw);

      letter.classList.toggle(
        "glitch-letter--heavy",
        isRoundOrStructural || force > 0.68
      );
    });
  }

  function triggerSignalGlitch(el) {
    if (!el || prefersReducedMotion) return;

    buildGlitchText(el);
    setLetterWarpVariables(el);

    el.style.setProperty("--glitch-x1", `${(Math.random() * 16 - 8).toFixed(2)}px`);
    el.style.setProperty("--glitch-x2", `${(Math.random() * 24 - 12).toFixed(2)}px`);
    el.style.setProperty("--glitch-x3", `${(Math.random() * 10 - 5).toFixed(2)}px`);
    el.style.setProperty("--glitch-y1", `${(Math.random() * 3 - 1.5).toFixed(2)}px`);
    el.style.setProperty("--glitch-y2", `${(Math.random() * 5 - 2.5).toFixed(2)}px`);

    el.classList.remove("is-live-glitch");

    void el.offsetWidth;

    el.classList.add("is-live-glitch");

    window.setTimeout(() => {
      el.classList.remove("is-live-glitch");
    }, 520);
  }

  function triggerProjectGlitch(button) {
    if (!button || prefersReducedMotion) return;

    const name = button.querySelector(".work-project__name");
    const number = button.querySelector(".work-project__number");

    button.classList.remove("is-glitching");

    void button.offsetWidth;

    button.classList.add("is-glitching");

    triggerSignalGlitch(name);
    triggerSignalGlitch(number);

    window.clearTimeout(glitchTimer);

    glitchTimer = window.setTimeout(() => {
      button.classList.remove("is-glitching");
    }, 560);
  }

  function buildAllGlitchText() {
    const targets = archive.querySelectorAll(
      ".work-project__name, .work-project__number"
    );

    targets.forEach((target) => buildGlitchText(target));
  }

  function triggerDrawerGlitch() {
    /*
      Drawer was removed from this file.
      Keep this as a safe no-op so older HTML/buttons cannot crash the script.
    */
  }

  /* ==========================================================
     ARCHIVE — HOVER PREVIEW + GLITCH
  ========================================================== */

  function setupArchiveHover() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));
    if (!rows.length) return;

    let activePreview = null;
    let activeRow = null;
    let mouseX = window.innerWidth * 0.68;
    let mouseY = window.innerHeight * 0.42;
    let currentX = mouseX;
    let currentY = mouseY;
    let raf = null;

    function movePreview() {
      currentX = lerp(currentX, mouseX, 0.16);
      currentY = lerp(currentY, mouseY, 0.16);

      if (activePreview) {
        activePreview.style.transform = `
          translate3d(${currentX}px, ${currentY}px, 0)
          translate3d(1.2rem, -46%, 0)
          rotate(-1.25deg)
          scale(1)
        `;
      }

      if (
        activePreview &&
        (Math.abs(currentX - mouseX) > 0.1 ||
          Math.abs(currentY - mouseY) > 0.1)
      ) {
        raf = window.requestAnimationFrame(movePreview);
      } else {
        raf = null;
      }
    }

    function requestMove() {
      if (!raf) {
        raf = window.requestAnimationFrame(movePreview);
      }
    }

    function showPreview(row, event) {
      if (mobileQuery.matches) return;

      const preview = row.querySelector(".work-project__preview");
      if (!preview) return;

      if (activeRow && activeRow !== row) {
        activeRow.classList.remove("is-previewing");
      }

      if (activePreview && activePreview !== preview) {
        activePreview.classList.remove("is-visible");
        activePreview.style.opacity = "0";
        activePreview.style.visibility = "hidden";
      }

      activeRow = row;
      activePreview = preview;

      mouseX = event.clientX;
      mouseY = event.clientY;
      currentX = event.clientX;
      currentY = event.clientY;

      row.classList.add("is-previewing");
      preview.classList.add("is-visible");

      preview.style.opacity = "1";
      preview.style.visibility = "visible";
      preview.style.pointerEvents = "none";
      preview.style.transform = `
        translate3d(${currentX}px, ${currentY}px, 0)
        translate3d(1.2rem, -46%, 0)
        rotate(-1.25deg)
        scale(1)
      `;

      requestMove();
    }

    function hidePreview(row) {
      const preview = row.querySelector(".work-project__preview");

      row.classList.remove("is-previewing");

      if (preview) {
        preview.classList.remove("is-visible");
        preview.style.opacity = "0";
        preview.style.visibility = "hidden";
        preview.style.transform = `
          translate3d(${currentX}px, ${currentY}px, 0)
          translate3d(1.2rem, -42%, 0)
          rotate(-2deg)
          scale(0.94)
        `;
      }

      if (activeRow === row) activeRow = null;
      if (activePreview === preview) activePreview = null;
    }

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");
      const preview = row.querySelector(".work-project__preview");

      if (!summary) return;

      if (preview) {
        preview.style.opacity = "0";
        preview.style.visibility = "hidden";
        preview.style.pointerEvents = "none";
      }

      summary.addEventListener("mouseenter", (event) => {
        triggerProjectGlitch(row);
        showPreview(row, event);
      });

      summary.addEventListener("mousemove", (event) => {
        if (mobileQuery.matches) return;

        mouseX = event.clientX;
        mouseY = event.clientY;

        requestMove();
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

      summary.addEventListener("click", () => {
        triggerProjectGlitch(row);
      });
    });
  }






/* ==========================================================
   ARCHIVE — STABLE ONE-TIME REVEAL
   No pin. No scrub. No de-animation. No scroll lock.
========================================================== */

/* ==========================================================
   ARCHIVE — NOOMO-STYLE LINE REVEAL
   Normal scroll. No pin. No scrub trap.
   Lines grow from center outward.
========================================================== */

function setupArchiveNoomoReveal() {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  const shell = archive.querySelector(".work-archive__shell");
  const header = archive.querySelector(".work-archive__header");
  const label = archive.querySelector(".work-archive__label");
  const kicker = archive.querySelector(".work-archive__kicker");
  const title = archive.querySelector(".work-archive__title");
  const intro = archive.querySelector(".work-archive__intro");
  const rows = Array.from(archive.querySelectorAll(".work-project"));

  if (!shell || !rows.length) return;

  /* kill old archive triggers only */
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
