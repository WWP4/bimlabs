const processSystem = document.querySelector(".process-system");
const processHeading = document.querySelector(".process-heading");
const systemStack = document.querySelector(".system-stack");
const systemCurves = document.querySelector(".system-curves");
const processOutcome = document.querySelector(".process-outcome");
const synthDot = document.querySelector(".system-synth-dot");
const synthCopy = document.querySelector(".system-synth-copy");

let processTicking = false;

const flowSteps = [
  [".process-rail", 0.04],
  [".process-top-label, .process-map-label", 0.07],
  [".process-copy", 0.11],
  [".system-layer--one, .label-one, .dot-one", 0.22],
  [".system-layer--two, .label-two, .dot-two", 0.33],
  [".system-layer--three, .label-three, .dot-three", 0.44],
  [".system-layer--four, .label-four, .dot-four", 0.55],
  [".system-curves", 0.65],
  [".system-synth-dot, .system-synth-copy", 0.74],
  [".process-outcome", 0.84],
  [".process-bottom-nav", 0.92],
];

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getProgress() {
  if (!processSystem) return 0;

  const rect = processSystem.getBoundingClientRect();
  const scrollable =
    processSystem.offsetHeight - window.innerHeight;

  return clamp(
    -rect.top / Math.max(scrollable, 1),
    0,
    1
  );
}

function triggerHeadingGlitch(progress) {
  if (!processHeading) return;

  if (
    progress > 0.13 &&
    !processHeading.classList.contains("has-glitched")
  ) {
    processHeading.classList.add(
      "has-glitched",
      "is-glitching"
    );

    setTimeout(() => {
      processHeading.classList.remove("is-glitching");
    }, 900);
  }
}

function updateFlow(progress) {
  flowSteps.forEach(([selector, trigger]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.toggle("flow-in", progress >= trigger);
    });
  });
}

function updateParallax(progress) {
  if (systemStack) {
    systemStack.style.transform = `
      translate3d(${progress * -28}px, ${progress * -20}px, 0)
    `;
  }

  if (systemCurves) {
    systemCurves.style.transform = `
      translate3d(${progress * 18}px, ${progress * -12}px, 0)
    `;
  }

  if (processOutcome) {
    processOutcome.style.transform = `
      translate3d(${progress * 24}px, ${progress * -16}px, 0)
    `;
  }

  if (synthDot) {
    synthDot.style.transform = `
      translate3d(${progress * 14}px, ${progress * -10}px, 0)
    `;
  }

  if (synthCopy) {
    synthCopy.style.transform = `
      translate3d(${progress * 10}px, ${progress * -8}px, 0)
    `;
  }
}

function updateProcess() {
  if (!processSystem) return;

  const progress = getProgress();

  processSystem.style.setProperty(
    "--process-progress",
    progress.toFixed(4)
  );

  updateFlow(progress);
  updateParallax(progress);
  triggerHeadingGlitch(progress);

  processTicking = false;
}

function requestProcessTick() {
  if (processTicking) return;

  processTicking = true;

  requestAnimationFrame(updateProcess);
}

window.addEventListener(
  "scroll",
  requestProcessTick,
  { passive: true }
);

window.addEventListener(
  "resize",
  requestProcessTick
);

window.addEventListener(
  "load",
  requestProcessTick
);

requestProcessTick();
