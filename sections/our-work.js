/* ==========================================================
   BIM LABS STUDIO — OUR WORK INSIDE PROCESS
   Optimized version.
   Page scroll controls:
   1. Our Work visibility
   2. Our Work zoom progress
   3. Internal track movement

   Project details update only from user interaction.
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
  const workWorld = document.querySelector("[data-work-world]");
  const root = document.querySelector(".work-archive");
  const workTrack = document.querySelector("[data-work-track]");

  if (!processSection || !workWorld || !root || !workTrack) return;

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
  let workVisible = false;
  let workMode = false;
  let workInteractive = false;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

  function getProcessProgress() {
    const rect = processSection.getBoundingClientRect();
    const scrollable = Math.max(1, processSection.offsetHeight - window.innerHeight);
    const moved = clamp(-rect.top, 0, scrollable);

    return moved / scrollable;
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

    clearTimeout(changeTimer);

    changeTimer = setTimeout(() => {
      detail.classList.remove("is-changing");
    }, 280);
  }

  function setActiveProject(index) {
    const safeIndex = clampIndex(index);

    if (safeIndex === activeIndex && projectButtons[safeIndex]?.classList.contains("is-active")) {
      return;
    }

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


function updateWorkScene() {
  ticking = false;

  if (window.innerWidth <= 900 || prefersReducedMotion) {
    workVisible = true;
    workMode = true;
    workInteractive = true;

    workWorld.classList.add("is-visible", "is-interactive");
    workWorld.removeAttribute("aria-hidden");

    processSection.classList.add("is-work-mode");

    processSection.style.setProperty("--work-zoom-progress", "1");
    processSection.style.setProperty("--work-reveal-progress", "1");
    processSection.style.setProperty("--work-scroll-progress", "0");

    workWorld.style.setProperty("--work-zoom-progress", "1");
    workWorld.style.setProperty("--work-reveal-progress", "1");
    workWorld.style.setProperty("--work-scroll-progress", "0");

    workTrack.style.setProperty("--work-scroll-progress", "0");

    return;
  }

  const progress = getProcessProgress();

  /*
    Correct timeline:
    0.00–0.76 = PROCESS cards / word only
    0.76–0.90 = camera starts pushing toward PROCESS
    0.90–0.97 = Our Work finally reveals through the center/C area
    0.97–1.00 = Our Work becomes the full website layer
  */

  const zoomStart = 0.76;
  const zoomEnd = 0.96;

  const revealStart = 0.9;
  const revealEnd = 0.97;

  const takeoverStart = 0.97;
  const internalStart = 0.97;
  const internalEnd = 1;

  const zoomProgress = clamp(
    (progress - zoomStart) / (zoomEnd - zoomStart),
    0,
    1
  );

  const revealProgress = clamp(
    (progress - revealStart) / (revealEnd - revealStart),
    0,
    1
  );

  const internalProgress = clamp(
    (progress - internalStart) / (internalEnd - internalStart),
    0,
    1
  );

  const zoomValue = zoomProgress.toFixed(4);
  const revealValue = revealProgress.toFixed(4);
  const internalValue = internalProgress.toFixed(4);

  processSection.style.setProperty("--work-zoom-progress", zoomValue);
  processSection.style.setProperty("--work-reveal-progress", revealValue);
  processSection.style.setProperty("--work-scroll-progress", internalValue);

  workWorld.style.setProperty("--work-zoom-progress", zoomValue);
  workWorld.style.setProperty("--work-reveal-progress", revealValue);
  workWorld.style.setProperty("--work-scroll-progress", internalValue);

  workTrack.style.setProperty("--work-scroll-progress", internalValue);

  const nextVisible = workVisible
    ? progress >= revealStart - 0.015
    : revealProgress > 0.01;

  const nextWorkMode = workMode
    ? progress >= takeoverStart - 0.015
    : progress >= takeoverStart;

  const nextInteractive = workInteractive
    ? revealProgress >= 0.92
    : revealProgress >= 0.98;

  if (nextVisible !== workVisible) {
    workVisible = nextVisible;
    workWorld.classList.toggle("is-visible", workVisible);

    if (workVisible) {
      workWorld.removeAttribute("aria-hidden");
    } else {
      workWorld.setAttribute("aria-hidden", "true");
    }
  }

  if (nextInteractive !== workInteractive) {
    workInteractive = nextInteractive;
    workWorld.classList.toggle("is-interactive", workInteractive);
  }

  if (nextWorkMode !== workMode) {
    workMode = nextWorkMode;
    processSection.classList.toggle("is-work-mode", workMode);
  }
}
   

  function requestUpdate() {
    if (ticking) return;

    ticking = true;
    requestAnimationFrame(updateWorkScene);
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
    updateWorkScene();

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
