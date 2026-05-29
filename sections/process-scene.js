// sections/process-scene.js

export class ProcessScene {
  constructor({ mount }) {
    this.mount = mount;
    this.word = mount?.querySelector(".process-word");
  }

  init() {
    this.mount?.classList.add("is-ready");
  }

  setProgress({ intro = 0, cards = 0, handoff = 0 }) {
    if (!this.mount) return;

    this.mount.style.setProperty("--process-intro", clamp01(intro).toFixed(4));
    this.mount.style.setProperty("--process-cards", clamp01(cards).toFixed(4));
    this.mount.style.setProperty("--process-handoff", clamp01(handoff).toFixed(4));
  }

  destroy() {
    this.mount?.classList.remove("is-ready");
  }
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}
