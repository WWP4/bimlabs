function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max);
}

function mapRange(value, inMin, inMax) {
  return clamp((value - inMin) / (inMax - inMin), 0, 1);
}

function updateProgress(app, progress) {
  const page = window.scrollY / Math.max(1, window.innerHeight);

  const heroOut = mapRange(page, 0.68, 0.96);
  const buildReveal = mapRange(page, 0.98, 1.18);
  const buildOut = mapRange(page, 1.72, 2.02);
  const workReveal = mapRange(page, 2.02, 2.28);
  const workDepth = mapRange(page, 2.34, 2.74);
  const workUiOut = mapRange(page, 3.08, 3.46);

  app.sceneState.progress = progress;
  app.sceneState.work = workReveal;
  app.sceneState.depth = workDepth;

  app.root.style.setProperty("--section-progress", progress.toFixed(4));
  app.root.style.setProperty("--hero-out", heroOut.toFixed(4));
  app.root.style.setProperty("--build-reveal", buildReveal.toFixed(4));
  app.root.style.setProperty("--build-out", buildOut.toFixed(4));
  app.root.style.setProperty("--work-reveal", workReveal.toFixed(4));
  app.root.style.setProperty("--work-depth", workDepth.toFixed(4));
  app.root.style.setProperty("--work-ui-out", workUiOut.toFixed(4));

  if (app.progressFill) {
    app.progressFill.style.width = `${Math.round(progress * 100)}%`;
  }
}

export function createScrollTimeline({ app, gsap }) {
  updateProgress(app, 0);

  gsap.timeline({
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.15,
      onUpdate: (self) => updateProgress(app, self.progress)
    }
  });
}
