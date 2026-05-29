// js/process-main.js

import { S as ScrollTrigger } from "../CODEX%20USE%20THIS%20FOLDER%20FOR%20PROCESS%20ANIMATIONS/ScrollTrigger.039d4140.js";
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

  const gsap = window.gsap;

  if (!gsap || !ScrollTrigger) {
    console.warn("[Process] GSAP core and local ScrollTrigger are required.");
    return;
  }

  window.ScrollTrigger = ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const scene = new ProcessScene({
    mount: sceneMount
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
    gsap,
    ScrollTrigger,
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
