function mapRange(THREE, value, inMin, inMax) {
  return THREE.MathUtils.clamp((value - inMin) / (inMax - inMin), 0, 1);
}

function setBackground(app, progress) {
  const start = new app.THREE.Color(0xe7f0fb);
  const end = new app.THREE.Color(0xfbfdff);
  const current = start.lerp(end, progress);

  app.scene.fog.color.copy(current);
  document.body.style.background = `linear-gradient(180deg, #${current.getHexString()} 0%, #fbfdff 100%)`;
}

function updateProgress(app, progress) {
  const page = window.scrollY / Math.max(1, window.innerHeight);

  const heroOut = mapRange(app.THREE, page, 0.68, 0.96);
  const buildReveal = mapRange(app.THREE, page, 0.98, 1.18);
  const buildOut = mapRange(app.THREE, page, 1.72, 2.02);
  const workReveal = mapRange(app.THREE, page, 2.02, 2.28);
  const workDepth = mapRange(app.THREE, page, 2.34, 2.74);
  const workUiOut = mapRange(app.THREE, page, 3.08, 3.46);

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

  setBackground(app, progress);
}

export function createScrollTimeline({ app, gsap }) {
  updateProgress(app, 0);

  if (app.reduceMotion) {
    app.labelOpacity.value = 0.5;
    app.workLabelOpacity.value = 0.8;

    updateProgress(app, 1);

    app.orb.scale.setScalar(1);
    app.orb.position.set(0.4, 1.25, -0.25);
    app.workGroup.position.set(0.25, 0.15, -0.85);
    app.camera.position.set(0, -0.7, 5.15);
    app.radialGroup.scale.setScalar(1.2);
    app.rings.scale.setScalar(1.15);

    return;
  }

  const timeline = gsap.timeline({
    defaults: {
      ease: "none",
      duration: 0.14
    },
    scrollTrigger: {
      trigger: document.body,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.15,
      onUpdate: (self) => updateProgress(app, self.progress)
    }
  });

  timeline
    .to(app.orb.scale, { x: 1, y: 1, z: 1 }, 0.12)
    .to(app.camera.position, { z: 4.15, y: 0.03 }, 0.12)
    .to(app.camera.rotation, { z: -0.035 }, 0.12)
    .to(app.orb.position, { x: 1.08, y: -0.03, z: 0.18 }, 0.12)
    .to(app.orb.rotation, { y: Math.PI * 0.58, x: 0.25 }, 0.12)
    .to(app.rings.scale, { x: 1.38, y: 1.38, z: 1.38 }, 0.12)
    .to(app.radialGroup.scale, { x: 1.35, y: 1.35, z: 1.35 }, 0.14)
    .to(app.innerFrame.scale, { x: 1.18, y: 1.18, z: 1.18 }, 0.12)
    .to(app.labelOpacity, { value: 1 }, 0.18)

    .to(app.camera.position, { z: 3.75, y: -0.38, x: -0.06 }, 0.32)
    .to(app.camera.rotation, { z: 0.025, x: -0.045 }, 0.32)
    .to(app.orb.position, { x: 0.58, y: 1.25, z: -0.28 }, 0.32)
    .to(app.orb.rotation, { y: Math.PI * 1.08, x: -0.14, z: 0.12 }, 0.32)
    .to(app.rings.scale, { x: 1.58, y: 1.58, z: 1.58 }, 0.32)
    .to(app.workGroup.position, { x: 0.1, y: -2.05, z: -0.88 }, 0.32)
    .to(app.workGroup.rotation, { x: -0.1, y: -0.04, z: 0.006 }, 0.32)
    .to(app.workLabelOpacity, { value: 1 }, 0.38)

    .to(app.camera.position, { z: 2.9, y: -1.22, x: 0.02, duration: 0.34 }, 0.58)
    .to(app.camera.rotation, { z: 0.01, x: -0.08, duration: 0.34 }, 0.58)
    .to(app.workGroup.position, { y: 2.35, z: -0.72, duration: 0.34 }, 0.58)
    .to(app.orb.position, { y: 1.88, z: -0.58, duration: 0.34 }, 0.58);
}
