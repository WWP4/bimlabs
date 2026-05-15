document.addEventListener("DOMContentLoaded", () => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const heroContent = document.querySelector("[data-hero-content]");
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas?.getContext("2d");
  let points = [];
  let rafId = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const body = document.body;

  const updateHeaderAndHero = () => {
    const scrollY = window.scrollY || 0;
    header?.classList.toggle("is-scrolled", scrollY > 16);
    if (heroContent) {
      const progress = clamp(scrollY / (window.innerHeight * 0.58), 0, 1);
      heroContent.style.opacity = String(1 - progress * 0.72);
      heroContent.style.transform = `translate3d(0, ${progress * -44}px, 0)`;
      heroContent.style.filter = `blur(${progress * 8}px)`;
    }
  };

  // ambient cursor drift
  document.addEventListener("pointermove", (event) => {
    const x = (event.clientX / window.innerWidth - 0.5) * 18;
    const y = (event.clientY / window.innerHeight - 0.5) * 18;
    document.querySelectorAll(".bim-cursor-label").forEach((label, index) => {
      label.style.setProperty("--cursor-x", `${x * (index ? -1 : 1)}px`);
      label.style.setProperty("--cursor-y", `${y * (index ? -1 : 1)}px`);
    });
  }, { passive: true });

  const setOrbState = (state) => {
    if (!state) return;
    Array.from(body.classList).forEach((cls) => {
      if (cls.startsWith("orb-")) body.classList.remove(cls);
    });
    body.classList.add(`orb-${state}`);
  };

  const sections = document.querySelectorAll("[data-orb-state]");
  const orbObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        setOrbState(entry.target.dataset.orbState);
      });
    }, { threshold: 0.45 })
    : null;

  sections.forEach((section) => orbObserver?.observe(section));
  setOrbState(document.querySelector("[data-orb-state]")?.dataset.orbState || "hero");

  const updateOrbScroll = () => {
    const doc = document.documentElement;
    const scrollable = Math.max(doc.scrollHeight - window.innerHeight, 1);
    const progress = clamp((window.scrollY || 0) / scrollable, 0, 1);
    doc.style.setProperty("--orb-scroll", String(progress));
    doc.style.setProperty("--orb-scroll-18", `${progress * 18}deg`);
    doc.style.setProperty("--orb-scroll-24", `${progress * 24}deg`);
    doc.style.setProperty("--orb-scroll-38", `${progress * 38}deg`);
    doc.style.setProperty("--orb-scroll-50", `${progress * 50}deg`);
    doc.style.setProperty("--orb-scroll-neg-24", `${progress * -24}deg`);
    doc.style.setProperty("--orb-scroll-neg-30", `${progress * -30}deg`);

    const wheel = document.querySelector("[data-wheel]");
    const cards = Array.from(document.querySelectorAll("[data-wheel-card]"));
    if (!wheel || !cards.length || !body.classList.contains("orb-wheel")) return;

    const rect = wheel.getBoundingClientRect();
    const wheelProgress = clamp((window.innerHeight * 0.58 - rect.top) / Math.max(rect.height, 1), 0, 1);
    const index = Math.round(wheelProgress * (cards.length - 1));
    setWheel(index);
  };

  updateHeaderAndHero();
  updateOrbScroll();
  window.addEventListener("scroll", () => window.requestAnimationFrame(() => {
    updateHeaderAndHero();
    updateOrbScroll();
  }), { passive: true });
  window.addEventListener("resize", updateOrbScroll);

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
    });
  });

  const setGlowPosition = (element, event) => {
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    element.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  document.querySelectorAll("[data-glow-button], [data-quadrant]").forEach((element) => {
    element.addEventListener("pointermove", (event) => setGlowPosition(element, event));
  });

  const quadrants = Array.from(document.querySelectorAll("[data-quadrant]"));
  const quadrantOrb = document.querySelector("[data-quadrant-orb] strong");
  const quadrantPreview = document.querySelector("[data-quadrant-preview]");
  quadrants.forEach((quadrant) => {
    const activate = () => {
      quadrants.forEach((item) => item.classList.remove("is-active"));
      quadrant.classList.add("is-active");
      body.dataset.orbQuadrant = quadrant.dataset.index || "01";
      if (quadrantOrb) quadrantOrb.textContent = quadrant.dataset.index || "01";
      if (quadrantPreview) {
        const title = quadrant.querySelector("h3")?.textContent || "Bim Labs";
        const text = quadrant.querySelector("p")?.textContent || "";
        quadrantPreview.querySelector("strong").textContent = title;
        quadrantPreview.querySelector("p").textContent = text;
      }
    };
    quadrant.addEventListener("pointerenter", activate);
    quadrant.addEventListener("focus", activate);
  });

  const quadrantStage = document.querySelector("[data-quadrant-stage]");
  quadrantStage?.addEventListener("pointermove", (event) => {
    const rect = quadrantStage.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
    const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
    document.documentElement.style.setProperty("--orb-nudge-x", `${x}px`);
    document.documentElement.style.setProperty("--orb-nudge-y", `${y}px`);
  }, { passive: true });
  quadrantStage?.addEventListener("pointerleave", () => {
    document.documentElement.style.setProperty("--orb-nudge-x", "0px");
    document.documentElement.style.setProperty("--orb-nudge-y", "0px");
  });

  document.querySelectorAll(".bim-media img").forEach((image) => {
    const markMissing = () => image.closest(".bim-media")?.classList.add("is-missing");
    image.addEventListener("error", markMissing, { once: true });
    if (image.complete && image.naturalWidth === 0) markMissing();
  });

  const updateDividers = () => {
    document.querySelectorAll("[data-divider]").forEach((divider) => {
      const line = divider.querySelector(".bim-divider__line");
      const value = divider.querySelector(".bim-divider__value");
      if (!line || !value) return;
      value.textContent = `${Math.round(line.getBoundingClientRect().width)}px`;
    });
  };

  updateDividers();
  window.addEventListener("resize", updateDividers);

  const resizeCanvas = () => {
    if (!canvas || !ctx) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * ratio);
    canvas.height = Math.floor(window.innerHeight * ratio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };

  const createPoints = () => {
    const count = window.innerWidth < 760 ? 18 : 34;
    points = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      baseY: Math.random() * window.innerHeight,
      speed: 0.16 + Math.random() * 0.26,
      phase: Math.random() * Math.PI * 2,
      size: index % 7 === 0 ? 1.6 : 0.8,
    }));
  };

  const drawBackground = (time = 0) => {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const glow = ctx.createRadialGradient(window.innerWidth * 0.5, window.innerHeight * 0.3, 0, window.innerWidth * 0.5, window.innerHeight * 0.3, window.innerWidth * 0.62);
    glow.addColorStop(0, "rgba(47, 107, 255, 0.13)");
    glow.addColorStop(0.48, "rgba(0, 213, 255, 0.04)");
    glow.addColorStop(1, "rgba(3, 5, 10, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    points.forEach((point, index) => {
      point.x += point.speed;
      point.y = point.baseY + Math.sin(time * 0.00055 + point.phase) * 34;
      if (point.x > window.innerWidth + 40) point.x = -40;

      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      ctx.fillStyle = index % 7 === 0 ? "rgba(0, 213, 255, .32)" : "rgba(47, 107, 255, .18)";
      ctx.fill();

      const next = points[index + 1];
      if (next) {
        const distance = Math.hypot(point.x - next.x, point.y - next.y);
        if (distance < 190) {
          ctx.beginPath();
          ctx.moveTo(point.x, point.y);
          ctx.lineTo(next.x, next.y);
          ctx.strokeStyle = `rgba(0, 213, 255, ${(1 - distance / 190) * 0.13})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    rafId = window.requestAnimationFrame(drawBackground);
  };

  if (canvas && ctx && !prefersReduced) {
    resizeCanvas();
    createPoints();
    drawBackground();
    window.addEventListener("resize", () => {
      resizeCanvas();
      createPoints();
    });
  }

  const revealItems = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16 });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const showcase = document.querySelector("[data-showcase]");
  const track = document.querySelector("[data-showcase-track]");
  const cursor = document.querySelector("[data-showcase-cursor]");

  const updateShowcase = () => {
    if (!showcase || window.innerWidth <= 860) return;
    const rect = showcase.getBoundingClientRect();
    const scrollable = Math.max(showcase.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / scrollable, 0, 1);
    if (track) {
      const maxShift = Math.max(track.scrollWidth - window.innerWidth + 64, 0);
      track.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
    }
    showcase.querySelectorAll("[data-parallax]").forEach((item) => {
      const amount = Number(item.dataset.parallax || 0);
      item.style.transform = `translate3d(0, ${amount * (progress - 0.5)}px, 0) scale(${0.96 + progress * 0.04})`;
      item.style.opacity = String(0.55 + progress * 0.45);
    });
  };

  if (showcase) {
    updateShowcase();
    window.addEventListener("scroll", () => window.requestAnimationFrame(updateShowcase), { passive: true });
    window.addEventListener("resize", updateShowcase);
  }

  if (showcase && cursor) {
    showcase.addEventListener("pointerenter", () => cursor.classList.add("is-visible"));
    showcase.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
    showcase.addEventListener("pointermove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
  }

  const wheelCards = Array.from(document.querySelectorAll("[data-wheel-card]"));
  let wheelIndex = 0;
  function setWheel(index) {
    wheelCards[wheelIndex]?.classList.remove("is-active");
    wheelIndex = index;
    wheelCards[wheelIndex]?.classList.add("is-active");
    document.documentElement.style.setProperty("--wheel-rotation", `${wheelIndex * 46}deg`);
    document.querySelectorAll(".bim-wheel__tabs span").forEach((tab, tabIndex) => {
      tab.classList.toggle("is-active", tabIndex === wheelIndex);
    });
  }

  wheelCards.forEach((card, index) => {
    card.addEventListener("pointerenter", () => setWheel(index));
    card.addEventListener("focus", () => setWheel(index));
  });

  if (wheelCards.length && !prefersReduced) {
    window.setInterval(() => setWheel((wheelIndex + 1) % wheelCards.length), 2600);
  }

  window.addEventListener("beforeunload", () => {
    if (rafId) window.cancelAnimationFrame(rafId);
  });
});
