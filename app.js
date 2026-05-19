(() => {
  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const canvas = document.querySelector("#bim-world");
  const progressFill = document.querySelector("#progressFill");

  const heroCopy = document.querySelector('[data-copy="hero"]');
  const buildCopy = document.querySelector('[data-copy="build"]');
  const workCopy = document.querySelector('[data-copy="work"]');
  const workDetailCopy = document.querySelector('[data-copy="work-detail"]');

  const scrollIndicator = document.querySelector(".scroll-indicator");
  const workIndex = document.querySelector(".work-index");

  const labels = document.querySelectorAll(".object-label");
  const archive = document.querySelector(".work-archive");
  const archiveContent = document.querySelector(".archive-content");
  const intro = document.querySelector(".work-scroll__intro");
  const workCards = gsap.utils.toArray(".work-card");
  const nextInner = document.querySelector(".next-section-inner");

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let width = window.innerWidth;
  let height = window.innerHeight;

  /*
    IMPORTANT:
    This version removes the confusing 3D label system.
    The site should feel like one clean scroll story:
    1. Hero
    2. Build explanation
    3. Work archive cards
    4. Final CTA
  */

  labels.forEach((label) => {
    label.style.display = "none";
  });

  function clamp(value, min = 0, max = 1) {
    return Math.min(max, Math.max(min, value));
  }

  function mapRange(value, inMin, inMax) {
    return clamp((value - inMin) / (inMax - inMin));
  }

  function setVar(name, value) {
    root.style.setProperty(name, Number(value).toFixed(4));
  }

  function updateBaseProgress() {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;

    setVar("--section-progress", progress);

    if (progressFill) {
      progressFill.style.width = `${Math.round(progress * 100)}%`;
    }
  }

  function resetVisualState() {
    setVar("--hero-out", 0);
    setVar("--build-reveal", 0);
    setVar("--build-out", 0);
    setVar("--work-reveal", 0);
    setVar("--work-depth", 0);
    setVar("--work-ui-out", 0);

    if (heroCopy) {
      gsap.set(heroCopy, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)"
      });
    }

    if (buildCopy) {
      gsap.set(buildCopy, {
        autoAlpha: 0,
        y: 28,
        filter: "blur(8px)"
      });
    }

    if (workCopy) {
      gsap.set(workCopy, {
        autoAlpha: 0,
        y: 28,
        filter: "blur(8px)"
      });
    }

    if (workDetailCopy) {
      gsap.set(workDetailCopy, {
        autoAlpha: 0,
        y: 28,
        filter: "blur(8px)"
      });
    }

    if (workIndex) {
      gsap.set(workIndex, {
        autoAlpha: 0,
        y: 28
      });
    }

    if (scrollIndicator) {
      gsap.set(scrollIndicator, {
        autoAlpha: 1
      });
    }

    if (nextInner) {
      gsap.set(nextInner, {
        autoAlpha: 0,
        y: 70,
        filter: "blur(10px)",
        pointerEvents: "none"
      });
    }

    if (intro) {
      gsap.set(intro, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)"
      });
    }

    if (archiveContent) {
      gsap.set(archiveContent, {
        autoAlpha: 1,
        scale: 1,
        filter: "blur(0px)"
      });
    }

    workCards.forEach((card) => {
      gsap.set(card, {
        autoAlpha: 0,
        y: "64vh",
        scale: 0.96,
        filter: "blur(8px)"
      });
    });
  }

  function createMainStory() {
    const story = gsap.timeline({
      defaults: {
        ease: "power2.out"
      },
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: () => `${window.innerHeight * 2.15}px`,
        scrub: 0.9,
        onUpdate: updateBaseProgress
      }
    });

    story
      .to(scrollIndicator, {
        autoAlpha: 0,
        duration: 0.18
      }, 0)

      .to(heroCopy, {
        autoAlpha: 0,
        y: -34,
        filter: "blur(8px)",
        duration: 0.32
      }, 0.12)

      .to(root, {
        "--hero-out": 1,
        duration: 0.32
      }, 0.12)

      .to(buildCopy, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.34
      }, 0.28)

      .to(root, {
        "--build-reveal": 1,
        duration: 0.34
      }, 0.28)

      .to(buildCopy, {
        autoAlpha: 0,
        y: -28,
        filter: "blur(8px)",
        duration: 0.28
      }, 0.66)

      .to(root, {
        "--build-out": 1,
        duration: 0.28
      }, 0.66)

      .to(workCopy, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.34
      }, 0.78)

      .to(root, {
        "--work-reveal": 1,
        duration: 0.34
      }, 0.78)

      .to(workCopy, {
        autoAlpha: 0,
        y: -24,
        filter: "blur(8px)",
        duration: 0.24
      }, 1.05)

      .to(workDetailCopy, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.32
      }, 1.08)

      .to(workIndex, {
        autoAlpha: 1,
        y: 0,
        duration: 0.32
      }, 1.1)

      .to(root, {
        "--work-depth": 1,
        duration: 0.32
      }, 1.08);
  }

  function createArchiveStory() {
    if (!archive || !archiveContent || !workCards.length) return;

    const archiveTimeline = gsap.timeline({
      defaults: {
        ease: "none"
      },
      scrollTrigger: {
        trigger: archive,
        start: "top top",
        end: () => `+=${window.innerHeight * 4}`,
        scrub: 0.8,
        pin: true,
        anticipatePin: 1,
        onUpdate: updateBaseProgress
      }
    });

    archiveTimeline
      .to(workDetailCopy, {
        autoAlpha: 0,
        y: -24,
        filter: "blur(8px)",
        duration: 0.08
      }, 0)

      .to(workIndex, {
        autoAlpha: 0,
        y: -20,
        duration: 0.08
      }, 0)

      .to(intro, {
        autoAlpha: 0,
        y: -60,
        filter: "blur(8px)",
        duration: 0.1
      }, 0.05)

      .to(workCards[0], {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.14
      }, 0.1)

      .to(workCards[0], {
        autoAlpha: 0,
        y: "-62vh",
        scale: 0.97,
        filter: "blur(8px)",
        duration: 0.14
      }, 0.27)

      .to(workCards[1], {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.14
      }, 0.28)

      .to(workCards[1], {
        autoAlpha: 0,
        y: "-62vh",
        scale: 0.97,
        filter: "blur(8px)",
        duration: 0.14
      }, 0.45)

      .to(workCards[2], {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.14
      }, 0.46)

      .to(workCards[2], {
        autoAlpha: 0,
        y: "-62vh",
        scale: 0.97,
        filter: "blur(8px)",
        duration: 0.14
      }, 0.63)

      .to(workCards[3], {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.14
      }, 0.64)

      .to(workCards[3], {
        autoAlpha: 0,
        y: -70,
        scale: 0.98,
        filter: "blur(8px)",
        duration: 0.14
      }, 0.81)

      .to(archiveContent, {
        autoAlpha: 0,
        scale: 0.97,
        filter: "blur(10px)",
        duration: 0.15
      }, 0.84)

      .to(root, {
        "--work-ui-out": 1,
        duration: 0.16
      }, 0.84);

    if (nextInner) {
      archiveTimeline.to(nextInner, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        pointerEvents: "auto",
        duration: 0.18
      }, 0.88);
    }
  }

  /*
    Lightweight orb background.
    This keeps the premium motion without the old 3D timing mess.
  */

  const ctx = canvas ? canvas.getContext("2d") : null;
  const orbState = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    scroll: 0,
    time: 0
  };

  function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;

    if (!canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ScrollTrigger.refresh();
  }

  function drawOrb() {
    if (!canvas || !ctx) return;

    orbState.time += 0.01;
    orbState.scroll = clamp(window.scrollY / Math.max(1, document.body.scrollHeight - height));

    orbState.x += (orbState.targetX - orbState.x) * 0.05;
    orbState.y += (orbState.targetY - orbState.y) * 0.05;

    ctx.clearRect(0, 0, width, height);

    const centerX = width * (0.52 + orbState.x * 0.025);
    const centerY = height * (0.48 + orbState.y * 0.025 - orbState.scroll * 0.08);
    const baseRadius = Math.min(width, height) * 0.22;
    const radius = baseRadius * (1 + orbState.scroll * 0.18);

    const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.1, centerX, centerY, radius * 1.85);
    glow.addColorStop(0, "rgba(0, 119, 255, 0.18)");
    glow.addColorStop(0.42, "rgba(0, 119, 255, 0.07)");
    glow.addColorStop(1, "rgba(0, 119, 255, 0)");

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 1.85, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(orbState.time * 0.12);

    for (let i = 0; i < 9; i += 1) {
      const lineRadius = radius * (0.45 + i * 0.07);
      const alpha = i % 3 === 0 ? 0.32 : 0.14;

      ctx.strokeStyle = i % 3 === 0
        ? `rgba(0, 119, 255, ${alpha})`
        : `rgba(7, 16, 29, ${alpha})`;

      ctx.lineWidth = i % 3 === 0 ? 1.2 : 0.8;

      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        lineRadius,
        lineRadius * (0.22 + (i % 4) * 0.08),
        i * 0.34 + orbState.time * 0.08,
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }

    for (let i = 0; i < 14; i += 1) {
      const angle = (i / 14) * Math.PI * 2 + orbState.time * 0.18;
      const inner = radius * 0.18;
      const outer = radius * (0.46 + (i % 4) * 0.05);

      const x1 = Math.cos(angle) * inner;
      const y1 = Math.sin(angle) * inner;
      const x2 = Math.cos(angle) * outer;
      const y2 = Math.sin(angle) * outer;

      ctx.strokeStyle = i % 5 === 0
        ? "rgba(0, 119, 255, 0.32)"
        : "rgba(7, 16, 29, 0.12)";

      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();

    requestAnimationFrame(drawOrb);
  }

  function handlePointerMove(event) {
    orbState.targetX = (event.clientX / width - 0.5) * 2;
    orbState.targetY = (event.clientY / height - 0.5) * 2;
  }

  function initReducedMotion() {
    resetVisualState();

    setVar("--hero-out", 0);
    setVar("--build-reveal", 1);
    setVar("--build-out", 0);
    setVar("--work-reveal", 1);
    setVar("--work-depth", 1);
    setVar("--work-ui-out", 0);

    if (heroCopy) gsap.set(heroCopy, { autoAlpha: 1, filter: "none" });
    if (buildCopy) gsap.set(buildCopy, { autoAlpha: 1, filter: "none" });
    if (workCopy) gsap.set(workCopy, { autoAlpha: 1, filter: "none" });
    if (workDetailCopy) gsap.set(workDetailCopy, { autoAlpha: 1, filter: "none" });
    if (workIndex) gsap.set(workIndex, { autoAlpha: 1 });
    if (scrollIndicator) gsap.set(scrollIndicator, { autoAlpha: 0 });

    workCards.forEach((card) => {
      gsap.set(card, {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        filter: "none",
        position: "relative",
        margin: "24px auto"
      });
    });

    if (archive) {
      archive.style.height = "auto";
      archive.style.minHeight = "100vh";
      archive.style.overflow = "visible";
    }

    if (archiveContent) {
      archiveContent.style.position = "relative";
      archiveContent.style.inset = "auto";
    }

    updateBaseProgress();
  }

  function init() {
    resetVisualState();
    resizeCanvas();

    if (prefersReducedMotion) {
      initReducedMotion();
    } else {
      createMainStory();
      createArchiveStory();
    }

    updateBaseProgress();
    drawOrb();

    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("scroll", updateBaseProgress, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, { passive: true });

    ScrollTrigger.refresh();
  }

  init();
})();
