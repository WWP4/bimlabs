// message.js
// Hero → Section 2 yellow reveal → yellow fades into cream

(() => {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  onReady(() => {
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

    // Clean up old transition pieces from previous versions
    document.querySelectorAll(".hero-message-transition").forEach((el) => el.remove());
    document.querySelectorAll(".calling-yellow-wash").forEach((el) => el.remove());

    // Add the yellow background directly inside Section 2
    const yellowWash = document.createElement("div");
    yellowWash.className = "calling-yellow-wash";
    yellowWash.setAttribute("aria-hidden", "true");
    calling.prepend(yellowWash);

    // Initial state
    gsap.set(yellowWash, { opacity: 1 });

    if (reducedMotion) {
      gsap.set(yellowWash, { opacity: 0 });
      return;
    }

    // HERO gently leaves as user scrolls into Section 2
    const heroContent = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band")
    ].filter(Boolean);

    if (heroContent.length) {
      gsap.to(heroContent, {
        autoAlpha: 0,
        y: -44,
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
        scale: 1.06,
        y: -48,
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
      IMPORTANT PART:
      Section 2 starts yellow.
      It stays yellow while it first enters.
      Then the yellow fades once Section 2 is actually on screen.
    */
    gsap.to(yellowWash, {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: calling,
        start: "top 22%",
        end: "top -45%",
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    // Section 2 content reveal
    gsap.from("#calling .calling-label", {
      autoAlpha: 0,
      y: 24,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 70%",
        once: true
      }
    });

    gsap.from("#calling .calling-note", {
      autoAlpha: 0,
      y: 18,
      duration: 0.85,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 66%",
        once: true
      }
    });

    gsap.from("#calling .calling-main h2 .line", {
      autoAlpha: 0,
      y: 54,
      stagger: 0.1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 54%",
        once: true
      }
    });

    gsap.from("#calling .calling-copy", {
      autoAlpha: 0,
      y: 32,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 46%",
        once: true
      }
    });

    gsap.from("#calling .calling-divider", {
      scaleY: 0,
      transformOrigin: "center",
      duration: 0.95,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 50%",
        once: true
      }
    });

    gsap.from("#calling .calling-bottom", {
      autoAlpha: 0,
      y: 34,
      duration: 0.95,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 32%",
        once: true
      }
    });

    gsap.from("#calling .calling-orbit", {
      autoAlpha: 0,
      scale: 0.92,
      rotate: -10,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 50%",
        once: true
      }
    });

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
