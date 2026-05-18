const root = document.documentElement;
const body = document.body;

const sceneLabel = document.getElementById("sceneLabel");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const panelButtons = document.querySelectorAll("[data-mode]");
const panelDescription = document.getElementById("panelDescription");

const descriptions = {
  strategy:
    "Turn messy business ideas into a clean interactive experience that explains, sells, and guides the user.",
  interface:
    "Build a polished front-end experience that feels like a product demo instead of a basic agency landing page.",
  automation:
    "Connect the experience to forms, AI workflows, project portals, and sales systems that keep moving after the click."
};

let mouseX = 0;
let mouseY = 0;
let targetMouseX = 0;
let targetMouseY = 0;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function setRootVar(name, value) {
  root.style.setProperty(name, value);
}

function updateScrollProgress() {
  const maxScroll = Math.max(1, body.scrollHeight - window.innerHeight);
  const progress = clamp(window.scrollY / maxScroll, 0, 1);

  setRootVar("--progress", progress.toFixed(4));

  const percent = Math.round(progress * 100);
  progressText.textContent = `${String(percent).padStart(2, "0")}%`;
  progressFill.style.width = `${percent}%`;

  if (progress < 0.42) {
    sceneLabel.textContent = "00 / Identity";
  } else {
    sceneLabel.textContent = "01 / System";
  }
}

function updateMouse() {
  mouseX += (targetMouseX - mouseX) * 0.075;
  mouseY += (targetMouseY - mouseY) * 0.075;

  setRootVar("--mouse-x", `${mouseX.toFixed(2)}px`);
  setRootVar("--mouse-y", `${mouseY.toFixed(2)}px`);

  requestAnimationFrame(updateMouse);
}

window.addEventListener(
  "pointermove",
  (event) => {
    targetMouseX = event.clientX - window.innerWidth / 2;
    targetMouseY = event.clientY - window.innerHeight / 2;
  },
  { passive: true }
);

window.addEventListener(
  "scroll",
  () => {
    updateScrollProgress();
  },
  { passive: true }
);

window.addEventListener("resize", updateScrollProgress);

panelButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const mode = button.dataset.mode;

    panelButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    panelDescription.textContent = descriptions[mode];
  });
});

updateScrollProgress();
updateMouse();
