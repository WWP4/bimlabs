document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("[data-site-header]");
  const canvas = document.getElementById("background-canvas");
  const ctx = canvas?.getContext("2d");
  let particles = [];
  let animationFrame;

  const setHeaderState = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const setPointerVars = (element, event) => {
    const rect = element.getBoundingClientRect();
    element.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    element.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  document.querySelectorAll(".magnetic, .quadrant").forEach((element) => {
    element.addEventListener("pointermove", (event) => setPointerVars(element, event));
  });

  document.querySelectorAll(".media-fallback img").forEach((image) => {
    const markMissing = () => image.closest(".media-fallback")?.classList.add("is-missing");
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

  const createParticles = () => {
    const count = window.innerWidth < 760 ? 28 : 56;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.18,
      r: Math.random() * 1.65 + 0.35,
      a: Math.random() * 0.28 + 0.06,
    }));
  };

  const drawBackground = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    const gradient = ctx.createRadialGradient(window.innerWidth * 0.5, window.innerHeight * 0.32, 0, window.innerWidth * 0.5, window.innerHeight * 0.32, window.innerWidth * 0.62);
    gradient.addColorStop(0, "rgba(47, 107, 255, 0.11)");
    gradient.addColorStop(0.48, "rgba(0, 213, 255, 0.035)");
    gradient.addColorStop(1, "rgba(3, 5, 10, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -30) particle.x = window.innerWidth + 30;
      if (particle.x > window.innerWidth + 30) particle.x = -30;
      if (particle.y < -30) particle.y = window.innerHeight + 30;
      if (particle.y > window.innerHeight + 30) particle.y = -30;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 213, 255, ${particle.a})`;
      ctx.fill();

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150) {
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(47, 107, 255, ${(1 - distance / 150) * 0.12})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    });

    animationFrame = window.requestAnimationFrame(drawBackground);
  };

  if (canvas && ctx && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    resizeCanvas();
    createParticles();
    drawBackground();
    window.addEventListener("resize", () => {
      resizeCanvas();
      createParticles();
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
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

  const reel = document.querySelector("[data-showcase-reel]");
  const showcase = document.querySelector(".HomeShowcase");
  const cursor = document.querySelector("[data-showcase-cursor]");

  const updateReel = () => {
    if (!reel || !showcase || window.innerWidth <= 860) return;
    const rect = showcase.getBoundingClientRect();
    const distance = Math.max(0, showcase.offsetHeight - window.innerHeight);
    const progress = Math.min(Math.max(-rect.top / Math.max(distance, 1), 0), 1);
    const maxShift = Math.max(0, reel.scrollWidth - window.innerWidth + 48);
    reel.style.transform = `translate3d(${-progress * maxShift}px, 0, 0)`;
  };

  if (reel && showcase) {
    window.addEventListener("scroll", () => window.requestAnimationFrame(updateReel), { passive: true });
    window.addEventListener("resize", updateReel);
    updateReel();
  }

  if (showcase && cursor) {
    showcase.addEventListener("pointerenter", () => cursor.classList.add("is-visible"));
    showcase.addEventListener("pointerleave", () => cursor.classList.remove("is-visible"));
    showcase.addEventListener("pointermove", (event) => {
      cursor.style.left = `${event.clientX}px`;
      cursor.style.top = `${event.clientY}px`;
    });
  }

  const wheelBlocks = Array.from(document.querySelectorAll("[data-wheel-block]"));
  let activeWheel = 0;
  if (wheelBlocks.length) {
    window.setInterval(() => {
      wheelBlocks[activeWheel]?.classList.remove("is-active");
      activeWheel = (activeWheel + 1) % wheelBlocks.length;
      wheelBlocks[activeWheel]?.classList.add("is-active");
    }, 2200);
    wheelBlocks.forEach((block, index) => {
      block.addEventListener("pointerenter", () => {
        wheelBlocks[activeWheel]?.classList.remove("is-active");
        activeWheel = index;
        block.classList.add("is-active");
      });
    });
  }

  window.addEventListener("beforeunload", () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
  });
});
