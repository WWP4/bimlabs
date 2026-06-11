/* ==========================================================
   BIM LABS STUDIO — OUR WORK
   Clean JS rebuild
   - One flying trust-card section
   - One archive system
   - One Noomo-style pinned archive reveal
   - No drawer
   - No duplicate reveal functions
   - Works with current <details>/<summary> archive HTML
========================================================== */

(() => {
  "use strict";

  const projects = [
    {
      number: "01",
      title: "Wonder World Portal",
      client: "Wonder World Playsets",
      role: "Commercial playground distributor",
      review:
        "The portal made our process feel organized, easier to manage, and easier to present to customers."
    },
    {
      number: "02",
      title: "Momentum Athlete",
      client: "Momentum Athlete",
      role: "Athlete performance platform",
      review:
        "The platform finally felt clear, premium, and easier to present to partners."
    },
    {
      number: "03",
      title: "Orynd AI",
      client: "Orynd AI",
      role: "AI platform",
      review:
        "The site made the product easier to explain without making the idea feel smaller."
    },
    {
      number: "04",
      title: "3D Install Tool",
      client: "BIM Labs Studio",
      role: "Interactive project system",
      review:
        "The visual tool made the project easier to explain and easier for people to understand quickly."
    }
  ];

  const archive = document.querySelector(".work-archive");
  if (!archive) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const mobileQuery = window.matchMedia("(max-width: 900px)");

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
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
     CLEAN OLD / DUPLICATE STATES
  ========================================================== */

  function cleanOldStates() {
    document.documentElement.classList.remove("work-drawer-lock");
    document.body.classList.remove("work-drawer-lock");

    document.querySelectorAll(".work-detail").forEach((node) => node.remove());

    document.querySelectorAll(".work-trust").forEach((node) => node.remove());

    document.querySelectorAll(".bim-trust").forEach((node, index) => {
      if (index > 0) node.remove();
    });

    archive.classList.remove(
      "has-open-detail",
      "is-forming",
      "is-formed",
      "is-previewing"
    );
  }

  /* ==========================================================
     TRUST BRIDGE — INJECT ONE FLYING CARD SECTION
  ========================================================== */

  function injectTrustBridge() {
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

    archive.parentNode.insertBefore(section, archive);
  }

  /* ==========================================================
     TRUST BRIDGE — FLYING CARD MOTION
  ========================================================== */

  function setupTrustCards() {
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

      return;
    }

    const cardSettings = [
      {
        startX: 118,
        midX: 46,
        endX: -58,
        startY: 24,
        peakY: 3,
        endY: 18,
        startRotate: 7,
        midRotate: -2,
        endRotate: -9,
        delay: 0,
        span: 0.94,
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
        delay: 0.055,
        span: 0.94,
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
        delay: 0.11,
        span: 0.94,
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
        delay: 0.165,
        span: 0.94,
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

    function getProgress() {
      const rect = section.getBoundingClientRect();
      const viewport =
        window.innerHeight || document.documentElement.clientHeight;
      const travel = Math.max(section.offsetHeight - viewport, 1);

      return clamp(-rect.top / travel, 0, 1);
    }

    function render(progress) {
      cards.forEach((card, index) => {
        const settings =
          cardSettings[index] || cardSettings[cardSettings.length - 1];

        const raw = clamp(
          (progress - settings.delay) / settings.span,
          0,
          1
        );

        const t = easeInOutCubic(raw);

        const x = bezier3(settings.startX, settings.midX, settings.endX, t);
        const y = bezier3(settings.startY, settings.peakY, settings.endY, t);
        const rotate = bezier3(
          settings.startRotate,
          settings.midRotate,
          settings.endRotate,
          t
        );

        const float = Math.sin(progress * Math.PI * 2 + index * 0.85) * 0.22;

        card.style.opacity = "1";
        card.style.visibility = "visible";
        card.style.zIndex = String(30 + index);
        card.style.transform = `
          translate3d(${x}vw, calc(${y}vh + ${float}rem), ${settings.depth}px)
          rotate(${rotate}deg)
          scale(1)
        `;
      });

      if (headline) {
        headline.style.opacity = String(lerp(0.92, 0.5, progress));
        headline.style.transform = `translate3d(0, ${lerp(
          0,
          -3.5,
          progress
        )}vh, 0)`;
      }

      if (copy) {
        copy.style.opacity = String(lerp(1, 0.76, progress));
        copy.style.transform = `translate3d(0, ${lerp(
          0,
          -1.8,
          progress
        )}vh, 0)`;
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
      targetProgress = getProgress();

      if (!raf) {
        raf = window.requestAnimationFrame(animate);
      }
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("orientationchange", requestUpdate);

    targetProgress = getProgress();
    currentProgress = targetProgress;
    render(currentProgress);
  }

  /* ==========================================================
     ARCHIVE DETAILS — CURRENT HTML USES DETAILS/SUMMARY
  ========================================================== */

  function setupArchiveDetails() {
    const details = Array.from(archive.querySelectorAll(".work-project"));

    details.forEach((item, index) => {
      if (item.tagName.toLowerCase() !== "details") return;

      item.dataset.workProjectItem = String(index);

      const summary = item.querySelector(".work-project__summary");
      if (!summary) return;

      summary.setAttribute("role", "button");
      summary.setAttribute("aria-expanded", item.open ? "true" : "false");

      item.addEventListener("toggle", () => {
        summary.setAttribute("aria-expanded", item.open ? "true" : "false");

        if (item.open) {
          details.forEach((other) => {
            if (other !== item && other.tagName.toLowerCase() === "details") {
              other.removeAttribute("open");

              const otherSummary = other.querySelector(
                ".work-project__summary"
              );

              if (otherSummary) {
                otherSummary.setAttribute("aria-expanded", "false");
              }
            }
          });
        }
      });
    });
  }

  /* ==========================================================
     ARCHIVE — HOVER PREVIEW POLISH
  ========================================================== */



function setupArchiveHover() {
  const rows = Array.from(archive.querySelectorAll(".work-project"));

  if (!rows.length) return;

  let activePreview = null;
  let activeRow = null;
  let mouseX = window.innerWidth * 0.68;
  let mouseY = window.innerHeight * 0.42;
  let currentX = mouseX;
  let currentY = mouseY;
  let raf = null;

  function movePreview() {
    currentX = lerp(currentX, mouseX, 0.16);
    currentY = lerp(currentY, mouseY, 0.16);

    if (activePreview) {
      activePreview.style.transform = `
        translate3d(${currentX}px, ${currentY}px, 0)
        translate3d(1.2rem, -46%, 0)
        rotate(-1.25deg)
        scale(1)
      `;
    }

    if (
      activePreview &&
      (Math.abs(currentX - mouseX) > 0.1 || Math.abs(currentY - mouseY) > 0.1)
    ) {
      raf = window.requestAnimationFrame(movePreview);
    } else {
      raf = null;
    }
  }

  function requestMove() {
    if (!raf) {
      raf = window.requestAnimationFrame(movePreview);
    }
  }

  function showPreview(row, event) {
    if (mobileQuery.matches) return;

    const preview = row.querySelector(".work-project__preview");
    if (!preview) return;

    if (activeRow && activeRow !== row) {
      activeRow.classList.remove("is-previewing");
    }

    if (activePreview && activePreview !== preview) {
      activePreview.classList.remove("is-visible");
      activePreview.style.opacity = "0";
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
    preview.style.transform = `
      translate3d(${currentX}px, ${currentY}px, 0)
      translate3d(1.2rem, -46%, 0)
      rotate(-1.25deg)
      scale(1)
    `;

    requestMove();
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
        translate3d(1.2rem, -42%, 0)
        rotate(-2deg)
        scale(0.94)
      `;
    }

    if (activeRow === row) activeRow = null;
    if (activePreview === preview) activePreview = null;
  }

  rows.forEach((row) => {
    const summary = row.querySelector(".work-project__summary");
    const preview = row.querySelector(".work-project__preview");

    if (!summary || !preview) return;

    preview.style.opacity = "0";
    preview.style.visibility = "hidden";

    summary.addEventListener("mouseenter", (event) => {
      showPreview(row, event);
    });

    summary.addEventListener("mousemove", (event) => {
      if (mobileQuery.matches) return;

      mouseX = event.clientX;
      mouseY = event.clientY;

      requestMove();
    });

    summary.addEventListener("mouseleave", () => {
      hidePreview(row);
    });

    summary.addEventListener("focus", (event) => {
      const rect = summary.getBoundingClientRect();

      showPreview(row, {
        clientX: rect.right - 160,
        clientY: rect.top + rect.height / 2
      });
    });

    summary.addEventListener("blur", () => {
      hidePreview(row);
    });
  });
}





   

function setupArchiveNoomoReveal() {
  const hasGsap = window.gsap && window.ScrollTrigger;
  const shell = archive.querySelector(".work-archive__shell");
  const header = archive.querySelector(".work-archive__header");
  const label = archive.querySelector(".work-archive__label");
  const kicker = archive.querySelector(".work-archive__kicker");
  const title = archive.querySelector(".work-archive__title");
  const intro = archive.querySelector(".work-archive__intro");
  const rows = Array.from(archive.querySelectorAll(".work-project"));

  if (!shell || !rows.length) return;

  rows.forEach((row) => {
    row.style.setProperty("--row-line", "0");
    row.style.setProperty("--row-fill", "0");
  });

  if (!hasGsap || prefersReducedMotion || mobileQuery.matches) {
    archive.classList.add("is-formed");
    archive.style.setProperty("--archive-reveal", "1");
    archive.style.setProperty("--archive-top-line", "1");
    archive.style.setProperty("--archive-glow", "0");

    rows.forEach((row) => {
      row.style.setProperty("--row-line", "1");
      row.style.setProperty("--row-fill", "0");
    });

    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  ScrollTrigger.getAll().forEach((trigger) => {
    const id = trigger.vars && trigger.vars.id;

    if (
      id === "workArchiveReveal" ||
      id === "workArchiveFormation" ||
      id === "workArchiveNoomo"
    ) {
      trigger.kill();
    }
  });

  archive.classList.remove("is-forming", "is-formed");

  gsap.set(archive, {
    minHeight: "100vh",
    "--archive-reveal": 0,
    "--archive-top-line": 0,
    "--archive-glow": 0
  });

  gsap.set(shell, {
    yPercent: 7,
    scale: 0.985,
    transformOrigin: "50% 50%"
  });

  gsap.set(header, {
    y: 70,
    autoAlpha: 1
  });

  gsap.set([label, kicker].filter(Boolean), {
    autoAlpha: 0,
    y: 24,
    filter: "blur(8px)"
  });

  if (title) {
    gsap.set(title, {
      autoAlpha: 0,
      y: 80,
      scale: 0.965,
      filter: "blur(20px)",
      letterSpacing: "-0.13em"
    });
  }

  if (intro) {
    gsap.set(intro, {
      autoAlpha: 0,
      y: 38,
      filter: "blur(12px)"
    });
  }

  rows.forEach((row) => {
    const pieces = row.querySelectorAll(
      ".work-project__index, .work-project__name, .work-project__meta, .work-project__year, .work-project__arrow"
    );

    gsap.set(row, {
      "--row-line": 0,
      "--row-fill": 0,
      autoAlpha: 1
    });

    gsap.set(pieces, {
      autoAlpha: 0,
      y: 42,
      filter: "blur(14px)"
    });
  });

  const tl = gsap.timeline({
    defaults: {
      ease: "power3.out"
    },
    scrollTrigger: {
      id: "workArchiveNoomo",
      trigger: archive,
      start: "top top",
      end: "+=230%",
      scrub: 1.25,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: () => archive.classList.add("is-forming"),
      onLeave: () => archive.classList.add("is-formed"),
      onEnterBack: () => archive.classList.add("is-forming"),
      onLeaveBack: () => {
        archive.classList.remove("is-formed");
        archive.classList.remove("is-forming");
      }
    }
  });

  /* background wakes up */
  tl.to(
    archive,
    {
      "--archive-reveal": 0.42,
      "--archive-glow": 0.35,
      duration: 0.7,
      ease: "none"
    },
    0
  );

  /* section settles into place */
  tl.to(
    shell,
    {
      yPercent: 0,
      scale: 1,
      duration: 1.05,
      ease: "power2.out"
    },
    0
  );

  tl.to(
    header,
    {
      y: 0,
      duration: 1.1,
      ease: "power3.out"
    },
    0.05
  );

  /* headline pieces reveal */
  tl.to(
    [label, kicker].filter(Boolean),
    {
      autoAlpha: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 0.65,
      stagger: 0.06,
      ease: "power3.out"
    },
    0.28
  );

  if (title) {
    tl.to(
      title,
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        letterSpacing: "-0.082em",
        duration: 1.1,
        ease: "power4.out"
      },
      0.38
    );
  }

  if (intro) {
    tl.to(
      intro,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "power3.out"
      },
      0.8
    );
  }

  /* header line grows left to right */
  tl.to(
    archive,
    {
      "--archive-top-line": 1,
      duration: 1.15,
      ease: "power2.inOut"
    },
    0.95
  );

  tl.to(
    archive,
    {
      "--archive-reveal": 0.82,
      duration: 1.2,
      ease: "none"
    },
    1.05
  );

  /* rows reveal like Noomo: line first, text follows */
  rows.forEach((row, index) => {
    const pieces = row.querySelectorAll(
      ".work-project__index, .work-project__name, .work-project__meta, .work-project__year, .work-project__arrow"
    );

    const start = 1.32 + index * 0.18;

    tl.to(
      row,
      {
        "--row-line": 1,
        duration: 0.95,
        ease: "power2.inOut"
      },
      start
    );

    tl.to(
      pieces,
      {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.72,
        stagger: 0.04,
        ease: "power4.out"
      },
      start + 0.16
    );
  });

  tl.to(
    archive,
    {
      "--archive-glow": 0,
      duration: 0.8,
      ease: "none"
    },
    2.35
  );
}













   
  /* ==========================================================
     IMAGE FALLBACKS
  ========================================================== */

  function setupImageFallbacks() {
    const images = archive.querySelectorAll("img");

    images.forEach((image) => {
      image.addEventListener(
        "error",
        () => {
          const holder = image.closest(
            ".work-project__preview, .work-project__media"
          );

          if (holder) {
            holder.classList.add("is-missing-image");
          }

          image.style.display = "none";
        },
        { once: true }
      );
    });
  }





function closeAllArchiveProjects() {
  const details = Array.from(archive.querySelectorAll(".work-project"));

  details.forEach((item) => {
    if (item.tagName.toLowerCase() !== "details") return;

    item.removeAttribute("open");
    item.open = false;
    item.classList.remove("is-previewing");

    const summary = item.querySelector(".work-project__summary");

    if (summary) {
      summary.setAttribute("aria-expanded", "false");
      summary.blur();
    }
  });
}







/* ==========================================================
   ARCHIVE — REAL LETTER GLITCH / MORPH
   No scramble. The actual letters distort.
========================================================== */

function setupArchiveTextGlitch() {
  const rows = Array.from(archive.querySelectorAll(".work-project"));

  if (!rows.length || prefersReducedMotion) return;

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function makePercent(min, max) {
    return `${random(min, max).toFixed(1)}%`;
  }

  function buildGlyphs(name) {
    if (!name || name.dataset.glyphReady === "true") return;

    const original = name.textContent.replace(/\s+/g, " ").trim();

    name.dataset.originalText = original;
    name.setAttribute("aria-label", original);
    name.classList.add("glitch-word");

    name.innerHTML = "";

    Array.from(original).forEach((char, index) => {
      const glyph = document.createElement("span");
      const isSpace = char === " ";

      glyph.className = isSpace
        ? "glitch-char glitch-char--space"
        : "glitch-char";

      glyph.dataset.char = isSpace ? "\u00A0" : char;
      glyph.style.setProperty("--i", index);
      glyph.setAttribute("aria-hidden", "true");
      glyph.textContent = isSpace ? "\u00A0" : char;

      name.appendChild(glyph);
    });

    name.dataset.glyphReady = "true";
  }

  function resetGlyphs(name) {
    if (!name) return;

    if (name._glyphFrame) {
      cancelAnimationFrame(name._glyphFrame);
      name._glyphFrame = null;
    }

    name.classList.remove("is-glitching", "is-glitch-hit");

    name.querySelectorAll(".glitch-char").forEach((glyph) => {
      glyph.classList.remove("is-hot");

      glyph.style.removeProperty("--gx");
      glyph.style.removeProperty("--gy");
      glyph.style.removeProperty("--gskew");
      glyph.style.removeProperty("--gscale");
      glyph.style.removeProperty("--gblur");
      glyph.style.removeProperty("--gopacity");

      glyph.style.removeProperty("--slice-a");
      glyph.style.removeProperty("--slice-b");
      glyph.style.removeProperty("--slice-c");
      glyph.style.removeProperty("--slice-d");

      glyph.style.removeProperty("--ghost-x-one");
      glyph.style.removeProperty("--ghost-y-one");
      glyph.style.removeProperty("--ghost-x-two");
      glyph.style.removeProperty("--ghost-y-two");
    });
  }

  function fireGlyphGlitch(name) {
    if (!name || mobileQuery.matches) return;

    buildGlyphs(name);
    resetGlyphs(name);

    const glyphs = Array.from(
      name.querySelectorAll(".glitch-char:not(.glitch-char--space)")
    );

    if (!glyphs.length) return;

    const duration = 520;
    const start = performance.now();

    name.classList.add("is-glitching", "is-glitch-hit");

    function frame(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);

      const attack = Math.sin(progress * Math.PI);
      const decay = Math.pow(1 - progress, 0.42);
      const force = attack * decay;

      glyphs.forEach((glyph, index) => {
        const wave = Math.sin(now * 0.034 + index * 1.7);
        const pulse = Math.random() > 0.48 ? 1 : 0.38;
        const amount = force * pulse;

        glyph.classList.toggle("is-hot", Math.random() > 0.58);

        glyph.style.setProperty("--gx", `${random(-7, 7) * amount}px`);
        glyph.style.setProperty("--gy", `${random(-3, 3) * amount}px`);
        glyph.style.setProperty("--gskew", `${random(-14, 14) * amount}deg`);
        glyph.style.setProperty("--gscale", `${1 + random(-0.12, 0.16) * amount}`);
        glyph.style.setProperty("--gblur", `${random(0, 1.1) * amount}px`);
        glyph.style.setProperty("--gopacity", `${0.28 + amount * 0.72}`);

        glyph.style.setProperty("--slice-a", makePercent(0, 24));
        glyph.style.setProperty("--slice-b", makePercent(28, 48));
        glyph.style.setProperty("--slice-c", makePercent(50, 68));
        glyph.style.setProperty("--slice-d", makePercent(72, 100));

        glyph.style.setProperty(
          "--ghost-x-one",
          `${(wave > 0 ? random(2, 9) : random(-9, -2)) * amount}px`
        );

        glyph.style.setProperty(
          "--ghost-y-one",
          `${random(-2, 2) * amount}px`
        );

        glyph.style.setProperty(
          "--ghost-x-two",
          `${(wave > 0 ? random(-8, -2) : random(2, 8)) * amount}px`
        );

        glyph.style.setProperty(
          "--ghost-y-two",
          `${random(-2, 2) * amount}px`
        );
      });

      if (progress < 1) {
        name._glyphFrame = requestAnimationFrame(frame);
      } else {
        resetGlyphs(name);
      }
    }

    name._glyphFrame = requestAnimationFrame(frame);
  }

  rows.forEach((row) => {
    const summary = row.querySelector(".work-project__summary");
    const name = row.querySelector(".work-project__name");

    if (!summary || !name) return;

    buildGlyphs(name);

    summary.addEventListener("mouseenter", () => {
      fireGlyphGlitch(name);
    });

    summary.addEventListener("focus", () => {
      fireGlyphGlitch(name);
    });

    summary.addEventListener("mouseleave", () => {
      resetGlyphs(name);
    });

    summary.addEventListener("blur", () => {
      resetGlyphs(name);
    });
  });
}



   


   

  /* ==========================================================
     INIT
  ========================================================== */

function init() {
  cleanOldStates();
  injectTrustBridge();
  closeAllArchiveProjects();
  setupTrustCards();
  setupArchiveDetails();
  setupArchiveHover();
  setupArchiveTextGlitch();
  setupArchiveNoomoReveal();
  setupImageFallbacks();

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
