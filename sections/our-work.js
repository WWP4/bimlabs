/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Archive interaction + right drawer + subtle signal glitch
========================================================== */

(() => {
  const projects = [
    {
      number: "01",
      type: "Client Portal",
      year: "2024",
      title: "Wonder World Portal",
      description:
        "A private operating layer built to organize quotes, products, lead flow, installer coordination, and customer-facing resources.",
      constraint:
        "Sales, quotes, product information, and project coordination were scattered across too many disconnected tools, making the process harder to manage and present clearly.",
      solution:
        "We created a cleaner internal system that brought quote flow, products, customer resources, and operational tools into one more usable digital layer.",
      result:
        "A more organized digital operating system that made the sales and planning process easier to understand, manage, and present.",
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
      type: "Sports Platform",
      year: "2024",
      title: "Momentum Athlete",
      description:
        "A sharper digital platform for athlete performance, training resources, course access, and brand presentation.",
      constraint:
        "The offer needed to feel more serious and structured, while making the platform easier for athletes and partners to understand.",
      solution:
        "We shaped a cleaner platform direction with clearer hierarchy, stronger presentation, and a more polished digital experience.",
      result:
        "A more credible and understandable digital presence that better supported the platform’s positioning and user flow.",
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
      type: "AI Platform",
      year: "2023",
      title: "Orynd AI",
      description:
        "A focused AI product presence built around clarity, positioning, and interface structure.",
      constraint:
        "The product concept was complex, and the challenge was making the offer feel credible, clear, and easier to trust.",
      solution:
        "We simplified the product narrative and shaped the interface around positioning, trust, and clarity instead of visual noise.",
      result:
        "A cleaner digital presence that made the platform easier to explain and more ready for real users.",
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
      type: "Fintech Platform",
      year: "2023",
      title: "CashFlowSwami",
      description:
        "A more focused fintech-facing web experience built around trust, simple messaging, and a cleaner path from attention to action.",
      constraint:
        "The offer needed stronger digital credibility and a clearer path from first impression to understanding the service.",
      solution:
        "We created a cleaner presentation layer with simpler messaging, a stronger interface direction, and a more intentional conversion path.",
      result:
        "A site experience that made the business feel more legitimate, easier to trust, and easier to present.",
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

  if (!root) return;

  const projectButtons = Array.from(root.querySelectorAll("[data-work-project]"));
  const detail = root.querySelector(".work-detail");

  const numberEl = root.querySelector("[data-work-detail-number]");
  const typeEl = root.querySelector("[data-work-detail-type]");
  const yearEl = root.querySelector("[data-work-detail-year]");
  const titleEl = root.querySelector("[data-work-detail-title]");
  const descriptionEl = root.querySelector("[data-work-detail-description]");
  const constraintEl = root.querySelector("[data-work-detail-constraint]");
  const solutionEl = root.querySelector("[data-work-detail-solution]");
  const resultEl = root.querySelector("[data-work-detail-result]");
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
  let glitchTimer = null;

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
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

  function animateDetailChange() {
    if (!detail || prefersReducedMotion) return;

    detail.classList.remove("is-changing");

    requestAnimationFrame(() => {
      detail.classList.add("is-changing");
    });

    window.clearTimeout(changeTimer);

    changeTimer = window.setTimeout(() => {
      detail.classList.remove("is-changing");
    }, 280);
  }

  function pulseSignalGlitch(index) {
    if (prefersReducedMotion) return;

    const safeIndex = clampIndex(index);
    const button = projectButtons[safeIndex];

    if (!button) return;

    button.classList.remove("is-glitching");

    /*
      Forces the animation to restart cleanly.
    */
    void button.offsetWidth;

    button.classList.add("is-glitching");

    window.clearTimeout(glitchTimer);

    glitchTimer = window.setTimeout(() => {
      button.classList.remove("is-glitching");
    }, 720);
  }

  function clearPreviewStates() {
    projectButtons.forEach((button) => {
      button.classList.remove("is-previewing", "is-glitching");
    });
  }

  function setPreviewProject(index) {
    const safeIndex = clampIndex(index);

    projectButtons.forEach((button, buttonIndex) => {
      button.classList.toggle("is-previewing", buttonIndex === safeIndex);
    });

    root.dataset.workActive = String(safeIndex);
    pulseSignalGlitch(safeIndex);
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

    root.dataset.workActive = String(index);
  }

  function renderProject(index) {
    if (!projects.length) return;

    const safeIndex = clampIndex(index);
    const project = projects[safeIndex];

    if (!project) return;

    activeIndex = safeIndex;

    setActiveButton(safeIndex);

    if (numberEl) numberEl.textContent = project.number;
    if (typeEl) typeEl.textContent = project.type;
    if (yearEl) yearEl.textContent = project.year;
    if (titleEl) titleEl.textContent = project.title;
    if (descriptionEl) descriptionEl.textContent = project.description;
    if (constraintEl) constraintEl.textContent = project.constraint;
    if (solutionEl) solutionEl.textContent = project.solution;
    if (resultEl) resultEl.textContent = project.result;
    if (reviewEl) reviewEl.textContent = `“${project.review}”`;
    if (clientEl) clientEl.textContent = project.client;
    if (roleEl) roleEl.textContent = project.role;

    renderServices(project.services);
  }

  function openDetail(index) {
    const safeIndex = clampIndex(index);

    renderProject(safeIndex);

    detailIsOpen = true;
    root.classList.add("has-open-detail");

    if (detail) {
      detail.classList.add("is-open");
      detail.classList.remove("is-muted", "is-changing");
      detail.setAttribute("aria-hidden", "false");
    }

    clearPreviewStates();
    pulseSignalGlitch(safeIndex);
    animateDetailChange();
  }

  function closeDetail() {
    detailIsOpen = false;
    root.classList.remove("has-open-detail");

    if (detail) {
      detail.classList.remove("is-open", "is-muted", "is-changing");
      detail.setAttribute("aria-hidden", "true");
    }

    projectButtons.forEach((button, index) => {
      const isActive = index === activeIndex;

      button.classList.toggle("is-active", isActive);
      button.classList.remove("is-previewing", "is-glitching");
      button.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    root.dataset.workActive = String(activeIndex);
  }

  function moveProject(delta) {
    const nextIndex = clampIndex(activeIndex + delta);

    if (detailIsOpen) {
      openDetail(nextIndex);
      return;
    }

    activeIndex = nextIndex;
    setPreviewProject(nextIndex);
  }

  function setupProjectEvents() {
    projectButtons.forEach((button) => {
      const index = Number(button.dataset.workProject || 0);

      button.setAttribute("type", "button");
      button.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");

      if (index === activeIndex) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }

      button.addEventListener("mouseenter", () => {
        activeIndex = index;
        setPreviewProject(index);
      });

      button.addEventListener("focus", () => {
        activeIndex = index;
        setPreviewProject(index);
      });

      button.addEventListener("mouseleave", () => {
        if (detailIsOpen) return;
        button.classList.remove("is-previewing", "is-glitching");
      });

      button.addEventListener("blur", () => {
        if (detailIsOpen) return;
        button.classList.remove("is-previewing", "is-glitching");
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        openDetail(index);
      });
    });

    if (prevBtn) {
      prevBtn.setAttribute("type", "button");

      prevBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDetail(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.setAttribute("type", "button");

      nextBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openDetail(activeIndex + 1);
      });
    }

    if (closeBtn) {
      closeBtn.setAttribute("type", "button");

      closeBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        closeDetail();
      });
    }

    document.addEventListener("click", (event) => {
      if (!detailIsOpen || !detail) return;

      const clickedInsideDrawer = detail.contains(event.target);
      const clickedProject = event.target.closest?.("[data-work-project]");

      if (!clickedInsideDrawer && !clickedProject) {
        closeDetail();
      }
    });

    window.addEventListener("keydown", (event) => {
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
    renderProject(0);
    closeDetail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
