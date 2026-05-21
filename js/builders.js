function lineFromPoints(app, points, material) {
  const geometry = new app.THREE.BufferGeometry().setFromPoints(points);
  return new app.THREE.Line(geometry, material);
}

function makeCircle(app, radius, segments = 160, arc = Math.PI * 2, offset = 0) {
  const points = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = offset + (i / segments) * arc;
    points.push(new app.THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }

  return points;
}

function buildOuterWireSphere(app) {
  const { THREE, materials } = app;
  const sphere = new THREE.Group();

  [-0.92, -0.56, -0.24, 0.24, 0.56, 0.92].forEach((y, index) => {
    const radius = Math.sqrt(Math.max(0, 1.44 - y * y));
    const line = lineFromPoints(app, makeCircle(app, radius, 128), index % 2 ? materials.softLine : materials.deepLine);

    line.position.y = y;
    line.rotation.x = Math.PI / 2;
    sphere.add(line);
  });

  for (let i = 0; i < 9; i += 1) {
    const meridian = lineFromPoints(app, makeCircle(app, 1.2, 128), i % 3 === 0 ? materials.blueSoft : materials.softLine);

    meridian.rotation.y = (i / 9) * Math.PI;
    meridian.rotation.z = Math.PI / 2;
    sphere.add(meridian);
  }

  return sphere;
}

function buildRings(app) {
  const { rings, materials } = app;

  const ringData = [
    [1.76, 0.35, 0.1, 0.22, materials.blueLine],
    [1.5, -0.58, 0.38, -0.16, materials.deepLine],
    [1.28, 0.94, -0.22, 0.42, materials.blueSoft],
    [1.05, -0.3, -0.75, 0.78, materials.softLine],
    [1.9, 0.12, 1.05, -0.55, materials.softLine]
  ];

  ringData.forEach(([radius, rx, ry, rz, material]) => {
    const ring = lineFromPoints(app, makeCircle(app, radius, 192), material);
    ring.rotation.set(rx, ry, rz);
    rings.add(ring);
  });
}

function buildRadials(app) {
  const { THREE, radialGroup, materials } = app;

  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;

    const start = new THREE.Vector3(Math.cos(angle) * 0.44, Math.sin(angle) * 0.44, 0);
    const end = new THREE.Vector3(
      Math.cos(angle) * (0.92 + (i % 3) * 0.12),
      Math.sin(angle) * (0.92 + (i % 3) * 0.12),
      0
    );

    const line = lineFromPoints(app, [start, end], i % 5 === 0 ? materials.blueSoft : materials.softLine);

    line.rotation.set((i % 3) * 0.34, (i % 4) * 0.22, 0);
    line.userData.baseScale = 0.48 + (i % 4) * 0.07;

    radialGroup.add(line);
  }
}

function buildNodes(app) {
  const { THREE, nodeGroup } = app;

  const nodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0077ff,
    transparent: true,
    opacity: 0.86
  });

  const darkNodeMaterial = new THREE.MeshBasicMaterial({
    color: 0x07101d,
    transparent: true,
    opacity: 0.56
  });

  const geometry = new THREE.SphereGeometry(0.025, 12, 12);

  const positions = [
    [-0.72, 0.52, 0.28],
    [0.72, 0.48, -0.2],
    [0.62, -0.58, 0.22],
    [-0.58, -0.62, -0.24],
    [0, 0.86, 0.06],
    [0, -0.86, -0.06]
  ];

  positions.forEach((position, index) => {
    const node = new THREE.Mesh(geometry, index % 3 === 0 ? nodeMaterial : darkNodeMaterial);

    node.position.set(...position);
    node.userData.pulse = 0.7 + index * 0.17;

    nodeGroup.add(node);
  });
}

function buildInnerFrame(app) {
  const { THREE, innerFrame, materials } = app;

  const cube = new THREE.BoxGeometry(0.98, 0.98, 0.98);
  const edges = new THREE.EdgesGeometry(cube);
  const edgeMesh = new THREE.LineSegments(edges, materials.blueSoft);
  const surface = new THREE.Mesh(cube, materials.surfaceMaterial);
  const gridLines = new THREE.Group();

  for (let i = -1; i <= 1; i += 1) {
    const offset = i * 0.24;

    gridLines.add(lineFromPoints(app, [new THREE.Vector3(-0.5, offset, 0.5), new THREE.Vector3(0.5, offset, 0.5)], materials.softLine));
    gridLines.add(lineFromPoints(app, [new THREE.Vector3(offset, -0.5, 0.5), new THREE.Vector3(offset, 0.5, 0.5)], materials.softLine));
    gridLines.add(lineFromPoints(app, [new THREE.Vector3(-0.5, offset, -0.5), new THREE.Vector3(0.5, offset, -0.5)], materials.softLine));
    gridLines.add(lineFromPoints(app, [new THREE.Vector3(offset, -0.5, -0.5), new THREE.Vector3(offset, 0.5, -0.5)], materials.softLine));
  }

  innerFrame.add(surface, edgeMesh, gridLines);
  innerFrame.rotation.set(0.72, 0.44, 0.18);
}

