// message.js
// Section 2 yellow reveal.
// Yellow is the reveal layer ON TOP.
// Cream/content is underneath.
// Reveal starts early as Section 2 enters the screen — no pin.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  };

  ready(() => {
    const hero = document.querySelector("#hero");
    const message = document.querySelector("#message");
    const bridge = document.querySelector("#calling-bridge");

    if (!hero || !message) {
      console.warn("Missing #hero or #message");
      return;
    }

    if (!window.gsap || !window.ScrollTrigger) {
      console.warn("GSAP or ScrollTrigger is missing");
      message.style.setProperty("--yellowReveal", "100%");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Clean old message triggers if this file reloads.
    ScrollTrigger.getAll().forEach((trigger) => {
      if (
        trigger.vars &&
        trigger.vars.id &&
        String(trigger.vars.id).startsWith("message-")
      ) {
        trigger.kill();
      }
    });

    // Remove old transition elements from earlier versions.
    document
      .querySelectorAll(
        ".hero-message-transition, .hero-garage-transition, .calling-yellow-wash"
      )
      .forEach((el) => el.remove());

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    /*
      IMPORTANT:
      0% = yellow fully covering Section 2.
      100% = yellow wiped away, cream section visible.
    */
    gsap.set(message, {
      "--yellowReveal": "0%"
    });

    if (reducedMotion) {
      gsap.set(message, {
        "--yellowReveal": "100%"
      });
      return;
    }

    // Hero fades/moves out slightly while Section 2 comes in.
    const heroExitTargets = [
      document.querySelector(".hero__copy"),
      document.querySelector(".church-band")
    ].filter(Boolean);

    if (heroExitTargets.length) {
      gsap.to(heroExitTargets, {
        autoAlpha: 0,
        y: -28,
        ease: "none",
        scrollTrigger: {
          id: "message-hero-exit",
          trigger: hero,
          start: "58% top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }

    // Small cinematic movement on hero image.
    const heroImage = document.querySelector(".hero__bg img");

    if (heroImage) {
      gsap.to(heroImage, {
        scale: 1.035,
        y: -24,
        ease: "none",
        scrollTrigger: {
          id: "message-hero-image",
          trigger: hero,
          start: "top top",
          end: "bottom top",
          scrub: true,
          invalidateOnRefresh: true
        }
      });
    }

    /*
      MAIN FIX:
      Reveal starts when Section 2 enters the viewport.
      It does NOT wait until Section 2 hits the top.
      It does NOT pin.
    */
    gsap
      .timeline({
        scrollTrigger: {
          id: "message-yellow-reveal",
          trigger: message,
          start: "top 92%",
          end: "top 18%",
          scrub: 0.75,
          invalidateOnRefresh: true
        }
      })

      // Let the user see yellow for a small moment.
      .to({}, { duration: 0.12 })

      // Yellow reveal layer wipes away.
      .to(message, {
        "--yellowReveal": "100%",
        duration: 0.88,
        ease: "none"
      });

    // Section 2 content comes in after yellow starts revealing.
    const messageContent = [
      ".calling-top",
      ".calling-main h2",
      ".calling-copy",
      ".calling-divider",
      ".calling-bottom"
    ];

    gsap.from(messageContent, {
      autoAlpha: 0,
      y: 34,
      duration: 0.8,
      stagger: 0.06,
      ease: "power3.out",
      scrollTrigger: {
        id: "message-content-enter",
        trigger: message,
        start: "top 58%",
        once: true
      }
    });

    // Section 2 orbit soft entrance.
    gsap.from(".calling-orbit", {
      autoAlpha: 0,
      scale: 0.94,
      duration: 1,
      ease: "power3.out",
      scrollTrigger: {
        id: "message-orbit-enter",
        trigger: message,
        start: "top 48%",
        once: true
      }
    });

    // Section 3 reveal animation.
    if (bridge) {
      gsap.from("#calling-bridge .bridge-label", {
        autoAlpha: 0,
        y: 24,
        duration: 0.85,
        ease: "power3.out",
        scrollTrigger: {
          id: "message-bridge-label",
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
          id: "message-bridge-title",
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
          id: "message-bridge-line",
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
          id: "message-bridge-marker",
          trigger: bridge,
          start: "top 50%",
          once: true
        }
      });
    }

    const refreshScroll = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener("load", refreshScroll, { once: true });
    window.addEventListener("resize", refreshScroll);

    requestAnimationFrame(refreshScroll);
  });
})();










gsap.registerPlugin(ScrollTrigger);

/* =========================================================
   MESSAGE HANDOFF ANIMATION
========================================================= */

const handoff = document.querySelector(".message-handoff");

if (handoff) {
  gsap.set(".message-handoff__rule", {
    scaleX: 0,
    transformOrigin: "center center"
  });

  gsap.set(".message-handoff__content", {
    y: 42,
    opacity: 0
  });

  gsap.set(".message-handoff__mini-line", {
    scaleX: 0,
    opacity: 0,
    transformOrigin: "center center"
  });

  const handoffTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".message-handoff",
      start: "top 72%",
      once: true
    }
  });

  handoffTl
    .to(".message-handoff__rule", {
      scaleX: 1,
      duration: 0.9,
      ease: "power3.out"
    })
    .to(".message-handoff__content", {
      y: 0,
      opacity: 1,
      duration: 0.95,
      ease: "power3.out"
    }, "-=0.45")
    .to(".message-handoff__mini-line", {
      scaleX: 1,
      opacity: 1,
      duration: 0.65,
      ease: "power3.out"
    }, "-=0.35");
}


