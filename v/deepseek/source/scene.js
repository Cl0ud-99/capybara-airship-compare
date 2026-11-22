/* ============================================================
   SKYBOUND CAPYBARA — a clockwork airship
   Three.js scene written to be embedded in a single HTML file.
   ============================================================ */
function startApp(THREE, OrbitControls) {
  'use strict';

  // ---------- utilities ----------
  const rand = (() => {
    let s = 918273;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  })();
  const rrange = (a, b) => a + (b - a) * rand();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const deg = THREE.MathUtils.degToRad;
  const TAU = Math.PI * 2;

  function mesh(geo, mat, cast = true, receive = true) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast;
    m.receiveShadow = receive;
    return m;
  }

  function addTo(parent, ...children) {
    children.forEach((c) => parent.add(c));
    return parent;
  }

  function canvasTexture(width, height, draw, repeatX = 1, repeatY = 1) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 8;
    return tex;
  }

  function makeWoodTexture() {
    return canvasTexture(1024, 512, (g, w, h) => {
      g.fillStyle = '#9b6a42';
      g.fillRect(0, 0, w, h);
      // broad tonal bands
      for (let i = 0; i < 36; i++) {
        const y = (i / 36) * h;
        g.fillStyle = i % 2 ? 'rgba(255,210,155,.035)' : 'rgba(70,40,21,.035)';
        g.fillRect(0, y, w, h / 36 + 2);
      }
      // long grain
      for (let i = 0; i < 260; i++) {
        const y = rand() * h;
        const amp = rrange(1, 8);
        const alpha = rrange(.025, .10);
        g.beginPath();
        g.moveTo(0, y);
        for (let x = 0; x <= w; x += 24) {
          g.lineTo(x, y + Math.sin(x * rrange(.003, .012) + i) * amp);
        }
        g.strokeStyle = i % 3 === 0 ? 'rgba(48,25,12,' + alpha + ')' : 'rgba(255,213,158,' + alpha * .8 + ')';
        g.lineWidth = rrange(.5, 2.3);
        g.stroke();
      }
      // plank seams
      for (let y = 64; y < h; y += 64) {
        g.fillStyle = 'rgba(58,31,16,.55)';
        g.fillRect(0, y, w, 3);
        g.fillStyle = 'rgba(255,220,170,.12)';
        g.fillRect(0, y + 3, w, 1);
      }
      // knots
      for (let i = 0; i < 11; i++) {
        const x = rand() * w, y = rand() * h;
        for (let r = 14; r > 2; r -= 2.5) {
          g.beginPath();
          g.ellipse(x, y, r * 1.8, r * .65, rrange(-.2, .2), 0, TAU);
          g.strokeStyle = 'rgba(66,35,17,.16)';
          g.lineWidth = 1.4;
          g.stroke();
        }
      }
      // sun-bleached scratches
      for (let i = 0; i < 80; i++) {
        g.strokeStyle = 'rgba(255,230,188,.09)';
        g.lineWidth = 1;
        g.beginPath();
        const x = rand() * w, y = rand() * h;
        g.moveTo(x, y);
        g.lineTo(x + rrange(8, 38), y + rrange(-3, 3));
        g.stroke();
      }
    }, 2, 1);
  }

  function makeCanvasTexture() {
    return canvasTexture(1024, 512, (g, w, h) => {
      g.fillStyle = '#ecdcb8';
      g.fillRect(0, 0, w, h);
      const panels = 8;
      for (let i = 0; i < panels; i++) {
        const x = i * w / panels;
        const shades = ['rgba(255,241,206,.20)', 'rgba(183,146,98,.055)'];
        g.fillStyle = shades[i % 2];
        g.fillRect(x, 0, w / panels, h);
        g.strokeStyle = 'rgba(98,76,48,.34)';
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x, h);
        g.stroke();
        g.strokeStyle = 'rgba(255,248,225,.35)';
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(x + 4, 0);
        g.lineTo(x + 4, h);
        g.stroke();
        // stitching beside the seam
        g.setLineDash([5, 6]);
        g.strokeStyle = 'rgba(91,70,45,.28)';
        g.lineWidth = 1.2;
        g.beginPath();
        g.moveTo(x + 11, 0);
        g.lineTo(x + 11, h);
        g.stroke();
        g.setLineDash([]);
      }
      // subtle cloth weave and weathering
      for (let i = 0; i < 1600; i++) {
        const a = rrange(.012, .045);
        g.fillStyle = rand() > .5 ? 'rgba(255,255,240,' + a + ')' : 'rgba(96,70,41,' + a + ')';
        g.fillRect(rand() * w, rand() * h, rrange(1, 3), rrange(1, 2));
      }
      for (let i = 0; i < 18; i++) {
        g.beginPath();
        g.arc(rand() * w, rand() * h, rrange(4, 17), 0, TAU);
        g.strokeStyle = 'rgba(105,79,47,.055)';
        g.lineWidth = 1;
        g.stroke();
      }
      // horizontal band seams
      for (const y of [110, 248, 388]) {
        g.strokeStyle = 'rgba(95,73,47,.22)';
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, y);
        g.lineTo(w, y);
        g.stroke();
      }
    }, 1, 1);
  }

  function makeSmokeTexture() {
    return canvasTexture(128, 128, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255,250,238,.9)');
      grad.addColorStop(.35, 'rgba(255,245,226,.55)');
      grad.addColorStop(1, 'rgba(255,240,218,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
  }

  function makeSunTexture() {
    return canvasTexture(256, 256, (g, w, h) => {
      const grad = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      grad.addColorStop(0, 'rgba(255,252,230,1)');
      grad.addColorStop(.12, 'rgba(255,239,184,.98)');
      grad.addColorStop(.38, 'rgba(255,197,116,.35)');
      grad.addColorStop(1, 'rgba(255,170,90,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, w, h);
    });
  }

  // ---------- renderer ----------
  const canvas = document.getElementById('stage');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
    alpha: false
  });
  const targetPixelRatio = () => Math.min(window.devicePixelRatio || 1, window.innerWidth < 760 ? 1.6 : 2);
  renderer.setPixelRatio(targetPixelRatio());
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xf1c99f, 0.0058);

  const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, .1, 500);
  camera.position.set(9.2, 9.6, 23.4);

  const controls = new OrbitControls(camera, canvas);
  controls.target.set(-.15, 6.9, 1.0);
  if (window.innerWidth / window.innerHeight < .8) {
    camera.fov = 38;
    camera.position.set(10.5, 11.5, 35);
    controls.target.set(0, 8.35, .4);
    camera.updateProjectionMatrix();
  }
  controls.enableDamping = true;
  controls.dampingFactor = .055;
  controls.rotateSpeed = .58;
  controls.zoomSpeed = .7;
  controls.enablePan = false;
  controls.minDistance = 13.5;
  controls.maxDistance = 48;
  controls.minPolarAngle = .48;
  controls.maxPolarAngle = 1.52;
  controls.autoRotate = false;
  controls.autoRotateSpeed = .3;
  let idleTimer = null;
  const stopAuto = () => {
    controls.autoRotate = false;
    if (idleTimer) clearTimeout(idleTimer);
  };
  const resumeAuto = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => { controls.autoRotate = true; }, 12000);
  };
  idleTimer = setTimeout(() => { controls.autoRotate = true; }, 17000);
  controls.addEventListener('start', stopAuto);
  controls.addEventListener('end', resumeAuto);

  // ---------- lighting ----------
  const hemi = new THREE.HemisphereLight(0xffe5c5, 0x66788c, 1.65);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffd3a0, 3.25);
  key.position.set(16, 24, 15);
  key.target.position.set(0, 5.2, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -18;
  key.shadow.camera.right = 18;
  key.shadow.camera.top = 18;
  key.shadow.camera.bottom = -18;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 70;
  key.shadow.bias = -.00025;
  key.shadow.normalBias = .035;
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(0x9ecbff, 1.35);
  rim.position.set(-18, 10, -14);
  scene.add(rim);

  const bounce = new THREE.DirectionalLight(0xffc796, .55);
  bounce.position.set(2, -8, 8);
  scene.add(bounce);

  // ---------- sky ----------
  const skyGeo = new THREE.SphereGeometry(270, 48, 32);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      topColor: { value: new THREE.Color(0x4a7690) },
      midColor: { value: new THREE.Color(0xf7c89a) },
      lowColor: { value: new THREE.Color(0xfbe1bf) },
      sunDir: { value: new THREE.Vector3(-.55, .28, -.78).normalize() }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 midColor;
      uniform vec3 lowColor;
      uniform vec3 sunDir;
      varying vec3 vWorldPosition;
      void main() {
        vec3 dir = normalize(vWorldPosition);
        float h = dir.y;
        vec3 col = mix(lowColor, midColor, smoothstep(-0.12, 0.18, h));
        col = mix(col, topColor, smoothstep(-0.02, 0.4, h));
        float sun = max(dot(dir, sunDir), 0.0);
        col += vec3(1.0, 0.58, 0.24) * pow(sun, 90.0) * 0.85;
        col += vec3(1.0, 0.68, 0.34) * pow(sun, 8.0) * 0.10;
        gl_FragColor = vec4(col, 1.0);
      }
    `
  });
  scene.add(new THREE.Mesh(skyGeo, skyMat));

  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSunTexture(),
    color: 0xfff0cb,
    transparent: true,
    opacity: .7,
    depthWrite: false,
    fog: false,
    blending: THREE.AdditiveBlending
  }));
  sunSprite.position.set(-92, 58, -135);
  sunSprite.scale.set(44, 44, 1);
  scene.add(sunSprite);

  // ---------- environment map for metals ----------
  {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x9dbdd4);
    const envMatA = new THREE.MeshBasicMaterial({ color: 0xffe6b8 });
    const envMatB = new THREE.MeshBasicMaterial({ color: 0x6f91a8 });
    const envMatC = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const p1 = new THREE.Mesh(new THREE.PlaneGeometry(18, 8), envMatA);
    p1.position.set(0, 9, 0); p1.rotation.x = Math.PI / 2;
    const p2 = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), envMatC);
    p2.position.set(8, 2, 4); p2.lookAt(0, 0, 0);
    const p3 = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), envMatB);
    p3.position.set(-8, -1, -5); p3.lookAt(0, 0, 0);
    const p4 = new THREE.Mesh(new THREE.PlaneGeometry(18, 6), envMatA);
    p4.position.set(0, -8, 0); p4.rotation.x = -Math.PI / 2;
    envScene.add(p1, p2, p3, p4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const rt = pmrem.fromScene(envScene, .02);
    scene.environment = rt.texture;
    scene.environmentIntensity = .55;
    pmrem.dispose();
  }

  // ---------- materials ----------
  const woodTex = makeWoodTexture();
  const canvasTex = makeCanvasTexture();

  const M = {
    wood: new THREE.MeshStandardMaterial({ map: woodTex, color: 0xffffff, roughness: .66, metalness: .02 }),
    woodDark: new THREE.MeshStandardMaterial({ map: woodTex, color: 0x9d7659, roughness: .76, metalness: .01 }),
    rib: new THREE.MeshStandardMaterial({ map: woodTex, color: 0xcfa67d, roughness: .62, metalness: .015 }),
    woodLight: new THREE.MeshStandardMaterial({ map: woodTex, color: 0xe0bd90, roughness: .68, metalness: .01 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd2a34f, metalness: .92, roughness: .28 }),
    brassDark: new THREE.MeshStandardMaterial({ color: 0x8d642e, metalness: .85, roughness: .38 }),
    copper: new THREE.MeshPhysicalMaterial({ color: 0xb56d45, metalness: .75, roughness: .31, clearcoat: .15 }),
    steel: new THREE.MeshStandardMaterial({ color: 0x4e5558, metalness: .88, roughness: .36 }),
    canvas: new THREE.MeshStandardMaterial({ map: canvasTex, color: 0xffffff, roughness: .88, metalness: 0 }),
    canvasWarm: new THREE.MeshStandardMaterial({ map: canvasTex, color: 0xf3d4ad, roughness: .9, metalness: 0 }),
    rope: new THREE.MeshStandardMaterial({ color: 0x6f5435, roughness: .98 }),
    leather: new THREE.MeshStandardMaterial({ color: 0x5a3525, roughness: .72 }),
    leatherDark: new THREE.MeshStandardMaterial({ color: 0x37241a, roughness: .8 }),
    fur: new THREE.MeshStandardMaterial({ color: 0x775139, roughness: .96 }),
    furLight: new THREE.MeshStandardMaterial({ color: 0xa47757, roughness: .96 }),
    furDark: new THREE.MeshStandardMaterial({ color: 0x543826, roughness: .96 }),
    nose: new THREE.MeshStandardMaterial({ color: 0x3a241c, roughness: .72 }),
    scarf: new THREE.MeshStandardMaterial({ color: 0xb43d2e, roughness: .76, side: THREE.DoubleSide }),
    scarfDark: new THREE.MeshStandardMaterial({ color: 0x8f2c22, roughness: .8, side: THREE.DoubleSide }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x8fb5bd, metalness: .15, roughness: .06, transmission: .45,
      transparent: true, opacity: .72, thickness: .15, ior: 1.45
    }),
    goggleGlass: new THREE.MeshPhysicalMaterial({
      color: 0x172832, metalness: .55, roughness: .09, transparent: true, opacity: .9,
      thickness: .12, ior: 1.45, clearcoat: .8, clearcoatRoughness: .1
    }),
    lantern: new THREE.MeshStandardMaterial({
      color: 0xffb35f, emissive: 0xff8c32, emissiveIntensity: 2.8, transparent: true, opacity: .9
    }),
    cloud: new THREE.MeshStandardMaterial({ color: 0xf8e6cb, roughness: 1, metalness: 0, flatShading: false }),
    cloudPink: new THREE.MeshStandardMaterial({ color: 0xf2cfb6, roughness: 1, metalness: 0, flatShading: false }),
    cloudShadow: new THREE.MeshStandardMaterial({ color: 0xd9bda9, roughness: 1, metalness: 0, flatShading: false }),
    eye: new THREE.MeshStandardMaterial({ color: 0x17110e, roughness: .25 }),
    eyeWhite: new THREE.MeshStandardMaterial({ color: 0xfff8e7, roughness: .3 }),
    cream: new THREE.MeshStandardMaterial({ color: 0xe9d3ae, roughness: .85 })
  };

  // ---------- helpers for geometry ----------
  const woodBoltGeo = new THREE.SphereGeometry(.045, 8, 6);
  const rivetGeo = new THREE.SphereGeometry(.05, 8, 6);

  function addRivet(parent, x, y, z, scale = 1) {
    const r = mesh(rivetGeo, M.brass, false, false);
    r.position.set(x, y, z);
    r.scale.setScalar(scale);
    parent.add(r);
    return r;
  }

  function cylinderBetween(parent, a, b, radius, mat, radialSegments = 8) {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(vb, va);
    const len = dir.length();
    const geo = new THREE.CylinderGeometry(radius, radius, len, radialSegments);
    const m = mesh(geo, mat);
    m.position.copy(va).add(vb).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    parent.add(m);
    return m;
  }

  function addRope(parent, a, b, sag = .5, radius = .022, mat = M.rope) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const mid = start.clone().add(end).multiplyScalar(.5);
    mid.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    const tube = new THREE.TubeGeometry(curve, 18, radius, 5, false);
    const m = mesh(tube, mat);
    parent.add(m);
    return m;
  }

  function makeGear(teeth, outerR, rootR, holeR, depth = .16) {
    const shape = new THREE.Shape();
    const step = Math.PI / teeth;
    for (let i = 0; i < teeth * 2; i++) {
      const angle = i * step;
      const r = i % 2 === 0 ? outerR : rootR;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, holeR, 0, TAU, true);
    shape.holes.push(hole);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: .022,
      bevelThickness: .018,
      curveSegments: 10
    });
    geo.center();
    return geo;
  }


  function roundedBoxGeometry(width, height, depth, radius) {
    const shape = new THREE.Shape();
    const x = -width / 2, y = -height / 2;
    shape.moveTo(x + radius, y);
    shape.lineTo(x + width - radius, y);
    shape.quadraticCurveTo(x + width, y, x + width, y + radius);
    shape.lineTo(x + width, y + height - radius);
    shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    shape.lineTo(x + radius, y + height);
    shape.quadraticCurveTo(x, y + height, x, y + height - radius);
    shape.lineTo(x, y + radius);
    shape.quadraticCurveTo(x, y, x + radius, y);
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: .035,
      bevelThickness: .035,
      steps: 1,
      curveSegments: 8
    });
    geo.center();
    return geo;
  }

  function makeLantern(x, y, z, side = 1) {
    const g = new THREE.Group();
    g.position.set(x, y, z);

    const chain = mesh(new THREE.CylinderGeometry(.018, .018, .42, 6), M.brassDark);
    chain.position.y = .42;
    g.add(chain);

    const top = mesh(new THREE.ConeGeometry(.17, .15, 8), M.brass);
    top.position.y = .23;
    g.add(top);
    const cap = mesh(new THREE.CylinderGeometry(.15, .17, .06, 8), M.brassDark);
    cap.position.y = .16;
    g.add(cap);

    const glass = mesh(new THREE.CylinderGeometry(.13, .13, .32, 10), M.lantern, false, false);
    glass.position.y = -.04;
    g.add(glass);

    const bottom = mesh(new THREE.CylinderGeometry(.14, .12, .06, 8), M.brassDark);
    bottom.position.y = -.24;
    g.add(bottom);

    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2;
      const bar = mesh(new THREE.CylinderGeometry(.014, .014, .34, 5), M.brass);
      bar.position.set(Math.cos(a) * .13, -.04, Math.sin(a) * .13);
      g.add(bar);
    }
    const light = new THREE.PointLight(0xffa95b, 9, 7.5, 2);
    light.position.set(0, -.03, 0);
    g.add(light);
    g.userData.light = light;
    g.userData.glass = glass;
    return g;
  }

  // ---------- ship ----------
  const ship = new THREE.Group();
  ship.position.y = 0;
  scene.add(ship);

  const balloon = new THREE.Group();
  ship.add(balloon);

  const balloonCenterY = 10.55;
  const rx = 3.05, ry = 2.82, rz = 6.85;

  // envelope
  {
    const env = mesh(new THREE.SphereGeometry(1, 64, 40), M.canvas);
    env.scale.set(rx, ry, rz);
    env.position.y = balloonCenterY;
    env.castShadow = true;
    env.receiveShadow = true;
    balloon.add(env);

    // longitudinal wooden battens
    const angles = [-1.45, -1.0, -.48, 0, .48, 1.0, 1.45, Math.PI];
    for (const a of angles) {
      const pts = [];
      for (let i = 0; i <= 32; i++) {
        const z = -rz * .965 + (i / 32) * rz * 1.93;
        const nz = z / rz;
        const cross = Math.sqrt(Math.max(.002, 1 - nz * nz));
        pts.push(new THREE.Vector3(
          Math.cos(a) * rx * cross * 1.012,
          balloonCenterY + Math.sin(a) * ry * cross * 1.012,
          z
        ));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      const tube = new THREE.TubeGeometry(curve, 44, .038, 5, false);
      const batten = mesh(tube, M.rib);
      balloon.add(batten);
    }

    // transverse ribs
    for (let i = -4; i <= 4; i++) {
      const z = i * 1.46;
      const nz = z / rz;
      const cross = Math.sqrt(Math.max(.002, 1 - nz * nz));
      const ringPts = [];
      for (let j = 0; j <= 56; j++) {
        const a = (j / 56) * TAU;
        ringPts.push(new THREE.Vector3(
          Math.cos(a) * rx * cross * 1.018,
          balloonCenterY + Math.sin(a) * ry * cross * 1.018,
          z
        ));
      }
      const curve = new THREE.CatmullRomCurve3(ringPts, true);
      const tube = new THREE.TubeGeometry(curve, 56, .043, 5, true);
      balloon.add(mesh(tube, M.rib));
    }

    // decorative brass equator band and rivets
    {
      const bandPts = [];
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * TAU;
        bandPts.push(new THREE.Vector3(Math.cos(a) * rx * 1.025, balloonCenterY + Math.sin(a) * ry * 1.025, -.35));
      }
      const curve = new THREE.CatmullRomCurve3(bandPts, true);
      balloon.add(mesh(new THREE.TubeGeometry(curve, 64, .055, 6, true), M.brassDark));
      for (let j = 0; j < 24; j++) {
        const a = j / 24 * TAU;
        const r = mesh(rivetGeo, M.brass, false, false);
        r.position.set(Math.cos(a) * rx * 1.041, balloonCenterY + Math.sin(a) * ry * 1.041, -.35);
        r.scale.setScalar(1.1);
        balloon.add(r);
      }
    }

    // nose cone, collar, finial
    const nose = mesh(new THREE.ConeGeometry(.58, 1.0, 16), M.brass);
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, balloonCenterY, rz + .33);
    balloon.add(nose);
    const collar = mesh(new THREE.TorusGeometry(.73, .07, 8, 32), M.brassDark);
    collar.position.set(0, balloonCenterY, rz - .13);
    balloon.add(collar);
    const finial = mesh(new THREE.SphereGeometry(.13, 12, 8), M.brass);
    finial.position.set(0, balloonCenterY, rz + .88);
    balloon.add(finial);

    // sculpted brass tail cone
    const tailHub = mesh(new THREE.SphereGeometry(.34, 18, 14), M.brassDark);
    tailHub.position.set(0, balloonCenterY, -6.82);
    balloon.add(tailHub);
    const tailCap = mesh(new THREE.ConeGeometry(.33, .6, 18), M.brass);
    tailCap.rotation.x = -Math.PI / 2;
    tailCap.position.set(0, balloonCenterY, -7.12);
    balloon.add(tailCap);
    const tailRing = mesh(new THREE.TorusGeometry(.34, .04, 7, 24), M.brass);
    tailRing.position.set(0, balloonCenterY, -6.69);
    balloon.add(tailRing);

    // small brass name plaque on the nose side
    const plaque = mesh(new THREE.BoxGeometry(.7, .26, .035), M.brassDark);
    plaque.position.set(0, balloonCenterY - .95, rz + .02);
    plaque.rotation.x = .08;
    balloon.add(plaque);
    const plaqueText = makeTextPlane('SKYBOUND', 512, 96, '#f6dfaf', 'rgba(0,0,0,0)');
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.62, .12), new THREE.MeshBasicMaterial({ map: plaqueText, transparent: true }));
    label.position.set(0, balloonCenterY - .95, rz + .045);
    balloon.add(label);
  }

  // text helper for plaques
  function makeTextPlane(text, w, h, color, bg) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.font = '700 44px Georgia, serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = color;
    g.fillText(text, w / 2, h / 2 + 2);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  // ---------- hull ----------
  const deckY = 4.15;
  const stations = [
    { z: -5.25, w: .18, d: .55 },
    { z: -4.65, w: .92, d: .92 },
    { z: -3.55, w: 1.55, d: 1.55 },
    { z: -1.8, w: 1.8, d: 1.73 },
    { z: .4, w: 1.86, d: 1.8 },
    { z: 2.5, w: 1.72, d: 1.65 },
    { z: 3.9, w: 1.28, d: 1.32 },
    { z: 4.75, w: .55, d: .8 },
    { z: 5.25, w: .1, d: .4 }
  ];

  function stationWidth(z) {
    for (let i = 0; i < stations.length - 1; i++) {
      const a = stations[i], b = stations[i + 1];
      if (z >= a.z && z <= b.z) {
        const t = (z - a.z) / (b.z - a.z);
        const s = t * t * (3 - 2 * t);
        return THREE.MathUtils.lerp(a.w, b.w, s);
      }
    }
    return .1;
  }

  function createHull() {
    const segs = 20;
    const positions = [];
    const indices = [];
    const uvs = [];
    for (let i = 0; i < stations.length; i++) {
      const st = stations[i];
      for (let j = 0; j <= segs; j++) {
        const theta = Math.PI - (j / segs) * Math.PI;
        const x = Math.cos(theta) * st.w;
        const y = deckY - Math.sin(theta) * st.d;
        positions.push(x, y, st.z);
        uvs.push(j / segs, i / (stations.length - 1));
      }
    }
    for (let i = 0; i < stations.length - 1; i++) {
      for (let j = 0; j < segs; j++) {
        const a = i * (segs + 1) + j;
        const b = a + segs + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  const hull = mesh(createHull(), M.wood);
  hull.castShadow = true;
  hull.receiveShadow = true;
  ship.add(hull);

  // deck planks
  for (let z = -4.85; z < 4.9; z += .39) {
    const w = stationWidth(z) * 1.92;
    const plank = mesh(new THREE.BoxGeometry(Math.max(.22, w), .11, .345), rand() > .34 ? M.woodLight : M.wood);
    plank.position.set(0, deckY + .015, z);
    plank.rotation.y = rrange(-.012, .012);
    ship.add(plank);
  }

  // central deck spine + side beams
  {
    const spine = mesh(new THREE.BoxGeometry(.18, .08, 8.4), M.woodDark);
    spine.position.set(0, deckY + .09, -.1);
    ship.add(spine);
    for (const s of [-1, 1]) {
      const beam = mesh(new THREE.BoxGeometry(.15, .09, 7.8), M.woodDark);
      beam.position.set(s * 1.55, deckY + .1, -.15);
      ship.add(beam);
    }
  }

  // hull rim / gunwale
  {
    const rimMat = M.woodDark;
    for (const s of [-1, 1]) {
      const pts = [];
      for (const st of stations) {
        pts.push(new THREE.Vector3(s * st.w * 1.015, deckY + .04, st.z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      ship.add(mesh(new THREE.TubeGeometry(curve, 32, .06, 6, false), rimMat));
    }
  }

  // side portholes
  for (const s of [-1, 1]) {
    for (const z of [-2.75, -.5, 2.1]) {
      const w = stationWidth(z) * .99;
      const y = deckY - 1.02;
      const ring = mesh(new THREE.TorusGeometry(.23, .055, 8, 22), M.brass);
      ring.position.set(s * w, y, z);
      ring.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
      ship.add(ring);
      const glass = mesh(new THREE.CircleGeometry(.19, 20), M.glass, false, false);
      glass.position.set(s * (w + .015), y, z);
      glass.rotation.y = s > 0 ? Math.PI / 2 : -Math.PI / 2;
      ship.add(glass);
      for (let k = 0; k < 6; k++) {
        const a = k / 6 * TAU;
        const bolt = mesh(rivetGeo, M.brassDark, false, false);
        bolt.position.set(s * (w + .035), y + Math.sin(a) * .25, z + Math.cos(a) * .25);
        bolt.scale.setScalar(.55);
        ship.add(bolt);
      }
    }
  }

  // deck rails and stanchions
  {
    for (const s of [-1, 1]) {
      const pts = [];
      for (const st of stations.slice(1, -1)) {
        pts.push(new THREE.Vector3(s * st.w * .96, deckY + .08, st.z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      for (const y of [.43, .72]) {
        const c = curve.clone();
        c.points = c.points.map(p => new THREE.Vector3(p.x, p.y + y, p.z));
        ship.add(mesh(new THREE.TubeGeometry(c, 32, .028, 5, false), M.brassDark));
      }
      for (const z of [-4.15, -2.85, -1.55, -.25, 1.05, 2.35, 3.65]) {
        const w = stationWidth(z) * .94;
        const post = mesh(new THREE.CylinderGeometry(.035, .045, .78, 6), M.brassDark);
        post.position.set(s * w, deckY + .42, z);
        ship.add(post);
        const ball = mesh(new THREE.SphereGeometry(.055, 8, 6), M.brass);
        ball.position.set(s * w, deckY + .82, z);
        ship.add(ball);
      }
    }
  }

  // bow figurehead scroll
  {
    const scroll = mesh(new THREE.TorusGeometry(.37, .055, 7, 24, Math.PI * 1.55), M.brass);
    scroll.position.set(0, deckY + .25, 4.92);
    scroll.rotation.set(.2, 0, -Math.PI * .2);
    ship.add(scroll);
    const ball = mesh(new THREE.SphereGeometry(.085, 10, 8), M.brass);
    ball.position.set(0, deckY + .02, 5.28);
    ship.add(ball);
  }

  // ---------- boiler, stack and steam ----------
  const steamGroup = new THREE.Group();
  ship.add(steamGroup);
  {
    const boiler = new THREE.Group();
    boiler.position.set(0, deckY + .55, -1.85);
    const tank = mesh(new THREE.CylinderGeometry(.5, .5, 1.9, 20), M.copper);
    tank.rotation.z = Math.PI / 2;
    boiler.add(tank);
    for (const x of [-.62, 0, .62]) {
      const band = mesh(new THREE.TorusGeometry(.51, .035, 6, 24), M.brass);
      band.rotation.y = Math.PI / 2;
      band.position.x = x;
      boiler.add(band);
    }
    const capGeo = new THREE.SphereGeometry(.5, 20, 14, 0, TAU, 0, Math.PI / 2);
    const capL = mesh(capGeo, M.brassDark);
    capL.rotation.z = Math.PI / 2;
    capL.position.x = -.95;
    boiler.add(capL);
    const capR = mesh(capGeo, M.brassDark);
    capR.rotation.z = -Math.PI / 2;
    capR.position.x = .95;
    boiler.add(capR);
    // wood cradle
    for (const s of [-1, 1]) {
      const cradle = mesh(new THREE.BoxGeometry(.15, .55, .85), M.woodDark);
      cradle.position.set(s * .76, -.4, 0);
      boiler.add(cradle);
    }
    // stack
    const stack = mesh(new THREE.CylinderGeometry(.16, .23, 1.1, 10), M.copper);
    stack.position.set(.5, 1.02, .12);
    boiler.add(stack);
    const stackRim = mesh(new THREE.TorusGeometry(.16, .035, 6, 18), M.brass);
    stackRim.rotation.x = Math.PI / 2;
    stackRim.position.set(.5, 1.57, .12);
    boiler.add(stackRim);
    // pressure gauge
    const gaugeBack = mesh(new THREE.CylinderGeometry(.17, .17, .1, 20), M.brass);
    gaugeBack.rotation.z = Math.PI / 2;
    gaugeBack.position.set(-.51, .16, .32);
    boiler.add(gaugeBack);
    const face = mesh(new THREE.CircleGeometry(.135, 20), M.cream, false, false);
    face.rotation.y = -Math.PI / 2;
    face.position.set(-.57, .16, .32);
    boiler.add(face);
    const needle = mesh(new THREE.BoxGeometry(.012, .1, .006), M.nose, false, false);
    needle.position.set(-.578, .18, .32);
    needle.rotation.y = -Math.PI / 2;
    boiler.add(needle);
    ship.add(boiler);
    // steam puff sprites
    const smokeTex = makeSmokeTexture();
    for (let i = 0; i < 20; i++) {
      const mat = new THREE.SpriteMaterial({
        map: smokeTex, color: 0xfff4de, transparent: true,
        opacity: 0, depthWrite: false, blending: THREE.NormalBlending
      });
      const puff = new THREE.Sprite(mat);
      const s = rrange(.3, .55);
      puff.scale.set(s, s, 1);
      puff.position.set(.5 + rrange(-.15, .15), deckY + 2.7, -1.72);
      puff.userData.age = rand();
      puff.userData.speed = rrange(.22, .42);
      puff.userData.drift = rrange(.25, .65);
      puff.userData.size = s;
      steamGroup.add(puff);
    }
  }

  // pipes from boiler to side engines
  for (const s of [-1, 1]) {
    addRope(ship, [s * .85, deckY + .55, -2.4], [s * 1.54, deckY - .45, -2.25], .15, .055, M.copper);
    const joint = mesh(new THREE.SphereGeometry(.11, 10, 8), M.brassDark);
    joint.position.set(s * 1.6, deckY - .45, -2.2);
    ship.add(joint);
  }

  // ---------- clockwork gears ----------
  const gears = [];
  for (const s of [-1, 1]) {
    const housing = mesh(new THREE.BoxGeometry(.16, 1.35, 1.55), M.woodDark);
    housing.position.set(s * 1.73, deckY - 1.05, -2.1);
    housing.rotation.z = s * -.05;
    ship.add(housing);

    const g1 = mesh(makeGear(14, .7, .54, .18, .14), M.brass);
    g1.position.set(s * 1.84, deckY - .9, -1.93);
    g1.rotation.y = s * Math.PI / 2;
    ship.add(g1);
    gears.push({ mesh: g1, speed: s * .85 });

    const g2 = mesh(makeGear(9, .43, .32, .12, .14), M.brassDark);
    g2.position.set(s * 1.84, deckY - 1.55, -2.48);
    g2.rotation.y = s * Math.PI / 2;
    ship.add(g2);
    gears.push({ mesh: g2, speed: -s * 1.32 });

    const hub = mesh(new THREE.CylinderGeometry(.15, .15, .22, 12), M.steel);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(s * 1.86, deckY - .9, -1.93);
    ship.add(hub);
    addRivet(ship, s * 1.99, deckY - .9, -1.93, 1.3);
  }

  // ---------- propellers ----------
  function makePropeller(radius, blades, mat = M.wood) {
    const g = new THREE.Group();
    const hub = mesh(new THREE.CylinderGeometry(.13, .18, .38, 12), M.brass);
    hub.rotation.x = Math.PI / 2;
    g.add(hub);
    const bladeShape = new THREE.Shape();
    bladeShape.moveTo(.14, -.09);
    bladeShape.bezierCurveTo(.42, -.33, 1.05, -.3, radius, -.08);
    bladeShape.bezierCurveTo(radius * .95, .20, .45, .28, .14, .1);
    bladeShape.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
      depth: .055, bevelEnabled: true, bevelSize: .012, bevelThickness: .012, bevelSegments: 1
    });
    bladeGeo.center();
    for (let i = 0; i < blades; i++) {
      const b = mesh(bladeGeo, mat);
      b.rotation.z = i / blades * TAU;
      b.castShadow = true;
      g.add(b);
    }
    const cap = mesh(new THREE.SphereGeometry(.14, 12, 8), M.brass);
    cap.position.z = .21;
    g.add(cap);
    return g;
  }

  const mainProp = makePropeller(1.55, 3, M.woodLight);
  mainProp.position.set(0, 4.05, -5.43);
  ship.add(mainProp);
  const propRing = mesh(new THREE.TorusGeometry(1.78, .045, 7, 64), M.brassDark);
  propRing.position.set(0, 4.05, -5.46);
  ship.add(propRing);
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4;
    const strut = mesh(new THREE.CylinderGeometry(.026, .026, .75, 6), M.brassDark);
    strut.position.set(Math.cos(a) * 1.45, 4.05 + Math.sin(a) * 1.45, -5.44);
    strut.rotation.z = a - Math.PI / 2;
    ship.add(strut);
  }
  const propMount = mesh(new THREE.CylinderGeometry(.16, .22, .8, 10), M.steel);
  propMount.rotation.x = Math.PI / 2;
  propMount.position.set(0, 4.05, -4.95);
  ship.add(propMount);

  const sideProps = [];
  for (const s of [-1, 1]) {
    const mount = mesh(new THREE.BoxGeometry(.7, .18, .28), M.brassDark);
    mount.position.set(s * 2.1, deckY - .55, -.95);
    ship.add(mount);
    const arm = mesh(new THREE.CylinderGeometry(.075, .095, .8, 8), M.brass);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(s * 2.3, deckY - .55, -.95);
    ship.add(arm);
    const p = makePropeller(.68, 3, M.woodLight);
    p.position.set(s * 2.72, deckY - .55, -.95);
    p.rotation.y = s * Math.PI / 2;
    p.userData.axis = 'x';
    ship.add(p);
    sideProps.push({ mesh: p, dir: s });
    const cage = mesh(new THREE.TorusGeometry(.82, .025, 5, 40), M.brassDark);
    cage.position.copy(p.position);
    cage.rotation.y = s * Math.PI / 2;
    ship.add(cage);
  }

  // ---------- deck fittings / helm ----------
  const helm = new THREE.Group();
  helm.position.set(0, deckY + .58, 3.25);
  helm.scale.setScalar(.88);
  helm.rotation.x = -.16;
  ship.add(helm);

  const wheelRing = mesh(new THREE.TorusGeometry(.62, .055, 10, 48), M.brass);
  helm.add(wheelRing);
  const wheelInner = mesh(new THREE.TorusGeometry(.53, .022, 7, 48), M.brassDark);
  helm.add(wheelInner);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU;
    const spoke = mesh(new THREE.CylinderGeometry(.026, .026, .59, 6), M.woodDark);
    spoke.position.set(Math.cos(a) * .3, Math.sin(a) * .3, 0);
    spoke.rotation.z = a + Math.PI / 2;
    helm.add(spoke);
    const handle = mesh(new THREE.CylinderGeometry(.038, .045, .23, 7), M.wood);
    handle.position.set(Math.cos(a) * .7, Math.sin(a) * .7, 0);
    handle.rotation.z = a + Math.PI / 2;
    helm.add(handle);
    const knob = mesh(new THREE.SphereGeometry(.055, 8, 6), M.brass);
    knob.position.set(Math.cos(a) * .82, Math.sin(a) * .82, 0);
    helm.add(knob);
  }
  const hub = mesh(new THREE.CylinderGeometry(.12, .14, .22, 12), M.brassDark);
  hub.rotation.x = Math.PI / 2;
  helm.add(hub);
  addRivet(helm, 0, 0, .12, 1.3);

  // helm pedestal
  {
    const pedestal = mesh(new THREE.CylinderGeometry(.18, .32, .85, 10), M.woodDark);
    pedestal.position.set(0, deckY + .38, 3.35);
    ship.add(pedestal);
    const collar = mesh(new THREE.TorusGeometry(.2, .035, 6, 16), M.brass);
    collar.rotation.x = Math.PI / 2;
    collar.position.set(0, deckY + .77, 3.35);
    ship.add(collar);
    const base = mesh(new THREE.CylinderGeometry(.4, .43, .12, 12), M.brassDark);
    base.position.set(0, deckY + .08, 3.35);
    ship.add(base);
  }

  // compass binnacle
  {
    const b = new THREE.Group();
    b.position.set(0, deckY + .28, 3.88);
    const base = mesh(new THREE.CylinderGeometry(.23, .26, .22, 12), M.woodDark);
    b.add(base);
    const top = mesh(new THREE.CylinderGeometry(.18, .2, .13, 16), M.brass);
    top.position.y = .17;
    b.add(top);
    const face = mesh(new THREE.CircleGeometry(.13, 20), M.cream, false, false);
    face.rotation.x = -Math.PI / 2;
    face.position.y = .245;
    b.add(face);
    const needle = mesh(new THREE.BoxGeometry(.015, .005, .18), M.scarfDark, false, false);
    needle.position.y = .255;
    needle.rotation.y = .5;
    b.add(needle);
    const dome = mesh(new THREE.SphereGeometry(.155, 16, 10, 0, TAU, 0, Math.PI / 2), M.glass, false, false);
    dome.position.y = .25;
    b.add(dome);
    ship.add(b);
  }

  // throttle lever
  {
    const base = mesh(new THREE.CylinderGeometry(.12, .16, .16, 10), M.brassDark);
    base.position.set(-.96, deckY + .18, 3.2);
    ship.add(base);
    const rod = mesh(new THREE.CylinderGeometry(.022, .028, .7, 6), M.brass);
    rod.position.set(-.96, deckY + .5, 3.12);
    rod.rotation.x = -.32;
    ship.add(rod);
    const knob = mesh(new THREE.SphereGeometry(.075, 10, 8), M.scarfDark);
    knob.position.set(-.96, deckY + .82, 3.02);
    ship.add(knob);
  }

  // stern cargo
  {
    const crate = mesh(new THREE.BoxGeometry(.75, .62, .75), M.wood);
    crate.position.set(-.8, deckY + .38, -3.45);
    crate.rotation.y = .18;
    ship.add(crate);
    for (const x of [-.39, .39]) {
      const strap = mesh(new THREE.BoxGeometry(.055, .66, .78), M.brassDark);
      strap.position.set(x, 0, 0);
      crate.add(strap);
    }
    const ropeCoil = new THREE.Group();
    ropeCoil.position.set(.68, deckY + .16, -3.55);
    for (let i = 0; i < 3; i++) {
      const t = mesh(new THREE.TorusGeometry(.25 - i * .045, .035, 6, 20), M.rope);
      t.rotation.x = Math.PI / 2;
      t.position.y = i * .055;
      ropeCoil.add(t);
    }
    ship.add(ropeCoil);
    const bucket = mesh(new THREE.CylinderGeometry(.19, .14, .34, 10), M.woodDark);
    bucket.position.set(1.15, deckY + .24, -2.95);
    ship.add(bucket);
  }

  // lanterns
  const lanterns = [];
  {
    const post = mesh(new THREE.CylinderGeometry(.045, .06, 1.55, 8), M.woodDark);
    post.position.set(0, deckY + .78, 4.55);
    ship.add(post);
    const arm = mesh(new THREE.CylinderGeometry(.028, .03, .8, 6), M.brassDark);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(-.36, deckY + 1.52, 4.55);
    ship.add(arm);
    const l1 = makeLantern(-.72, deckY + 1.25, 4.55, 1);
    ship.add(l1);
    lanterns.push(l1);

    const l2 = makeLantern(.68, deckY + 1.02, -3.95, -1);
    ship.add(l2);
    lanterns.push(l2);
    const arm2 = mesh(new THREE.CylinderGeometry(.026, .03, .55, 6), M.brassDark);
    arm2.rotation.z = Math.PI / 2;
    arm2.position.set(.35, deckY + 1.45, -3.95);
    ship.add(arm2);
    const post2 = mesh(new THREE.CylinderGeometry(.035, .055, 1.35, 6), M.woodDark);
    post2.position.set(.02, deckY + .7, -3.95);
    ship.add(post2);
  }

  // suspension ropes and struts
  {
    const anchors = [
      [-1.65, deckY + .02, 3.45, -1.85, balloonCenterY - 2.3, 2.7],
      [1.65, deckY + .02, 3.45, 1.85, balloonCenterY - 2.3, 2.7],
      [-1.7, deckY + .02, -1.9, -1.95, balloonCenterY - 2.45, -1.4],
      [1.7, deckY + .02, -1.9, 1.95, balloonCenterY - 2.45, -1.4],
      [-1.1, deckY + .02, -4.3, -1.25, balloonCenterY - 2.1, -4.7],
      [1.1, deckY + .02, -4.3, 1.25, balloonCenterY - 2.1, -4.7]
    ];
    for (const a of anchors) addRope(ship, [a[0], a[1], a[2]], [a[3], a[4], a[5]], .12, .022);
    // brass king posts
    for (const x of [-1.8, 1.8]) {
      const post = mesh(new THREE.CylinderGeometry(.055, .07, .6, 6), M.brassDark);
      post.position.set(x, deckY + .27, 2.85);
      ship.add(post);
      addRivet(ship, x, deckY + .56, 2.85, .8);
    }
    // gas pipe from boiler upward to envelope
    addRope(ship, [.48, deckY + 1.55, -1.88], [.35, balloonCenterY - 2.55, -1.62], .18, .065, M.copper);
    const valve = mesh(new THREE.TorusGeometry(.16, .035, 6, 18), M.brass);
    valve.rotation.x = Math.PI / 2;
    valve.position.set(.35, balloonCenterY - 2.55, -1.62);
    ship.add(valve);
  }

  // ---------- capybara pilot ----------
  const capy = new THREE.Group();
  capy.position.set(0, deckY, .72);
  capy.scale.setScalar(1.12);
  ship.add(capy);

  const capyBody = mesh(new THREE.SphereGeometry(1, 36, 28), M.fur);
  capyBody.scale.set(.8, .92, .7);
  capyBody.position.set(0, .8, .15);
  capy.add(capyBody);

  // lighter belly patch
  const belly = mesh(new THREE.SphereGeometry(1, 28, 22), M.furLight);
  belly.scale.set(.52, .62, .16);
  belly.position.set(0, .72, .75);
  capy.add(belly);

  // leather harness
  for (const s of [-1, 1]) {
    const strap = mesh(new THREE.BoxGeometry(.12, 1.1, .075), M.leatherDark);
    strap.position.set(s * .22, .9, .82);
    strap.rotation.z = s * -.3;
    strap.rotation.x = -.08;
    capy.add(strap);
  }
  const buckle = mesh(new THREE.TorusGeometry(.075, .018, 6, 12), M.brass);
  buckle.position.set(0, .92, .9);
  capy.add(buckle);

  // head group
  const head = new THREE.Group();
  head.position.set(0, 1.55, .65);
  capy.add(head);

  const skull = mesh(new THREE.SphereGeometry(1, 44, 32), M.fur);
  skull.scale.set(.78, .60, .82);
  head.add(skull);

  const muzzle = mesh(roundedBoxGeometry(.98, .46, .72, .22), M.furLight);
  muzzle.position.set(0, -.29, .84);
  head.add(muzzle);

  // broad cheek pads give the face its gentle capybara shape
  for (const s of [-1, 1]) {
    const cheek = mesh(new THREE.SphereGeometry(1, 22, 16), M.furLight);
    cheek.scale.set(.22, .25, .25);
    cheek.position.set(s * .46, -.2, .62);
    head.add(cheek);
  }

  const chin = mesh(new THREE.SphereGeometry(1, 24, 18), M.furLight);
  chin.scale.set(.42, .22, .3);
  chin.position.set(0, -.46, .87);
  head.add(chin);

  // nose
  const nose = mesh(new THREE.SphereGeometry(.105, 16, 12), M.nose);
  nose.scale.set(1.7, .62, .82);
  nose.position.set(0, -.22, 1.21);
  head.add(nose);
  const noseBridge = mesh(new THREE.CapsuleGeometry(.022, .1, 4, 8), M.nose, false, false);
  noseBridge.position.set(0, -.31, 1.205);
  head.add(noseBridge);
  for (const s of [-1, 1]) {
    const nostril = mesh(new THREE.SphereGeometry(.033, 8, 6), M.nose);
    nostril.scale.set(1, .65, .5);
    nostril.position.set(s * .15, -.21, 1.27);
    head.add(nostril);
  }

  // smile
  {
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      pts.push(new THREE.Vector3(-.28 + t * .56, -.355 - Math.sin(t * Math.PI) * .05, 1.195));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    head.add(mesh(new THREE.TubeGeometry(curve, 16, .018, 5, false), M.nose, false, false));
  }

  // tiny incisors
  for (const s of [-1, 1]) {
    const tooth = mesh(new THREE.BoxGeometry(.085, .11, .045), M.cream);
    tooth.position.set(s * .075, -.49, 1.19);
    head.add(tooth);
  }

  // whiskers
  {
    const mat = new THREE.LineBasicMaterial({ color: 0xf4e3c8, transparent: true, opacity: .5 });
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const pts = [
          new THREE.Vector3(s * .52, -.22 + i * .055, 1.00),
          new THREE.Vector3(s * (.80 + i * .03), -.17 + i * .075, 1.10),
          new THREE.Vector3(s * (1.04 + i * .04), -.12 + i * .1, 1.00)
        ];
        const c = new THREE.CatmullRomCurve3(pts);
        const geo = new THREE.BufferGeometry().setFromPoints(c.getPoints(10));
        const line = new THREE.Line(geo, mat);
        head.add(line);
      }
    }
  }

  // ears
  for (const s of [-1, 1]) {
    const ear = new THREE.Group();
    ear.position.set(s * .60, .47, .03);
    ear.rotation.z = s * -.28;
    ear.rotation.x = -.18;
    const outer = mesh(new THREE.SphereGeometry(.115, 18, 14), M.furDark);
    outer.scale.set(1, .92, .5);
    ear.add(outer);
    const inner = mesh(new THREE.SphereGeometry(.062, 14, 10), M.furLight);
    inner.scale.set(1, .9, .32);
    inner.position.z = .08;
    ear.add(inner);
    head.add(ear);
  }

  // small, friendly capybara eyes beneath the raised goggles
  for (const s of [-1, 1]) {
    const eye = mesh(new THREE.SphereGeometry(.058, 16, 12), M.eye, false, false);
    eye.scale.set(1, 1.05, .58);
    eye.position.set(s * .30, .035, .805);
    head.add(eye);
    const eyeGlint = mesh(new THREE.SphereGeometry(.017, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), false, false);
    eyeGlint.position.set(s * .313, .06, .843);
    head.add(eyeGlint);
  }

  // aviator goggles, pushed up on the forehead
  {
    const strap = mesh(new THREE.TorusGeometry(.78, .055, 8, 44), M.leatherDark);
    strap.rotation.x = Math.PI / 2;
    strap.scale.set(1, .86, 1);
    strap.position.set(0, .32, .02);
    head.add(strap);
    // side buckle
    const buckle = mesh(new THREE.BoxGeometry(.08, .17, .075), M.brass);
    buckle.position.set(-.79, .32, .02);
    head.add(buckle);

    const tilt = -.38;
    for (const s of [-1, 1]) {
      const rim = mesh(new THREE.TorusGeometry(.185, .04, 10, 34), M.brass);
      rim.position.set(s * .285, .32, .70);
      rim.rotation.x = tilt;
      head.add(rim);
      const innerRim = mesh(new THREE.TorusGeometry(.164, .015, 8, 30), M.copper);
      innerRim.position.set(s * .285, .32, .715);
      innerRim.rotation.x = tilt;
      head.add(innerRim);
      const lens = mesh(new THREE.CircleGeometry(.164, 30), M.goggleGlass, false, false);
      lens.position.set(s * .285, .32, .718);
      lens.rotation.x = tilt;
      head.add(lens);
      const shine = mesh(new THREE.RingGeometry(.085, .128, 22, 1, .42, 1.5), new THREE.MeshBasicMaterial({
        color: 0xd9f1f1, transparent: true, opacity: .34, side: THREE.DoubleSide, depthWrite: false
      }), false, false);
      shine.position.set(s * .285 + .018, .37, .735);
      shine.rotation.x = tilt;
      head.add(shine);
      const glint = mesh(new THREE.CircleGeometry(.021, 10), new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: .5, depthWrite: false
      }), false, false);
      glint.position.set(s * .285 + .065, .405, .72);
      glint.rotation.x = tilt;
      head.add(glint);
      // side strap bosses
      const boss = mesh(new THREE.CylinderGeometry(.062, .062, .08, 10), M.brassDark);
      boss.rotation.z = Math.PI / 2;
      boss.position.set(s * .64, .32, .51);
      head.add(boss);
    }
    // bridge
    const bridge = mesh(new THREE.CylinderGeometry(.036, .036, .2, 8), M.brass);
    bridge.rotation.z = Math.PI / 2;
    bridge.position.set(0, .35, .73);
    head.add(bridge);

    // buckles / strap keepers on the sides
    for (const s of [-1, 1]) {
      const keep = mesh(new THREE.BoxGeometry(.05, .11, .085), M.brass);
      keep.position.set(s * .7, .33, .37);
      head.add(keep);
    }
  }

  // fur tufts around cheeks and crown
  {
    const tuftGeo = new THREE.ConeGeometry(.045, .18, 5);
    const tufts = [
      [-.74, .02, .28, -.7, -.2], [.74, .02, .28, .7, -.2],
      [-.63, .36, .22, -.5, .2], [.63, .36, .22, .5, .2],
      [-.46, .5, .06, -.3, .6], [.46, .5, .06, .3, .6]
    ];
    for (const [x, y, z, rx, rz] of tufts) {
      const t = mesh(tuftGeo, M.furDark, false, false);
      t.position.set(x, y, z);
      t.rotation.set(rx, 0, rz);
      head.add(t);
    }
  }

  // scarf collar
  {
    const collar = mesh(new THREE.TorusGeometry(.56, .14, 9, 36), M.scarf);
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(1, .88, 1);
    collar.position.set(0, 1.22, .5);
    capy.add(collar);
    const knot = mesh(new THREE.SphereGeometry(.19, 16, 12), M.scarf);
    knot.scale.set(.8, 1, .65);
    knot.position.set(.38, 1.12, .78);
    capy.add(knot);
    const knotTail = mesh(new THREE.ConeGeometry(.12, .4, 8), M.scarfDark);
    knotTail.rotation.x = Math.PI;
    knotTail.position.set(.38, .94, .82);
    capy.add(knotTail);
  }

  // scarf ribbons (animated)
  const ribbons = [];
  function makeScarfRibbon(baseX, baseY, baseZ, length, width, phase, mat) {
    const N = 22;
    const positions = new Float32Array((N + 1) * 2 * 3);
    const geo = new THREE.BufferGeometry();
    const indices = [];
    for (let i = 0; i < N; i++) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    capy.add(m);
    const r = { mesh: m, baseX, baseY, baseZ, length, width, phase, N, positions };
    ribbons.push(r);
    return r;
  }
  makeScarfRibbon(.56, 1.38, .08, 2.3, .14, 0, M.scarf);
  makeScarfRibbon(.42, 1.31, .04, 1.9, .09, 1.7, M.scarfDark);

  function updateRibbons(t) {
    for (const r of ribbons) {
      const pos = r.positions;
      for (let i = 0; i <= r.N; i++) {
        const u = i / r.N;
        const flutter = Math.sin(t * 4.2 + u * 5.8 + r.phase);
        const flutter2 = Math.sin(t * 2.1 + u * 9.1 + r.phase * .7);
        const x = r.baseX + u * .9 + flutter * (.06 + .08 * u);
        const y = r.baseY - u * .22 + flutter * (.07 + .06 * u) + flutter2 * .03;
        const z = r.baseZ - u * r.length;
        const w = (r.width * (1 + u * .5)) / 2;
        const i6 = i * 6;
        pos[i6] = x; pos[i6 + 1] = y + w; pos[i6 + 2] = z;
        pos[i6 + 3] = x; pos[i6 + 4] = y - w; pos[i6 + 5] = z;
      }
      r.mesh.geometry.attributes.position.needsUpdate = true;
      r.mesh.geometry.computeVertexNormals();
    }
  }

  // arms and paws reaching the wheel
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Vector3(s * .55, 1.02, .5);
    const paw = new THREE.Vector3(s * .44, .78, 2.25);
    const mid = shoulder.clone().lerp(paw, .55);
    mid.y += .08;
    const curve = new THREE.QuadraticBezierCurve3(shoulder, mid, paw);
    const arm = mesh(new THREE.TubeGeometry(curve, 18, .115, 10, false), M.fur);
    capy.add(arm);
    const pawMesh = mesh(new THREE.SphereGeometry(.14, 18, 14), M.fur);
    pawMesh.scale.set(1.05, .9, 1.2);
    pawMesh.position.copy(paw);
    capy.add(pawMesh);
    // fingers
    for (let i = -1; i <= 1; i++) {
      const finger = mesh(new THREE.CapsuleGeometry(.035, .09, 4, 8), M.furLight);
      finger.position.set(paw.x + i * .07, paw.y - .015, paw.z + .12);
      finger.rotation.x = .4;
      capy.add(finger);
    }
  }

  // legs / feet tucked behind rail
  for (const s of [-1, 1]) {
    const foot = mesh(new THREE.SphereGeometry(.19, 16, 12), M.furDark);
    foot.scale.set(.8, .45, 1.2);
    foot.position.set(s * .45, .12, .65);
    capy.add(foot);
  }

  // ---------- clouds ----------
  const cloudRoot = new THREE.Group();
  scene.add(cloudRoot);
  const cloudGeo = new THREE.SphereGeometry(1, 16, 12);
  const cloudMats = [M.cloud, M.cloudPink, M.cloudShadow];

  function makeCloud(x, y, z, size, seed) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const count = 5 + Math.floor(rrange(0, 4));
    for (let i = 0; i < count; i++) {
      const puff = mesh(cloudGeo, cloudMats[Math.floor(rrange(0, 3))], false, false);
      const s = size * rrange(.35, .7);
      puff.scale.set(s * rrange(.8, 1.35), s * rrange(.55, .9), s * rrange(.75, 1.15));
      puff.position.set(rrange(-1, 1) * size * .8, rrange(-.25, .35) * size * .5, rrange(-1, 1) * size * .65);
      g.add(puff);
    }
    g.userData.drift = rrange(.25, .8);
    g.userData.phase = rrange(0, TAU);
    g.userData.baseY = y;
    g.userData.baseX = x;
    cloudRoot.add(g);
    return g;
  }

  const clouds = [];
  for (let i = 0; i < 15; i++) {
    const a = i / 15 * TAU + rrange(-.1, .1);
    const radius = rrange(26, 48);
    clouds.push(makeCloud(
      Math.cos(a) * radius,
      rrange(-7.5, -1.8),
      Math.sin(a) * radius,
      rrange(3.2, 6.5),
      i
    ));
  }
  // a soft sea of cloud below
  for (let i = 0; i < 8; i++) {
    clouds.push(makeCloud(rrange(-30, 30), rrange(-11, -8), rrange(-30, 18), rrange(5, 8.5), i + 40));
  }
  // a couple of high wisps behind
  for (let i = 0; i < 4; i++) {
    clouds.push(makeCloud(rrange(-40, 40), rrange(12, 20), rrange(-50, -30), rrange(4, 6), i + 80));
  }

  // distant birds
  {
    const birdMat = new THREE.LineBasicMaterial({ color: 0x5a5047, transparent: true, opacity: .35 });
    for (let i = 0; i < 6; i++) {
      const pts = [
        new THREE.Vector3(-.5, 0, 0), new THREE.Vector3(0, .17, 0), new THREE.Vector3(.5, 0, 0)
      ];
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const bird = new THREE.Line(geo, birdMat);
      bird.position.set(rrange(-35, -20), rrange(9, 16), rrange(-25, 5));
      bird.rotation.y = rrange(-.3, .3);
      bird.scale.setScalar(rrange(.8, 1.4));
      scene.add(bird);
    }
  }

  // floating dust
  {
    const count = 260;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = rrange(-35, 35);
      positions[i * 3 + 1] = rrange(-1, 24);
      positions[i * 3 + 2] = rrange(-35, 35);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffe6b8, size: .055, transparent: true, opacity: .55,
      depthWrite: false, blending: THREE.AdditiveBlending, fog: true
    });
    const dust = new THREE.Points(geo, mat);
    dust.name = 'dust';
    scene.add(dust);
  }

  // ---------- animation ----------
  const clock = new THREE.Clock();
  let elapsed = 0;
  let frame = 0;

  function animate() {
    const dt = Math.min(clock.getDelta(), .05);
    elapsed += dt;
    frame += 1;

    // gentle flight motion
    ship.position.y = Math.sin(elapsed * .62) * .11;
    ship.rotation.z = Math.sin(elapsed * .41) * .008;
    ship.rotation.x = Math.sin(elapsed * .33) * .005;
    ship.rotation.y = Math.sin(elapsed * .21) * .006;

    balloon.rotation.z = Math.sin(elapsed * .33) * .004;
    balloon.rotation.x = Math.sin(elapsed * .27 + .8) * .003;

    // capybara looks around a little and breathes
    head.rotation.y = Math.sin(elapsed * .26) * .055;
    head.rotation.x = Math.sin(elapsed * .37) * .018;
    capyBody.scale.y = .92 * (1 + Math.sin(elapsed * 1.2) * .006);
    updateRibbons(elapsed);

    // clockwork
    for (const g of gears) g.mesh.rotation.z += g.speed * dt;
    mainProp.rotation.z -= dt * 2.9;
    for (const sp of sideProps) sp.mesh.rotation.z -= dt * 4.2 * sp.dir;

    // steam puffs
    for (const puff of steamGroup.children) {
      puff.userData.age += dt * puff.userData.speed;
      if (puff.userData.age > 1) {
        puff.userData.age = 0;
        puff.userData.speed = rrange(.22, .42);
        puff.userData.drift = rrange(.25, .65);
        puff.position.x = .5 + rrange(-.15, .15);
        puff.position.y = deckY + 2.7;
        puff.position.z = -1.72;
      }
      const age = puff.userData.age;
      puff.position.y += dt * (.45 + age * .9);
      puff.position.z -= dt * (.12 + age * .25);
      puff.position.x += Math.sin(elapsed + age * 5) * dt * .06;
      const scale = puff.userData.size * (1 + age * 2.5);
      puff.scale.set(scale, scale, 1);
      puff.material.opacity = Math.sin(Math.min(1, age) * Math.PI) * .42;
    }

    // lantern flicker
    for (let i = 0; i < lanterns.length; i++) {
      const l = lanterns[i];
      const f = .9 + Math.sin(elapsed * 6.1 + i * 2.2) * .06 + Math.sin(elapsed * 13.7 + i) * .025;
      l.userData.light.intensity = 9 * f;
      l.userData.glass.material.emissiveIntensity = 2.8 * f;
    }

    // clouds drift slowly
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.position.x = c.userData.baseX + Math.sin(elapsed * .018 + c.userData.phase) * 1.8 * c.userData.drift;
      c.position.y = c.userData.baseY + Math.sin(elapsed * .09 + c.userData.phase) * .18;
    }
    const dust = scene.getObjectByName('dust');
    if (dust) dust.rotation.y = elapsed * .006;

    // camera idle drift is handled by OrbitControls
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  // first render, then reveal
  renderer.compile(scene, camera);
  animate();

  const loader = document.getElementById('loader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 900);
    }, 350);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setPixelRatio(targetPixelRatio());
  });
}
