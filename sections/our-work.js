/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Archive interaction + premium drawer + signal glitch
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
        "Wonder World needed one cleaner place to manage quote requests, product information, project details, and customer-facing resources.",
      solution:
        "We brought the core sales and project workflow into a more usable digital layer with clearer structure and less friction.",
      result:
        "The business gained a stronger operating system for managing project information and presenting the offer more professionally.",
      services: [
        "Client portal architecture",
        "Product and quote system",
        "Installer finder workflow",
        "CRM and internal dashboard",
        "Frontend design and development"
      ],
      review:
        "The portal made our process feel organized, easier to manage, and easier to present to customers.",
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
  let lockedScrollY = 0;

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

function lockSiteScroll() {
  lockedScrollY = window.scrollY || window.pageYOffset || 0;

  document.documentElement.classList.add("work-drawer-lock");
  document.body.classList.add("work-drawer-lock");
}

function unlockSiteScroll() {
  document.documentElement.classList.remove("work-drawer-lock");
  document.body.classList.remove("work-drawer-lock");
}

  function restartGlitch(button) {
    if (!button || prefersReducedMotion) return;

    button.classList.remove("is-glitching");

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

  function setPreviewProject(index) {
    const safeIndex = clampIndex(index);

    projectButtons.forEach((button, buttonIndex) => {
      const isPreviewing = buttonIndex === safeIndex;

      button.classList.toggle("is-previewing", isPreviewing);

      if (isPreviewing) {
        restartGlitch(button);
      } else {
        button.classList.remove("is-glitching");
      }
    });

    root.dataset.workActive = String(safeIndex);
  }

  function renderProject(index) {
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

  function animateDetailChange() {
    if (!detail || prefersReducedMotion) return;

    detail.classList.remove("is-changing");

    requestAnimationFrame(() => {
      detail.classList.add("is-changing");
    });

    window.clearTimeout(changeTimer);

    changeTimer = window.setTimeout(() => {
      detail.classList.remove("is-changing");
    }, 300);
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

    lockSiteScroll();
    clearPreviewStates();
    restartGlitch(projectButtons[safeIndex]);
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
    unlockSiteScroll();
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

  function reorderDrawerLayout() {
    const inner = root.querySelector(".work-detail__inner");
    const testimonial = root.querySelector(".work-detail__testimonial");
    const proofGrid = root.querySelector(".work-detail__proof-grid");

    if (!inner || !testimonial || !proofGrid) return;

    inner.insertBefore(testimonial, proofGrid);
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
        if (detailIsOpen) return;
        activeIndex = index;
        setPreviewProject(index);
      });

      button.addEventListener("focus", () => {
        if (detailIsOpen) return;
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

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        moveProject(-1);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        moveProject(1);
      }
    });
  }

  function init() {
    if (!projectButtons.length) return;

    reorderDrawerLayout();
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
