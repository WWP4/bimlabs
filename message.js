// message.js
// Safe Section 2 reveal.
// Yellow is underneath. Cream/content reveals downward on top.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  ready(() => {
    const hero = document.querySelector("#hero");
    const message = document.querySelector("#message");
    const bridge = document.querySelector("#calling-bridge");

    if (!hero || !message) {
      console.warn("Missing #hero or #message");
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      console.warn("GSAP or ScrollTrigger is missing");
      message.style.setProperty("--creamReveal", "100%");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Prevent duplicate triggers if this file gets loaded twice.
    ScrollTrigger.getAll().forEach((trigger) => {
      if (
        trigger.vars &&
        trigger.vars.id &&
        String(trigger.vars.id).startsWith("message-")
      ) {
        trigger.kill();
      }
    });

    // Remove older transition leftovers.
    document
      .querySelectorAll(
        ".hero-message-transition, .hero-garage-transition, .calling-yellow-wash"
      )
      .forEach((el) => el.remove());

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // 0% = cream closed / yellow showing.
    // 100% = cream fully revealed.
    gsap.set(message, { "--creamReveal": "0%" });

    if (reducedMotion) {
      gsap.set(message, { "--creamReveal": "100%" });
      return;
    }

    const heroExitTargets = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band")
    ].filter(Boolean);

    if (heroExitTargets.length) {
      gsap.to(heroExitTargets, {
        autoAlpha: 0,
        y: -34,
        ease: "none",
        scrollTrigger: {
          id: "message-hero-exit",
          trigger: hero,
          start: "55% top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }

    const heroImage = document.querySelector(".hero__bg img");

    if (heroImage) {
      gsap.to(heroImage, {
        scale: 1.045,
        y: -30,
        ease: "none",
        scrollTrigger: {
          id: "message-hero-image",
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }

    // Main reverse-garage reveal:
    // Section pins, yellow sits behind, cream/content opens downward on top.
    gsap
      .timeline({
        scrollTrigger: {
          id: "message-cream-reveal",
          trigger: message,
          start: "top top",
          end: () => (window.innerWidth <= 768 ? "+=90%" : "+=115%"),
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      })
      .to(message, {
        "--creamReveal": "100%",
        duration: 1,
        ease: "none"
      })
      .to({}, { duration: 0.08 });

    // Section 3 soft entrance.
    if (bridge) {
      gsap.from("#calling-bridge .bridge-label", {
        autoAlpha: 0,
        y: 24,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          id: "message-bridge-label",
          trigger: bridge,
          start: "top 72%",
          once: true
        }
      });

      gsap.from("#calling-bridge .calling-center h2", {
        autoAlpha: 0,
        y: 46,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          id: "message-bridge-title",
          trigger: bridge,
          start: "top 56%",
          once: true
        }
      });

      gsap.from("#calling-bridge .calling-line", {
        scaleY: 0,
        transformOrigin: "top",
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          id: "message-bridge-line",
          trigger: bridge,
          start: "top 48%",
          once: true
        }
      });

      gsap.from("#calling-bridge .calling-marker", {
        autoAlpha: 0,
        x: 18,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          id: "message-bridge-marker",
          trigger: bridge,
          start: "top 50%",
          once: true
        }
      });
    }

    const refresh = () => ScrollTrigger.refresh();

    window.addEventListener("load", refresh, { once: true });
    window.addEventListener("resize", refresh);

    requestAnimationFrame(refresh);
  });
})();
