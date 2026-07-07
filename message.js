// message.js
// Hero → Calling transition + Section 2 / Section 3 reveals

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

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Prevent duplicated transition layer on refresh/hot reload
    document
      .querySelectorAll(".hero-message-transition")
      .forEach((el) => el.remove());

    // Build yellow transition panel
    const transition = document.createElement("div");
    transition.className = "hero-message-transition";
    transition.setAttribute("aria-hidden", "true");

    transition.innerHTML = `
      <div class="hero-message-transition__panel"></div>
      <div class="hero-message-transition__text">THE JOURNEY</div>
    `;

    hero.appendChild(transition);

    const panel = transition.querySelector(".hero-message-transition__panel");
    const text = transition.querySelector(".hero-message-transition__text");

    const heroFadeTargets = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band"),
      document.querySelector(".site-header")
    ].filter(Boolean);

    if (prefersReducedMotion) {
      gsap.set([panel, text], { clearProps: "all" });
      transition.style.display = "none";
      return;
    }

    gsap.set(transition, {
      pointerEvents: "none"
    });

    gsap.set(panel, {
      yPercent: 100
    });

    gsap.set(text, {
      autoAlpha: 0,
      y: 18
    });

    gsap.set(calling, {
      y: 90,
      scale: 0.985
    });

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=240%",
          scrub: 1.15,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(panel, {
        yPercent: 0,
        duration: 1.1,
        ease: "none"
      });

      if (heroFadeTargets.length) {
        tl.to(
          heroFadeTargets,
          {
            autoAlpha: 0,
            y: -28,
            duration: 0.55,
            ease: "power2.out"
          },
          "<+=0.22"
        );
      }

      tl.to(
        text,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.38,
          ease: "power2.out"
        },
        "-=0.15"
      )
        .to({}, { duration: 0.42 })
        .to(text, {
          autoAlpha: 0,
          y: -18,
          duration: 0.35,
          ease: "power2.inOut"
        })
        .to(
          panel,
          {
            yPercent: -100,
            duration: 1.1,
            ease: "none"
          },
          "-=0.08"
        )
        .to(
          calling,
          {
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power2.out"
          },
          "<"
        );

      return () => tl.kill();
    });

    mm.add("(max-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=175%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      tl.to(panel, {
        yPercent: 0,
        duration: 1,
        ease: "none"
      });

      if (heroFadeTargets.length) {
        tl.to(
          heroFadeTargets,
          {
            autoAlpha: 0,
            y: -20,
            duration: 0.5,
            ease: "power2.out"
          },
          "<+=0.2"
        );
      }

      tl.to(
        text,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out"
        },
        "-=0.1"
      )
        .to({}, { duration: 0.25 })
        .to(text, {
          autoAlpha: 0,
          y: -14,
          duration: 0.3,
          ease: "power2.inOut"
        })
        .to(panel, {
          yPercent: -100,
          duration: 0.95,
          ease: "none"
        })
        .to(
          calling,
          {
            y: 0,
            scale: 1,
            duration: 0.85,
            ease: "power2.out"
          },
          "<"
        );

      return () => tl.kill();
    });

    // Section 2 reveal
    const callingLines = gsap.utils.toArray("#calling .calling-main h2 .line");

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
      y: 18,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 70%",
        once: true
      }
    });

    if (callingLines.length) {
      gsap.from(callingLines, {
        autoAlpha: 0,
        y: 54,
        stagger: 0.09,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: calling,
          start: "top 58%",
          once: true
        }
      });
    }

    gsap.from("#calling .calling-copy", {
      autoAlpha: 0,
      y: 28,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 50%",
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
        start: "top 54%",
        once: true
      }
    });

    gsap.from("#calling .calling-bottom", {
      autoAlpha: 0,
      y: 34,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 36%",
        once: true
      }
    });

    gsap.from("#calling .calling-orbit", {
      autoAlpha: 0,
      scale: 0.9,
      rotate: -12,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 55%",
        once: true
      }
    });

    // Section 3 reveal
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

    // Mobile menu safety, in case lloyd.js is not handling it
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
