document.addEventListener("DOMContentLoaded", () => {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector("[data-header]");
  const heroContent = document.querySelector("[data-hero-content]");
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas?.getContext("2d");
  let points = [];
  let rafId = 0;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

  updateHeaderAndHero();
  window.addEventListener("scroll", () => window.requestAnimationFrame(updateHeaderAndHero), { passive: true });

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
  quadrants.forEach((quadrant) => {
    const activate = () => {
      quadrants.forEach((item) => item.classList.remove("is-active"));
      quadrant.classList.add("is-active");
    };
    quadrant.addEventListener("pointerenter", activate);
    quadrant.addEventListener("focus", activate);
  });

  document.querySelectorAll(".bim-media img").forEach((image) => {
    const markMissing = () => image.closest(".bim-media")?.classList.add("is-missing");
    image.addEventListener("error", markMissing, { once: true });
    if (image.complete && image.naturalWidth === 0) markMissing();
  });

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
    if (!showcase || !track || window.innerWidth <= 860) return;
    const rect = showcase.getBoundingClientRect();
    const scrollable = Math.max(showcase.offsetHeight - window.innerHeight, 1);
    const progress = clamp(-rect.top / scrollable, 0, 1);
    const maxShift = Math.max(track.scrollWidth - window.innerWidth + 64, 0);
    track.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
  };

  if (showcase && track) {
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
  const setWheel = (index) => {
    wheelCards[wheelIndex]?.classList.remove("is-active");
    wheelIndex = index;
    wheelCards[wheelIndex]?.classList.add("is-active");
  };

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
