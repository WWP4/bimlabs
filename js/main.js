import { createScrollTimeline } from "./scroll.js";

(() => {
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const root = document.documentElement;
  const progressFill = document.querySelector("#progressFill");

  const app = {
    root,
    progressFill,
    sceneState: {
      progress: 0,
      work: 0,
      depth: 0
    },
    reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  createScrollTimeline({ app, gsap, ScrollTrigger });
})();
