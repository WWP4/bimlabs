/* =========================================================
   BIM LABS — PROCESS WALL ANIMATION FIX
   CSS sticky controls position.
   GSAP controls reveal animation only.
   ========================================================= */

(function () {
  const section = document.querySelector(".bim-process-wall");

  if (!section) {
    console.warn("Process section not found.");
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) {
    console.warn("GSAP or ScrollTrigger is not loaded.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  let ctx;

  function initProcessAnimation() {
    if (ctx) ctx.revert();

    ctx = gsap.context(() => {
      const meta = section.querySelector(".process-meta");
      const footerMeta = section.querySelector(".process-footer-meta");

      const hero = section.querySelector(".process-hero");
      const kicker = section.querySelector(".process-kicker");
      const heading = section.querySelector(".process-hero h2");
      const introCopy = section.querySelector(".process-intro-copy");

      const wall = section.querySelector(".process-wall");
      const rows = gsap.utils.toArray(section.querySelectorAll(".process-row"));
      const rowLines = gsap.utils.toArray(section.querySelectorAll(".process-row-line"));
      const rowNumbers = gsap.utils.toArray(section.querySelectorAll(".process-row-number"));
      const rowTitles = gsap.utils.toArray(section.querySelectorAll(".process-row-title"));
      const rowDetails = gsap.utils.toArray(section.querySelectorAll(".process-row-detail"));

      const close = section.querySelector(".process-close");

      section.classList.add("process-ready");

      const isDesktop = window.matchMedia("(min-width: 1101px)").matches;

      if (!isDesktop) {
        gsap.set([
          meta,
          footerMeta,
          kicker,
          heading,
          introCopy,
          wall,
          rows,
          rowLines,
          rowNumbers,
          rowTitles,
          rowDetails,
          close
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

        return;
      }

      gsap.set([meta, footerMeta], {
        opacity: 0
      });

      gsap.set(kicker, {
        opacity: 0,
        y: 24
      });

      gsap.set(heading, {
        opacity: 0,
        y: 70,
        filter: "blur(12px)",
        letterSpacing: "-0.105em"
      });

      gsap.set(introCopy, {
        opacity: 0,
        y: 34
      });

      gsap.set(wall, {
        opacity: 1,
        y: 110
      });

      gsap.set(rows, {
        opacity: 0,
        y: 72
      });

      gsap.set(rowLines, {
        scaleX: 0,
        transformOrigin: "left center"
      });

      gsap.set([rowNumbers, rowTitles, rowDetails], {
        opacity: 0,
        y: 34
      });

      gsap.set(close, {
        opacity: 0,
        y: 40,
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
        duration: 0.08
      }, 0);

      tl.to(kicker, {
        opacity: 1,
        y: 0,
        duration: 0.12
      }, 0.04);

      tl.to(heading, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        letterSpacing: "-0.075em",
        duration: 0.25
      }, 0.08);

      tl.to(introCopy, {
        opacity: 1,
        y: 0,
        duration: 0.16
      }, 0.18);

      tl.to(wall, {
        y: 0,
        duration: 0.25
      }, 0.25);

      rows.forEach((row, index) => {
        const start = 0.32 + index * 0.105;

        tl.to(row, {
          opacity: 1,
          y: 0,
          duration: 0.15
        }, start);

        tl.to(rowLines[index], {
          scaleX: 1,
          duration: 0.2,
          ease: "power2.inOut"
        }, start);

        tl.to(rowNumbers[index], {
          opacity: 1,
          y: 0,
          duration: 0.12
        }, start + 0.035);

        tl.to(rowTitles[index], {
          opacity: 1,
          y: 0,
          duration: 0.15
        }, start + 0.055);

        tl.to(rowDetails[index], {
          opacity: 1,
          y: 0,
          duration: 0.15
        }, start + 0.075);
      });

      tl.to(hero, {
        y: -60,
        opacity: 0.25,
        duration: 0.2
      }, 0.72);

      tl.to(wall, {
        y: -22,
        duration: 0.18
      }, 0.82);

      tl.to(close, {
        opacity: 1,
        y: 0,
        pointerEvents: "auto",
        duration: 0.18
      }, 0.88);

      ScrollTrigger.refresh();
    }, section);
  }

  window.addEventListener("load", initProcessAnimation);

  window.addEventListener("resize", () => {
    clearTimeout(window.__bimProcessResize);
    window.__bimProcessResize = setTimeout(initProcessAnimation, 250);
  });
})();
