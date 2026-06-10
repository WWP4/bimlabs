
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

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  let activeIndex = 0;

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
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

  /* ==========================================================
     TRUST BRIDGE
  ========================================================== */

  function injectTrustBridge() {
    document.querySelector(".work-trust")?.remove();

    if (document.querySelector(".bim-trust")) return;

    const section = document.createElement("section");
    section.className = "bim-trust";
    section.setAttribute("aria-label", "Client trust");

    const cards = projects
      .map((project, index) => {
        return `
          <article class="bim-trust-card" data-bim-trust-card="${index}">
            <p class="bim-trust-card__logo">${escapeHtml(project.client)}</p>

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
      <div class="bim-trust__sticky">
        <h2 class="bim-trust__headline" aria-hidden="true">
          GOOD WORK<br>
          IS BUILT<br>
          WITH TRUST.
        </h2>

        <div class="bim-trust__copy">
          <p>
            We build with clients who need more than a nice-looking website.
            They need clearer systems, sharper presentation, and digital work
            that makes the business easier to understand.
          </p>
        </div>

        <div class="bim-trust__stage">
          ${cards}
        </div>
      </div>
    `;

    root.parentNode.insertBefore(section, root);
  }

  function setupWorkTrustScroll() {
    const section = document.querySelector(".bim-trust");
    const cards = Array.from(document.querySelectorAll("[data-bim-trust-card]"));
    const headline = document.querySelector(".bim-trust__headline");
    const copy = document.querySelector(".bim-trust__copy");

    if (!section || !cards.length) return;

    if (prefersReducedMotion || mobileQuery.matches) {
      cards.forEach((card) => {
        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.transform = "none";
      });

      if (headline) {
        headline.style.opacity = "";
        headline.style.transform = "";
      }

      if (copy) {
        copy.style.opacity = "";
        copy.style.transform = "";
      }

      return;
    }

    const cardSettings = [
      {
        startX: 118,
        midX: 46,
        endX: -58,
        startY: 25,
        peakY: 4,
        endY: 18,
        startRotate: 8,
        midRotate: -2,
        endRotate: -9,
        delay: 0,
        span: 0.92,
        depth: 0
      },
      {
        startX: 136,
        midX: 58,
        endX: -46,
        startY: 17,
        peakY: -5,
        endY: 9,
        startRotate: 5,
        midRotate: 1,
        endRotate: -6,
        delay: 0.06,
        span: 0.92,
        depth: 18
      },
      {
        startX: 154,
        midX: 70,
        endX: -34,
        startY: 18,
        peakY: -7,
        endY: 8,
        startRotate: 3,
        midRotate: -1,
        endRotate: -5,
        delay: 0.12,
        span: 0.92,
        depth: 32
      },
      {
        startX: 172,
        midX: 82,
        endX: -22,
        startY: 25,
        peakY: 3,
        endY: 16,
        startRotate: 7,
        midRotate: 2,
        endRotate: -3,
        delay: 0.18,
        span: 0.92,
        depth: 10
      }
    ];

    let targetProgress = 0;
    let currentProgress = 0;
    let raf = null;

    function easeInOutCubic(value) {
      return value < 0.5
        ? 4 * value * value * value
        : 1 - Math.pow(-2 * value + 2, 3) / 2;
    }

    function bezier3(p0, p1, p2, t) {
      const a = lerp(p0, p1, t);
      const b = lerp(p1, p2, t);
      return lerp(a, b, t);
    }

    function getSectionProgress() {
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);

      return clamp(-rect.top / travel, 0, 1);
    }

    function render(progress) {
      cards.forEach((card, index) => {
        const s = cardSettings[index] || cardSettings[cardSettings.length - 1];

        const raw = clamp((progress - s.delay) / s.span, 0, 1);
        const t = easeInOutCubic(raw);

        const x = bezier3(s.startX, s.midX, s.endX, t);
        const y = bezier3(s.startY, s.peakY, s.endY, t);
        const rotate = bezier3(s.startRotate, s.midRotate, s.endRotate, t);
        const float = Math.sin(progress * Math.PI * 2 + index * 0.85) * 0.22;

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(30 + index);
        card.style.transform = `
          translate3d(${x}vw, calc(${y}vh + ${float}rem), ${s.depth}px)
          rotate(${rotate}deg)
          scale(1)
        `;
      });

      if (headline) {
        headline.style.opacity = String(lerp(0.92, 0.5, progress));
        headline.style.transform = `translate3d(0, ${lerp(0, -3.5, progress)}vh, 0)`;
      }

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.76, progress));
        copy.style.transform = `translate3d(0, ${lerp(0, -1.8, progress)}vh, 0)`;
      }
    }

    function animate() {
      currentProgress = lerp(currentProgress, targetProgress, 0.045);
      render(currentProgress);

      if (Math.abs(targetProgress - currentProgress) > 0.0004) {
        raf = window.requestAnimationFrame(animate);
      } else {
        currentProgress = targetProgress;
        render(currentProgress);
        raf = null;
      }
    }

    function requestUpdate() {
      targetProgress = getSectionProgress();

      if (!raf) {
        raf = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("orientationchange", requestUpdate);

    targetProgress = getSectionProgress();
    currentProgress = targetProgress;
    render(currentProgress);
  }

  /* ==========================================================
     INLINE ARCHIVE
  ========================================================== */

  function createInlineDetail(project) {
    return `
      <div class="work-project__detail">
        <figure class="work-project__media">
          <img src="${escapeHtml(project.image)}" alt="${escapeHtml(project.title)} project preview" />
        </figure>

        <div class="work-project__case">
          <p class="work-project__eyebrow">
            Case ${escapeHtml(project.number)} / ${escapeHtml(project.type)} / ${escapeHtml(project.year)}
          </p>

          <p class="work-project__description">
            ${escapeHtml(project.description)}
          </p>

          <div class="work-project__proof" aria-label="${escapeHtml(project.title)} proof points">
            <section>
              <p>Constraint</p>
              <span>${escapeHtml(project.constraint)}</span>
            </section>

            <section>
              <p>What we built</p>
              <span>${escapeHtml(project.solution)}</span>
            </section>

            <section>
              <p>Result</p>
              <span>${escapeHtml(project.result)}</span>
            </section>
          </div>

          <ul class="work-project__services" aria-label="${escapeHtml(project.title)} services">
            ${project.services.map((service) => `<li>${escapeHtml(service)}</li>`).join("")}
          </ul>

          <blockquote class="work-project__quote">
            “${escapeHtml(project.review)}”
          </blockquote>
        </div>
      </div>
    `;
  }

  function upgradeArchiveMarkup() {
    const buttons = Array.from(root.querySelectorAll("[data-work-project]"));

    buttons.forEach((button, buttonIndex) => {
      const parsedIndex = Number(button.dataset.workProject);
      const index = Number.isFinite(parsedIndex) ? clampIndex(parsedIndex) : buttonIndex;
      const project = projects[index];

      if (!project) return;

      let article = button.closest(".work-project");

      /*
        Your current HTML uses button.work-project.
        This converts each button into an article row without needing you to remake HTML.
      */
      if (!article || article === button) {
        article = document.createElement("article");
        article.className = button.className;
        article.classList.remove("is-previewing");
        article.dataset.workProjectItem = String(index);

        button.className = "work-project__bar";
        button.removeAttribute("role");

        button.parentNode.insertBefore(article, button);
        article.appendChild(button);
      }

      article.dataset.workProjectItem = String(index);

      button.dataset.workProject = String(index);
      button.setAttribute("type", "button");
      button.setAttribute("aria-expanded", index === 0 ? "true" : "false");

      if (!article.querySelector(".work-project__detail")) {
        article.insertAdjacentHTML("beforeend", createInlineDetail(project));
      }
    });

    root.querySelector(".work-detail")?.remove();
    root.classList.remove("has-open-detail");
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");
  }

  function getProjectItems() {
    return Array.from(root.querySelectorAll("[data-work-project-item]"));
  }

  function getProjectButtons() {
    return Array.from(root.querySelectorAll(".work-project__bar[data-work-project]"));
  }

  function clearPreviewStates() {
    getProjectButtons().forEach((button) => {
      button.classList.remove("is-previewing", "is-active");
    });
  }

  function setActiveProject(index, scrollToProject = false) {
    const items = getProjectItems();
    const buttons = getProjectButtons();

    if (!items.length) return;

    const safeIndex = clampIndex(index);
    activeIndex = safeIndex;

    items.forEach((item, itemIndex) => {
      const isActive = itemIndex === safeIndex;
      item.classList.toggle("is-active", isActive);
      item.classList.toggle("is-expanded", isActive);
      item.classList.add("is-visible");
    });

    buttons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === safeIndex;
      button.classList.toggle("is-active", isActive);
      button.classList.remove("is-previewing");
      button.setAttribute("aria-expanded", isActive ? "true" : "false");
      button.setAttribute("aria-pressed", isActive ? "true" : "false");

      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });

    root.dataset.workActive = String(safeIndex);

    if (scrollToProject && mobileQuery.matches) {
      items[safeIndex]?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    }
  }

  function setupProjectButtons() {
    const buttons = getProjectButtons();

    buttons.forEach((button, buttonIndex) => {
      const parsedIndex = Number(button.dataset.workProject);
      const index = Number.isFinite(parsedIndex) ? clampIndex(parsedIndex) : buttonIndex;

      button.addEventListener("mouseenter", () => {
        if (mobileQuery.matches) return;

        clearPreviewStates();
        button.classList.add("is-previewing");
      });

      button.addEventListener("focus", () => {
        if (mobileQuery.matches) return;

        clearPreviewStates();
        button.classList.add("is-previewing");
      });

      button.addEventListener("mouseleave", () => {
        button.classList.remove("is-previewing");
      });

      button.addEventListener("blur", () => {
        button.classList.remove("is-previewing");
      });

      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        setActiveProject(index, true);
      });
    });
  }

  function setupArchiveScroll() {
    const items = getProjectItems();
    const header = root.querySelector(".work-archive__header");

    if (!items.length || prefersReducedMotion) return;

    let targetProgress = 0;
    let currentProgress = 0;
    let raf = null;

    function getArchiveProgress() {
      const rect = root.getBoundingClientRect();
      const viewport = window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(root.offsetHeight - viewport, 1);

      return clamp(-rect.top / travel, 0, 1);
    }

    function render(progress) {
      if (!mobileQuery.matches) {
        const nextIndex = Math.round(progress * (items.length - 1));
        setActiveProject(nextIndex, false);

        if (header) {
          header.style.opacity = String(lerp(1, 0.68, progress));
          header.style.transform = `translate3d(0, ${lerp(0, -18, progress)}px, 0)`;
        }

        items.forEach((item, index) => {
          const distance = Math.abs(index - activeIndex);

          item.style.opacity =
            index === activeIndex ? "1" : distance === 1 ? "0.56" : "0.34";

          item.style.transform = `translate3d(0, ${distance * 3}px, 0)`;
        });
      } else {
        if (header) {
          header.style.opacity = "";
          header.style.transform = "";
        }

        items.forEach((item) => {
          item.style.opacity = "";
          item.style.transform = "";
        });
      }
    }

    function animate() {
      currentProgress = lerp(currentProgress, targetProgress, 0.075);
      render(currentProgress);

      if (Math.abs(targetProgress - currentProgress) > 0.0005) {
        raf = window.requestAnimationFrame(animate);
      } else {
        currentProgress = targetProgress;
        render(currentProgress);
        raf = null;
      }
    }

    function requestUpdate() {
      targetProgress = getArchiveProgress();

      if (!raf) {
        raf = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("orientationchange", requestUpdate);

    targetProgress = getArchiveProgress();
    currentProgress = targetProgress;
    render(currentProgress);
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

        const media = img.closest(".work-project__media");

        if (media) {
          media.style.display = "none";
        }
      });
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

      if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveProject(activeIndex - 1, true);
        return;
      }

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        event.preventDefault();
        setActiveProject(activeIndex + 1, true);
      }
    });
  }

  function revealRows() {
    const items = getProjectItems();

    items.forEach((item, index) => {
      window.setTimeout(() => {
        item.classList.add("is-visible");
      }, index * 90);
    });
  }

  function init() {
    injectTrustBridge();
    setupWorkTrustScroll();

    upgradeArchiveMarkup();
    setupProjectButtons();
    setupArchiveScroll();
    setupKeyboardControls();
    disableBrokenImages();
    revealRows();

    setActiveProject(0, false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }



/* ==========================================================
   BIM LABS — WORK ARCHIVE FINAL REVEAL
   Paste at very bottom of sections/our-work.js
   This overrides older archive reveal attempts.
========================================================== */

(() => {
  "use strict";

  function setupFinalArchiveReveal() {
    const archive = document.querySelector(".work-archive");
    if (!archive) return;

    const hasGsap = window.gsap && window.ScrollTrigger;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    const shell = archive.querySelector(".work-archive__shell");
    const label = archive.querySelector(".work-archive__label");
    const kicker = archive.querySelector(".work-archive__kicker");
    const title = archive.querySelector(".work-archive__title");
    const intro = archive.querySelector(".work-archive__intro");
    const rows = Array.from(archive.querySelectorAll(".work-project"));
    const summaries = Array.from(archive.querySelectorAll(".work-project__summary"));

    if (!shell || !rows.length) return;

    archive.classList.add("archive-final-ready");

    if (!hasGsap || reduceMotion || isMobile) {
      archive.classList.add("is-formed");
      archive.style.setProperty("--archive-progress", "1");
      archive.style.setProperty("--archive-top-line", "1");
      archive.style.setProperty("--archive-scan", "0");

      summaries.forEach((summary) => {
        summary.style.setProperty("--row-line", "1");
      });

      rows.forEach((row) => {
        const pieces = row.querySelectorAll(
          ".work-project__index, .work-project__name, .work-project__meta, .work-project__year, .work-project__arrow"
        );

        gsap?.set?.(pieces, {
          autoAlpha: 1,
          y: 0,
          filter: "blur(0px)"
        });
      });

      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    /*
      Kill older archive reveal triggers so animations do not fight.
      This only targets triggers attached to .work-archive.
    */
    ScrollTrigger.getAll().forEach((trigger) => {
      const triggerEl = trigger.trigger;
      const isArchiveTrigger =
        triggerEl === archive ||
        triggerEl?.classList?.contains("work-archive");

      if (isArchiveTrigger) trigger.kill();
    });

    archive.classList.remove("is-formed", "is-forming");

    gsap.set(archive, {
      "--archive-progress": 0,
      "--archive-top-line": 0,
      "--archive-scan": 0
    });

    gsap.set(shell, {
      y: 34,
      scale: 0.992,
      transformOrigin: "50% 50%"
    });

    gsap.set([label, kicker], {
      autoAlpha: 0,
      y: 18,
      filter: "blur(7px)"
    });

    gsap.set(title, {
      autoAlpha: 0,
      y: 58,
      scale: 0.975,
      filter: "blur(18px)",
      letterSpacing: "-0.12em"
    });

    gsap.set(intro, {
      autoAlpha: 0,
      y: 30,
      filter: "blur(10px)"
    });

    rows.forEach((row) => {
      const summary = row.querySelector(".work-project__summary");

      const pieces = row.querySelectorAll(
        ".work-project__index, .work-project__name, .work-project__meta, .work-project__year, .work-project__arrow"
      );

      if (summary) {
        gsap.set(summary, {
          "--row-line": 0
        });
      }

      gsap.set(row, {
        autoAlpha: 1
      });

      gsap.set(pieces, {
        autoAlpha: 0,
        y: 22,
        filter: "blur(9px)"
      });
    });

    const tl = gsap.timeline({
      defaults: {
        ease: "power3.out"
      },
      scrollTrigger: {
        trigger: archive,
        start: "top top",
        end: "+=150%",
        scrub: 1.15,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onEnter: () => archive.classList.add("is-forming"),
        onLeave: () => archive.classList.add("is-formed"),
        onEnterBack: () => archive.classList.add("is-forming"),
        onLeaveBack: () => archive.classList.remove("is-formed")
      }
    });

    /*
      01 — section locks, black breath ends, soft scan passes
    */
    tl.to(archive, {
      "--archive-progress": 0.24,
      "--archive-scan": 0.7,
      duration: 0.32,
      ease: "none"
    }, 0);

    tl.to(shell, {
      y: 0,
      scale: 1,
      duration: 0.58,
      ease: "power2.out"
    }, 0);

    /*
      02 — architectural top line grows from center
    */
    tl.to(archive, {
      "--archive-top-line": 1,
      duration: 0.5,
      ease: "power2.inOut"
    }, 0.06);

    /*
      03 — labels appear quietly
    */
    tl.to([label, kicker], {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.34,
      stagger: 0.045,
      ease: "power3.out"
    }, 0.18);

    /*
      04 — headline resolves like a lens focusing
    */
    tl.to(title, {
      autoAlpha: 1,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
      letterSpacing: "-0.082em",
      duration: 0.68,
      ease: "power4.out"
    }, 0.3);

    /*
      05 — intro follows after title
    */
    tl.to(intro, {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.42,
      ease: "power3.out"
    }, 0.56);

    /*
      06 — rows assemble one by one
    */
    rows.forEach((row, index) => {
      const summary = row.querySelector(".work-project__summary");

      const number = row.querySelector(".work-project__index");
      const name = row.querySelector(".work-project__name");
      const meta = row.querySelector(".work-project__meta");
      const year = row.querySelector(".work-project__year");
      const arrow = row.querySelector(".work-project__arrow");

      const start = 0.78 + index * 0.12;

      if (summary) {
        tl.to(summary, {
          "--row-line": 1,
          duration: 0.26,
          ease: "power2.inOut"
        }, start);
      }

      tl.to(number, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.22
      }, start + 0.05);

      tl.to(name, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.32,
        ease: "power4.out"
      }, start + 0.075);

      tl.to([meta, year, arrow], {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.28,
        stagger: 0.025
      }, start + 0.12);
    });

    /*
      07 — final settle, section becomes interactive
    */
    tl.to(archive, {
      "--archive-progress": 1,
      "--archive-scan": 0,
      duration: 0.44,
      ease: "none"
    }, 1.12);

    ScrollTrigger.addEventListener("refreshInit", () => {
      archive.classList.remove("is-formed");
    });

    window.addEventListener("load", () => {
      ScrollTrigger.refresh();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupFinalArchiveReveal);
  } else {
    setupFinalArchiveReveal();
  }
})();


  
})();



