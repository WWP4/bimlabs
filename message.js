/* =========================================================
   MESSAGE JS — THE MESSAGE REVEAL
   Yellow flood → text mark → diagonal wipe → content reveal
   ========================================================= */

(() => {
  const section = document.querySelector(".message-section");
  const wipe = document.querySelector(".message-wipe");
  const wipeText = document.querySelector(".message-wipe span");

  const revealItems = [
    ".message-kicker",
    ".message-brand",
    ".message-right h2",
    ".message-pillar",
    ".dot-grid",
    ".message-actions"
  ];

  if (!section) return;

  section.classList.add("is-visible");

  if (!window.gsap || !window.ScrollTrigger || !wipe) {
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const items = gsap.utils.toArray(revealItems.join(","));

  section.classList.remove("is-visible");

  gsap.set(items, {
    autoAlpha: 0,
    y: 34
  });

  gsap.set(wipe, {
    yPercent: 100,
    clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)"
  });

  gsap.set(wipeText, {
    autoAlpha: 0,
    y: 18,
    letterSpacing: "0.48em"
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top bottom",
      end: "top top",
      scrub: 1.1
    }
  });

  tl
    /* yellow floods upward from bottom */
    .to(wipe, {
      yPercent: 0,
      duration: 0.42,
      ease: "power3.out"
    })

    /* small black title appears */
    .to(wipeText, {
      autoAlpha: 1,
      y: 0,
      letterSpacing: "0.32em",
      duration: 0.16,
      ease: "power2.out"
    }, "-=0.08")

    /* section begins to exist behind it */
    .add(() => {
      section.classList.add("is-visible");
    })

    /* yellow diagonally sweeps down into the section */
    .to(wipe, {
      clipPath: "polygon(0 100%, 100% 72%, 100% 100%, 0 100%)",
      duration: 0.44,
      ease: "power4.inOut"
    }, "+=0.08")

    /* title fades away */
    .to(wipeText, {
      autoAlpha: 0,
      y: -16,
      duration: 0.12,
      ease: "power2.out"
    }, "<")

    /* final yellow panel leaves, bottom CSS wave remains */
    .to(wipe, {
      yPercent: 101,
      duration: 0.26,
      ease: "power2.inOut"
    }, "-=0.08");

  ScrollTrigger.create({
    trigger: section,
    start: "top 58%",
    once: true,
    onEnter: () => {
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: {
          each: 0.07,
          from: "start"
        },
        ease: "power3.out"
      });
    }
  });
})();
