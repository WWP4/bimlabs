/* =========================================================
   BIM LABS — PROCESS WALL
   Replacement for process-world.js
   Requires: GSAP + ScrollTrigger loaded globally
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

  const sticky = section.querySelector(".process-sticky");
  const transitionLine = section.querySelector(".process-transition-line");
  const transitionLabel = section.querySelector(".process-transition-label");

  const meta = section.querySelector(".process-meta");
  const hero = section.querySelector(".process-hero");
  const kicker = section.querySelector(".process-kicker");
  const heading = section.querySelector(".process-hero h2");
  const introCopy = section.querySelector(".process-intro-copy");

  const wall = section.querySelector(".process-wall");
  const rows = gsap.utils.toArray(".process-row");
  const rowLines = gsap.utils.toArray(".process-row-line");
  const rowNumbers = gsap.utils.toArray(".process-row-number");
  const rowTitles = gsap.utils.toArray(".process-row-title");
  const rowDetails = gsap.utils.toArray(".process-row-detail");

  const close = section.querySelector(".process-close");
  const footerMeta = section.querySelector(".process-footer-meta");

  const isDesktop = window.matchMedia("(min-width: 1101px)");

  let ctx;

  function buildDesktopAnimation() {
    if (ctx) ctx.revert();

    ctx = gsap.context(() => {
      /* -----------------------------
         Initial states
      ----------------------------- */

      gsap.set([meta, footerMeta], {
        opacity: 0
      });

      gsap.set(transitionLine, {
        scaleX: 0.12,
        opacity: 0.12,
        transformOrigin: "left center"
      });

      gsap.set(transitionLabel, {
        opacity: 0,
        y: 12
      });

      gsap.set(kicker, {
        opacity: 0,
        y: 18
      });

      gsap.set(heading, {
        opacity: 0,
        y: 46,
        letterSpacing: "-0.095em",
        filter: "blur(8px)"
      });

      gsap.set(introCopy, {
        opacity: 0,
        y: 26
      });

      gsap.set(wall, {
        opacity: 1,
        y: 70
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
        y: 24
      });

      gsap.set(close, {
        opacity: 0,
        y: 28
      });

      /* -----------------------------
         Main pinned timeline
      ----------------------------- */

      const tl = gsap.timeline({
        defaults: {
          ease: "power2.out"
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.15,
          pin: sticky,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });

      /* Phase 1: handoff from section 2 */
      tl.to(transitionLine, {
        scaleX: 1,
        opacity: 0.22,
        duration: 0.16,
        ease: "power1.out"
      }, 0);

      tl.to(transitionLabel, {
        opacity: 1,
        y: 0,
        duration: 0.12
      }, 0.03);

      tl.to(transitionLabel, {
        opacity: 0,
        y: -12,
        duration: 0.12
      }, 0.16);

      tl.to(transitionLine, {
        opacity: 0,
        duration: 0.12
      }, 0.18);

      /* Phase 2: editorial frame arrives */
      tl.to([meta, footerMeta], {
        opacity: 1,
        duration: 0.16
      }, 0.15);

      tl.to(kicker, {
        opacity: 1,
        y: 0,
        duration: 0.14
      }, 0.18);

      tl.to(heading, {
        opacity: 1,
        y: 0,
        letterSpacing: "-0.075em",
        filter: "blur(0px)",
        duration: 0.22
      }, 0.2);

      tl.to(introCopy, {
        opacity: 1,
        y: 0,
        duration: 0.16
      }, 0.28);

      /* Phase 3: process rows assemble */
      tl.to(wall, {
        y: 0,
        duration: 0.22
      }, 0.34);

      rows.forEach((row, index) => {
        const start = 0.4 + index * 0.105;

        tl.to(row, {
          opacity: 1,
          y: 0,
          duration: 0.12
        }, start);

        tl.to(rowLines[index], {
          scaleX: 1,
          duration: 0.16,
          ease: "power2.inOut"
        }, start);

        tl.to(rowNumbers[index], {
          opacity: 1,
          y: 0,
          duration: 0.12
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

      /* Phase 4: headline quiets down as full process becomes focus */
      tl.to(hero, {
        y: -28,
        opacity: 0.72,
        duration: 0.18
      }, 0.76);

      /* Phase 5: final closing line */
      tl.to(close, {
        opacity: 1,
        y: 0,
        duration: 0.18
      }, 0.84);

      tl.to(wall, {
        y: -18,
        duration: 0.16
      }, 0.86);

      /* tiny living detail, not cheap */
      gsap.to(".process-ruler--top", {
        opacity: 0.55,
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      gsap.to(".process-ruler--bottom", {
        opacity: 0.42,
        duration: 3.2,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });
    }, section);
  }

  function buildMobileFallback() {
    if (ctx) ctx.revert();

    ctx = gsap.context(() => {
      gsap.set([
        ".process-meta",
        ".process-footer-meta",
        ".process-transition",
        ".process-frame"
      ], {
        clearProps: "all"
      });

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
          y: 32,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: row,
            start: "top 86%",
            once: true
          }
        });
      });
    }, section);
  }

  function init() {
    ScrollTrigger.getAll().forEach((trigger) => {
      if (trigger.trigger === section || trigger.pin === sticky) {
        trigger.kill();
      }
    });

    if (isDesktop.matches) {
      buildDesktopAnimation();
    } else {
      buildMobileFallback();
    }

    ScrollTrigger.refresh();
  }

  window.addEventListener("load", init);
  window.addEventListener("resize", () => {
    clearTimeout(window.__bimProcessResize);
    window.__bimProcessResize = setTimeout(init, 250);
  });
})();