/* =========================================================
   BOOK SECTION ENTRANCE
========================================================= */

const bookSection = document.querySelector(".book-section");

if (bookSection) {
  gsap.set(".book-top", {
    y: 34,
    opacity: 0
  });

  gsap.set(".book-left", {
    y: 48,
    opacity: 0
  });

  gsap.set(".book-bg", {
    y: 58,
    opacity: 0,
    scale: 0.965
  });

  gsap.set(".book-right", {
    y: 48,
    opacity: 0
  });

  gsap.set([
    ".book-actions",
    ".book-footnote",
    ".book-bottom"
  ], {
    y: 30,
    opacity: 0
  });

  const bookTl = gsap.timeline({
    scrollTrigger: {
      trigger: ".book-section",
      start: "top 70%",
      once: true
    }
  });

  bookTl
    .to(".book-top", {
      y: 0,
      opacity: 1,
      duration: 0.75,
      ease: "power3.out"
    })
    .to(".book-left", {
      y: 0,
      opacity: 1,
      duration: 0.9,
      ease: "power3.out"
    }, "-=0.3")
    .to(".book-bg", {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1.05,
      ease: "power3.out"
    }, "-=0.68")
    .to(".book-right", {
      y: 0,
      opacity: 1,
      duration: 0.85,
      ease: "power3.out"
    }, "-=0.58")
    .to(".book-actions", {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: "power3.out"
    }, "-=0.28")
    .to(".book-footnote", {
      y: 0,
      opacity: 1,
      duration: 0.58,
      ease: "power3.out"
    }, "-=0.22")
    .to(".book-bottom", {
      y: 0,
      opacity: 1,
      duration: 0.58,
      ease: "power3.out"
    }, "-=0.2");
}


/* =========================================================
   REFRESH SCROLLTRIGGER AFTER IMAGES LOAD
========================================================= */

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});















/* =========================================================
   PODCAST EPISODE TRACK
========================================================= */

const episodesTrack = document.querySelector("#episodesTrack");
const episodesPrev = document.querySelector(".episodes-prev");
const episodesNext = document.querySelector(".episodes-next");
const episodesProgress = document.querySelector(".episodes-progress span");

if (episodesTrack && episodesPrev && episodesNext) {
  const getEpisodeScrollAmount = () => {
    const card = episodesTrack.querySelector(".episode-card");
    if (!card) return 400;

    const styles = window.getComputedStyle(episodesTrack);
    const gap = parseFloat(styles.gap || styles.columnGap || 22);

    return card.offsetWidth + gap;
  };

  const updateEpisodesProgress = () => {
    if (!episodesProgress) return;

    const maxScroll = episodesTrack.scrollWidth - episodesTrack.clientWidth;

    if (maxScroll <= 0) {
      episodesProgress.style.width = "100%";
      return;
    }

    const progress = (episodesTrack.scrollLeft / maxScroll) * 100;
    const width = Math.max(28, progress + 28);

    episodesProgress.style.width = `${Math.min(width, 100)}%`;
  };

  episodesNext.addEventListener("click", () => {
    episodesTrack.scrollBy({
      left: getEpisodeScrollAmount(),
      behavior: "smooth"
    });
  });

  episodesPrev.addEventListener("click", () => {
    episodesTrack.scrollBy({
      left: -getEpisodeScrollAmount(),
      behavior: "smooth"
    });
  });

  episodesTrack.addEventListener("scroll", updateEpisodesProgress);
  window.addEventListener("resize", updateEpisodesProgress);

  updateEpisodesProgress();
}


/* =========================================================
   PODCAST ENTRANCE ANIMATIONS
========================================================= */

