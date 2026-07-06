/* =========================================================
   MESSAGE SECTION — YELLOW CURTAIN REVEAL
   File: message.js
   ========================================================= */

(() => {
  const section = document.querySelector(".message-section");
  const wipe = document.querySelector(".message-wipe");
  const wipeText = document.querySelector(".message-wipe span");
  const sun = document.querySelector(".message-sun");
  const rings = document.querySelector(".message-rings");
  const kicker = document.querySelector(".message-kicker");
  const brand = document.querySelector(".message-brand");
  const headline = document.querySelector(".message-right h2");
  const pillars = gsap.utils.toArray(".message-pillar");
  const actions = document.querySelector(".message-actions");
  const dots = document.querySelector(".dot-grid");

  if (!section) return;

  /*
    Safety:
    This makes sure your text does not stay hidden
    if GSAP fails or loads late.
  */
  section.classList.add("is-visible");

  if (!window.gsap || !window.ScrollTrigger) {
    console.warn("GSAP or ScrollTrigger is missing. Message animation disabled.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* Reset visible class so GSAP can control the entrance */
  section.classList.remove("is-visible");

  gsap.set([kicker, brand, headline, actions, dots], {
    autoAlpha: 0,
    y: 34
  });

  gsap.set(pillars, {
    autoAlpha: 0,
    y: 44
  });

  gsap.set(wipe, {
    yPercent: -101,
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
  });

  gsap.set(wipeText, {
    autoAlpha: 0,
    y: 18,
    letterSpacing: "0.5em"
  });

  /* Main yellow curtain transition */
  const revealTL = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top 84%",
      end: "top 12%",
      scrub: 1.05,
      onEnter: revealContent,
      onEnterBack: revealContent
    }
  });

  revealTL
    .to(wipe, {
      yPercent: 0,
      duration: 0.42,
      ease: "power3.out"
    })
    .to(
      wipeText,
      {
        autoAlpha: 1,
        y: 0,
        letterSpacing: "0.32em",
        duration: 0.18,
        ease: "power2.out"
      },
      "-=0.16"
    )
    .to(wipe, {
      clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)",
      duration: 0.48,
      ease: "power4.inOut"
    })
    .to(
      wipeText,
      {
        autoAlpha: 0,
        y: -14,
        duration: 0.16,
        ease: "power2.out"
      },
      "<"
    );

  /* Content reveal */
  let contentPlayed = false;

  function revealContent() {
    if (contentPlayed) return;
    contentPlayed = true;

    section.classList.add("is-visible");

    const contentTL = gsap.timeline({
      defaults: {
        duration: 0.9,
        ease: "power3.out"
      }
    });

    contentTL
      .to(kicker, {
        autoAlpha: 1,
        y: 0
      })
      .to(
        brand,
        {
          autoAlpha: 1,
          y: 0
        },
        "-=0.68"
      )
      .to(
        headline,
        {
          autoAlpha: 1,
          y: 0
        },
        "-=0.72"
      )
      .to(
        pillars,
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.08
        },
        "-=0.44"
      )
      .to(
        [actions, dots],
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.08
        },
        "-=0.48"
      );
  }

  /* Sun movement */
  if (sun) {
    gsap.to(sun, {
      xPercent: -18,
      rotate: 8,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  /* Ring movement */
  if (rings) {
    gsap.to(rings, {
      rotate: 18,
      scale: 1.08,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true
      }
    });
  }

  /* Pillar hover polish */
  pillars.forEach((pillar) => {
    pillar.addEventListener("mouseenter", () => {
      gsap.to(pillar, {
        y: -8,
        duration: 0.35,
        ease: "power2.out"
      });
    });

    pillar.addEventListener("mouseleave", () => {
      gsap.to(pillar, {
        y: 0,
        duration: 0.35,
        ease: "power2.out"
      });
    });
  });
})();
