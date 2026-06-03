/* ==========================================================
   BIM LABS STUDIO — OUR WORK ARCHIVE
   Stable version: no ScrollTrigger refresh loops
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

  const processSection = document.querySelector(".process-3d");
  const workWorld = document.querySelector(".process-world-inside");
  const root = document.querySelector(".work-archive");

  if (!processSection || !workWorld || !root) return;

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

  let activeIndex = 0;
  let ticking = false;
  let changeTimer = null;

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

  function renderServices(items) {
    if (!servicesEl) return;

    servicesEl.innerHTML = "";

    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      servicesEl.appendChild(li);
    });
  }

  function animateDetail() {
    if (!detail) return;

    detail.classList.remove("is-changing");

    requestAnimationFrame(() => {
      detail.classList.add("is-changing");
    });

    clearTimeout(changeTimer);

    changeTimer = setTimeout(() => {
      detail.classList.remove("is-changing");
    }, 460);
  }

  function setActiveProject(index) {
    const safeIndex = clampIndex(index);
    const project = projects[safeIndex];

    activeIndex = safeIndex;

    projectButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === safeIndex;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", isActive ? "true" : "false");
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

  function getProcessProgress() {
    const rect = processSection.getBoundingClientRect();
    const scrollable = Math.max(1, processSection.offsetHeight - window.innerHeight);
    const moved = Math.min(scrollable, Math.max(0, -rect.top));

    return moved / scrollable;
  }

  function updateWorkReveal() {
    ticking = false;

    const progress = getProcessProgress();

    const revealStart = 0.72;
    const releaseStart = 0.88;

    const workProgress = Math.min(
      1,
      Math.max(0, (progress - revealStart) / (releaseStart - revealStart))
    );

    workWorld.style.setProperty("--work-progress", workProgress.toFixed(4));

    const isVisible = progress >= revealStart;
    const isReleased = progress >= releaseStart;

    workWorld.classList.toggle("is-visible", isVisible);
    workWorld.classList.toggle("is-interactive", isReleased);
    workWorld.classList.toggle("is-released", isReleased);
    processSection.classList.toggle("is-work-mode", isReleased);

    if (!isVisible) {
      workWorld.setAttribute("aria-hidden", "true");
    } else {
      workWorld.removeAttribute("aria-hidden");
    }
  }

  function requestRevealUpdate() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateWorkReveal);
  }

  function setupProjectEvents() {
    projectButtons.forEach((button) => {
      const index = Number(button.dataset.workProject || 0);

      button.setAttribute("aria-pressed", index === activeIndex ? "true" : "false");

      button.addEventListener("mouseenter", () => {
        setActiveProject(index);
      });

      button.addEventListener("focus", () => {
        setActiveProject(index);
      });

      button.addEventListener("click", () => {
        setActiveProject(index);

        if (detail && window.innerWidth <= 1180) {
          detail.scrollIntoView({
            behavior: "smooth",
            block: "start"
          });
        }
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        setActiveProject(activeIndex - 1);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        setActiveProject(activeIndex + 1);
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        if (!detail) return;
        detail.classList.toggle("is-muted");
      });
    }

    window.addEventListener("keydown", (event) => {
      if (!workWorld.classList.contains("is-interactive")) return;

      if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
        setActiveProject(activeIndex - 1);
      }

      if (event.key === "ArrowDown" || event.key === "ArrowRight") {
        setActiveProject(activeIndex + 1);
      }
    });
  }

  function init() {
    setupProjectEvents();
    setActiveProject(0);

    window.addEventListener("scroll", requestRevealUpdate, { passive: true });
    window.addEventListener("resize", requestRevealUpdate);

    requestRevealUpdate();

    window.BIMLabsOurWork = {
      setActiveProject,
      update: requestRevealUpdate
    };
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
