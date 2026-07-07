// message.js
// Real Section 2 reveal:
// cream is final section, branded yellow is the reveal layer on top.

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

    // Remove old transition systems
    document.querySelectorAll(".hero-message-transition").forEach((el) => el.remove());
    document.querySelectorAll(".hero-garage-transition").forEach((el) => el.remove());
    document.querySelectorAll(".calling-yellow-wash").forEach((el) => el.remove());

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Yellow starts fully covering Section 2
    gsap.set(calling, {
      "--yellowCover": "0%"
    });

    if (reducedMotion) {
      gsap.set(calling, {
        "--yellowCover": "100%"
      });
      return;
    }

    // Hero softly exits as Section 2 approaches
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
      Main reveal:
      Yellow layer starts covering the cream section.
      As the user scrolls, yellow clips downward and disappears.
      Cream Section 2 is revealed underneath.
    */
    gsap.timeline({
      scrollTrigger: {
        trigger: calling,
        start: "top top",
        end: () => window.innerWidth <= 768 ? "+=95%" : "+=125%",
        scrub: 1.05,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    })
    .to(calling, {
      "--yellowCover": "100%",
      duration: 1,
      ease: "none"
    })
    .to({}, { duration: 0.12 });

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