if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.from(".podcast-eyebrow", {
    scrollTrigger: {
      trigger: ".podcast-section",
      start: "top 72%",
      once: true
    },
    y: 24,
    opacity: 0,
    duration: 0.75,
    ease: "power3.out"
  });

  gsap.from(".podcast-hero h2 span", {
    scrollTrigger: {
      trigger: ".podcast-section",
      start: "top 68%",
      once: true
    },
    y: 44,
    opacity: 0,
    duration: 0.9,
    stagger: 0.08,
    ease: "power3.out"
  });

  gsap.from(".podcast-copy, .podcast-actions", {
    scrollTrigger: {
      trigger: ".podcast-section",
      start: "top 62%",
      once: true
    },
    y: 30,
    opacity: 0,
    duration: 0.75,
    stagger: 0.1,
    ease: "power3.out"
  });

  gsap.from(".episodes-head", {
    scrollTrigger: {
      trigger: ".podcast-episodes",
      start: "top 80%",
      once: true
    },
    y: 28,
    opacity: 0,
    duration: 0.75,
    ease: "power3.out"
  });

  gsap.from(".episode-card", {
    scrollTrigger: {
      trigger: ".episodes-track",
      start: "top 84%",
      once: true
    },
    y: 42,
    opacity: 0,
    duration: 0.75,
    stagger: 0.08,
    ease: "power3.out"
  });

  gsap.from(".episodes-bottom", {
    scrollTrigger: {
      trigger: ".episodes-bottom",
      start: "top 90%",
      once: true
    },
    y: 22,
    opacity: 0,
    duration: 0.6,
    ease: "power3.out"
  });
}








if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.from(".book-to-podcast__inner p", {
    scrollTrigger: {
      trigger: ".book-to-podcast",
      start: "top 82%",
      once: true
    },
    y: 24,
    opacity: 0,
    duration: 0.75,
    ease: "power3.out"
  });

  gsap.from(".book-to-podcast__inner span", {
    scrollTrigger: {
      trigger: ".book-to-podcast",
      start: "top 82%",
      once: true
    },
    scaleX: 0,
    transformOrigin: "left center",
    duration: 0.85,
    ease: "power3.out"
  });
}
















/* =========================================================
   SPEAKING SECTION — CREAM-TO-YELLOW REVEAL
   Mirrors the Journey section's clip-path reveal.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".speaking-section");

  if (!section) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    section.style.setProperty("--speakingReveal", "100%");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  [
    "speaking-yellow-reveal",
    "speaking-content-enter",
    "speaking-figure-enter",
    "speaking-decor-enter"
  ].forEach((id) => ScrollTrigger.getById(id)?.kill());

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  gsap.set(section, {
    "--speakingReveal": reducedMotion ? "100%" : "0%"
  });

  if (reducedMotion) return;

  /*
    Same reveal logic as the Journey section:
    0%   = cream fully covering the speaking section
    100% = cream wiped away, yellow section visible
  */
  gsap
    .timeline({
      scrollTrigger: {
        id: "speaking-yellow-reveal",
        trigger: section,
        start: "top 92%",
        end: "top 16%",
        scrub: 0.75,
        invalidateOnRefresh: true
      }
    })
    .to({}, { duration: 0.1 })
    .to(section, {
      "--speakingReveal": "100%",
      duration: 0.9,
      ease: "none"
    });

  const content = [
    ".speaking-eyebrow",
    ".speaking-title",
    ".speaking-copy",
    ".speaking-cta",
    ".speaking-availability"
  ];

  gsap.from(content, {
    autoAlpha: 0,
    y: 46,
    duration: 0.9,
    stagger: 0.075,
    ease: "power3.out",
    scrollTrigger: {
      id: "speaking-content-enter",
      trigger: section,
      start: "top 57%",
      once: true
    }
  });

  gsap.from(".speaking-figure", {
    autoAlpha: 0,
    x: 84,
    y: 38,
    scale: 0.96,
    transformOrigin: "right bottom",
    duration: 1.15,
    ease: "power3.out",
    scrollTrigger: {
      id: "speaking-figure-enter",
      trigger: section,
      start: "top 55%",
      once: true
    }
  });

  gsap.from(
    ".speaking-dots, .speaking-slashes, .speaking-plus",
    {
      autoAlpha: 0,
      scale: 0.92,
      duration: 0.78,
      stagger: 0.08,
      ease: "power2.out",
      scrollTrigger: {
        id: "speaking-decor-enter",
        trigger: section,
        start: "top 52%",
        once: true
      }
    }
  );

  window.addEventListener(
    "load",
    () => ScrollTrigger.refresh(),
    { once: true }
  );
});













const openDates = document.querySelectorAll(".calendar-grid button.is-open");

openDates.forEach((date) => {
  date.addEventListener("click", () => {
    openDates.forEach((item) => item.classList.remove("is-selected"));
    date.classList.add("is-selected");
  });
});

















