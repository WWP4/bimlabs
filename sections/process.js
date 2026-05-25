const processSystem = document.querySelector(".process-system");
const processFrame = document.querySelector(".process-system__frame");
const processHeading = document.querySelector(".process-heading");
const systemStack = document.querySelector(".system-stack");
const systemCurves = document.querySelector(".system-curves");
const processOutcome = document.querySelector(".process-outcome");

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

function updateProcessFlow() {
  if (!processSystem) return;

  const rect = processSystem.getBoundingClientRect();
  const scrollable =
    processSystem.offsetHeight - window.innerHeight;

  const progress = Math.min(
    Math.max(
      -rect.top / Math.max(scrollable, 1),
      0
    ),
    1
  );

  steps.forEach(([selector, trigger]) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.classList.toggle(
        "flow-in",
        progress >= trigger
      );
    });
  });

  if (
    processHeading &&
    progress > 0.14 &&
    !processHeading.classList.contains("has-glitched")
  ) {
    processHeading.classList.add(
      "has-glitched",
      "is-glitching"
    );

    setTimeout(() => {
      processHeading.classList.remove(
        "is-glitching"
      );
    }, 900);
  }

  document.documentElement.style.setProperty(
    "--process-progress",
    progress
  );
}

window.addEventListener(
  "scroll",
  updateProcessFlow,
  { passive: true }
);

window.addEventListener(
  "resize",
  updateProcessFlow
);

window.addEventListener(
  "load",
  updateProcessFlow
);

updateProcessFlow();
