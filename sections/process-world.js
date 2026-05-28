/* =========================================================
   BIM LABS — PROCESS WALL FIXED
   Clean sticky-scroll animation
   Uses CSS sticky only. No GSAP pin.
   ========================================================= */

(function () {
  const section = document.querySelector(".bim-process-wall");

  if (!section) {
    console.warn("BIM Process Wall section not found.");
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) {
    console.warn("GSAP or ScrollTrigger is not loaded.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const q = gsap.utils.selector(section);

  const meta = q(".process-meta");
  const footerMeta = q(".process-footer-meta");

  const kicker = q(".process-kicker");
  const heading = q(".process-hero h2");
  const introCopy = q(".process-intro-copy");
  const hero = q(".process-hero");

  const wall = q(".process-wall");
  const rows = q(".process-row");
  const rowLines = q(".process-row-line");
  const rowNumbers = q(".process-row-number");
  const rowTitles = q(".process-row-title");
  const rowDetails = q(".process-row-detail");

  const close = q(".process-close");

  let ctx;

  function buildDesktop() {
    if (ctx) ctx.revert();

    ctx = gsap.context(() => {
      gsap.set([meta, footerMeta], {
        opacity: 0
      });

      gsap.set(kicker, {
        opacity: 0,
        y: 18
      });

      gsap.set(heading, {
        opacity: 0,
        y: 46,
        filter: "blur(8px)",
        letterSpacing: "-0.095em"
      });

      gsap.set(introCopy, {
        opacity: 0,
        y: 24
      });

      gsap.set(wall, {
        opacity: 1,
        y: 72
      });

      gsap.set(rows, {
        opacity: 0,
        y: 42
      });

      gsap.set(rowLines, {
        scaleX: 0,
        transformOrigin: "left center"
      });

      gsap.set([rowNumbers, rowTitles, rowDetails], {
        opacity: 0,
        y: 22
      });

      gsap.set(close, {
        opacity: 0,
        y: 28,
        pointerEvents: "none"
      });

      const tl = gsap.timeline({
        defaults: {
          ease: "power2.out"
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.85,
          invalidateOnRefresh: true
        }
      });

      tl.to([meta, footerMeta], {
        opacity: 1,
        duration: 0.12
      }, 0);

      tl.to(kicker, {
        opacity: 1,
        y: 0,
        duration: 0.13
      }, 0.04);

      tl.to(heading, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        letterSpacing: "-0.075em",
        duration: 0.24
      }, 0.07);

      tl.to(introCopy, {
        opacity: 1,
        y: 0,
        duration: 0.16
      }, 0.18);

      tl.to(wall, {
        y: 0,
        duration: 0.22
      }, 0.24);

      rows.forEach((row, index) => {
        const start = 0.28 + index * 0.09;

        tl.to(row, {
          opacity: 1,
          y: 0,
          duration: 0.13
        }, start);

        tl.to(rowLines[index], {
          scaleX: 1,
          duration: 0.16,
          ease: "power2.inOut"
        }, start);

        tl.to(rowNumbers[index], {
          opacity: 1,
          y: 0,
          duration: 0.13
        }, start + 0.025);

        tl.to(rowTitles[index], {
          opacity: 1,
          y: 0,
          duration: 0.14
        }, start + 0.045);

        tl.to(rowDetails[index], {
          opacity: 1,
          y: 0,
          duration: 0.14
        }, start + 0.065);
      });

      tl.to(hero, {
        y: -52,
        opacity: 0.28,
        duration: 0.22
      }, 0.62);

      tl.to(wall, {
        y: -18,
        duration: 0.18
      }, 0.78);

      tl.to(close, {
        opacity: 1,
        y: 0,
        pointerEvents: "auto",
        duration: 0.2
      }, 0.82);

      gsap.to(q(".process-ruler--top"), {
        opacity: 0.55,
        duration: 2.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      gsap.to(q(".process-ruler--bottom"), {
        opacity: 0.42,
        duration: 3.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });
    }, section);
  }

  function buildMobile() {
    if (ctx) ctx.revert();

    ctx = gsap.context(() => {
      gsap.set([
        ".process-kicker",
        ".process-hero h2",
        ".process-intro-copy",
        ".process-wall",
        ".process-row",
        ".process-row-line",
        ".process-row-number",
        ".process-row-title",
        ".process-row-detail",
        ".process-close"
      ], {
        clearProps: "all"
      });

      rows.forEach((row) => {
        gsap.from(row, {
          opacity: 0,
          y: 28,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: row,
            start: "top 88%",
            once: true
          }
        });
      });
    }, section);
  }

  function init() {
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.trigger === section || section.contains(trigger.trigger)) {
        trigger.kill();
      }
    });

    if (window.matchMedia("(min-width: 1101px)").matches) {
      buildDesktop();
    } else {
      buildMobile();
    }

    ScrollTrigger.refresh();
  }

  window.addEventListener("load", init);

  window.addEventListener("resize", () => {
    clearTimeout(window.__bimProcessResize);
    window.__bimProcessResize = setTimeout(init, 250);
  });
})();
