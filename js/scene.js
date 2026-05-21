export function createSceneSystem({ THREE, ScrollTrigger }) {
  const root = document.documentElement;
  const canvas = document.querySelector("#bim-world");
  const progressFill = document.querySelector("#progressFill");

  const labels = {
    ai: document.querySelector('[data-label="ai"]'),
    portal: document.querySelector('[data-label="portal"]'),
    viewer: document.querySelector('[data-label="viewer"]'),
    archive: document.querySelector('[data-label="archive"]')
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clock = new THREE.Clock();
  const pointer = new THREE.Vector2();
  const pointerTarget = new THREE.Vector2();
  const screenPosition = new THREE.Vector3();

  const labelOpacity = { value: 0 };
  const workLabelOpacity = { value: 0 };
  const sceneState = { progress: 0, work: 0, depth: 0 };

  let width = window.innerWidth;
  let height = window.innerHeight;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe7f0fb, 7, 16);

  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 100);
  camera.position.set(0, 0.1, 7.2);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(width, height);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const world = new THREE.Group();
  const orb = new THREE.Group();
  const rings = new THREE.Group();
  const nodeGroup = new THREE.Group();
  const radialGroup = new THREE.Group();
  const innerFrame = new THREE.Group();
  const workGroup = new THREE.Group();
  const workMaterials = [];

  const labelAnchors = {
    ai: new THREE.Object3D(),
    portal: new THREE.Object3D(),
    viewer: new THREE.Object3D(),
    archive: new THREE.Object3D()
  };

  scene.add(world);
  world.add(orb);
  orb.scale.setScalar(0.001);
  orb.add(rings, nodeGroup, radialGroup, innerFrame);
  world.add(workGroup);

  const materials = {
    deepLine: new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.28 }),
    softLine: new THREE.LineBasicMaterial({ color: 0x07101d, transparent: true, opacity: 0.15 }),
    blueLine: new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.72 }),
    blueSoft: new THREE.LineBasicMaterial({ color: 0x0077ff, transparent: true, opacity: 0.34 }),
    surfaceMaterial: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.075,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  };

  function onPointerMove(event) {
    pointerTarget.x = (event.clientX / width - 0.5) * 2;
    pointerTarget.y = (event.clientY / height - 0.5) * 2;
  }

  function onResize() {
    width = window.innerWidth;
    height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.setSize(width, height);

    ScrollTrigger.refresh();
  }

  return {
    THREE,
    ScrollTrigger,
    root,
    canvas,
    progressFill,
    labels,
    reduceMotion,
    clock,
    pointer,
    pointerTarget,
    screenPosition,
    labelOpacity,
    workLabelOpacity,
    sceneState,
    get width() {
      return width;
    },
    get height() {
      return height;
    },
    scene,
    camera,
    renderer,
    world,
    orb,
    rings,
    nodeGroup,
    radialGroup,
    innerFrame,
    workGroup,
    workMaterials,
    labelAnchors,
    materials,
    onPointerMove,
    onResize
  };
}
