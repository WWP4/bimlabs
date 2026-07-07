// message.js
// Hero scrolls away → Section 2 enters yellow → yellow fades into cream

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

    /*
      Remove the old curtain system completely.
      This new transition belongs to section 2 itself.
    */
    document.querySelectorAll(".hero-message-transition").forEach((el) => el.remove());
    document.querySelectorAll(".calling-yellow-wash").forEach((el) => el.remove());

    const yellowWash = document.createElement("div");
    yellowWash.className = "calling-yellow-wash";
    yellowWash.setAttribute("aria-hidden", "true");

    calling.prepend(yellowWash);

    if (reducedMotion) {
      yellowWash.style.opacity = "0";
      return;
    }

    /*
      HERO LEAVES SOFTLY
      No fake curtain. No hard cover.
    */
    gsap.to(".hero__copy, .church-band", {
      autoAlpha: 0,
      y: -42,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "65% top",
        end: "bottom top",
        scrub: true
      }
    });

    gsap.to(".hero__bg img", {
      scale: 1.08,
      y: -60,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    /*
      SECTION 2 ENTERS AS YELLOW
      When the user first sees section 2, it is yellow.
    */
    gsap.set(yellowWash, {
      opacity: 1
    });

    /*
      YELLOW FADES TO CREAM/WHITE
      Once section 2 reaches the viewport, the yellow slowly washes out.
    */
    gsap.to(yellowWash, {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: calling,
        start: "top 72%",
        end: "top 8%",
        scrub: 1.15,
        invalidateOnRefresh: true
      }
    });

    /*
      SECTION 2 CONTENT REVEAL
    */
    gsap.from("#calling .calling-label", {
      autoAlpha: 0,
      y: 24,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 72%",
        once: true
      }
    });

    gsap.from("#calling .calling-note", {
      autoAlpha: 0,
      y: 20,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 68%",
        once: true
      }
    });

    gsap.from("#calling .calling-main h2 .line", {
      autoAlpha: 0,
      y: 58,
      stagger: 0.1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 56%",
        once: true
      }
    });

    gsap.from("#calling .calling-divider", {
      scaleY: 0,
      transformOrigin: "center",
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 52%",
        once: true
      }
    });

    gsap.from("#calling .calling-copy", {
      autoAlpha: 0,
      y: 34,
      duration: 0.95,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 48%",
        once: true
      }
    });

    gsap.from("#calling .calling-bottom", {
      autoAlpha: 0,
      y: 36,
      duration: 0.95,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 34%",
        once: true
      }
    });

    gsap.from("#calling .calling-orbit", {
      autoAlpha: 0,
      scale: 0.9,
      rotate: -10,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 52%",
        once: true
      }
    });

    /*
      SECTION 3 REVEAL
    */
    if (bridge) {
      gsap.from("#calling-bridge .bridge-label", {
        autoAlpha: 0,
        y: 24,
        duration: 0.9,
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
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: {
          trigger: bridge,
          start: "top 50%",
          once: true
        }
      });
    }

    /*
      MOBILE MENU BACKUP
    */
    const menuToggle = document.querySelector("#menuToggle");
    const mobileMenu = document.querySelector("#mobileMenu");

    if (menuToggle && mobileMenu) {
      menuToggle.addEventListener("click", () => {
        document.body.classList.toggle("menu-open");
      });

      mobileMenu.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
          document.body.classList.remove("menu-open");
        });
      });
    }

    window.addEventListener("resize", () => {
      ScrollTrigger.refresh();
    });

    ScrollTrigger.refresh();
  });
})();
