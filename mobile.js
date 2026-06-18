/* =========================================================
   BIM LABS — MOBILE-ONLY SCROLL EXPERIENCE
   Runs only at max-width: 900px. Desktop exits without doing
   anything, leaving the existing desktop JS/ScrollTrigger intact.
   ========================================================= */
(() => {
  const mobileQuery = window.matchMedia("(max-width: 900px)");
  const state = {
    active: false,
    triggers: [],
    disabledProcessTriggers: [],
    resizeHandler: null,
    orientationHandler: null,
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const getScrollTrigger = () => window.ScrollTrigger || window.gsap?.plugins?.ScrollTrigger;

  function getGsapStack() {
    const gsap = window.gsap;
    const ScrollTrigger = getScrollTrigger();

    if (!gsap || !ScrollTrigger) return null;

    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (_) {
      /* Already registered or unavailable; fail safely below if unusable. */
    }

    return { gsap, ScrollTrigger };
  }

  function initMobileShowcase({ gsap, ScrollTrigger }) {
    const section = document.querySelector("#showcaseScroll");
    const showcase = document.querySelector(".HomeShowcase");
    const frame = document.querySelector(".HomeShowcase__outerFrame");
    const track = document.querySelector(".HomeShowcase__inner, .bim-track");

    if (!section || !showcase || !frame || !track) return;

    const applyPinnedSceneSizing = () => {
      section.style.height = "100svh";
      section.style.minHeight = "540px";
      section.style.overflow = "hidden";
      showcase.style.position = "relative";
      showcase.style.top = "auto";
      showcase.style.height = "100svh";
      showcase.style.overflow = "hidden";
    };

    const getHorizontalDistance = () => {
      return Math.max(track.scrollWidth - window.innerWidth, window.innerHeight * 3.5, 2400);
    };

    const renderShowcase = (progress) => {
      const maxMove = Math.max(0, track.scrollWidth - window.innerWidth);
      const intro = clamp(progress / 0.1, 0, 1);
      const travel = clamp((progress - 0.08) / 0.72, 0, 1);
      const outro = clamp((progress - 0.82) / 0.18, 0, 1);
      const scale = progress <= 0.1 ? 0.94 + intro * 0.06 : progress >= 0.82 ? 1 - outro * 0.06 : 1;
      const opacity = progress <= 0.1 ? 0.74 + intro * 0.26 : progress >= 0.82 ? 1 - outro * 0.22 : 1;

      gsap.set(track, { x: -maxMove * travel, force3D: true });
      gsap.set(frame, { scale, opacity, force3D: true });
    };

    applyPinnedSceneSizing();
    gsap.set(track, { x: 0, force3D: true });
    gsap.set(frame, { scale: 0.94, opacity: 0.74, force3D: true });

    const trigger = ScrollTrigger.create({
      id: "mobile-showcase-horizontal",
      trigger: section,
      start: "top top",
      end: () => `+=${getHorizontalDistance()}`,
      pin: true,
      pinSpacing: true,
      scrub: 0.9,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit() {
        applyPinnedSceneSizing();
        gsap.set(track, { x: 0, force3D: true });
      },
      onUpdate(self) {
        renderShowcase(self.progress);
      },
    });

    state.triggers.push(trigger);
  }

  function disableDesktopProcessTriggers(ScrollTrigger, processSection) {
    state.disabledProcessTriggers = ScrollTrigger.getAll().filter((trigger) => {
      return trigger.trigger === processSection && !String(trigger.vars?.id || "").startsWith("mobile-");
    });

    state.disabledProcessTriggers.forEach((trigger) => trigger.disable(false));
  }

  function initMobileProcess({ gsap, ScrollTrigger }) {
    const section = document.querySelector("#process");
    const scene = section?.querySelector(".process-scene");
    const word = section?.querySelector(".process-word");
    const voidTarget = section?.querySelector(".process-void");
    const worldInside = section?.querySelector(".process-world-inside");
    const copy = section?.querySelector(".process-copy");
    const cards = [...(section?.querySelectorAll("[data-process-card]") || [])];

    if (!section || !scene || !word || !cards.length) return;

    disableDesktopProcessTriggers(ScrollTrigger, section);

    gsap.set(scene, { clearProps: "all" });
    gsap.set(word, {
      autoAlpha: 0.32,
      scale: 0.58,
      yPercent: 22,
      transformOrigin: "52% 50%",
      filter: "blur(0px)",
      force3D: true,
    });

    if (copy) {
      gsap.set(copy, { autoAlpha: 0, y: 24, force3D: true });
    }

    if (voidTarget) {
      gsap.set(voidTarget, { autoAlpha: 0, scale: 0.16, transformOrigin: "50% 50%", force3D: true });
    }

    if (worldInside) {
      worldInside.setAttribute("aria-hidden", "true");
      gsap.set(worldInside, {
        autoAlpha: 0,
        visibility: "hidden",
        clipPath: "circle(0% at 51.8% 50%)",
        webkitClipPath: "circle(0% at 51.8% 50%)",
        y: 36,
        scale: 0.9,
        filter: "blur(9px)",
        pointerEvents: "none",
        transformOrigin: "51.8% 50%",
        force3D: true,
      });
    }

    gsap.set(cards, {
      autoAlpha: 0,
      y: 86,
      scale: 0.96,
      transformOrigin: "50% 50%",
      force3D: true,
    });

    const timeline = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        id: "mobile-process-sequence",
        trigger: section,
        start: "top top",
        end: () => `+=${Math.max(window.innerHeight * 5.8, 4200)}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
      },
    });

    timeline
      .to(word, { autoAlpha: 0.94, scale: 1, yPercent: 0, letterSpacing: "-0.085em", duration: 0.12 }, 0)
      .to(copy, { autoAlpha: 1, y: 0, duration: 0.1 }, 0.04)
      .to(copy, { autoAlpha: 0, y: -22, duration: 0.08 }, 0.16)
      .to(word, { scale: 1.08, duration: 0.1 }, 0.18);

    cards.forEach((card, index) => {
      const start = 0.24 + index * 0.135;
      timeline
        .to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.075 }, start)
        .to(card, { autoAlpha: 1, y: 0, scale: 1, duration: 0.045 }, start + 0.075)
        .to(card, { autoAlpha: 0, y: -72, scale: 0.985, duration: 0.075 }, start + 0.12);
    });

    timeline
      .to(word, { scale: 1.34, xPercent: -0.4, autoAlpha: 0.92, duration: 0.07 }, 0.8)
      .to(voidTarget, { autoAlpha: 0.52, scale: 0.82, duration: 0.06 }, 0.81)
      .to(worldInside, {
        autoAlpha: 1,
        visibility: "visible",
        clipPath: "circle(3% at 51.8% 50%)",
        webkitClipPath: "circle(3% at 51.8% 50%)",
        y: 22,
        scale: 0.92,
        filter: "blur(6px)",
        duration: 0.06,
      }, 0.82)
      .to(word, { scale: 2.35, xPercent: -2.4, autoAlpha: 0.82, filter: "blur(0.4px)", duration: 0.08 }, 0.875)
      .to(voidTarget, { autoAlpha: 0.78, scale: 2.7, duration: 0.08 }, 0.875)
      .to(worldInside, {
        clipPath: "circle(16% at 51.8% 50%)",
        webkitClipPath: "circle(16% at 51.8% 50%)",
        y: 10,
        scale: 0.96,
        filter: "blur(3px)",
        duration: 0.08,
      }, 0.89)
      .to(word, { scale: 6.2, xPercent: -7.2, autoAlpha: 0.36, filter: "blur(4px)", duration: 0.09 }, 0.95)
      .to(voidTarget, { autoAlpha: 0.58, scale: 8, duration: 0.09 }, 0.95)
      .to(worldInside, {
        clipPath: "circle(58% at 51.8% 50%)",
        webkitClipPath: "circle(58% at 51.8% 50%)",
        y: 2,
        scale: 0.992,
        filter: "blur(1px)",
        duration: 0.09,
      }, 0.96)
      .to(word, { scale: 11, xPercent: -12.5, autoAlpha: 0, filter: "blur(12px)", duration: 0.1 }, 1.02)
      .to(voidTarget, { autoAlpha: 0, scale: 15.5, duration: 0.1 }, 1.02)
      .to(worldInside, {
        clipPath: "circle(155% at 51.8% 50%)",
        webkitClipPath: "circle(155% at 51.8% 50%)",
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 0.12,
      }, 1.025);

    state.triggers.push(timeline.scrollTrigger);
  }

  function refreshMobileScenes() {
    const stack = getGsapStack();
    if (!stack || !state.active) return;
    stack.ScrollTrigger.refresh();
  }

  function activate() {
    if (state.active || !mobileQuery.matches) return;

    const stack = getGsapStack();
    if (!stack) return;

    state.active = true;
    document.body.classList.add("mobile-js-active");

    initMobileShowcase(stack);
    initMobileProcess(stack);

    state.resizeHandler = () => refreshMobileScenes();
    state.orientationHandler = () => window.setTimeout(refreshMobileScenes, 220);

    window.addEventListener("resize", state.resizeHandler, { passive: true });
    window.addEventListener("orientationchange", state.orientationHandler, { passive: true });
    window.addEventListener("load", state.resizeHandler, { passive: true, once: true });

    window.requestAnimationFrame(() => stack.ScrollTrigger.refresh());
  }

  function deactivate() {
    if (!state.active) return;

    const stack = getGsapStack();

    state.triggers.forEach((trigger) => trigger?.kill?.());
    state.triggers = [];

    state.disabledProcessTriggers.forEach((trigger) => trigger.enable?.());
    state.disabledProcessTriggers = [];

    window.removeEventListener("resize", state.resizeHandler);
    window.removeEventListener("orientationchange", state.orientationHandler);
    state.resizeHandler = null;
    state.orientationHandler = null;
    state.active = false;
    document.body.classList.remove("mobile-js-active");

    if (stack) {
      stack.gsap.set([
        "#showcaseScroll",
        ".HomeShowcase",
        ".HomeShowcase__outerFrame",
        ".HomeShowcase__inner",
        ".bim-track",
        ".process-word",
        ".process-copy",
        ".process-void",
        ".process-world-inside",
        ".process-card",
      ], { clearProps: "all" });

      stack.ScrollTrigger.refresh();
    }
  }

  function handleQueryChange(event) {
    if (event.matches) activate();
    else deactivate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", activate, { once: true });
  } else {
    activate();
  }

  mobileQuery.addEventListener?.("change", handleQueryChange);
})();
