/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Clean rebuild for current button + drawer HTML
   - No details/summary logic
   - No removed drawer logic
   - No undefined functions
   - Mouse-attached preview
   - Right project drawer
   - Physical same-text letter glitch
========================================================== */

(() => {
  "use strict";

  const projects = [
    {
      number: "01",
      type: "Client Portal",
      year: "2024",
      title: "Wonder World Portal",
      description:
        "A private operating layer built to organize quotes, products, lead flow, installer coordination, and customer-facing resources.",
      constraint:
        "Sales, quotes, product information, and project coordination were scattered across disconnected tools.",
      solution:
        "We created a cleaner internal system that helped the team manage quote requests, project information, products, and customer resources in one place.",
      result:
        "A more organized digital operating layer that made the sales and project planning process easier to understand, manage, and present.",
      services: [
        "Client portal architecture",
        "Product and quote system",
        "Installer finder workflow",
        "CRM and internal dashboard",
        "Frontend design and development"
      ],
      review:
        "BIM Labs Studio helped us turn a scattered sales process into a cleaner system.",
      client: "Wonder World Playsets",
      role: "Commercial playground distributor"
    },
    {
      number: "02",
      type: "Sports Platform",
      year: "2024",
      title: "Momentum Athlete",
      description:
        "A sharper digital platform for athlete performance, training resources, course access, and brand presentation.",
      constraint:
        "Momentum Athlete needed the platform to feel more serious, structured, and easier for athletes and partners to understand.",
      solution:
        "We shaped a cleaner experience with stronger hierarchy, clearer presentation, and a more polished digital direction.",
      result:
        "The platform became easier to understand and felt more credible from the first impression.",
      services: [
        "Platform experience direction",
        "Course system structure",
        "Landing page design",
        "Stripe payment flow",
        "Frontend build support"
      ],
      review:
        "The platform finally felt clear, premium, and easier to present to partners.",
      client: "Momentum Athlete",
      role: "Athlete performance platform"
    },
    {
      number: "03",
      type: "AI Platform",
      year: "2023",
      title: "Orynd AI",
      description:
        "A focused AI product presence built around clarity, positioning, and interface structure.",
      constraint:
        "The product idea was complex and needed to feel credible, clear, and easier to trust without overwhelming the user.",
      solution:
        "We simplified the product narrative and shaped the interface around positioning, trust, and direct next steps.",
      result:
        "The platform became easier to explain and more ready for real users.",
      services: [
        "AI product positioning",
        "Brand direction",
        "Website interface",
        "Product narrative",
        "Conversion-focused layout"
      ],
      review:
        "The site made the product easier to explain without making the idea feel smaller.",
      client: "Orynd AI",
      role: "AI platform"
    },
    {
      number: "04",
      type: "Fintech Platform",
      year: "2023",
      title: "CashFlowSwami",
      description:
        "A focused fintech-facing web experience built around trust, simple messaging, and a cleaner path from attention to action.",
      constraint:
        "The offer needed stronger digital credibility and a clearer path from first impression to understanding the service.",
      solution:
        "We created a cleaner presentation layer with simpler messaging, stronger interface direction, and a more intentional conversion path.",
      result:
        "The site made the business feel more legitimate, easier to trust, and easier to present.",
      services: [
        "Landing page strategy",
        "Fintech brand presentation",
        "Interface design",
        "Lead path structure",
        "Frontend development"
      ],
      review:
        "The site helped the offer feel real, polished, and ready to show people.",
      client: "CashFlowSwami",
      role: "Fintech platform"
    }
  ];

  const archive = document.querySelector(".work-archive");
  if (!archive) return;

  const rows = Array.from(archive.querySelectorAll("[data-work-project]"));
  const drawer = archive.querySelector(".work-detail");

  const closeBtn = archive.querySelector(".work-detail__close");
  const prevBtn = archive.querySelector("[data-work-prev]");
  const nextBtn = archive.querySelector("[data-work-next]");

  const numberEl = archive.querySelector("[data-work-detail-number]");
  const typeEl = archive.querySelector("[data-work-detail-type]");
  const yearEl = archive.querySelector("[data-work-detail-year]");
  const titleEl = archive.querySelector("[data-work-detail-title]");
  const descriptionEl = archive.querySelector("[data-work-detail-description]");
  const constraintEl = archive.querySelector("[data-work-detail-constraint]");
  const solutionEl = archive.querySelector("[data-work-detail-solution]");
  const resultEl = archive.querySelector("[data-work-detail-result]");
  const servicesEl = archive.querySelector("[data-work-detail-services]");
  const reviewEl = archive.querySelector("[data-work-detail-review]");
  const clientEl = archive.querySelector("[data-work-detail-client]");
  const roleEl = archive.querySelector("[data-work-detail-role]");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobileQuery = window.matchMedia("(max-width: 900px)");

  let activeIndex = 0;
  let drawerOpen = false;
  let changeTimer = null;
  let previewRaf = null;
  let activePreview = null;
  let activeRow = null;
  let mouseX = 0;
  let mouseY = 0;
  let currentX = 0;
  let currentY = 0;

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function escapeHTML(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text || "";
    el.dataset.glitchBuilt = "false";
  }

  function lockPage() {
    document.documentElement.classList.add("work-drawer-lock");
    document.body.classList.add("work-drawer-lock");
  }

  function unlockPage() {
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");
  }

  /* ==========================================================
     PHYSICAL SAME-TEXT LETTER GLITCH
  ========================================================== */

  function buildGlitchText(el) {
    if (!el || el.dataset.glitchBuilt === "true") return;

    const text = (el.dataset.text || el.textContent || "").trim();
    if (!text) return;

    el.dataset.text = text;
    el.dataset.glitchBuilt = "true";

    const letters = Array.from(text)
      .map((char, index) => {
        if (char === " ") {
          return `<span class="glitch-letter glitch-letter--space" style="--i:${index}">&nbsp;</span>`;
        }

        return `<span class="glitch-letter" style="--i:${index}">${escapeHTML(char)}</span>`;
      })
      .join("");

    el.innerHTML = `
      <span class="glitch-word__base">${letters}</span>
      <span class="glitch-word__layer glitch-word__layer--a" aria-hidden="true">${letters}</span>
      <span class="glitch-word__layer glitch-word__layer--b" aria-hidden="true">${letters}</span>
      <span class="glitch-word__layer glitch-word__layer--c" aria-hidden="true">${letters}</span>
    `;
  }

  function setWarpVariables(el) {
    if (!el) return;

    const letters = Array.from(
      el.querySelectorAll(".glitch-letter:not(.glitch-letter--space)")
    );

    letters.forEach((letter) => {
      const raw = letter.textContent.trim().toLowerCase();
      const isRound = ["o", "c", "d", "a", "r", "p", "q", "0"].includes(raw);
      const heavy = isRound || Math.random() > 0.66;

      letter.classList.toggle("glitch-letter--heavy", heavy);
      letter.style.setProperty("--warp-x", `${(Math.random() * 20 - 10).toFixed(2)}px`);
      letter.style.setProperty("--warp-y", `${(Math.random() * 7 - 3.5).toFixed(2)}px`);
      letter.style.setProperty("--warp-skew", `${(Math.random() * 24 - 12).toFixed(2)}deg`);
      letter.style.setProperty("--warp-rotate", `${(Math.random() * 6 - 3).toFixed(2)}deg`);
      letter.style.setProperty("--warp-scale-x", (0.84 + Math.random() * 0.38).toFixed(2));
      letter.style.setProperty("--warp-scale-y", (0.88 + Math.random() * 0.24).toFixed(2));
    });
  }

  function triggerGlitch(el) {
    if (!el || prefersReducedMotion) return;

    buildGlitchText(el);
    setWarpVariables(el);

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
    }, 560);
  }

  function prepareGlitchTargets() {
    rows.forEach((row) => {
      buildGlitchText(row.querySelector(".work-project__number"));
      buildGlitchText(row.querySelector(".work-project__name"));
    });

    buildGlitchText(titleEl);
    buildGlitchText(reviewEl);
  }

  /* ==========================================================
     PROJECT RENDERING
  ========================================================== */

  function renderServices(items = []) {
    if (!servicesEl) return;

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      fragment.appendChild(li);
    });

    servicesEl.replaceChildren(fragment);
  }

  function setActiveRow(index) {
    activeIndex = clampIndex(index);
    archive.dataset.workActive = String(activeIndex);

    rows.forEach((row, rowIndex) => {
      const isActive = rowIndex === activeIndex;
      row.classList.toggle("is-active", isActive);
      row.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
    });
  }

  function renderProject(index) {
    const safeIndex = clampIndex(index);
    const project = projects[safeIndex];
    if (!project) return;

    setActiveRow(safeIndex);

    setText(numberEl, project.number);
    setText(typeEl, project.type);
    setText(yearEl, project.year);
    setText(titleEl, project.title);
    setText(descriptionEl, project.description);
    setText(constraintEl, project.constraint);
    setText(solutionEl, project.solution);
    setText(resultEl, project.result);
    setText(reviewEl, `“${project.review}”`);
    setText(clientEl, project.client);
    setText(roleEl, project.role);

    renderServices(project.services);

    buildGlitchText(titleEl);
    buildGlitchText(reviewEl);
  }

  function animateDrawerChange() {
    if (!drawer || prefersReducedMotion) return;

    drawer.classList.remove("is-changing");
    void drawer.offsetWidth;
    drawer.classList.add("is-changing");

    window.clearTimeout(changeTimer);
    changeTimer = window.setTimeout(() => {
      drawer.classList.remove("is-changing");
    }, 340);
  }

  function openDrawer(index) {
    if (!drawer) return;

    renderProject(index);

    drawerOpen = true;
    archive.classList.add("has-open-detail");
    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");

    lockPage();
    hideActivePreview();
    animateDrawerChange();

    const row = rows[activeIndex];
    if (row) {
      triggerGlitch(row.querySelector(".work-project__number"));
      triggerGlitch(row.querySelector(".work-project__name"));
    }

    window.requestAnimationFrame(() => {
      triggerGlitch(titleEl);
      triggerGlitch(reviewEl);
    });
  }

  function closeDrawer() {
    if (!drawer) return;

    drawerOpen = false;
    archive.classList.remove("has-open-detail");
    drawer.classList.remove("is-open", "is-changing");
    drawer.setAttribute("aria-hidden", "true");

    unlockPage();
    setActiveRow(activeIndex);
  }

  function moveProject(delta) {
    const nextIndex = clampIndex(activeIndex + delta);

    if (drawerOpen) {
      openDrawer(nextIndex);
      return;
    }

    setActiveRow(nextIndex);
  }

  /* ==========================================================
     MOUSE-ATTACHED PREVIEW
  ========================================================== */

  function hideActivePreview() {
    if (activeRow) activeRow.classList.remove("is-previewing");

    if (activePreview) {
      activePreview.classList.remove("is-visible");
      activePreview.style.opacity = "0";
      activePreview.style.visibility = "hidden";
    }

    activeRow = null;
    activePreview = null;
  }

  function movePreview() {
    currentX = lerp(currentX, mouseX, 0.18);
    currentY = lerp(currentY, mouseY, 0.18);

    if (activePreview) {
      activePreview.style.transform = `
        translate3d(${currentX}px, ${currentY}px, 0)
        translate3d(1.1rem, -48%, 0)
        rotate(-1.25deg)
        scale(1)
      `;
    }

    if (
      activePreview &&
      (Math.abs(currentX - mouseX) > 0.15 || Math.abs(currentY - mouseY) > 0.15)
    ) {
      previewRaf = window.requestAnimationFrame(movePreview);
    } else {
      previewRaf = null;
    }
  }

  function requestPreviewMove() {
    if (!previewRaf) previewRaf = window.requestAnimationFrame(movePreview);
  }

  function showPreview(row, event) {
    if (drawerOpen || mobileQuery.matches) return;

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
    preview.style.left = "0";
    preview.style.top = "0";

    triggerGlitch(row.querySelector(".work-project__number"));
    triggerGlitch(row.querySelector(".work-project__name"));

    requestPreviewMove();
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
        translate3d(1.1rem, -43%, 0)
        rotate(-2deg)
        scale(0.94)
      `;
    }

    if (activeRow === row) activeRow = null;
    if (activePreview === preview) activePreview = null;
  }

  function setupRows() {
    rows.forEach((row, index) => {
      row.setAttribute("type", "button");
      row.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");

      const preview = row.querySelector(".work-project__preview");
      if (preview) {
        preview.style.opacity = "0";
        preview.style.visibility = "hidden";
      }

      row.addEventListener("mouseenter", (event) => {
        setActiveRow(index);
        showPreview(row, event);
      });

      row.addEventListener("mousemove", (event) => {
        if (drawerOpen || mobileQuery.matches) return;
        mouseX = event.clientX;
        mouseY = event.clientY;
        requestPreviewMove();
      });

      row.addEventListener("mouseleave", () => {
        hidePreview(row);
      });

      row.addEventListener("focus", () => {
        setActiveRow(index);
        const rect = row.getBoundingClientRect();
        showPreview(row, {
          clientX: rect.right - 180,
          clientY: rect.top + rect.height / 2
        });
      });

      row.addEventListener("blur", () => {
        hidePreview(row);
      });

      row.addEventListener("click", (event) => {
        event.preventDefault();
        openDrawer(index);
      });
    });
  }

  function setupDrawerControls() {
    if (closeBtn) {
      closeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        closeDrawer();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDrawer(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDrawer(activeIndex + 1);
      });
    }

    document.addEventListener("click", (event) => {
      if (!drawerOpen || !drawer) return;

      const clickedDrawer = drawer.contains(event.target);
      const clickedRow = event.target.closest?.("[data-work-project]");

      if (!clickedDrawer && !clickedRow) closeDrawer();
    });

    window.addEventListener("keydown", (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTyping =
        activeTag === "input" ||
        activeTag === "textarea" ||
        document.activeElement?.isContentEditable;

      if (isTyping) return;

      if (event.key === "Escape" && drawerOpen) {
        event.preventDefault();
        closeDrawer();
        return;
      }

      if (event.key === "ArrowLeft" && drawerOpen) {
        event.preventDefault();
        moveProject(-1);
        return;
      }

      if (event.key === "ArrowRight" && drawerOpen) {
        event.preventDefault();
        moveProject(1);
      }
    });
  }

  function setupImageFallbacks() {
    archive.querySelectorAll("img").forEach((image) => {
      image.addEventListener(
        "error",
        () => {
          const holder = image.closest(".work-project__preview");
          if (holder) holder.classList.add("is-missing-image");
          image.style.display = "none";
        },
        { once: true }
      );
    });
  }

  function init() {
    if (!rows.length) return;

    archive.classList.remove("has-open-detail", "is-previewing");
    unlockPage();

    setupRows();
    setupDrawerControls();
    setupImageFallbacks();
    renderProject(0);
    prepareGlitchTargets();
    closeDrawer();

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
