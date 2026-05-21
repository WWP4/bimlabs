import { createSceneSystem } from "./scene.js";
import { buildSceneContent } from "./builders.js";
import { createScrollTimeline } from "./scroll.js";
import { updateLabels } from "./labels.js";

(async () => {
  const THREE = await import("https://unpkg.com/three@0.164.1/build/three.module.js");
  const { gsap, ScrollTrigger } = window;

  if (!gsap || !ScrollTrigger) {
    console.error("GSAP and ScrollTrigger are required.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const app = createSceneSystem({ THREE, ScrollTrigger });
  buildSceneContent(app);
  createScrollTimeline({ app, gsap, ScrollTrigger, THREE });

  function animate() {
    const elapsed = app.clock.getElapsedTime();
    const delta = app.clock.getDelta();
    const motionScale = app.reduceMotion ? 0.22 : 1;

    app.pointer.x += (app.pointerTarget.x - app.pointer.x) * 0.055;
    app.pointer.y += (app.pointerTarget.y - app.pointer.y) * 0.055;

    app.orb.rotation.y += delta * 0.08 * motionScale;
    app.orb.rotation.x += delta * 0.025 * motionScale;

    app.world.rotation.y = app.pointer.x * 0.055;
    app.world.rotation.x = -app.pointer.y * 0.04;
    app.world.position.x = app.pointer.x * 0.08;
    app.world.position.y = -app.pointer.y * 0.055;

    app.rings.children.forEach((ring, index) => {
      ring.rotation.z += delta * (0.035 + index * 0.006) * motionScale;
    });

    app.radialGroup.children.forEach((line, index) => {
      const extension = THREE.MathUtils.lerp(line.userData.baseScale, 1.25, app.sceneState.progress);
      const pulse = Math.sin(elapsed * 0.65 + index) * 0.018;
      line.scale.setScalar(extension + pulse * motionScale);
    });

    app.nodeGroup.children.forEach((node) => {
      const pulse = 1 + Math.sin(elapsed * 1.7 + node.userData.pulse) * 0.18 * motionScale;
      node.scale.setScalar(pulse * THREE.MathUtils.lerp(1, 1.35, app.sceneState.progress));
    });

    app.innerFrame.rotation.y += delta * 0.045 * motionScale;

    app.workGroup.children.forEach((child) => {
      if (child.isGroup && Number.isFinite(child.userData.baseY)) {
        child.position.y = child.userData.baseY + Math.sin(elapsed * 0.5 + child.userData.floatOffset) * 0.012 * motionScale;
      }
    });

    app.workMaterials.forEach(({ material, target }) => {
      material.opacity = target * THREE.MathUtils.lerp(app.sceneState.work, 1, app.sceneState.depth * 0.35);
    });

    updateLabels(app);
    app.renderer.render(app.scene, app.camera);
    requestAnimationFrame(animate);
  }

  window.addEventListener("pointermove", app.onPointerMove, { passive: true });
  window.addEventListener("resize", app.onResize);

  animate();
})();
