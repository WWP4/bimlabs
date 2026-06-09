/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Clean archive interaction + image-first drawer
========================================================== */

(() => {
  const projects = [
    {
      number: "01",
      type: "Client Portal",
      year: "2024",
      title: "Wonder World Portal",
      image: "assets/showcase/project-portal.png",
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
      image: "assets/showcase/momentum.png",
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
      image: "assets/showcase/orynd-ai.png",
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
      type: "Interactive System",
      year: "2024",
      title: "3D Install Tool",
      image: "assets/showcase/3d-install-tool.png",
      description:
        "A visual system built to make complex installation planning easier to understand through a cleaner interactive preview layer.",
      constraint:
        "The workflow needed a more visual way to explain installation details without overwhelming the customer or relying only on static notes.",
      solution:
        "We shaped the experience around a clearer visual preview, simplified interface structure, and more direct project understanding.",
      result:
        "The tool made the project feel easier to understand, easier to explain, and more polished from the first interaction.",
      services: [
        "3D visual direction",
        "Interactive interface structure",
        "Project preview system",
        "Frontend implementation",
        "UX simplification"
      ],
      review:
        "The visual tool made the project easier to explain and easier for people to understand quickly.",
      client: "BIM Labs Studio",
      role: "Interactive project system"
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
  const imageEl = root.querySelector("[data-work-detail-image]");
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

  function lockSiteScroll() {
    document.documentElement.classList.add("work-drawer-lock");
    document.body.classList.add("work-drawer-lock");
  }

  function unlockSiteScroll() {
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");
  }

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

  function restartGlitch(button) {
    if (!button || prefersReducedMotion) return;

    button.classList.remove("is-glitching");

    void button.offsetWidth;

    button.classList.add("is-glitching");

    window.clearTimeout(glitchTimer);

    glitchTimer = window.setTimeout(() => {
      button.classList.remove("is-glitching");
    }, 700);
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

    if (imageEl) {
      imageEl.src = project.image;
      imageEl.alt = `${project.title} project preview`;
    }

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
    }, 280);
  }

  function openDetail(index) {
    const safeIndex = clampIndex(index);

    renderProject(safeIndex);

    detailIsOpen = true;
    root.classList.add("has-open-detail");

    if (detail) {
      detail.classList.add("is-open");
      detail.classList.remove("is-muted");
      detail.setAttribute("aria-hidden", "false");
    }

    lockSiteScroll();
    clearPreviewStates();
    restartGlitch(projectButtons[safeIndex]);
    animateDetailChange();
  }

  function closeDetail() {
    if (!detailIsOpen) return;

    detailIsOpen = false;
    root.classList.remove("has-open-detail");

    if (detail) {
      detail.classList.remove("is-open", "is-muted", "is-changing");
      detail.setAttribute("aria-hidden", "true");
    }

    clearPreviewStates();
    setActiveButton(activeIndex);
    unlockSiteScroll();
  }

  function moveProject(delta) {
    const nextIndex = clampIndex(activeIndex + delta);

    if (detailIsOpen) {
      renderProject(nextIndex);
      restartGlitch(projectButtons[nextIndex]);
      animateDetailChange();
      return;
    }

    activeIndex = nextIndex;
    setPreviewProject(nextIndex);
  }

  function setupProjectButtons() {
    projectButtons.forEach((button) => {
      const index = Number(button.dataset.workProject || 0);

      button.setAttribute("type", "button");
      button.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");

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
        event.stopPropagation();

        openDetail(index);
      });
    });
  }

  function setupDrawerControls() {
    if (prevBtn) {
      prevBtn.setAttribute("type", "button");

      prevBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        moveProject(-1);
      });
    }

    if (nextBtn) {
      nextBtn.setAttribute("type", "button");

      nextBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        moveProject(1);
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

    if (detail) {
      detail.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    }

    document.addEventListener("click", (event) => {
      if (!detailIsOpen) return;

      const clickedProject = event.target.closest?.("[data-work-project]");
      const clickedDrawer = event.target.closest?.(".work-detail");

      if (!clickedProject && !clickedDrawer) {
        closeDetail();
      }
    });
  }

  function setupKeyboardControls() {
    window.addEventListener("keydown", (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();

      const isTyping =
        activeTag === "input" ||
        activeTag === "textarea" ||
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

  function disableBrokenImages() {
    const images = root.querySelectorAll("img");

    images.forEach((img) => {
      img.addEventListener("error", () => {
        const preview = img.closest(".work-project__preview");

        if (preview) {
          preview.style.display = "none";
          return;
        }

        if (img.matches("[data-work-detail-image]")) {
          img.closest(".work-detail__media")?.classList.add("is-missing");
        }
      });
    });
  }

  function init() {
    if (!projectButtons.length || !detail) return;

    setupProjectButtons();
    setupDrawerControls();
    setupKeyboardControls();
    disableBrokenImages();

    renderProject(0);
    setActiveButton(0);

    detail.classList.remove("is-open", "is-muted", "is-changing");
    detail.setAttribute("aria-hidden", "true");

    root.classList.remove("has-open-detail");
    unlockSiteScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
