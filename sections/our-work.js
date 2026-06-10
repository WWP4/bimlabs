/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Perfected Noomo-style trust cards + archive drawer
========================================================== */

(() => {
  "use strict";

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

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const projectButtons = Array.from(root.querySelectorAll("[data-work-project]"));
  const detail = root.querySelector(".work-detail");

  const els = {
    number: root.querySelector("[data-work-detail-number]"),
    type: root.querySelector("[data-work-detail-type]"),
    year: root.querySelector("[data-work-detail-year]"),
    title: root.querySelector("[data-work-detail-title]"),
    description: root.querySelector("[data-work-detail-description]"),
    image: root.querySelector("[data-work-detail-image]"),
    constraint: root.querySelector("[data-work-detail-constraint]"),
    solution: root.querySelector("[data-work-detail-solution]"),
    result: root.querySelector("[data-work-detail-result]"),
    services: root.querySelector("[data-work-detail-services]"),
    review: root.querySelector("[data-work-detail-review]"),
    client: root.querySelector("[data-work-detail-client]"),
    role: root.querySelector("[data-work-detail-role]")
  };

  const prevBtn = root.querySelector("[data-work-prev]");
  const nextBtn = root.querySelector("[data-work-next]");
  const closeBtn = root.querySelector(".work-detail__close");

  let activeIndex = 0;
  let detailIsOpen = false;
  let changeTimer = null;
  let lastFocusedElement = null;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function clampIndex(index) {
    return (index + projects.length) % projects.length;
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function lockSiteScroll() {
    document.documentElement.classList.add("work-drawer-lock");
    document.body.classList.add("work-drawer-lock");
  }

  function unlockSiteScroll() {
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");
  }

  /* ==========================================================
     TRUST BRIDGE
  ========================================================== */

  function injectTrustBridge() {
    if (document.querySelector(".work-trust")) return;

    const section = document.createElement("section");
    section.className = "work-trust";
    section.setAttribute("aria-label", "Client trust");

    const cards = projects
      .map((project, index) => {
        return `
          <article class="work-trust-card" data-work-trust-card="${index}">
            <p class="work-trust-card__logo">${escapeHtml(project.client)}</p>

            <blockquote>
              “${escapeHtml(project.review)}”
            </blockquote>

            <footer>
              <strong>${escapeHtml(project.title)}</strong>
              <span>${escapeHtml(project.role)}</span>
            </footer>
          </article>
        `;
      })
      .join("");

    section.innerHTML = `
      <div class="work-trust__sticky">
        <div class="work-trust__bg-text" aria-hidden="true">
          GOOD WORK<br>
          IS BUILT<br>
          WITH TRUST.
        </div>

        <div class="work-trust__copy">
          <p>
            We build with clients who need more than a nice-looking website.
            They need clearer systems, sharper presentation, and digital work
            that makes the business easier to understand.
          </p>
        </div>

        <div class="work-trust__track" data-work-trust-track>
          ${cards}
        </div>
      </div>
    `;

    root.parentNode.insertBefore(section, root);
  }

 function setupWorkTrustScroll() {
  const section = document.querySelector(".work-trust");
  const sticky = document.querySelector(".work-trust__sticky");
  const cards = Array.from(document.querySelectorAll("[data-work-trust-card]"));
  const bgText = document.querySelector(".work-trust__bg-text");
  const copy = document.querySelector(".work-trust__copy");

  if (!section || !sticky || !cards.length) return;

  const isMobile = window.matchMedia("(max-width: 900px)").matches;

  if (prefersReducedMotion || isMobile) {
    cards.forEach((card, index) => {
      card.style.removeProperty("opacity");
      card.style.removeProperty("z-index");
      card.style.removeProperty("transform");
      card.style.removeProperty("visibility");
    });

    if (bgText) {
      bgText.style.removeProperty("transform");
      bgText.style.removeProperty("opacity");
    }

    if (copy) {
      copy.style.removeProperty("transform");
      copy.style.removeProperty("opacity");
    }

    return;
  }

  const cardSettings = [
    {
      startX: 118,
      endX: -42,
      yStart: 14,
      yEnd: 8,
      rotateStart: -8,
      rotateEnd: -2,
      scaleStart: 1,
      scaleEnd: 1.03,
      delay: 0
    },
    {
      startX: 145,
      endX: -18,
      yStart: -5,
      yEnd: -8,
      rotateStart: 6,
      rotateEnd: 1.5,
      scaleStart: 0.98,
      scaleEnd: 1,
      delay: 0.08
    },
    {
      startX: 172,
      endX: 8,
      yStart: 8,
      yEnd: 5,
      rotateStart: -5,
      rotateEnd: -1,
      scaleStart: 1.02,
      scaleEnd: 1.04,
      delay: 0.16
    },
    {
      startX: 202,
      endX: 34,
      yStart: -2,
      yEnd: -5,
      rotateStart: 7,
      rotateEnd: 2,
      scaleStart: 0.96,
      scaleEnd: 0.99,
      delay: 0.24
    }
  ];

  let rafId = null;
  let isRunning = false;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, progress) {
    return start + (end - start) * progress;
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function getProgress() {
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const scrollable = Math.max(section.offsetHeight - viewport, 1);

    return clamp(-rect.top / scrollable, 0, 1);
  }

  function sectionIsNearViewport() {
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;

    return rect.top < viewport * 1.35 && rect.bottom > viewport * -0.35;
  }

  function update() {
    const progress = getProgress();

    cards.forEach((card, index) => {
      const settings = cardSettings[index] || cardSettings[cardSettings.length - 1];

      const localProgress = clamp(
        (progress - settings.delay) / 0.76,
        0,
        1
      );

      const eased = easeInOutCubic(localProgress);

      const x = lerp(settings.startX, settings.endX, eased);
      const y = lerp(settings.yStart, settings.yEnd, eased);
      const rotate = lerp(settings.rotateStart, settings.rotateEnd, eased);
      const scale = lerp(settings.scaleStart, settings.scaleEnd, eased);

      const float = Math.sin(progress * Math.PI * 2 + index * 0.9) * 0.75;

      const fadeIn = clamp(localProgress * 8, 0, 1);
      const fadeOut = clamp((1 - localProgress) * 8, 0, 1);
      const opacity = clamp(Math.min(fadeIn, fadeOut) * 0.98 + 0.02, 0, 1);

      card.style.visibility = "visible";
      card.style.opacity = String(opacity);
      card.style.zIndex = String(20 + index);

      card.style.transform = `
        translate3d(${x}vw, calc(${y}vh + ${float}rem), 0)
        rotate(${rotate}deg)
        scale(${scale})
      `;
    });

    if (bgText) {
      const bgY = lerp(0, -5.5, easeOutCubic(progress));
      const bgOpacity = lerp(0.96, 0.42, progress);

      bgText.style.transform = `translate3d(0, ${bgY}vh, 0)`;
      bgText.style.opacity = String(bgOpacity);
    }

    if (copy) {
      const copyY = lerp(0, -3.5, easeOutCubic(progress));
      const copyOpacity = lerp(1, 0.62, progress);

      copy.style.transform = `translate3d(0, ${copyY}vh, 0)`;
      copy.style.opacity = String(copyOpacity);
    }
  }

  function loop() {
    if (!isRunning) return;

    update();

    if (sectionIsNearViewport()) {
      rafId = window.requestAnimationFrame(loop);
    } else {
      stopLoop();
    }
  }

  function startLoop() {
    if (isRunning) return;

    isRunning = true;
    rafId = window.requestAnimationFrame(loop);
  }

  function stopLoop() {
    isRunning = false;

    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  function requestUpdate() {
    update();

    if (sectionIsNearViewport()) {
      startLoop();
    }
  }

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  window.addEventListener("orientationchange", requestUpdate);

  requestUpdate();
}

  /* ==========================================================
     PROJECT DETAIL DRAWER
  ========================================================== */

  function clearPreviewStates() {
    projectButtons.forEach((button) => {
      button.classList.remove("is-previewing", "is-active");
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
      button.classList.toggle("is-previewing", buttonIndex === safeIndex);
    });

    root.dataset.workActive = String(safeIndex);
  }

  function renderServices(services = []) {
    if (!els.services) return;

    els.services.innerHTML = "";

    services.forEach((service) => {
      const li = document.createElement("li");
      li.textContent = service;
      els.services.appendChild(li);
    });
  }

  function renderProject(index) {
    const safeIndex = clampIndex(index);
    const project = projects[safeIndex];

    if (!project) return;

    activeIndex = safeIndex;
    setActiveButton(safeIndex);

    if (els.number) els.number.textContent = project.number;
    if (els.type) els.type.textContent = project.type;
    if (els.year) els.year.textContent = project.year;
    if (els.title) els.title.textContent = project.title;
    if (els.description) els.description.textContent = project.description;
    if (els.constraint) els.constraint.textContent = project.constraint;
    if (els.solution) els.solution.textContent = project.solution;
    if (els.result) els.result.textContent = project.result;
    if (els.review) els.review.textContent = `“${project.review}”`;
    if (els.client) els.client.textContent = project.client;
    if (els.role) els.role.textContent = project.role;

    if (els.image) {
      els.image.src = project.image;
      els.image.alt = `${project.title} project preview`;

      const media = els.image.closest(".work-detail__media");
      if (media) media.classList.remove("is-missing");
    }

    renderServices(project.services);
  }

  function animateDetailChange() {
    if (!detail || prefersReducedMotion) return;

    detail.classList.remove("is-changing");

    window.requestAnimationFrame(() => {
      detail.classList.add("is-changing");
    });

    window.clearTimeout(changeTimer);

    changeTimer = window.setTimeout(() => {
      detail.classList.remove("is-changing");
    }, 280);
  }

  function resetDrawerScroll() {
    if (!detail) return;
    detail.scrollTo({ top: 0, behavior: "auto" });
  }

  function openDetail(index) {
    if (!detail) return;

    const safeIndex = clampIndex(index);

    lastFocusedElement = document.activeElement;

    renderProject(safeIndex);
    resetDrawerScroll();

    detailIsOpen = true;

    root.classList.add("has-open-detail");
    detail.classList.add("is-open");
    detail.setAttribute("aria-hidden", "false");

    lockSiteScroll();
    clearPreviewStates();
    animateDetailChange();

    window.setTimeout(() => {
      closeBtn?.focus({ preventScroll: true });
    }, 140);
  }

  function closeDetail() {
    if (!detail || !detailIsOpen) return;

    detailIsOpen = false;

    root.classList.remove("has-open-detail");
    detail.classList.remove("is-open", "is-changing");
    detail.setAttribute("aria-hidden", "true");

    clearPreviewStates();
    setActiveButton(activeIndex);
    unlockSiteScroll();

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  function moveProject(delta) {
    const nextIndex = clampIndex(activeIndex + delta);

    if (detailIsOpen) {
      renderProject(nextIndex);
      resetDrawerScroll();
      animateDetailChange();
      return;
    }

    activeIndex = nextIndex;
    setPreviewProject(nextIndex);
  }

  function setupProjectButtons() {
    if (!projectButtons.length) return;

    projectButtons.forEach((button, buttonIndex) => {
      const rawIndex = button.dataset.workProject;
      const parsedIndex = Number(rawIndex);

      const index =
        Number.isFinite(parsedIndex) && parsedIndex >= 0
          ? clampIndex(parsedIndex)
          : buttonIndex;

      button.dataset.workProject = String(index);
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
        button.classList.remove("is-previewing");
      });

      button.addEventListener("blur", () => {
        if (detailIsOpen) return;
        button.classList.remove("is-previewing");
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

      detail.addEventListener(
        "wheel",
        (event) => {
          event.stopPropagation();
        },
        { passive: true }
      );

      detail.addEventListener(
        "touchmove",
        (event) => {
          event.stopPropagation();
        },
        { passive: true }
      );
    }
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

      if (!detailIsOpen) return;

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

  function cleanInitialState() {
    root.classList.remove("has-open-detail");
    unlockSiteScroll();

    if (detail) {
      detail.classList.remove("is-open", "is-changing");
      detail.setAttribute("aria-hidden", "true");
    }
  }

  function init() {
    /*
      Important:
      Trust cards inject first so they still work even if the drawer HTML
      is missing or broken.
    */
    injectTrustBridge();
    setupWorkTrustScroll();

    /*
      Archive/drawer only runs if the archive markup exists.
      This prevents the testimonial cards from dying because of drawer issues.
    */
    if (!projectButtons.length || !detail) return;

    setupProjectButtons();
    setupDrawerControls();
    setupKeyboardControls();
    disableBrokenImages();

    renderProject(0);
    setActiveButton(0);
    cleanInitialState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
