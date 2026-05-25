const processSystem = document.querySelector(".process-system");
const processFrame = document.querySelector(".process-system__frame");
const processHeading = document.querySelector(".process-heading");
const systemStack = document.querySelector(".system-stack");
const systemCurves = document.querySelector(".system-curves");
const processOutcome = document.querySelector(".process-outcome");

let processActive = false;
let processTicking = false;

function clampProcess(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function processProgress() {
  if (!processSystem) return 0;

  const rect = processSystem.getBoundingClientRect();
  const distance = processSystem.offsetHeight - window.innerHeight;

  return clampProcess(-rect.top / Math.max(distance, 1), 0, 1);
}

const processSystem = document.querySelector(".process-system");
const heading = document.querySelector(".process-heading");

const steps = [
  [".process-rail", 0.05],
  [".process-top-label", 0.08],
  [".process-copy", 0.12],
  [".system-layer--one, .label-one, .dot-one", 0.22],
  [".system-layer--two, .label-two, .dot-two", 0.32],
  [".system-layer--three, .label-three, .dot-three", 0.42],
  [".system-layer--four, .label-four, .dot-four", 0.52],
  [".system-curves", 0.62],
  [".system-synth-dot, .system-synth-copy", 0.72],
  [".process-outcome", 0.82],
  [".process-bottom-nav", 0.9],
];

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function updateProcessFlow() {
  if (!processSystem) return;

  const rect = processSystem.getBoundingClientRect();
  const scrollable = processSystem.offsetHeight - window.innerHeight;
  const progress = clamp(-rect.top / Math.max(scrollable, 1), 0, 1);

  steps.forEach(([selector, trigger]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.toggle("flow-in", progress >= trigger);
    });
  });

  if (heading && progress > 0.14 && !heading.classList.contains("has-glitched")) {
    heading.classList.add("has-glitched", "is-glitching");
    setTimeout(() => heading.classList.remove("is-glitching"), 900);
  }

  document.documentElement.style.setProperty("--process-progress", progress);
}

window.addEventListener("scroll", updateProcessFlow, { passive: true });
window.addEventListener("resize", updateProcessFlow);
window.addEventListener("load", updateProcessFlow);
updateProcessFlow();
