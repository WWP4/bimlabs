// message.js
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  const hero = document.querySelector("#hero");
  const message = document.querySelector("#message");
  const calling = document.querySelector("#calling");
  const bridge = document.querySelector("#calling-bridge");

  if (!hero || !message) {
    console.warn("Missing #hero or #message");
    return;
  }

  // Remove old curtain if it exists
  document.querySelectorAll(".yellow-curtain").forEach(el => el.remove());

  // Create transition layer attached to the hero
  const transition = document.createElement("div");
  transition.className = "hero-message-transition";
  transition.innerHTML = `
    <div class="hero-message-transition__panel"></div>
    <div class="hero-message-transition__text">THE MESSAGE</div>
  `;
  hero.appendChild(transition);

  const panel = transition.querySelector(".hero-message-transition__panel");
  const text = transition.querySelector(".hero-message-transition__text");

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

  gsap.set(message, {
    y: 90,
    scale: 0.985
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "top top",
      end: "+=260%",
      scrub: 1.25,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  });

  tl
    // yellow grows from bottom of hero
    .to(panel, {
      yPercent: 0,
      duration: 1.15,
      ease: "none"
    })

    // hero content settles back while yellow takes over
    .to(".hero__copy, .church-band, .site-header", {
      autoAlpha: 0,
      y: -28,
      duration: 0.55,
      ease: "power2.out"
    }, "<+=0.25")

    // text appears while yellow owns the screen
    .to(text, {
      autoAlpha: 1,
      y: 0,
      duration: 0.38,
      ease: "power2.out"
    }, "-=0.2")

    // hold the yellow chapter moment
    .to({}, { duration: 0.45 })

    // text leaves
    .to(text, {
      autoAlpha: 0,
      y: -18,
      duration: 0.35,
      ease: "power2.inOut"
    })

    // yellow exits upward, revealing message underneath
    .to(panel, {
      yPercent: -100,
      duration: 1.15,
      ease: "none"
    }, "-=0.1")

    // message settles in under the yellow
    .to(message, {
      y: 0,
      scale: 1,
      duration: 1.05,
      ease: "power2.out"
    }, "<");

  // Calling section reveal
  if (calling) {
    gsap.from("#calling .calling-label", {
      autoAlpha: 0,
      y: 24,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 72%"
      }
    });

    gsap.from("#calling .calling-main h2 .line", {
      autoAlpha: 0,
      y: 46,
      stagger: 0.1,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 58%"
      }
    });

    gsap.from("#calling .calling-copy", {
      autoAlpha: 0,
      y: 28,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 50%"
      }
    });

    gsap.from("#calling .calling-bottom", {
      autoAlpha: 0,
      y: 34,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 38%"
      }
    });
  }

  // Bridge reveal
  if (bridge) {
    gsap.from("#calling-bridge .bridge-label", {
      autoAlpha: 0,
      y: 24,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: bridge,
        start: "top 72%"
      }
    });

    gsap.from("#calling-bridge .calling-center h2", {
      autoAlpha: 0,
      y: 44,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: bridge,
        start: "top 55%"
      }
    });

    gsap.from("#calling-bridge .calling-line", {
      scaleY: 0,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: bridge,
        start: "top 48%"
      }
    });

    gsap.from("#calling-bridge .calling-marker", {
      autoAlpha: 0,
      x: 18,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: bridge,
        start: "top 50%"
      }
    });
  }

  ScrollTrigger.refresh();
});
