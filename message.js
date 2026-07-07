// message.js
// Hero → Yellow stage → Section 2 reveals downward like a reverse garage door

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

    // Remove old versions
    document.querySelectorAll(".hero-message-transition").forEach((el) => el.remove());
    document.querySelectorAll(".calling-yellow-wash").forEach((el) => el.remove());
    document.querySelectorAll(".hero-garage-transition").forEach((el) => el.remove());

    const callingInner = calling.querySelector(".calling-inner");

    // Build transition layer inside the pinned hero
    const garage = document.createElement("div");
    garage.className = "hero-garage-transition";
    garage.setAttribute("aria-hidden", "true");

    garage.innerHTML = `
      <div class="hero-garage-transition__yellow"></div>
      <div class="hero-garage-transition__white">
        <div class="hero-garage-transition__white-bg"></div>
      </div>
    `;

    hero.appendChild(garage);

    const yellowLayer = garage.querySelector(".hero-garage-transition__yellow");
    const whiteLayer = garage.querySelector(".hero-garage-transition__white");

    // Clone Section 2 content into the white reveal panel
    // This makes it feel like Section 2 itself is being revealed downward.
    if (callingInner) {
      const clone = callingInner.cloneNode(true);
      clone.classList.add("calling-inner--garage-clone");

      clone.querySelectorAll("[id]").forEach((el) => {
        el.removeAttribute("id");
      });

      whiteLayer.appendChild(clone);
    }

    const heroContent = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band")
    ].filter(Boolean);

    const heroImage = document.querySelector(".hero__bg img");

    if (reducedMotion) {
      gsap.set(garage, { display: "none" });
      return;
    }

    // Initial transition states
    gsap.set(garage, {
      autoAlpha: 0
    });

    gsap.set(yellowLayer, {
      autoAlpha: 1
    });

    gsap.set(whiteLayer, {
      clipPath: "inset(0% 0% 100% 0%)"
    });

    const mm = gsap.matchMedia();

    mm.add("(min-width: 769px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=210%",
          scrub: 1.12,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      if (heroImage) {
        tl.to(
          heroImage,
          {
            scale: 1.055,
            y: -42,
            duration: 1.4,
            ease: "none"
          },
          0
        );
      }

      if (heroContent.length) {
        tl.to(
          heroContent,
          {
            autoAlpha: 0,
            y: -38,
            duration: 0.58,
            ease: "power2.out"
          },
          0.1
        );
      }

      // Yellow appears behind everything
      tl.to(
        garage,
        {
          autoAlpha: 1,
          duration: 0.16,
          ease: "none"
        },
        0.35
      );

      // Hold the yellow for a beat
      tl.to({}, { duration: 0.22 });

      // White/cream Section 2 reveals downward over yellow
      tl.to(
        whiteLayer,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.25,
          ease: "none"
        },
        ">"
      );

      // Yellow disappears once white has fully loaded in
      tl.to(
        yellowLayer,
        {
          autoAlpha: 0,
          duration: 0.18,
          ease: "none"
        },
        ">-0.08"
      );

      // Tiny hold so the completed section breathes before normal scrolling
      tl.to({}, { duration: 0.32 });

      return () => tl.kill();
    });

    mm.add("(max-width: 768px)", () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: hero,
          start: "top top",
          end: "+=170%",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      if (heroImage) {
        tl.to(
          heroImage,
          {
            scale: 1.045,
            y: -28,
            duration: 1.2,
            ease: "none"
          },
          0
        );
      }

      if (heroContent.length) {
        tl.to(
          heroContent,
          {
            autoAlpha: 0,
            y: -28,
            duration: 0.5,
            ease: "power2.out"
          },
          0.08
        );
      }

      tl.to(
        garage,
        {
          autoAlpha: 1,
          duration: 0.14,
          ease: "none"
        },
        0.28
      );

      tl.to({}, { duration: 0.14 });

      tl.to(
        whiteLayer,
        {
          clipPath: "inset(0% 0% 0% 0%)",
          duration: 1.05,
          ease: "none"
        },
        ">"
      );

      tl.to(
        yellowLayer,
        {
          autoAlpha: 0,
          duration: 0.15,
          ease: "none"
        },
        ">-0.08"
      );

      tl.to({}, { duration: 0.2 });

      return () => tl.kill();
    });

    // Section 3 reveal only
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
