(() => {
  const section = document.querySelector(".bim-process");
  if (!section) return;

  const shell = section.querySelector(".process-shell");
  const intro = section.querySelector(".process-intro");
  const board = section.querySelector(".process-board");
  const footer = section.querySelector(".process-footer");
  const cards = Array.from(section.querySelectorAll(".process-card"));

  if (!shell || !board || !cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 1080px)");

  const limitValue = (value, min, max) => {
    return Math.min(Math.max(value, min), max);
  };

  const smoothStep = (value) => {
    const x = limitValue(value, 0, 1);
    return x * x * (3 - 2 * x);
  };

  const mapRange = (value, inMin, inMax, outMin, outMax) => {
    const progress = limitValue((value - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * progress;
  };

  let ticking = false;

  const setCardState = (card, progress, index, activeIndex) => {
    const eased = smoothStep(progress);

    const y = mapRange(eased, 0, 1, 96, 0);
    const scale = mapRange(eased, 0, 1, 0.88, 1);
    const opacity = mapRange(eased, 0, 1, 0.2, 1);

    card.style.setProperty("--card-progress", eased.toFixed(4));
    card.style.setProperty("--card-y", `${y.toFixed(2)}px`);
    card.style.setProperty("--card-scale", scale.toFixed(4));
    card.style.setProperty("--card-opacity", opacity.toFixed(4));

    if (index === activeIndex) {
      card.classList.add("is-current");
    } else {
      card.classList.remove("is-current");
    }
  };

  const resetForMobile = () => {
    section.style.removeProperty("--process-progress");
    shell.style.removeProperty("--process-opacity");
    shell.style.removeProperty("--process-y");
    shell.style.removeProperty("--process-scale");

    if (intro) {
      intro.style.removeProperty("--intro-opacity");
      intro.style.removeProperty("--intro-y");
    }

    if (board) {
      board.style.removeProperty("--board-y");
    }

    if (footer) {
      footer.style.removeProperty("--footer-opacity");
      footer.style.removeProperty("--footer-y");
    }

    cards.forEach((card) => {
      card.style.removeProperty("--card-progress");
      card.style.removeProperty("--card-y");
      card.style.removeProperty("--card-scale");
      card.style.removeProperty("--card-opacity");
      card.classList.remove("is-current");
    });
  };

  const updateProcessScroll = () => {
    ticking = false;

    if (reduceMotion.matches || mobileQuery.matches) {
      resetForMobile();
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    const scrollable = Math.max(rect.height - viewportHeight, 1);
    const rawProgress = limitValue(-rect.top / scrollable, 0, 1);
    const easedProgress = smoothStep(rawProgress);

    section.style.setProperty("--process-progress", easedProgress.toFixed(4));

    const entranceProgress = smoothStep(mapRange(rawProgress, 0, 0.16, 0, 1));
    const exitProgress = smoothStep(mapRange(rawProgress, 0.88, 1, 0, 1));

    const shellOpacity = mapRange(entranceProgress, 0, 1, 0.2, 1) * mapRange(exitProgress, 0, 1, 1, 0.18);
    const shellY = mapRange(entranceProgress, 0, 1, 70, 0) + mapRange(exitProgress, 0, 1, 0, -42);
    const shellScale = mapRange(entranceProgress, 0, 1, 0.965, 1) - mapRange(exitProgress, 0, 1, 0, 0.025);

    shell.style.setProperty("--process-opacity", shellOpacity.toFixed(4));
    shell.style.setProperty("--process-y", `${shellY.toFixed(2)}px`);
    shell.style.setProperty("--process-scale", shellScale.toFixed(4));

    if (intro) {
      const introFade = mapRange(rawProgress, 0.26, 0.72, 1, 0.28);
      const introY = mapRange(rawProgress, 0.26, 0.72, 0, -34);

      intro.style.setProperty("--intro-opacity", introFade.toFixed(4));
      intro.style.setProperty("--intro-y", `${introY.toFixed(2)}px`);
    }

    if (board) {
      const boardY = mapRange(rawProgress, 0, 1, 38, -18);
      board.style.setProperty("--board-y", `${boardY.toFixed(2)}px`);
    }

    if (footer) {
      const footerOpacity = mapRange(rawProgress, 0.48, 0.92, 0.28, 1);
      const footerY = mapRange(rawProgress, 0.48, 0.92, 18, 0);

      footer.style.setProperty("--footer-opacity", footerOpacity.toFixed(4));
      footer.style.setProperty("--footer-y", `${footerY.toFixed(2)}px`);
    }

    const activeIndex = Math.min(
      cards.length - 1,
      Math.floor(mapRange(rawProgress, 0.18, 0.88, 0, cards.length))
    );

    cards.forEach((card, index) => {
      const start = 0.1 + index * 0.13;
      const end = start + 0.38;
      const cardProgress = mapRange(rawProgress, start, end, 0, 1);

      setCardState(card, cardProgress, index, activeIndex);
    });
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateProcessScroll);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  reduceMotion.addEventListener?.("change", requestUpdate);
  mobileQuery.addEventListener?.("change", requestUpdate);

  cards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      if (mobileQuery.matches || reduceMotion.matches) return;

      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 100;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 100;

      card.style.setProperty("--hover-x", `${x.toFixed(2)}%`);
      card.style.setProperty("--hover-y", `${y.toFixed(2)}%`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--hover-x");
      card.style.removeProperty("--hover-y");
    });
  });

  requestUpdate();
})();
