(() => {
  const section = document.querySelector(".bim-process");
  if (!section) return;

  const intro = section.querySelector(".process-intro");
  const footer = section.querySelector(".process-footer");
  const cards = Array.from(section.querySelectorAll(".process-card"));

  if (!cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 1080px)");

  const limitValue = (value, min, max) => Math.min(Math.max(value, min), max);

  const smoothStep = (value) => {
    const x = limitValue(value, 0, 1);
    return x * x * (3 - 2 * x);
  };

  const mapRange = (value, inMin, inMax, outMin, outMax) => {
    const progress = limitValue((value - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * progress;
  };

  const lerp = (current, target, ease) => {
    return current + (target - current) * ease;
  };

  let targetProgress = 0;
  let smoothProgress = 0;
  let rafId = null;

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
      card.style.removeProperty("--plate-grow");
      card.style.removeProperty("--plate-opacity");
      card.style.removeProperty("--card-rise");
      card.style.removeProperty("--card-width");
      card.style.removeProperty("--content-opacity");
      card.style.removeProperty("--content-y");
      card.classList.remove("is-current");
    });
  };

  const readScroll = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const scrollable = Math.max(rect.height - viewportHeight, 1);

    targetProgress = limitValue(-rect.top / scrollable, 0, 1);
  };

  const render = () => {
    if (reduceMotion.matches || mobileQuery.matches) {
      reset();
      rafId = null;
      return;
    }

    smoothProgress = lerp(smoothProgress, targetProgress, 0.075);

    const progress = smoothProgress;

    if (intro) {
      const introOpacity = mapRange(progress, 0.14, 0.58, 1, 0.24);
      const introY = mapRange(progress, 0.14, 0.58, 0, -36);

      intro.style.setProperty("--intro-opacity", introOpacity.toFixed(4));
      intro.style.setProperty("--intro-y", `${introY.toFixed(2)}px`);
    }

    const activeIndex = Math.min(
      cards.length - 1,
      Math.floor(mapRange(progress, 0.12, 0.86, 0, cards.length))
    );

    cards.forEach((card, index) => {
      const start = 0.1 + index * 0.16;
      const plateStart = start - 0.055;
      const end = start + 0.25;

      const plateRaw = mapRange(progress, plateStart, end - 0.04, 0, 1);
      const growRaw = mapRange(progress, start, end, 0, 1);
      const contentRaw = mapRange(progress, start + 0.115, end + 0.08, 0, 1);

      const plateGrow = smoothStep(plateRaw);
      const grow = smoothStep(growRaw);
      const content = smoothStep(contentRaw);

      const rise = mapRange(grow, 0, 1, 58, 0);
      const width = mapRange(grow, 0, 1, 0.95, 1);
      const contentY = mapRange(content, 0, 1, 30, 0);

      card.style.setProperty("--plate-grow", plateGrow.toFixed(4));
      card.style.setProperty("--plate-opacity", mapRange(plateGrow, 0, 1, 0, 1).toFixed(4));

      card.style.setProperty("--grow", grow.toFixed(4));
      card.style.setProperty("--card-rise", `${rise.toFixed(2)}px`);
      card.style.setProperty("--card-width", width.toFixed(4));

      card.style.setProperty("--content-opacity", content.toFixed(4));
      card.style.setProperty("--content-y", `${contentY.toFixed(2)}px`);

      if (index === activeIndex && grow > 0.36) {
        card.classList.add("is-current");
      } else {
        card.classList.remove("is-current");
      }
    });

    if (footer) {
      const footerRaw = mapRange(progress, 0.8, 0.97, 0, 1);
      const footerProgress = smoothStep(footerRaw);

      footer.style.setProperty("--footer-opacity", footerProgress.toFixed(4));
      footer.style.setProperty(
        "--footer-y",
        `${mapRange(footerProgress, 0, 1, 18, 0).toFixed(2)}px`
      );
    }

    if (Math.abs(targetProgress - smoothProgress) > 0.001) {
      rafId = window.requestAnimationFrame(render);
    } else {
      smoothProgress = targetProgress;
      rafId = null;
    }
  };

  const requestRender = () => {
    readScroll();

    if (!rafId) {
      rafId = window.requestAnimationFrame(render);
    }
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);

  reduceMotion.addEventListener?.("change", requestRender);
  mobileQuery.addEventListener?.("change", requestRender);

  requestRender();
})();
