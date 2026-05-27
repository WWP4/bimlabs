(() => {
  const section = document.querySelector(".bim-process");
  if (!section) return;

  const shell = section.querySelector(".process-shell");
  const intro = section.querySelector(".process-intro");
  const footer = section.querySelector(".process-footer");
  const cards = Array.from(section.querySelectorAll(".process-card"));

  if (!shell || !cards.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobileQuery = window.matchMedia("(max-width: 1080px)");

  const pClamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

  const smoothStep = (value) => {
    const x = pClamp(value);
    return x * x * (3 - 2 * x);
  };

  const map = (value, inMin, inMax, outMin, outMax) => {
    const progress = pClamp((value - inMin) / (inMax - inMin));
    return outMin + (outMax - outMin) * progress;
  };

  const lerp = (current, target, ease) => current + (target - current) * ease;

  let targetProgress = 0;
  let currentProgress = 0;
  let raf = null;

  const setReadyState = () => {
    section.style.setProperty("--process-progress", "1");

    if (intro) {
      intro.style.setProperty("--intro-opacity", "1");
      intro.style.setProperty("--intro-y", "0px");
    }

    if (footer) {
      footer.style.setProperty("--footer-opacity", "1");
      footer.style.setProperty("--footer-y", "0px");
    }

    cards.forEach((card) => {
      card.style.setProperty("--plate-clip", "0%");
      card.style.setProperty("--plate-opacity", "1");
      card.style.setProperty("--plate-y", "0px");

      card.style.setProperty("--grow-clip", "0%");
      card.style.setProperty("--face-y", "0px");
      card.style.setProperty("--face-opacity", "1");

      card.style.setProperty("--image-opacity", ".78");
      card.style.setProperty("--content-opacity", "1");
      card.style.setProperty("--content-y", "0px");
      card.style.setProperty("--line-scale", "1");

      card.classList.remove("is-current");
    });
  };

  const readScroll = () => {
    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const scrollable = Math.max(rect.height - viewport, 1);

    targetProgress = pClamp(-rect.top / scrollable);
  };

  const render = () => {
    if (reduceMotion.matches || mobileQuery.matches) {
      setReadyState();
      raf = null;
      return;
    }

    currentProgress = lerp(currentProgress, targetProgress, 0.095);

    const progress = currentProgress;
    section.style.setProperty("--process-progress", progress.toFixed(4));

    const introFade = smoothStep(map(progress, 0.12, 0.42, 0, 1));

    if (intro) {
      intro.style.setProperty("--intro-opacity", (1 - introFade * 0.72).toFixed(4));
      intro.style.setProperty("--intro-y", `${(-26 * introFade).toFixed(2)}px`);
    }

    const activeIndex = Math.min(
      cards.length - 1,
      Math.max(0, Math.floor(map(progress, 0.18, 0.88, 0, cards.length)))
    );

    cards.forEach((card, index) => {
      const start = 0.16 + index * 0.155;
      const plateStart = start - 0.06;
      const end = start + 0.225;
      const contentStart = start + 0.09;
      const contentEnd = end + 0.08;

      const plate = smoothStep(map(progress, plateStart, end - 0.04, 0, 1));
      const grow = smoothStep(map(progress, start, end, 0, 1));
      const content = smoothStep(map(progress, contentStart, contentEnd, 0, 1));

      const plateClip = (1 - plate) * 100;
      const growClip = (1 - grow) * 100;

      const plateY = map(plate, 0, 1, 34, 0);
      const faceY = map(grow, 0, 1, 54, 0);
      const contentY = map(content, 0, 1, 24, 0);

      card.style.setProperty("--plate-clip", `${plateClip.toFixed(2)}%`);
      card.style.setProperty("--plate-opacity", plate.toFixed(4));
      card.style.setProperty("--plate-y", `${plateY.toFixed(2)}px`);

      card.style.setProperty("--grow-clip", `${growClip.toFixed(2)}%`);
      card.style.setProperty("--face-y", `${faceY.toFixed(2)}px`);
      card.style.setProperty("--face-opacity", grow.toFixed(4));

      card.style.setProperty("--image-opacity", map(grow, 0, 1, 0, 0.82).toFixed(4));
      card.style.setProperty("--content-opacity", content.toFixed(4));
      card.style.setProperty("--content-y", `${contentY.toFixed(2)}px`);
      card.style.setProperty("--line-scale", grow.toFixed(4));

      if (index === activeIndex && grow > 0.55) {
        card.classList.add("is-current");
      } else {
        card.classList.remove("is-current");
      }
    });

    if (footer) {
      const footerIn = smoothStep(map(progress, 0.78, 0.94, 0, 1));
      footer.style.setProperty("--footer-opacity", footerIn.toFixed(4));
      footer.style.setProperty("--footer-y", `${map(footerIn, 0, 1, 18, 0).toFixed(2)}px`);
    }

    if (Math.abs(targetProgress - currentProgress) > 0.0008) {
      raf = window.requestAnimationFrame(render);
    } else {
      currentProgress = targetProgress;
      raf = null;
    }
  };

  const requestRender = () => {
    readScroll();

    if (!raf) {
      raf = window.requestAnimationFrame(render);
    }
  };

  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);

  reduceMotion.addEventListener?.("change", requestRender);
  mobileQuery.addEventListener?.("change", requestRender);

  requestRender();
})();
