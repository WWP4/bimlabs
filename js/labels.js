export function updateLabels(app) {
  Object.entries(app.labelAnchors).forEach(([key, anchor]) => {
    const label = app.labels[key];

    if (!label) return;

    const opacity =
      key === "archive"
        ? app.workLabelOpacity.value
        : app.labelOpacity.value * (1 - app.sceneState.work * 0.5);

    anchor.getWorldPosition(app.screenPosition);
    app.screenPosition.project(app.camera);

    const x = (app.screenPosition.x * 0.5 + 0.5) * app.width;
    const y = (-app.screenPosition.y * 0.5 + 0.5) * app.height;
    const drift = Math.sin(app.clock.elapsedTime * 0.9 + x * 0.01) * 5;

    label.style.transform = `translate3d(${x + drift}px, ${y}px, 0) translate(-50%, -50%)`;
    label.style.opacity = Math.max(0, opacity * (app.screenPosition.z < 1 ? 1 : 0)).toFixed(3);
  });
}
