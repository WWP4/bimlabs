/* ==========================================================
   BIM LABS STUDIO — OUR WORK INTERACTION ONLY

   This file does NOT control scroll.
   process-scroll.js owns the PROCESS → Our Work reveal.

   This file owns:
   - project hover preview
   - project click
   - detail panel open / close
   - prev / next controls
   - keyboard navigation when Our Work is interactive
========================================================== */

(() => {
  const projects = [
    {
      number: "01",
      title: "Wonder World Portal",
      description:
        "We designed and built a private operating layer for Wonder World, bringing quotes, products, lead flow, installer coordination, and customer-facing resources into one cleaner system.",
      services: [
        "Client portal architecture",
        "Product and quote system",
        "Installer finder workflow",
        "CRM and internal dashboard",
        "Frontend design and development"
      ],
      review:
        "BIM Labs Studio helped us turn a scattered sales process into a cleaner system. The portal gave our team a stronger way to manage quotes, products, and customer information.",
      client: "Wonder World Playsets",
      role: "Commercial playground distributor"
    },
    {
      number: "02",
      title: "Momentum Athlete",
      description:
        "We partnered with Momentum Athlete to shape a sharper digital platform for athlete performance, training resources, course access, and brand presentation.",
      services: [
        "Platform experience direction",
        "Course system structure",
        "Landing page design",
        "Stripe payment flow",
        "Frontend build support"
      ],
      review:
        "The work gave our platform a more polished and professional direction. It made the experience easier to understand and helped the brand feel more serious.",
      client: "Momentum Athlete",
      role: "Athlete performance platform"
    },
    {
      number: "03",
      title: "Orynd AI",
      description:
        "We shaped an AI product presence around clarity, positioning, and interface structure so the offer could feel more focused, credible, and ready for users.",
      services: [
        "AI product positioning",
        "Brand direction",
        "Website interface",
        "Product narrative",
        "Conversion-focused layout"
      ],
      review:
        "BIM Labs Studio helped simplify a complex idea into a cleaner digital presence. The final direction made the platform easier to explain and easier to trust.",
      client: "Orynd AI",
      role: "AI platform"
    },
    {
      number: "04",
      title: "CashFlowSwami",
      description:
        "We created a more focused fintech-facing web experience built around trust, simple messaging, and a cleaner path from attention to action.",
      services: [
        "Landing page strategy",
        "Fintech brand presentation",
        "Interface design",
        "Lead path structure",
        "Frontend development"
      ],
      review:
        "The project helped us move from a rough idea to something that looked and felt legitimate. The site made the offer clearer and easier to present.",
      client: "CashFlowSwami",
      role: "Fintech platform"
    }
  ];

  const root = document.querySelector(".work-archive");
  const workWorld =
    document.querySelector("[data-work-world]") ||
    document.querySelector(".process-world-inside");

  if (!root) return;

  const projectButtons = Array.from(root.querySelectorAll("[data-work-project]"));
  const detail = root.querySelector(".work-detail");

  const numberEl = root.querySelector("[data-work-detail-number]");
  const titleEl = root.querySelector("[data-work-detail-title]");
  const descriptionEl = root.querySelector("[data-work-detail-description]");
  const servicesEl = root.querySelector("[data-work-detail-services]");
  const reviewEl = root.querySelector("[data-work-detail-review]");
  const clientEl = root.querySelector("[data-work-detail-client]");
  const roleEl = root.querySelector("[data-work-detail-role]");

  const prevBtn = root.querySelector("[data-work-prev]");
  const nextBtn = root.querySelector("[data-work-next]");
  const closeBtn = root.querySelector(".work-detail__close");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let activeIndex = 0;
  let detailIsOpen = false;
  let changeTimer = null;

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

  function isWorkInteractive() {
    if (!workWorld) return true;

    const processSection = workWorld.closest(".process-3d");

    return (
      workWorld.classList.contains("is-interactive") ||
      processSection?.classList.contains("is-work-interactive") ||
      processSection?.classList.contains("is-inside-work")
    );
  }

  function renderServices(items) {
    if (!servicesEl) return;

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      fragment.appendChild(li);
    });

    servicesEl.replaceChildren(fragment);
  }

  function animateDetail() {
    if (!detail || prefersReducedMotion) return;

    detail.classList.remove("is-changing");

    requestAnimationFrame(() => {
      detail.classList.add("is-changing");
    });

    window.clearTimeout(changeTimer);

    changeTimer = window.setTimeout(() => {
      detail.classList.remove("is-changing");
    }, 260);
  }

  function clearPreviewStates() {
    projectButtons.forEach((button) => {
      button.classList.remove("is-previewing");
    });
  }

  function setPreviewProject(index) {
    const safeIndex = clampIndex(index);

    projectButtons.forEach((button, buttonIndex) => {
      button.classList.toggle("is-previewing", buttonIndex === safeIndex);
    });
  }

  function setActiveButton(index) {
    projectButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  function renderProject(index) {
    if (!projects.length) return;

    const safeIndex = clampIndex(index);
    const project = projects[safeIndex];

    if (!project) return;

    activeIndex = safeIndex;

    setActiveButton(safeIndex);

    if (numberEl) numberEl.textContent = project.number;
    if (titleEl) titleEl.textContent = project.title;
    if (descriptionEl) descriptionEl.textContent = project.description;
    if (reviewEl) reviewEl.textContent = `“${project.review}”`;
    if (clientEl) clientEl.textContent = project.client;
    if (roleEl) roleEl.textContent = project.role;

    renderServices(project.services);
  }

  function openDetail(index) {
    renderProject(index);

    detailIsOpen = true;
    root.classList.add("has-open-detail");

    if (detail) {
      detail.classList.add("is-open");
      detail.classList.remove("is-muted");
      detail.removeAttribute("aria-hidden");
    }

    clearPreviewStates();
    animateDetail();
  }

  function closeDetail() {
    detailIsOpen = false;
    root.classList.remove("has-open-detail");

    if (detail) {
      detail.classList.remove("is-open", "is-muted", "is-changing");
      detail.setAttribute("aria-hidden", "true");
    }

    projectButtons.forEach((button) => {
      button.classList.remove("is-active", "is-previewing");
      button.setAttribute("aria-pressed", "false");
      button.removeAttribute("aria-current");
    });
  }

  function moveProject(delta) {
    const nextIndex = clampIndex(activeIndex + delta);

    if (detailIsOpen) {
      openDetail(nextIndex);
      return;
    }

    setPreviewProject(nextIndex);
    activeIndex = nextIndex;
  }

  function setupProjectEvents() {
    projectButtons.forEach((button) => {
      const index = Number(button.dataset.workProject || 0);

      button.setAttribute("type", "button");
      button.setAttribute("aria-pressed", "false");
      button.removeAttribute("aria-current");

      button.addEventListener("mouseenter", () => {
        if (!isWorkInteractive()) return;
        setPreviewProject(index);
      });

      button.addEventListener("focus", () => {
        if (!isWorkInteractive()) return;
        setPreviewProject(index);
      });

      button.addEventListener("mouseleave", () => {
        button.classList.remove("is-previewing");
      });

      button.addEventListener("blur", () => {
        button.classList.remove("is-previewing");
      });

      button.addEventListener("click", () => {
        if (!isWorkInteractive()) return;
        openDetail(index);
      });
    });

    if (prevBtn) {
      prevBtn.setAttribute("type", "button");

      prevBtn.addEventListener("click", () => {
        if (!isWorkInteractive()) return;
        openDetail(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.setAttribute("type", "button");

      nextBtn.addEventListener("click", () => {
        if (!isWorkInteractive()) return;
        openDetail(activeIndex + 1);
      });
    }

    if (closeBtn) {
      closeBtn.setAttribute("type", "button");

      closeBtn.addEventListener("click", () => {
        closeDetail();
      });
    }

    window.addEventListener("keydown", (event) => {
      if (!isWorkInteractive()) return;

      const tagName = document.activeElement?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        document.activeElement?.isContentEditable;

      if (isTyping) return;

      if (event.key === "Escape" && detailIsOpen) {
        event.preventDefault();
        closeDetail();
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        moveProject(-1);
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        moveProject(1);
      }
    });
  }

  function init() {
    if (!projectButtons.length) return;

    setupProjectEvents();

    /*
      Preload the first project content into the hidden detail panel,
      but do not open the panel until the user clicks a project.
    */
    renderProject(0);
    closeDetail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
