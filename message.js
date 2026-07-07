// message.js
gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  const hero = document.querySelector("#hero");
  const message = document.querySelector("#message");
  const calling = document.querySelector("#calling");

  if (!hero || !message) return;

  // Create yellow curtain
  const curtain = document.createElement("div");
  curtain.className = "yellow-curtain";
  curtain.innerHTML = `
    <div class="yellow-curtain__text">
      <span>THE MESSAGE</span>
    </div>
  `;
  document.body.appendChild(curtain);

  gsap.set(curtain, {
    yPercent: 100,
    autoAlpha: 1
  });

  gsap.set(".yellow-curtain__text", {
    autoAlpha: 0,
    y: 18
  });

  gsap.set(message, {
    y: 80,
    autoAlpha: 0
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: "bottom bottom",
      end: "+=170%",
      scrub: 1.25,
      pin: true,
      anticipatePin: 1
    }
  });

  tl
    // Yellow rises slowly over hero
    .to(curtain, {
      yPercent: 0,
      ease: "power2.inOut",
      duration: 1.25
    })

    // Small message appears while yellow owns screen
    .to(".yellow-curtain__text", {
      autoAlpha: 1,
      y: 0,
      ease: "power2.out",
      duration: .45
    }, "-=.35")

    // Hold the yellow moment
    .to({}, { duration: .35 })

    // Message section starts coming in underneath
    .to(message, {
      autoAlpha: 1,
      y: 0,
      ease: "power2.out",
      duration: .85
    })

    // Curtain slides away upward
    .to(curtain, {
      yPercent: -100,
      ease: "power2.inOut",
      duration: 1.15
    }, "-=.55")

    // Text disappears with curtain
    .to(".yellow-curtain__text", {
      autoAlpha: 0,
      y: -18,
      ease: "power2.inOut",
      duration: .5
    }, "<");

  // Section 2 image settles softly
  gsap.fromTo(
    ".message-bg",
    {
      scale: 1.035,
      filter: "blur(3px)"
    },
    {
      scale: 1,
      filter: "blur(0px)",
      ease: "power2.out",
      scrollTrigger: {
        trigger: message,
        start: "top 80%",
        end: "top 20%",
        scrub: 1.1
      }
    }
  );

  // Section 3 / calling reveal
  if (calling) {
    gsap.from(".calling-label", {
      autoAlpha: 0,
      y: 24,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 72%"
      }
    });

    gsap.from(".calling-main h2 .line", {
      autoAlpha: 0,
      y: 48,
      stagger: .12,
      duration: 1.1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 58%"
      }
    });

    gsap.from(".calling-copy", {
      autoAlpha: 0,
      y: 26,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 46%"
      }
    });

    gsap.from(".calling-bottom", {
      autoAlpha: 0,
      y: 34,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        trigger: calling,
        start: "top 36%"
      }
    });
  }
});