function addLabelAnchors(app) {
  const { labelAnchors, orb, workGroup } = app;

  labelAnchors.ai.position.set(1.32, 0.78, 0.25);
  labelAnchors.portal.position.set(-1.12, -0.12, 0.38);
  labelAnchors.viewer.position.set(0.88, -0.86, -0.1);
  labelAnchors.archive.position.set(-0.68, -1.7, 0.52);

  Object.entries(labelAnchors).forEach(([key, anchor]) => {
    if (key === "archive") {
      workGroup.add(anchor);
    } else {
      orb.add(anchor);
    }
  });
}

function buildAtmosphere(app) {
  const { THREE, world } = app;

  const planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x0077ff,
    transparent: true,
    opacity: 0.025,
    depthWrite: false,
    side: THREE.DoubleSide
  });

  for (let i = 0; i < 3; i += 1) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2 + i * 0.8, 2.2 + i * 0.34, 1, 1),
      planeMaterial.clone()
    );

    plane.position.set(0.2 - i * 0.2, 0.04 + i * 0.18, -0.5 - i * 0.32);
    plane.rotation.set(0.35 + i * 0.2, -0.22, 0.18 - i * 0.12);

    world.add(plane);
  }
}

function registerWorkMaterial(app, material) {
  app.workMaterials.push({ material, target: material.opacity });
  material.opacity = 0;
  return material;
}

function makeFrameGeometry(app, widthValue, heightValue) {
  const { THREE } = app;
  const w = widthValue / 2;
  const h = heightValue / 2;

  return new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-w, -h, 0),
    new THREE.Vector3(w, -h, 0),
    new THREE.Vector3(w, h, 0),
    new THREE.Vector3(-w, h, 0),
    new THREE.Vector3(-w, -h, 0)
  ]);
}

function buildWorkArchive(app) {
  const { THREE, workGroup } = app;

  workGroup.position.set(0.18, -3.6, -0.85);
  workGroup.scale.setScalar(1.42);
  workGroup.rotation.set(-0.12, -0.08, 0.015);

  const archiveLine = registerWorkMaterial(
    app,
    new THREE.LineBasicMaterial({
      color: 0x07101d,
      transparent: true,
      opacity: 0.18
    })
  );

  const archiveBlue = registerWorkMaterial(
    app,
    new THREE.LineBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.42
    })
  );

  const archiveSurface = registerWorkMaterial(
    app,
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.11,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  const frames = [
    { position: [-0.22, 2.4, 0.12], size: [2.35, 1.28], rotation: [0.01, 0.06, -0.012] },
    { position: [0.18, 0.8, -0.06], size: [2.7, 1.38], rotation: [-0.018, -0.045, 0.01] },
    { position: [-0.12, -0.8, 0.06], size: [2.32, 1.22], rotation: [0.02, 0.04, 0.014] },
    { position: [0.2, -2.38, -0.02], size: [2.5, 1.3], rotation: [-0.012, -0.035, -0.01] }
  ];

  frames.forEach(({ position, size, rotation }, index) => {
    const frame = new THREE.Group();

    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1], 1, 1),
      archiveSurface
    );

    const outline = new THREE.Line(
      makeFrameGeometry(app, size[0], size[1]),
      index === 1 ? archiveBlue : archiveLine
    );

    const header = lineFromPoints(app, [
      new THREE.Vector3(-size[0] * 0.38, size[1] * 0.24, 0.01),
      new THREE.Vector3(size[0] * 0.38, size[1] * 0.24, 0.01)
    ], index === 1 ? archiveBlue : archiveLine);

    const metric = lineFromPoints(app, [
      new THREE.Vector3(-size[0] * 0.38, -size[1] * 0.12, 0.01),
      new THREE.Vector3(size[0] * (0.08 + index * 0.09), -size[1] * 0.12, 0.01)
    ], archiveLine);

    frame.position.set(...position);
    frame.rotation.set(...rotation);
    frame.userData.baseY = position[1];
    frame.userData.floatOffset = index * 0.85;

    frame.add(surface, outline, header, metric);
    workGroup.add(frame);
  });

  const descentRail = lineFromPoints(app, [
    new THREE.Vector3(-1.58, 3.18, 0),
    new THREE.Vector3(-1.58, -3.18, 0)
  ], archiveBlue);

  const crossLinks = new THREE.Group();

  frames.forEach(({ position }, index) => {
    crossLinks.add(lineFromPoints(app, [
      new THREE.Vector3(-1.58, position[1], 0),
      new THREE.Vector3(position[0] - 1.18, position[1], position[2])
    ], index === 1 ? archiveBlue : archiveLine));
  });

  workGroup.add(descentRail, crossLinks);
}

export function buildSceneContent(app) {
  app.orb.add(buildOuterWireSphere(app));
  buildRings(app);
  buildRadials(app);
  buildNodes(app);
  buildInnerFrame(app);
  addLabelAnchors(app);
  buildAtmosphere(app);
  buildWorkArchive(app);
}
