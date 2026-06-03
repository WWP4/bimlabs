// sections/process-scene.js

export class ProcessScene {
  constructor({ mount }) {
    this.mount = mount;
    this.word = mount?.querySelector(".process-word");
    this.progressCache = new Map();
  }

  init() {
    this.mount?.classList.add("is-ready");
  }

  setProgress({ intro = 0, cards = 0, handoff = 0 }) {
    if (!this.mount) return;

    this.setProgressVar("--process-intro", clamp01(intro).toFixed(4));
    this.setProgressVar("--process-cards", clamp01(cards).toFixed(4));
    this.setProgressVar("--process-handoff", clamp01(handoff).toFixed(4));
  }

  setProgressVar(name, value) {
    if (this.progressCache.get(name) === value) return;

    this.progressCache.set(name, value);
    this.mount.style.setProperty(name, value);
  }

  destroy() {
    this.mount?.classList.remove("is-ready");
    this.progressCache.clear();
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