/* =========================================================
   LLOYD DEVOTIONAL POPUP
   Shows once per browser session.
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const popup = document.getElementById("lloydPopup");
  const closeBtn = document.getElementById("lloydPopupClose");

  if (!popup || !closeBtn) return;

  const sessionKey = "lloydDevotionalPopupClosed";

  const openPopup = () => {
    if (sessionStorage.getItem(sessionKey)) return;

    popup.classList.add("is-visible");
    popup.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closePopup = () => {
    popup.classList.remove("is-visible");
    popup.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    sessionStorage.setItem(sessionKey, "true");
  };

  setTimeout(openPopup, 1200);

  closeBtn.addEventListener("click", closePopup);

  popup.addEventListener("click", (event) => {
    if (event.target.classList.contains("lloyd-popup__backdrop")) {
      closePopup();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && popup.classList.contains("is-visible")) {
      closePopup();
    }
  });
});


/* =========================================================
   MESSAGE FILM BRIDGE — PODCAST TO SPEAKING TRANSITION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".message-film-section");
  const curtain = document.querySelector(".message-film-curtain");
  const intro = document.querySelector(".message-film-intro");
  const card = document.querySelector(".message-film-card");
  const video = document.querySelector(".message-film-media");
  const playButton = document.querySelector(".message-film-play");
  const bridge = document.querySelector(".message-film-bridge");

  if (!section || !curtain || !intro || !card || !video || !bridge) return;

  /* Real playback: the first click reveals native controls and sound. */
  const startVideo = async () => {
    try {
      video.controls = true;
      video.muted = false;
      await video.play();
      card.classList.add("is-playing");
    } catch (error) {
      console.warn("The message video could not start automatically.", error);
    }
  };

  playButton?.addEventListener("click", startVideo);

  video.addEventListener("play", () => {
    card.classList.add("is-playing");
  });

  video.addEventListener("pause", () => {
    if (video.currentTime < 0.1 || video.ended) {
      card.classList.remove("is-playing");
    }
  });

  video.addEventListener("ended", () => {
    card.classList.remove("is-playing");
  });

  /* Encourage the browser to display the opening frame without autoplaying. */
  video.addEventListener(
    "loadedmetadata",
    () => {
      if (video.duration > 0 && video.currentTime === 0) {
        try {
          video.currentTime = Math.min(0.12, video.duration / 10);
        } catch (_) {}
      }
    },
    { once: true }
  );

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger is missing for the message film bridge.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  [
    "message-film-flow",
    "message-film-mobile"
  ].forEach((id) => ScrollTrigger.getById(id)?.kill());

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (reducedMotion) return;

  const mm = gsap.matchMedia();

  /* Desktop: black continues from the podcast, then recedes like a curtain. */
  mm.add("(min-width: 769px)", () => {
    gsap.set(section, {
      "--curtain-h": "100%",
      "--curve-x": "0%",
      "--curve-y": "0%"
    });

    gsap.set(intro, {
      autoAlpha: 0,
      y: 42
    });

    gsap.set(card, {
      autoAlpha: 0,
      y: 180,
      scale: 0.84,
      transformOrigin: "center center"
    });

    gsap.set(bridge, {
      autoAlpha: 0,
      y: 34
    });

    const timeline = gsap.timeline({
      defaults: {
        ease: "power3.inOut"
      },
      scrollTrigger: {
        id: "message-film-flow",
        trigger: section,
        start: "top top",
        end: "+=135%",
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true
      }
    });

    timeline
      .to(
        intro,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.2,
          ease: "power3.out"
        },
        0
      )
      .to(
        section,
        {
          "--curtain-h": "64%",
          "--curve-x": "52%",
          "--curve-y": "18%",
          duration: 0.48
        },
        0.16
      )
      .to(
        intro,
        {
          y: -14,
          scale: 0.965,
          duration: 0.38
        },
        0.25
      )
      .to(
        card,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.48
        },
        0.24
      )
      .to(
        card,
        {
          y: -8,
          duration: 0.24,
          ease: "none"
        },
        0.68
      )
      .to(
        bridge,
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.26,
          ease: "power3.out"
        },
        0.66
      );

    return () => {
      ScrollTrigger.getById("message-film-flow")?.kill();
    };
  });

  /* Mobile: a lighter entrance with no long pinned scroll. */
  mm.add("(max-width: 768px)", () => {
    gsap.from(intro, {
      autoAlpha: 0,
      y: 28,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: {
        id: "message-film-mobile",
        trigger: section,
        start: "top 78%",
        once: true
      }
    });

    gsap.from(card, {
      autoAlpha: 0,
      y: 48,
      scale: 0.94,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: {
        trigger: card,
        start: "top 86%",
        once: true
      }
    });

    gsap.from(bridge, {
      autoAlpha: 0,
      y: 24,
      duration: 0.75,
      ease: "power3.out",
      scrollTrigger: {
        trigger: bridge,
        start: "top 90%",
        once: true
      }
    });
  });

  window.addEventListener(
    "load",
    () => ScrollTrigger.refresh(),
    { once: true }
  );
});
