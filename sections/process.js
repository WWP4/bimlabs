const processSection = document.querySelector(".process-section");
const processFrame = document.querySelector(".process-frame");
const processTitle = document.querySelector(".process-title");
const processBgWord = document.querySelector(".process-bg-word");
const processVisual = document.querySelector(".process-visual");
const processScanline = document.querySelector(".process-scanline");
const processData = document.querySelector(".process-data-list");

let processBuilt = false;
let processRAF = false;

const processClamp = (value, min, max) => Math.min(Math.max(value, min), max);
const processLerp = (a, b, t) => a + (b - a) * t;

let processState = {
  titleY: 24,
  titleOpacity: 0,
  visualY: 40,
  visualOpacity: 0,
  bgX: 0,
  scanY: 40,
  dataY: 18,
  dataOpacity: 0,
};

let processTarget = { ...processState };

function splitProcessTitle() {
  if (!processTitle || processTitle.dataset.split === "true") return;

  const text = processTitle.textContent.trim();
  processTitle.textContent = "";

  [...text].forEach((char, index) => {
    const span = document.createElement("span");
    span.className = "char";
    span.textContent = char === " " ? "\u00A0" : char;
    span.style.transition = `
      opacity 0.55s ease ${index * 0.018}s,
      filter 0.55s ease ${index * 0.018}s,
      transform 0.55s ease ${index * 0.018}s
    `;
    processTitle.appendChild(span);
  });

  processTitle.dataset.split = "true";
}

function buildProcessTitle() {
  if (!processTitle || processBuilt) return;
  processBuilt = true;
  processTitle.classList.add("is-built");
}

function updateProcessTargets() {
  if (!processSection) return;

  const rect = processSection.getBoundingClientRect();
  const distance = processSection.offsetHeight - window.innerHeight;
  const progress = processClamp(-rect.top / Math.max(distance, 1), 0, 1);

  const enter = processClamp(progress / 0.22, 0, 1);
  const exit = processClamp((progress - 0.76) / 0.24, 0, 1);

  processTarget.titleY = processLerp(24, -8, enter) + exit * -20;
  processTarget.titleOpacity = processLerp(0, 1, enter) * (1 - exit * 0.25);

  processTarget.visualY = processLerp(45, -10, enter) + exit * -30;
  processTarget.visualOpacity = processLerp(0, 1, enter) * (1 - exit * 0.35);

  processTarget.bgX = processLerp(0, -90, progress);
  processTarget.scanY = processLerp(40, 340, progress);
  processTarget.dataY = processLerp(20, 0, enter);
  processTarget.dataOpacity = processLerp(0, 1, enter);

  if (progress > 0.08) buildProcessTitle();

  startProcessLoop();
}

function startProcessLoop() {
  if (processRAF) return;
  processRAF = true;
  requestAnimationFrame(animateProcess);
}

function animateProcess() {
  processState.titleY = processLerp(processState.titleY, processTarget.titleY, 0.09);
  processState.titleOpacity = processLerp(processState.titleOpacity, processTarget.titleOpacity, 0.09);
  processState.visualY = processLerp(processState.visualY, processTarget.visualY, 0.09);
  processState.visualOpacity = processLerp(processState.visualOpacity, processTarget.visualOpacity, 0.09);
  processState.bgX = processLerp(processState.bgX, processTarget.bgX, 0.08);
  processState.scanY = processLerp(processState.scanY, processTarget.scanY, 0.08);
  processState.dataY = processLerp(processState.dataY, processTarget.dataY, 0.09);
  processState.dataOpacity = processLerp(processState.dataOpacity, processTarget.dataOpacity, 0.09);

  if (processTitle) {
    processTitle.style.transform = `translate3d(0, ${processState.titleY}px, 0)`;
    processTitle.style.opacity = processState.titleOpacity.toFixed(3);
  }

  if (processVisual) {
    processVisual.style.transform = `translate3d(0, calc(-50% + ${processState.visualY}px), 0)`;
    processVisual.style.opacity = processState.visualOpacity.toFixed(3);
  }

  if (processBgWord) {
    processBgWord.style.transform = `translate3d(${processState.bgX}px, 0, 0)`;
  }

  if (processScanline) {
    processScanline.style.transform = `translate3d(0, ${processState.scanY}px, 0)`;
  }

  if (processData) {
    processData.style.transform = `translate3d(0, ${processState.dataY}px, 0)`;
    processData.style.opacity = processState.dataOpacity.toFixed(3);
  }

  const moving =
    Math.abs(processState.titleY - processTarget.titleY) > 0.1 ||
    Math.abs(processState.titleOpacity - processTarget.titleOpacity) > 0.01 ||
    Math.abs(processState.visualY - processTarget.visualY) > 0.1 ||
    Math.abs(processState.visualOpacity - processTarget.visualOpacity) > 0.01 ||
    Math.abs(processState.bgX - processTarget.bgX) > 0.1 ||
    Math.abs(processState.scanY - processTarget.scanY) > 0.1 ||
    Math.abs(processState.dataY - processTarget.dataY) > 0.1 ||
    Math.abs(processState.dataOpacity - processTarget.dataOpacity) > 0.01;

  if (moving) {
    requestAnimationFrame(animateProcess);
  } else {
    processRAF = false;
  }
}

function initProcessSection() {
  splitProcessTitle();
  updateProcessTargets();

  window.addEventListener("scroll", updateProcessTargets, { passive: true });
  window.addEventListener("resize", updateProcessTargets);
}

initProcessSection();



function triggerProcessGlitch() {
  const glitchEls = document.querySelectorAll(
    ".process-title, .process-kicker, .process-index-number, .process-index-label"
  );

  glitchEls.forEach((el) => {
    el.classList.remove("is-glitching");
    void el.offsetWidth;
    el.classList.add("is-glitching");
  });
}

let glitchTriggered = false;

function watchProcessGlitch() {
  if (!processSection) return;

  const rect = processSection.getBoundingClientRect();
  const triggerPoint = window.innerHeight * 0.55;

  if (!glitchTriggered && rect.top < triggerPoint) {
    glitchTriggered = true;
    triggerProcessGlitch();
  }
}

window.addEventListener("scroll", watchProcessGlitch, { passive: true });
window.addEventListener("load", watchProcessGlitch);
