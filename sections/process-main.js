// js/process-main.js

import { ProcessScene } from "./process-scene.js";
import { initProcessUI } from "./process-ui.js";
import { initProcessScroll } from "./process-scroll.js";

function bootProcessExperience() {
  const section = document.querySelector("#process");
  const sceneMount = document.querySelector("[data-process-scene]");

  if (!section || !sceneMount) {
    console.warn("[Process] Missing #process or [data-process-scene].");
    return;
  }

  if (!window.gsap || !window.ScrollTrigger) {
    console.warn("[Process] GSAP and ScrollTrigger are required.");
    return;
  }

  window.gsap.registerPlugin(window.ScrollTrigger);

  const scene = new ProcessScene({
    mount: sceneMount,
    word: "PROCESS"
  });

  scene.init();

  const ui = initProcessUI({
    section,
    cards: [...section.querySelectorAll("[data-process-card]")]
  });

  initProcessScroll({
    section,
    scene,
    ui,
    cards: [...section.querySelectorAll("[data-process-card]")]
  });

  window.addEventListener("beforeunload", () => {
    scene.destroy();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootProcessExperience);
} else {
  bootProcessExperience();
}
