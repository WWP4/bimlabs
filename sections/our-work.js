/* ==========================================================
   BIM LABS — OUR WORK SAFE VERSION
   - Injects trust cards before archive
   - Does NOT delete other sections
   - Does NOT touch process/testimonials
   - Does NOT body lock
   - Does NOT transform the whole archive shell
========================================================== */

(() => {
  "use strict";

  const archive = document.querySelector(".work-archive");
  if (!archive) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileQuery = window.matchMedia("(max-width: 900px)");

  const projects = [
    {
      number: "01",
      client: "Wonder World Playsets",
      type: "Portal / CRM / Quote Flow"
    },
    {
      number: "02",
      client: "Momentum Athlete",
      type: "Web / Courses / Stripe"
    },
    {
      number: "03",
      client: "Orynd AI",
      type: "Brand / Product / UX"
    },
    {
      number: "04",
      client: "BIM Labs Studio",
      type: "3D / Visual Tool / UX"
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

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getScrollProgress(section) {
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const travel = Math.max(section.offsetHeight - viewport, 1);

    return clamp(-rect.top / travel, 0, 1);
  }

  /* ==========================================================
     TRUST SECTION
  ========================================================== */

  function injectTrustSection() {
    const existingSafeTrust = document.querySelector("[data-work-trust-section]");
    if (existingSafeTrust) return existingSafeTrust;

    const section = document.createElement("section");
    section.className = "work-trust";
    section.dataset.workTrustSection = "true";
    section.setAttribute("aria-label", "Client trust");

    const cards = projects
      .map((project) => {
        return `
          <article class="work-trust-card" data-work-trust-card>
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

          <h2>Real work should feel clear before it ever feels loud.</h2>

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
    return section;
  }

  function setupTrustCards(section) {
    const cards = Array.from(section.querySelectorAll("[data-work-trust-card]"));
    const copy = section.querySelector(".work-trust__copy");

    if (!cards.length) return;

    if (prefersReducedMotion || mobileQuery.matches) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.transform = "none";
      });

      return;
    }

    const settings = [
      { sx: 116, mx: 48, ex: -54, sy: 24, my: 4, ey: 16, sr: 8, mr: -2, er: -9, d: 0 },
      { sx: 134, mx: 60, ex: -42, sy: 15, my: -5, ey: 9, sr: 5, mr: 1, er: -6, d: 0.06 },
      { sx: 152, mx: 72, ex: -30, sy: 18, my: -7, ey: 10, sr: 3, mr: -1, er: -5, d: 0.12 },
      { sx: 170, mx: 84, ex: -18, sy: 26, my: 3, ey: 17, sr: 7, mr: 2, er: -3, d: 0.18 }
    ];

    let target = 0;
    let current = 0;
    let raf = null;

    function bezier(a, b, c, t) {
      return lerp(lerp(a, b, t), lerp(b, c, t), t);
    }

    function render(progress) {
      cards.forEach((card, index) => {
        const s = settings[index] || settings[settings.length - 1];
        const raw = clamp((progress - s.d) / 0.9, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier(s.sx, s.mx, s.ex, t);
        const y = bezier(s.sy, s.my, s.ey, t);
        const r = bezier(s.sr, s.mr, s.er, t);
        const float = Math.sin(progress * Math.PI * 2 + index * 0.8) * 0.18;

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(20 + index);
        card.style.transform = `
          translate3d(${x}vw, calc(${y}vh + ${float}rem), ${index * 14}px)
          rotate(${r}deg)
        `;
      });

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.62, progress));
        copy.style.transform = `translate3d(0, ${lerp(0, -3.5, progress)}vh, 0)`;
      }
    }

    function tick() {
      current = lerp(current, target, 0.055);
      render(current);

      if (Math.abs(target - current) > 0.0005) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function update() {
      target = getScrollProgress(section);

      if (!raf) {
        raf = window.requestAnimationFrame(tick);
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    target = getScrollProgress(section);
    current = target;
    render(current);
  }

  /* ==========================================================
     ARCHIVE ROWS
  ========================================================== */

  function setupArchiveRows() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));
    const summaries = Array.from(archive.querySelectorAll(".work-project__summary"));

    if (!rows.length) return;

    function setActive(row) {
      rows.forEach((item) => {
        item.classList.toggle("is-active", item === row);
      });
    }

    function closeOthers(activeRow) {
      rows.forEach((row) => {
        if (row !== activeRow) row.removeAttribute("open");
      });
    }

    rows.forEach((row, index) => {
      const summary = row.querySelector(".work-project__summary");
      if (!summary) return;

      if (row.hasAttribute("open")) setActive(row);

      summary.addEventListener("click", () => {
        const willOpen = !row.hasAttribute("open");

        window.requestAnimationFrame(() => {
          if (willOpen) {
            closeOthers(row);
            setActive(row);
          } else {
            row.classList.remove("is-active");
          }
        });
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

  function revealArchiveRows() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));

    rows.forEach((row, index) => {
      window.setTimeout(() => {
        row.classList.add("is-visible");
      }, prefersReducedMotion ? 0 : index * 80);
    });
  }

  function setupArchiveScrollFeel() {
    const rows = Array.from(archive.querySelectorAll(".work-project"));
    const header = archive.querySelector(".work-archive__header");

    if (!rows.length || prefersReducedMotion || mobileQuery.matches) {
      revealArchiveRows();
      return;
    }

    let target = 0;
    let current = 0;
    let raf = null;

    function render(progress) {
      const activeIndex = Math.round(progress * (rows.length - 1));

      rows.forEach((row, index) => {
        const distance = Math.abs(index - activeIndex);

        row.classList.add("is-visible");
        row.style.opacity = index === activeIndex ? "1" : distance === 1 ? "0.62" : "0.42";
        row.style.transform = `translate3d(0, ${distance * 3}px, 0)`;
      });

      if (header) {
        header.style.opacity = String(lerp(1, 0.78, progress));
        header.style.transform = `translate3d(0, ${lerp(0, -10, progress)}px, 0)`;
      }
    }

    function tick() {
      current = lerp(current, target, 0.07);
      render(current);

      if (Math.abs(target - current) > 0.0005) {
        raf = window.requestAnimationFrame(tick);
      } else {
        raf = null;
      }
    }

    function update() {
      target = getScrollProgress(archive);

      if (!raf) {
        raf = window.requestAnimationFrame(tick);
      }
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    target = getScrollProgress(archive);
    current = target;
    render(current);
  }

  function cleanupOnlyArchiveDrawerStuff() {
    archive.classList.remove("has-open-detail");

    const oldDrawerInsideArchive = archive.querySelector(".work-detail");
    if (oldDrawerInsideArchive) oldDrawerInsideArchive.remove();

    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");
  }

  function init() {
    cleanupOnlyArchiveDrawerStuff();

    const trustSection = injectTrustSection();

    setupTrustCards(trustSection);
    setupArchiveRows();
    setupArchiveScrollFeel();

    archive.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
