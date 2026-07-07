// message.js
// Real Section 2 reveal:
// yellow is behind, cream/content reveal downward over it

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

    // Kill old transition systems
    document.querySelectorAll(".hero-message-transition").forEach((el) => el.remove());
    document.querySelectorAll(".hero-garage-transition").forEach((el) => el.remove());
    document.querySelectorAll(".calling-yellow-wash").forEach((el) => el.remove());

    // Real section starts hidden by cream reveal mask
    gsap.set(calling, {
      "--creamReveal": "100%"
    });

    if (reducedMotion) {
      gsap.set(calling, {
        "--creamReveal": "0%"
      });
      return;
    }

    // Hero softly leaves as user scrolls toward Section 2
    const heroContent = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band")
    ].filter(Boolean);

    if (heroContent.length) {
      gsap.to(heroContent, {
        autoAlpha: 0,
        y: -38,
        ease: "none",
        scrollTrigger: {
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
        scale: 1.055,
        y: -42,
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
      Main reveal:
      - Section 2 reaches the screen as yellow
      - Page pins
      - Cream/content opens downward over yellow
      - Once reveal is complete, yellow is hidden underneath
    */
    const revealTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: calling,
        start: "top top",
        end: "+=115%",
        scrub: 1.1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    revealTimeline
      .to(calling, {
        "--creamReveal": "0%",
        duration: 1,
        ease: "none"
      })
      .to({}, { duration: 0.15 });

    // Section 3 reveal
    if (bridge) {
      gsap.from("#calling-bridge .bridge-label", {
        autoAlpha: 0,
        y: 24,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
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
