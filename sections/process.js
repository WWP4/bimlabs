(() => {
  const section = document.querySelector(".bim-process");
  if (!section) return;

  const intro = section.querySelector(".process-intro");
  const footer = section.querySelector(".process-footer");
  const cards = Array.from(section.querySelectorAll(".process-card"));

  if (!cards.length) return;

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

  const reset = () => {
    if (intro) {
      intro.style.removeProperty("--intro-opacity");
      intro.style.removeProperty("--intro-y");
    }

    if (footer) {
      footer.style.removeProperty("--footer-opacity");
      footer.style.removeProperty("--footer-y");
    }

    cards.forEach((card) => {
      card.style.removeProperty("--grow");
      card.style.removeProperty("--card-opacity");
      card.style.removeProperty("--card-rise");
      card.style.removeProperty("--card-width");
      card.style.removeProperty("--content-opacity");
      card.style.removeProperty("--content-y");
      card.classList.remove("is-current");
    });
  };

  const update = () => {
    ticking = false;

    if (reduceMotion.matches || mobileQuery.matches) {
      reset();
      return;
    }

    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollable = Math.max(rect.height - viewportHeight, 1);

    const progress = limitValue(-rect.top / scrollable, 0, 1);

    if (intro) {
      const introOpacity = mapRange(progress, 0.16, 0.54, 1, 0.28);
      const introY = mapRange(progress, 0.16, 0.54, 0, -34);

      intro.style.setProperty("--intro-opacity", introOpacity.toFixed(4));
      intro.style.setProperty("--intro-y", `${introY.toFixed(2)}px`);
    }

    const activeIndex = Math.min(
      cards.length - 1,
      Math.floor(mapRange(progress, 0.12, 0.82, 0, cards.length))
    );

    cards.forEach((card, index) => {
      const start = 0.1 + index * 0.16;
      const end = start + 0.22;

      const growRaw = mapRange(progress, start, end, 0, 1);
      const grow = smoothStep(growRaw);

      const contentRaw = mapRange(progress, start + 0.1, end + 0.08, 0, 1);
      const content = smoothStep(contentRaw);

      const rise = mapRange(grow, 0, 1, 54, 0);
      const width = mapRange(grow, 0, 1, 0.94, 1);
      const opacity = mapRange(grow, 0, 1, 0, 1);
      const contentY = mapRange(content, 0, 1, 28, 0);

      card.style.setProperty("--grow", grow.toFixed(4));
      card.style.setProperty("--card-opacity", opacity.toFixed(4));
      card.style.setProperty("--card-rise", `${rise.toFixed(2)}px`);
      card.style.setProperty("--card-width", width.toFixed(4));
      card.style.setProperty("--content-opacity", content.toFixed(4));
      card.style.setProperty("--content-y", `${contentY.toFixed(2)}px`);

      if (index === activeIndex && grow > 0.4) {
        card.classList.add("is-current");
      } else {
        card.classList.remove("is-current");
      }
    });

    if (footer) {
      const footerRaw = mapRange(progress, 0.78, 0.96, 0, 1);
      const footerProgress = smoothStep(footerRaw);

      footer.style.setProperty("--footer-opacity", footerProgress.toFixed(4));
      footer.style.setProperty("--footer-y", `${mapRange(footerProgress, 0, 1, 18, 0).toFixed(2)}px`);
    }
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  reduceMotion.addEventListener?.("change", requestUpdate);
  mobileQuery.addEventListener?.("change", requestUpdate);

  requestUpdate();
})();
