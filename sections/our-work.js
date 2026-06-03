/* ==========================================================
   BIM LABS STUDIO — OUR WORK INTERACTION ONLY

   Important:
   This file does NOT control scroll anymore.

   process-scroll.js owns:
   - Our Work reveal timing
   - Our Work visibility
   - Our Work interactivity
   - --work-zoom-progress
   - --work-reveal-progress
   - --work-scroll-progress
   - is-work-mode / is-inside-work states

   This file only owns:
   - project hover
   - project focus
   - project click
   - detail panel content
   - previous / next controls
   - keyboard navigation while Our Work is interactive
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
  let changeTimer = null;

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

  function isWorkInteractive() {
    if (!workWorld) return true;

    return (
      workWorld.classList.contains("is-interactive") ||
      workWorld.closest(".process-3d")?.classList.contains("is-work-interactive") ||
      workWorld.closest(".process-3d")?.classList.contains("is-inside-work")
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
    }, 280);
  }

  function setActiveProject(index) {
    if (!projects.length) return;

    const safeIndex = clampIndex(index);
    const project = projects[safeIndex];

    if (!project) return;

    const alreadyActive =
      safeIndex === activeIndex &&
      projectButtons[safeIndex]?.classList.contains("is-active");

    if (alreadyActive) return;

    activeIndex = safeIndex;

    projectButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === safeIndex;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    if (numberEl) numberEl.textContent = project.number;
    if (titleEl) titleEl.textContent = project.title;
    if (descriptionEl) descriptionEl.textContent = project.description;
    if (reviewEl) reviewEl.textContent = `“${project.review}”`;
    if (clientEl) clientEl.textContent = project.client;
    if (roleEl) roleEl.textContent = project.role;

    renderServices(project.services);
    animateDetail();
  }

  function setupProjectEvents() {
    projectButtons.forEach((button) => {
      const index = Number(button.dataset.workProject || 0);

      button.setAttribute("type", "button");
      button.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");

      button.addEventListener("mouseenter", () => {
        if (!isWorkInteractive()) return;
        setActiveProject(index);
      });

      button.addEventListener("focus", () => {
        if (!isWorkInteractive()) return;
        setActiveProject(index);
      });

      button.addEventListener("click", () => {
        setActiveProject(index);
      });
    });

    if (prevBtn) {
      prevBtn.setAttribute("type", "button");

      prevBtn.addEventListener("click", () => {
        setActiveProject(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.setAttribute("type", "button");

      nextBtn.addEventListener("click", () => {
        setActiveProject(activeIndex + 1);
      });
    }

    if (closeBtn) {
      closeBtn.setAttribute("type", "button");

      closeBtn.addEventListener("click", () => {
        if (!detail) return;
        detail.classList.toggle("is-muted");
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

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        event.preventDefault();
        setActiveProject(activeIndex - 1);
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        event.preventDefault();
        setActiveProject(activeIndex + 1);
      }
    });
  }

  function init() {
    if (!projectButtons.length) return;

    setupProjectEvents();
    setActiveProject(0);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
