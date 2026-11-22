(function (THREE) {
  'use strict';

  const stage = document.getElementById('canvas-container');
  const errorPanel = document.getElementById('error-panel');
  function showError(message) {
    document.getElementById('loading-panel').hidden = true;
    errorPanel.hidden = false;
    document.getElementById('error-message').textContent = message;
  }

  try {
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xe9e9df, 0.010);
    const camera = new THREE.PerspectiveCamera(37, innerWidth / innerHeight, 0.1, 140);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0xe8e9df, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    stage.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', '戴飞行护目镜的水豚，驾驶一艘木制发条飞艇。拖动旋转，滚轮缩放，方向键旋转，0 键归位。');

    const controls = new window.AirshipOrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.rotateSpeed = 0.58;
    controls.zoomSpeed = 0.75;
    controls.panSpeed = 0.65;
    controls.minDistance = 4;
    controls.maxDistance = 55;
    controls.minPolarAngle = 0.23;
    controls.maxPolarAngle = Math.PI * 0.77;
    controls.autoRotateSpeed = 0.4;
    controls.screenSpacePanning = true;
    controls.listenToKeyEvents(canvas);

    const state = { paused: false, autoOrbit: false, view: 'wide', elapsed: 0 };
    const flight = new THREE.Group();
    scene.add(flight);
    const movingGears = [];
    const propellers = [];
    const steamPuffs = [];
    const cloudGroups = [];
    const tinyFlags = [];
    const palette = { wood: 0x96592f, darkWood: 0x58331e, honey: 0xc58b4d, brass: 0xc59b4c, gold: 0xe2bc70, darkMetal: 0x3c504c, rope: 0x766047 };
    const material = (color, options = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.64, ...options });
    const brass = material(palette.brass, { metalness: 0.65, roughness: 0.32 });
    const paleBrass = material(palette.gold, { metalness: 0.5, roughness: 0.36 });
    const iron = material(palette.darkMetal, { metalness: 0.55, roughness: 0.48 });
    const rope = material(palette.rope, { roughness: 1 });
    const darkWood = material(palette.darkWood);
    const leather = material(0x4a4c38, { roughness: 0.91 });
    const ivory = material(0xeee4ce, { roughness: 0.9 });
    const copper = material(0x9b5b39, { metalness: 0.52, roughness: 0.38 });

    let seed = 27;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    function woodTexture() {
      const c = document.createElement('canvas'); c.width = 512; c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#dec5a0'; ctx.fillRect(0, 0, 512, 128);
      for (let i = 0; i < 140; i++) {
        const y = random() * 128, amplitude = 0.4 + random() * 2.4;
        ctx.beginPath();
        for (let x = 0; x <= 512; x += 8) {
          const yy = y + Math.sin(x * 0.014 + y) * amplitude + Math.sin(x * 0.046 + y) * 0.35;
          if (!x) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = `rgba(94,53,28,${0.03 + random() * 0.13})`;
        ctx.lineWidth = 0.3 + random() * 0.9; ctx.stroke();
      }
      for (let k = 0; k < 4; k++) {
        const x = random() * 512, y = random() * 128;
        for (let r = 1; r < 6; r++) {
          ctx.beginPath(); ctx.ellipse(x, y, r * 4.6, r * 1.65, 0, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(91,51,28,.12)'; ctx.lineWidth = 0.7; ctx.stroke();
        }
      }
      const texture = new THREE.CanvasTexture(c);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return texture;
    }
    const grain = woodTexture();
    const woodMats = [0xb87e43, 0xa66936, 0xbf884d, 0x9e632f, 0xba8249, 0xaa713d, 0xc18a51].map(color => material(color, { map: grain, roughness: 0.79, side: THREE.DoubleSide }));
    const deckMat = material(0xd5ae73, { map: grain, roughness: 0.83 });

    function mesh(geometry, mat, parent = flight, position = null) {
      const object = new THREE.Mesh(geometry, mat);
      object.castShadow = true; object.receiveShadow = true;
      if (position) object.position.set(...position);
      parent.add(object); return object;
    }
    const sphereGeometry = new THREE.SphereGeometry(1, 20, 14);
    function ellipsoid(parent, mat, position, scale) {
      const object = mesh(sphereGeometry, mat, parent, position); object.scale.set(...scale); return object;
    }
    function box(parent, mat, position, scale) { return mesh(new THREE.BoxGeometry(...scale), mat, parent, position); }
    function tube(parent, points, radius, mat, segments = 40, closed = false) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), closed);
      return mesh(new THREE.TubeGeometry(curve, segments, radius, 7, closed), mat, parent);
    }
    function rod(parent, start, end, radius, mat, radiusEnd = radius) {
      const a = new THREE.Vector3(...start), b = new THREE.Vector3(...end), delta = b.clone().sub(a);
      const object = mesh(new THREE.CylinderGeometry(radiusEnd, radius, delta.length(), 12), mat, parent);
      object.position.copy(a.add(b).multiplyScalar(0.5));
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize());
      return object;
    }
    function ring(parent, mat, position, radius, thickness, rotation = null) {
      const object = mesh(new THREE.TorusGeometry(radius, thickness, 8, 44), mat, parent, position);
      if (rotation) object.rotation.set(...rotation); return object;
    }
    const boltGeometry = new THREE.SphereGeometry(0.045, 8, 6);
    function bolt(parent, position, mat = paleBrass) { return mesh(boltGeometry, mat, parent, position); }

    // A continuous boat hull, assembled as seven slightly different timber strakes.
    const length = 9.0;
    function hullStation(u) {
      const s = Math.max(0.0001, Math.sin(Math.PI * u));
      return { x: -4.35 + length * u, width: 1.24 * Math.pow(s, 0.65) + 0.016, depth: 1.60 * Math.pow(s, 0.62) + 0.04, rim: 0.79 + 0.17 * Math.pow(Math.abs(u * 2 - 1), 3) };
    }
    function hullPoint(u, v, offset = 0) {
      const station = hullStation(u), angle = Math.PI * v;
      return [station.x, station.rim - station.depth * Math.pow(Math.sin(angle), 0.89), -Math.cos(angle) * (station.width + offset)];
    }
    for (let strake = 0; strake < 7; strake++) {
      const positions = [], uvs = [], indices = [], nx = 66, ny = 4;
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= ny; j++) {
        const u = i / nx, v = (strake + j / ny) / 7;
        positions.push(...hullPoint(u, v)); uvs.push(u * 3.7, j / ny * 0.98);
      }
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const a = i * (ny + 1) + j, b = a + ny + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices); geometry.computeVertexNormals();
      mesh(geometry, woodMats[strake]);
      if (strake > 0) {
        const points = []; for (let i = 0; i <= 44; i++) points.push(hullPoint(i / 44, strake / 7, 0.007));
        tube(flight, points, 0.015, darkWood, 66);
      }
    }
    // Timber deck and its inset caulking lines.
    const deckShape = new THREE.Shape();
    for (let i = 0; i <= 48; i++) { const h = hullStation(i / 48); if (!i) deckShape.moveTo(h.x, h.width); else deckShape.lineTo(h.x, h.width); }
    for (let i = 48; i >= 0; i--) { const h = hullStation(i / 48); deckShape.lineTo(h.x, -h.width); }
    deckShape.closePath();
    const deck = mesh(new THREE.ExtrudeGeometry(deckShape, { depth: 0.10, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.035, bevelSegments: 2, steps: 1 }), deckMat);
    deck.rotation.x = -Math.PI / 2; deck.position.y = 0.735;
    for (let zi = -5; zi <= 5; zi++) {
      const z = zi * 0.205, points = [];
      for (let i = 1; i < 88; i++) { const h = hullStation(i / 88); if (h.width > Math.abs(z) + 0.05) points.push([h.x, 0.848, z]); }
      if (points.length > 1) tube(flight, points, 0.009, darkWood, 30);
    }
    for (const side of [-1, 1]) {
      const rim = [];
      for (let i = 0; i <= 64; i++) { const h = hullStation(i / 64); rim.push([h.x, h.rim + 0.03, h.width * side]); }
      tube(flight, rim, 0.071, darkWood, 94);
      tube(flight, rim.map(p => [p[0], p[1] + 0.038, p[2]]), 0.023, paleBrass, 94);
      const rail = [];
      for (let i = 5; i <= 57; i++) { const h = hullStation(i / 64); rail.push([h.x, h.rim + 0.43, h.width * side]); }
      tube(flight, rail, 0.040, woodMats[1], 76);
      for (let i = 8; i <= 56; i += 8) {
        const h = hullStation(i / 64);
        rod(flight, [h.x, h.rim, h.width * side], [h.x, h.rim + 0.43, h.width * side], 0.025, brass);
        bolt(flight, [h.x, h.rim + 0.44, h.width * side]);
      }
      // Rows of brass nails read clearly against the curved wood.
      for (let i = 4; i <= 32; i += 2) for (const v of [0.12, 0.26, 0.37]) {
        const p = hullPoint(i / 36, side > 0 ? 1 - v : v, 0.016); bolt(flight, p, brass).scale.setScalar(0.62);
      }
    }

    const envelope = window.createAirshipEnvelope(THREE);
    flight.add(envelope.group);
    // Suspension cables have a slight bow under their own weight.
    for (const x of [-3.35, -0.6, 2.4]) for (const side of [-1, 1]) {
      const h = hullStation((x + 4.35) / length);
      const top = [x - 0.2, 4.22, side * 1.11], bottom = [x, 1.18, h.width * side];
      tube(flight, [top, [x - 0.28, 2.7, side * 1.32], bottom], 0.024, rope, 25);
      ring(flight, brass, bottom, 0.082, 0.018, [Math.PI / 2, 0, 0]);
      box(flight, brass, [x, 1.0, h.width * side], [0.13, 0.31, 0.09]);
      rod(flight, [x - 0.36, 4.25, side * 1.05], [x + 0.0, 4.25, side * 1.05], 0.045, darkWood);
    }
    for (const side of [-1, 1]) {
      rod(flight, [-1.7, 0.9, side * 0.68], [-0.8, 3.55, side * 0.48], 0.045, woodMats[2]);
      rod(flight, [-1.7, 0.9, side * 0.68], [-3.0, 3.78, side * 0.49], 0.043, woodMats[2]);
    }

    function makeGear(parent, position, radius, teeth, speed, mat = brass) {
      const group = new THREE.Group(); group.position.set(...position); parent.add(group);
      const shape = new THREE.Shape();
      const count = teeth * 4;
      for (let i = 0; i <= count; i++) {
        const angle = i / count * Math.PI * 2, r = radius * ((i % 4 === 1 || i % 4 === 2) ? 1 : 0.875);
        const x = Math.cos(angle) * r, y = Math.sin(angle) * r;
        if (!i) shape.moveTo(x, y); else shape.lineTo(x, y);
      }
      const hole = new THREE.Path(); hole.absarc(0, 0, radius * 0.61, 0, Math.PI * 2, true); shape.holes.push(hole);
      mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.105, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.012, bevelThickness: 0.012, curveSegments: 36 }), mat, group);
      ring(group, paleBrass, [0, 0, 0.055], radius * 0.65, radius * 0.035);
      for (let i = 0; i < 5; i++) {
        const spoke = box(group, mat, [0, 0, 0.055], [radius * 1.24, radius * 0.14, 0.08]); spoke.rotation.z = i * Math.PI * 2 / 5;
      }
      const hub = mesh(new THREE.CylinderGeometry(radius * 0.19, radius * 0.19, 0.20, 14), iron, group, [0, 0, 0.07]); hub.rotation.x = Math.PI / 2;
      bolt(group, [0, 0, 0.19], paleBrass).scale.setScalar(1.25);
      movingGears.push({ group, speed }); return group;
    }
    // The exposed clockwork is deliberately placed on the camera-facing side.
    for (const side of [-1, 1]) {
      const assembly = new THREE.Group(); assembly.position.z = side * 1.28; if (side < 0) assembly.rotation.y = Math.PI; flight.add(assembly);
      const offset = side > 0 ? 0 : 0.10;
      rod(assembly, [-3.45, 0.12, -0.04], [-1.25, 0.12, -0.04], 0.12, darkWood);
      makeGear(assembly, [-2.87 + offset, 0.42, 0.02], 0.55, 22, 0.35);
      makeGear(assembly, [-1.99 + offset, 0.42, 0.025], 0.40, 16, -0.49, paleBrass);
      makeGear(assembly, [-2.33 + offset, -0.22, 0.075], 0.31, 13, 0.63, copper);
      ring(assembly, darkWood, [-2.87 + offset, 0.42, -0.02], 0.65, 0.029);
    }

    // Copper boiler, pressure dial, chimney, and brass pipes.
    const engine = new THREE.Group(); engine.position.set(-2.28, 0.86, 0); flight.add(engine);
    mesh(new THREE.CylinderGeometry(0.48, 0.54, 1.12, 28), iron, engine, [0, 0.56, 0]);
    ellipsoid(engine, copper, [0, 1.13, 0], [0.48, 0.22, 0.48]);
    ellipsoid(engine, darkWood, [0, 0.04, 0], [0.62, 0.13, 0.61]);
    for (const y of [0.16, 0.93]) ring(engine, brass, [0, y, 0], 0.505, 0.044, [Math.PI / 2, 0, 0]);
    for (let a = 0; a < 12; a++) {
      const angle = a * Math.PI / 6; bolt(engine, [Math.cos(angle) * 0.53, 0.95, Math.sin(angle) * 0.53]);
    }
    rod(engine, [-0.13, 1.16, -0.08], [-0.13, 1.89, -0.08], 0.115, copper);
    mesh(new THREE.CylinderGeometry(0.19, 0.14, 0.17, 20), darkWood, engine, [-0.13, 1.94, -0.08]);
    ring(engine, brass, [-0.13, 2.04, -0.08], 0.165, 0.034, [Math.PI / 2, 0, 0]);
    tube(engine, [[0.27, 0.94, 0.43], [0.51, 1.27, 0.50], [0.79, 1.16, 0.52], [0.79, 0.22, 0.62], [1.12, -0.28, 1.45]], 0.061, brass, 35);
    tube(engine, [[-0.3, 0.65, -0.39], [-0.77, 0.67, -0.6], [-0.95, 0.15, -1.51]], 0.060, copper, 25);
    for (const z of [-0.3, 0.3]) rod(engine, [-0.38, -0.03, z], [-0.38, -0.22, z], 0.064, brass);
    const dial = new THREE.Group(); dial.position.set(0.06, 0.67, 0.515); dial.rotation.x = -0.05; engine.add(dial);
    const gaugeCase = mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.085, 24), brass, dial); gaugeCase.rotation.x = Math.PI / 2;
    mesh(new THREE.CircleGeometry(0.179, 28), ivory, dial, [0, 0, 0.05]);
    ring(dial, paleBrass, [0, 0, 0.052], 0.19, 0.02);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * 0.25 + i / 8 * Math.PI * 1.5;
      const tick = box(dial, darkWood, [Math.sin(a) * 0.145, Math.cos(a) * 0.145, 0.058], [0.016, 0.044, 0.008]); tick.rotation.z = -a;
    }
    const needle = new THREE.Group(); dial.add(needle);
    box(needle, copper, [0, 0.055, 0.067], [0.014, 0.125, 0.01]); bolt(dial, [0, 0, 0.077], iron).scale.setScalar(0.45);

    // Oversized winding key: a clockwork silhouette with twin loops.
    const key = new THREE.Group(); key.position.set(-3.18, 1.95, 0.60); flight.add(key);
    rod(key, [0, -0.38, 0], [0, 0.16, 0], 0.068, brass);
    ring(key, paleBrass, [-0.19, 0.23, 0], 0.22, 0.054);
    ring(key, paleBrass, [0.19, 0.23, 0], 0.22, 0.054);
    box(key, brass, [0, 0.10, 0], [0.28, 0.13, 0.095]);

    // Three-bladed polished timber propellers.
    function propeller(parent, position, axis, radius, speed) {
      const mount = new THREE.Group(); mount.position.set(...position); parent.add(mount);
      if (axis === 'x') mount.rotation.y = Math.PI / 2;
      if (axis === '-z') mount.rotation.y = Math.PI;
      const casing = mesh(new THREE.CylinderGeometry(radius * 0.22, radius * 0.26, 0.35, 20), copper, mount, [0, 0, -0.12]); casing.rotation.x = Math.PI / 2;
      ring(mount, brass, [0, 0, 0.025], radius * 0.23, 0.033);
      const spin = new THREE.Group(); mount.add(spin);
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Group(); blade.rotation.z = i * Math.PI * 2 / 3; spin.add(blade);
        const shape = new THREE.Shape();
        shape.moveTo(-0.075, 0.11); shape.bezierCurveTo(-0.18, radius * 0.42, -0.19, radius * 0.86, -0.075, radius);
        shape.bezierCurveTo(0.035, radius * 1.06, 0.22, radius * 0.97, 0.20, radius * 0.78);
        shape.bezierCurveTo(0.19, radius * 0.46, 0.11, 0.20, 0.075, 0.11); shape.closePath();
        mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.065, bevelEnabled: true, bevelSegments: 2, bevelSize: 0.022, bevelThickness: 0.017, curveSegments: 12 }), woodMats[1], blade);
        const stripe = box(blade, ivory, [0.056, radius * 0.88, 0.075], [0.215, 0.065, 0.012]); stripe.rotation.z = -0.18;
        for (const y of [0.22, 0.31]) bolt(blade, [0.00, y, 0.088], brass).scale.setScalar(0.63);
      }
      ellipsoid(spin, paleBrass, [0, 0, 0.08], [0.17, 0.17, 0.13]);
      propellers.push({ group: spin, speed }); return mount;
    }
    for (const side of [-1, 1]) {
      rod(flight, [-1.31, 0.4, side * 0.9], [-1.31, 0.4, side * 1.95], 0.075, brass);
      rod(flight, [-2.18, 0.9, side * 1.0], [-1.31, 0.4, side * 1.82], 0.043, iron);
      propeller(flight, [-1.31, 0.40, side * 1.96], side > 0 ? 'z' : '-z', 1.07, side * 3.1);
    }
    propeller(flight, [-4.64, 0.44, 0], 'x', 0.91, -3.8);
    // The stern rudder is wood, with brass hinges and canvas fins above.
    const finShape = new THREE.Shape(); finShape.moveTo(-4.13, 1.03); finShape.lineTo(-5.20, 2.02); finShape.quadraticCurveTo(-5.67, 2.24, -5.47, 1.26); finShape.lineTo(-4.64, 0.55); finShape.closePath();
    mesh(new THREE.ExtrudeGeometry(finShape, { depth: 0.11, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 }), woodMats[3], flight, [0, 0, -0.055]);
    rod(flight, [-4.31, 0.6, 0], [-4.63, 1.25, 0], 0.051, brass);
    tube(flight, [[-4.31, 1.05, 0.10], [-5.17, 1.83, 0.10], [-5.33, 1.40, 0.10]], 0.028, paleBrass, 18);

    // A simple upholstered seat, a logbook, and the capybara's wooden helm.
    box(flight, darkWood, [2.18, 0.99, 0], [0.92, 0.25, 0.98]);
    ellipsoid(flight, leather, [2.15, 1.10, 0], [0.61, 0.15, 0.64]);
    const character = window.createCapybara(THREE); character.group.position.set(2.10, 0.85, 0); flight.add(character.group);
    const helm = new THREE.Group(); helm.position.set(3.14, 1.81, 0); helm.rotation.y = Math.PI / 2; flight.add(helm);
    rod(flight, [3.15, 0.88, 0], [3.14, 1.81, 0], 0.062, iron);
    ring(helm, woodMats[1], [0, 0, 0], 0.46, 0.055);
    ring(helm, paleBrass, [0, 0, -0.012], 0.405, 0.018);
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4;
      rod(helm, [0, 0, 0], [Math.cos(angle) * 0.54, Math.sin(angle) * 0.54, 0], 0.023, brass);
      ellipsoid(helm, darkWood, [Math.cos(angle) * 0.55, Math.sin(angle) * 0.55, 0], [0.062, 0.062, 0.064]);
    }
    ellipsoid(helm, brass, [0, 0, 0], [0.11, 0.11, 0.07]);
    const dashboard = box(flight, woodMats[3], [3.80, 1.05, 0], [0.44, 0.32, 0.78]); dashboard.rotation.z = -0.08;
    const compass = new THREE.Group(); compass.position.set(3.79, 1.23, 0.09); compass.rotation.x = -Math.PI / 2; flight.add(compass);
    mesh(new THREE.CircleGeometry(0.18, 24), ivory, compass); ring(compass, brass, [0, 0, 0.025], 0.18, 0.03);
    const arrowShape = new THREE.Shape(); arrowShape.moveTo(0, 0.14); arrowShape.lineTo(-0.045, 0); arrowShape.lineTo(0, -0.11); arrowShape.lineTo(0.045, 0); arrowShape.closePath();
    mesh(new THREE.ShapeGeometry(arrowShape), copper, compass, [0, 0, 0.035]);
    const book = box(flight, leather, [1.11, 0.915, 0.58], [0.40, 0.065, 0.29]); book.rotation.y = -0.3;
    const pages = box(flight, ivory, [1.11, 0.932, 0.58], [0.36, 0.032, 0.27]); pages.rotation.y = -0.3;
    box(flight, brass, [1.12, 0.955, 0.57], [0.075, 0.012, 0.22]).rotation.y = -0.3;

    function lantern(position) {
      const group = new THREE.Group(); group.position.set(...position); flight.add(group);
      const glass = material(0xffd69b, { transparent: true, opacity: 0.72, emissive: 0xf9ad47, emissiveIntensity: 0.48, roughness: 0.24 });
      mesh(new THREE.CylinderGeometry(0.105, 0.11, 0.27, 10), glass, group, [0, 0.18, 0]);
      for (const y of [0.03, 0.335]) mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.05, 10), brass, group, [0, y, 0]);
      for (const x of [-0.09, 0.09]) for (const z of [-0.07, 0.07]) rod(group, [x, 0.04, z], [x, 0.33, z], 0.012, darkWood);
      mesh(new THREE.ConeGeometry(0.17, 0.12, 10), darkWood, group, [0, 0.40, 0]);
      ring(group, brass, [0, 0.49, 0], 0.058, 0.014);
    }
    lantern([4.00, 1.07, 0.52]); lantern([4.00, 1.07, -0.52]);
    rod(flight, [-4.04, 1.0, 0.83], [-4.04, 2.28, 0.83], 0.024, brass);
    const flagGeometry = new THREE.PlaneGeometry(0.56, 0.28, 12, 4);
    const flag = mesh(flagGeometry, material(0xb9643d, { side: THREE.DoubleSide, roughness: 1 }), flight, [-4.32, 2.07, 0.83]);
    tinyFlags.push({ mesh: flag, original: flagGeometry.attributes.position.array.slice() });

    // Soft handmade clouds: each lobe shares a single low-poly sphere.
    const cloudMaterial = material(0xffffff, { roughness: 1 });
    function cloud(position, scale, count = 10) {
      const group = new THREE.Group(); group.position.set(...position); group.scale.setScalar(scale); scene.add(group);
      for (let i = 0; i < count; i++) {
        const x = (i / (count - 1) - 0.5) * 4.0, radius = 0.57 + random() * 0.72;
        const lobe = ellipsoid(group, cloudMaterial, [x, random() * 0.4 - 0.15, (random() - 0.5) * 1.15], [radius * 1.45, radius * 0.67, radius]);
        lobe.castShadow = false; lobe.receiveShadow = false;
      }
      cloudGroups.push({ group, base: group.position.clone(), speed: 0.02 + random() * 0.032 }); return group;
    }
    cloud([-7.9, -1.8, -4.3], 1.10, 12);
    cloud([7.2, -1.72, -4.1], 1.09, 13);
    cloud([-3.2, -2.9, 4.6], 0.82, 10);
    cloud([6.8, 4.9, -10.5], 0.85, 10);
    cloud([-9.2, 6.3, -8.4], 0.72, 10);
    cloud([2.0, -4.0, -11.8], 1.35, 12);
    // A few very distant clouds give depth without competing with the pilot.
    cloud([-13.5, 2.3, -21], 1.7, 12);
    cloud([14, 0.5, -18], 1.6, 11);

    const puffMat = material(0xe7e4d8, { transparent: true, opacity: 0.32, depthWrite: false, roughness: 1 });
    for (let i = 0; i < 5; i++) {
      const puff = ellipsoid(flight, puffMat.clone(), [-2.42, 2.98 + i * 0.14, -0.08], [0.15, 0.13, 0.15]);
      puff.castShadow = puff.receiveShadow = false; steamPuffs.push(puff);
    }

    // Warm sun, cool sky fill, and a soft copper rim light.
    scene.add(new THREE.HemisphereLight(0xf4f7ec, 0xab8b63, 2.35));
    const sun = new THREE.DirectionalLight(0xffedcf, 3.9); sun.position.set(1, 12, 8); scene.add(sun);
    sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -10; sun.shadow.camera.right = 10; sun.shadow.camera.top = 11; sun.shadow.camera.bottom = -8;
    sun.shadow.camera.near = 1; sun.shadow.camera.far = 35; sun.shadow.bias = -0.00045; sun.shadow.normalBias = 0.03;
    const fill = new THREE.DirectionalLight(0xbad9da, 1.45); fill.position.set(-7, 5, -8); scene.add(fill);
    const rimLight = new THREE.DirectionalLight(0xffdbac, 1.65); rimLight.position.set(-5, 8, 1); scene.add(rimLight);

    const viewButtons = ['wide', 'pilot', 'detail'];
    let transition = null;
    function preset(view) {
      const mobile = innerWidth < 650;
      if (view === 'pilot') return { position: new THREE.Vector3(7.0, 3.35, 5.2), target: new THREE.Vector3(2.46, 1.99, 0) };
      if (view === 'detail') return { position: new THREE.Vector3(-3.6, 2.7, 7.5), target: new THREE.Vector3(-2.35, 0.89, 0.48) };
      if (mobile) {
        const target = new THREE.Vector3(-0.23, 2.33, 0);
        const offset = new THREE.Vector3(14.8, 8.1, 22.5).sub(target);
        const fit = 1.27 * Math.max(0.78, (innerHeight / innerWidth) / (900 / 430));
        return { position: offset.multiplyScalar(fit).add(target), target };
      }
      return { position: new THREE.Vector3(11.6, 7.0, 15.2), target: new THREE.Vector3(-0.22, 2.33, 0) };
    }
    function clearOrbitMomentum() {
      const damping = controls.enableDamping, auto = controls.autoRotate;
      controls.enableDamping = false; controls.autoRotate = false;
      controls.update();
      controls.enableDamping = damping; controls.autoRotate = auto;
    }
    function selectView(view, instant = false) {
      clearOrbitMomentum();
      state.view = view;
      for (const key of viewButtons) {
        const button = document.getElementById(`view-${key}`);
        button?.classList.toggle('active', key === view); button?.setAttribute('aria-pressed', String(key === view));
      }
      const next = preset(view);
      if (instant) { transition = null; controls.target.copy(next.target); camera.position.copy(next.position); controls.update(); }
      else transition = { fromPosition: camera.position.clone(), fromTarget: controls.target.clone(), ...next, startedAt: performance.now() };
    }
    function resetView() {
      state.autoOrbit = false; controls.autoRotate = false;
      document.getElementById('auto-orbit').setAttribute('aria-pressed', 'false');
      document.getElementById('auto-orbit').classList.remove('active');
      selectView('wide', true);
    }
    viewButtons.forEach(view => document.getElementById(`view-${view}`).addEventListener('click', () => selectView(view)));
    document.getElementById('reset-view').addEventListener('click', resetView);
    document.getElementById('pause-flight').addEventListener('click', () => {
      state.paused = !state.paused;
      const button = document.getElementById('pause-flight');
      button.setAttribute('aria-pressed', String(state.paused)); button.classList.toggle('active', state.paused);
      button.querySelector('.button-label').textContent = state.paused ? '继续' : '暂停';
      document.getElementById('status-label').textContent = state.paused ? '停留这一刻' : '晴空巡航';
      document.body.dataset.paused = String(state.paused);
    });
    document.getElementById('auto-orbit').addEventListener('click', () => {
      state.autoOrbit = !state.autoOrbit; controls.autoRotate = state.autoOrbit;
      const button = document.getElementById('auto-orbit'); button.setAttribute('aria-pressed', String(state.autoOrbit)); button.classList.toggle('active', state.autoOrbit);
    });
    document.getElementById('fullscreen')?.addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch (_) { /* The scene remains usable if fullscreen is unavailable. */ }
    });
    canvas.addEventListener('dblclick', resetView);
    canvas.addEventListener('keydown', event => { if (event.key === '0') resetView(); });
    controls.addEventListener('start', () => { transition = null; });
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) document.getElementById('pause-flight').click();
    selectView('wide', true);

    function resize() {
      camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 650 ? 1.5 : 1.75)); renderer.setSize(innerWidth, innerHeight);
      if (state.view === 'wide') selectView('wide', true);
    }
    addEventListener('resize', resize);
    let lastTime = performance.now();
    function animate(now) {
      requestAnimationFrame(animate);
      const delta = Math.min((now - lastTime) / 1000, 0.10); lastTime = now;
      if (!state.paused && !document.hidden) state.elapsed += delta;
      const t = state.elapsed;
      flight.position.y = Math.sin(t * 0.7) * 0.115;
      flight.rotation.x = Math.sin(t * 0.48) * 0.012;
      flight.rotation.z = Math.sin(t * 0.54) * 0.009;
      character.update(t);
      movingGears.forEach(({ group, speed }) => { group.rotation.z = t * speed; });
      propellers.forEach(({ group, speed }) => { group.rotation.z = t * speed; });
      needle.rotation.z = -0.68 + Math.sin(t * 1.4) * 0.07;
      key.rotation.y = Math.sin(t * 0.31) * 0.09;
      helm.rotation.z = Math.sin(t * 0.48) * 0.04;
      cloudGroups.forEach(({ group, base, speed }, i) => {
        group.position.x = base.x + Math.sin(t * speed + i) * 0.65;
        group.position.y = base.y + Math.sin(t * 0.12 + i * 0.8) * 0.12;
      });
      steamPuffs.forEach((puff, i) => {
        const phase = (t * 0.18 + i / 5) % 1;
        puff.position.set(-2.42 - phase * 0.57, 2.95 + phase * 0.51, -0.08);
        puff.scale.setScalar(0.09 + phase * 0.16); puff.material.opacity = Math.sin(phase * Math.PI) * 0.19;
      });
      tinyFlags.forEach(({ mesh: flag, original }) => {
        const attribute = flag.geometry.attributes.position;
        for (let i = 0; i < attribute.count; i++) {
          const x = original[i * 3], y = original[i * 3 + 1];
          attribute.setZ(i, Math.sin(t * 3.0 + x * 10 + y * 4) * 0.055 * (0.28 - x));
        }
        attribute.needsUpdate = true;
      });
      if (transition) {
        const linear = Math.min((now - transition.startedAt) / 1000, 1), eased = linear * linear * (3 - 2 * linear);
        camera.position.lerpVectors(transition.fromPosition, transition.position, eased);
        controls.target.lerpVectors(transition.fromTarget, transition.target, eased);
        if (linear === 1) transition = null;
      }
      controls.update(delta); renderer.render(scene, camera);
    }
    window.airshipDemo = { scene, camera, controls, renderer, state, resetView, selectView, flight };
    renderer.render(scene, camera);
    document.body.dataset.ready = 'true';
    requestAnimationFrame(animate);
    canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); showError('图形上下文已中断。请刷新页面重新起航。'); });
  } catch (error) {
    console.error(error);
    showError('这次起航遇到了问题：' + error.message + '。请使用支持 WebGL 2 的新版 Chrome 或 Edge 打开。');
  }
})(window.THREE);
