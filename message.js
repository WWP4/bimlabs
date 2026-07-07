// message.js
// Real Section 2 reverse-garage reveal:
// yellow underneath, cream/content reveal downward over it.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  ready(() => {
    const hero = document.querySelector("#hero");
    const calling = document.querySelector("#calling");
    const bridge = document.querySelector("#calling-bridge");

    if (!hero || !calling) {
      console.warn("Missing #hero or #calling");
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      console.warn("GSAP or ScrollTrigger is missing");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Remove old transition systems from previous attempts
    document.querySelectorAll(".hero-message-transition").forEach((el) => el.remove());
    document.querySelectorAll(".hero-garage-transition").forEach((el) => el.remove());
    document.querySelectorAll(".calling-yellow-wash").forEach((el) => el.remove());

    // Kill only these message-section triggers if script reloads during dev
    ["messageHeroSoftExit", "messageCallingReveal", "messageBridgeLabel", "messageBridgeTitle", "messageBridgeLine", "messageBridgeMarker"].forEach((id) => {
      const trigger = ScrollTrigger.getById(id);
      if (trigger) trigger.kill();
    });

    // Start Section 2 hidden, with yellow visible underneath
    gsap.set(calling, {
      "--creamReveal": "100%"
    });

    if (reducedMotion) {
      gsap.set(calling, {
        "--creamReveal": "0%"
      });
      return;
    }

    // Hero softly leaves before the reveal
    const heroExitTargets = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band")
    ].filter(Boolean);

    if (heroExitTargets.length) {
      gsap.to(heroExitTargets, {
        autoAlpha: 0,
        y: -36,
        ease: "none",
        scrollTrigger: {
          id: "messageHeroSoftExit",
          trigger: hero,
          start: "58% top",
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
        y: -34,
        ease: "none",
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }

    /*
      THE REAL REVEAL:
      #calling itself is yellow.
      Its cream background + real .calling-inner content are clipped.
      On scroll, the cream/content reveal downward over the yellow.
    */
    const revealTl = gsap.timeline({
      scrollTrigger: {
        id: "messageCallingReveal",
        trigger: calling,
        start: "top top",
        end: () => window.innerWidth <= 768 ? "+=95%" : "+=125%",
        scrub: 1.05,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    revealTl
      .to(calling, {
        "--creamReveal": "0%",
        duration: 1,
        ease: "none"
      })
      .to({}, { duration: 0.14 });

    // Section 3 reveal
    if (bridge) {
      gsap.from("#calling-bridge .bridge-label", {
        autoAlpha: 0,
        y: 24,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          id: "messageBridgeLabel",
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
          id: "messageBridgeTitle",
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
          id: "messageBridgeLine",
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
          id: "messageBridgeMarker",
          trigger: bridge,
          start: "top 50%",
          once: true
        }
      });
    }

    window.addEventListener("resize", () => {
      ScrollTrigger.refresh();
    });

    ScrollTrigger.refresh();
  });
})();
