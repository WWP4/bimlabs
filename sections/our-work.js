/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Trust bridge + clean archive
   - Injects section before archive
   - Flying cards on scroll
   - Clean <details> archive rows
   - No drawer
   - No overlay
   - No body scroll lock
========================================================== */

(() => {
  "use strict";

  const archive = document.querySelector(".work-archive");
  if (!archive) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  const projects = [
    {
      number: "01",
      client: "Wonder World Playsets",
      title: "Wonder World Portal",
      type: "Portal / CRM / Quote Flow",
      year: "2024"
    },
    {
      number: "02",
      client: "Momentum Athlete",
      title: "Momentum Athlete",
      type: "Web / Courses / Stripe",
      year: "2024"
    },
    {
      number: "03",
      client: "Orynd AI",
      title: "Orynd AI",
      type: "Brand / Product / UX",
      year: "2023"
    },
    {
      number: "04",
      client: "BIM Labs Studio",
      title: "3D Install Tool",
      type: "3D / Visual Tool / UX",
      year: "2024"
    }
  ];

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

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

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  /* ==========================================================
     TRUST BRIDGE INJECTION
  ========================================================== */

  function injectTrustBridge() {
    const oldTrust =
      document.querySelector(".bim-trust") ||
      document.querySelector(".work-trust");

    if (oldTrust) oldTrust.remove();

    const section = document.createElement("section");
    section.className = "work-trust";
    section.setAttribute("aria-label", "Client trust");

    const cards = projects
      .map((project) => {
        return `
          <article class="work-trust-card" data-trust-card>
            <span>${escapeHtml(project.number)}</span>
            <strong>${escapeHtml(project.client)}</strong>
            <p>${escapeHtml(project.type)}</p>
          </article>
        `;
      })
      .join("");

    section.innerHTML = `
      <div class="work-trust__sticky">
        <div class="work-trust__copy">
          <p class="work-trust__kicker">Client trust</p>

          <h2>
            Real work should feel clear before it ever feels loud.
          </h2>

          <p>
            Before the archive, project signals move through the frame —
            proof that the work is built around systems, outcomes, and trust.
          </p>
        </div>

        <div class="work-trust__stage" aria-hidden="true">
          ${cards}
        </div>
      </div>
    `;

    archive.parentNode.insertBefore(section, archive);
  }

  /* ==========================================================
     TRUST CARD SCROLL ANIMATION
  ========================================================== */

  function setupTrustCards() {
    const section = document.querySelector(".work-trust");
    const cards = Array.from(document.querySelectorAll("[data-trust-card]"));
    const copy = document.querySelector(".work-trust__copy");

    if (!section || !cards.length) return;

    if (prefersReducedMotion || mobileQuery.matches) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.transform = "none";
      });

      if (copy) {
        copy.style.opacity = "";
        copy.style.transform = "";
      }

      return;
    }

    const cardSettings = [
      {
        startX: 118,
        midX: 50,
        endX: -54,
        startY: 23,
        midY: 2,
        endY: 16,
        startRotate: 8,
        midRotate: -2,
        endRotate: -9,
        delay: 0,
        span: 0.9,
        depth: 0,
        scale: 1
      },
      {
        startX: 136,
        midX: 62,
        endX: -42,
        startY: 14,
        midY: -6,
        endY: 8,
        startRotate: 5,
        midRotate: 1,
        endRotate: -6,
        delay: 0.06,
        span: 0.9,
        depth: 26,
        scale: 1.02
      },
      {
        startX: 154,
        midX: 74,
        endX: -30,
        startY: 18,
        midY: -8,
        endY: 10,
        startRotate: 3,
        midRotate: -1,
        endRotate: -5,
        delay: 0.12,
        span: 0.9,
        depth: 42,
        scale: 1.035
      },
      {
        startX: 172,
        midX: 86,
        endX: -18,
        startY: 26,
        midY: 4,
        endY: 17,
        startRotate: 7,
        midRotate: 2,
        endRotate: -3,
        delay: 0.18,
        span: 0.9,
        depth: 14,
        scale: 1.01
      }
    ];

    let targetProgress = 0;
    let currentProgress = 0;
    let raf = null;

    function getProgress() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);

      return clamp(-rect.top / travel, 0, 1);
    }

    function render(progress) {
      cards.forEach((card, index) => {
        const setting = cardSettings[index] || cardSettings[cardSettings.length - 1];

        const raw = clamp((progress - setting.delay) / setting.span, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier3(setting.startX, setting.midX, setting.endX, t);
        const y = bezier3(setting.startY, setting.midY, setting.endY, t);
        const rotate = bezier3(
          setting.startRotate,
          setting.midRotate,
          setting.endRotate,
          t
        );

        const float = Math.sin(progress * Math.PI * 2 + index * 0.9) * 0.18;
        const opacity = raw <= 0.02 ? lerp(0.72, 1, raw / 0.02) : 1;

        card.style.opacity = String(opacity);
        card.style.visibility = "visible";
        card.style.zIndex = String(20 + index);
        card.style.transform = `
          translate3d(${x}vw, calc(${y}vh + ${float}rem), ${setting.depth}px)
          rotate(${rotate}deg)
          scale(${setting.scale})
        `;
      });

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.58, progress));
        copy.style.transform = `
          translate3d(0, ${lerp(0, -4.5, progress)}vh, 0)
          scale(${lerp(1, 0.985, progress)})
        `;
      }
    }

    function animate() {
      currentProgress = lerp(currentProgress, targetProgress, 0.055);
      render(currentProgress);

      if (Math.abs(targetProgress - currentProgress) > 0.0005) {
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
     ARCHIVE DETAILS BEHAVIOR
  ========================================================== */

  function setupArchiveRows() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));
    const summaries = Array.from(archive.querySelectorAll(".work-project__summary"));

    if (!rows.length) return;

    function setActiveRow(row) {
      rows.forEach((item) => {
        const isActive = item === row;
        item.classList.toggle("is-active", isActive);
      });
    }

    function closeOtherRows(activeRow) {
      rows.forEach((row) => {
        if (row !== activeRow) {
          row.removeAttribute("open");
        }
      });
    }

    rows.forEach((row, index) => {
      const summary = row.querySelector(".work-project__summary");
      if (!summary) return;

      if (row.hasAttribute("open")) {
        setActiveRow(row);
      }

      summary.addEventListener("click", () => {
        const willOpen = !row.hasAttribute("open");

        window.requestAnimationFrame(() => {
          if (willOpen) {
            closeOtherRows(row);
            setActiveRow(row);
          } else {
            row.classList.remove("is-active");
          }
        });
      });

      summary.addEventListener("mouseenter", () => {
        if (mobileQuery.matches) return;
        row.classList.add("is-hovering");
      });

      summary.addEventListener("mouseleave", () => {
        row.classList.remove("is-hovering");
      });

      summary.addEventListener("focus", () => {
        if (mobileQuery.matches) return;
        row.classList.add("is-hovering");
      });

      summary.addEventListener("blur", () => {
        row.classList.remove("is-hovering");
      });

      summary.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

        event.preventDefault();

        const direction = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex = (index + direction + summaries.length) % summaries.length;
        summaries[nextIndex]?.focus();
      });
    });
  }

  /* ==========================================================
     ARCHIVE SCROLL LOCK FEEL
     Uses sticky + progress. Does not freeze body scroll.
  ========================================================== */

  function setupArchiveScroll() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));
    const header = archive.querySelector(".work-archive__header");
    const shell = archive.querySelector(".work-archive__shell");

    if (!rows.length || prefersReducedMotion || mobileQuery.matches) {
      rows.forEach((row) => row.classList.add("is-visible"));
      return;
    }

    let targetProgress = 0;
    let currentProgress = 0;
    let raf = null;

    function getProgress() {
      const rect = archive.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(archive.offsetHeight - viewport, 1);

      return clamp(-rect.top / travel, 0, 1);
    }

    function render(progress) {
      const activeIndex = Math.round(progress * (rows.length - 1));

      rows.forEach((row, index) => {
        const distance = Math.abs(index - activeIndex);

        row.classList.add("is-visible");

        if (!row.matches(":hover") && document.activeElement !== row.querySelector("summary")) {
          row.style.opacity =
            index === activeIndex ? "1" : distance === 1 ? "0.58" : "0.36";

          row.style.transform = `
            translate3d(0, ${distance * 4}px, 0)
          `;
        }
      });

      if (header) {
        header.style.opacity = String(lerp(1, 0.72, progress));
        header.style.transform = `translate3d(0, ${lerp(0, -16, progress)}px, 0)`;
      }

      if (shell) {
        shell.style.transform = `translate3d(0, ${lerp(8, -8, progress)}px, 0)`;
      }
    }

    function animate() {
      currentProgress = lerp(currentProgress, targetProgress, 0.07);
      render(currentProgress);

      if (Math.abs(targetProgress - currentProgress) > 0.0005) {
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
     CLEANUP OLD STATES
  ========================================================== */

  function cleanupOldWorkStates() {
    archive.classList.remove("has-open-detail");

    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");

    const oldDrawer = archive.querySelector(".work-detail");
    if (oldDrawer) oldDrawer.remove();

    const oldInjectedTrust = document.querySelector(".bim-trust");
    if (oldInjectedTrust) oldInjectedTrust.remove();
  }

  function init() {
    cleanupOldWorkStates();
    injectTrustBridge();
    setupTrustCards();
    setupArchiveRows();
    setupArchiveScroll();

    archive.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
