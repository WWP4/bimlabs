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

function activateProcess() {
  if (!processSystem || processActive) return;

  processActive = true;
  processSystem.classList.add("is-active");

  if (processHeading) {
    processHeading.classList.add("is-glitching");

    setTimeout(() => {
      processHeading.classList.remove("is-glitching");
    }, 900);
  }
}

function updateProcess() {
  if (!processSystem) return;

  const rect = processSystem.getBoundingClientRect();
  const vh = window.innerHeight;

  if (rect.top < vh * 0.72 && rect.bottom > vh * 0.2) {
    activateProcess();
  }

  const p = processProgress();

  if (systemStack) {
    systemStack.style.transform = `
      translate3d(${p * -22}px, ${p * -18}px, 0)
    `;
  }

  if (systemCurves) {
    systemCurves.style.transform = `
      translate3d(${p * 12}px, ${p * -10}px, 0)
    `;
  }

  if (processOutcome) {
    processOutcome.style.transform = `
      translate3d(${p * 18}px, ${p * -14}px, 0)
    `;
  }

  processTicking = false;
}

function requestProcessTick() {
  if (processTicking) return;
  processTicking = true;
  requestAnimationFrame(updateProcess);
}

window.addEventListener("scroll", requestProcessTick, { passive: true });
window.addEventListener("resize", requestProcessTick);
window.addEventListener("load", requestProcessTick);

requestProcessTick();
