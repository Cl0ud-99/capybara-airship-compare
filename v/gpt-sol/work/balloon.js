(function () {
  'use strict';

  window.createAirshipEnvelope = function (THREE) {
    const group = new THREE.Group();
    group.name = 'Linen and ashwood airship envelope';
    const centerX = -0.5, centerY = 5.25;
    const radiusX = 5.3, radiusY = 1.7, radiusZ = 1.52;
    const brass = new THREE.MeshStandardMaterial({ color: 0xcfab62, metalness: 0.7, roughness: 0.42 });
    const rivetMat = new THREE.MeshStandardMaterial({ color: 0xdac08a, metalness: 0.72, roughness: 0.37 });
    const wood = new THREE.MeshStandardMaterial({ color: 0xae8658, metalness: 0.06, roughness: 0.77 });
    const endLeather = new THREE.MeshStandardMaterial({ color: 0x80614b, roughness: 0.84 });
    const seamMat = new THREE.MeshStandardMaterial({ color: 0xcbb48a, roughness: 0.95 });
    const stitchMat = new THREE.MeshStandardMaterial({ color: 0xe4d3ab, roughness: 0.97 });

    function mesh(geometry, material) {
      const object = new THREE.Mesh(geometry, material);
      object.castShadow = true;
      object.receiveShadow = true;
      group.add(object);
      return object;
    }

    function makeLinenTexture() {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 512;
      const context = canvas.getContext('2d');
      context.fillStyle = '#f4f0e7';
      context.fillRect(0, 0, 512, 512);
      let seed = 42971;
      const random = () => {
        seed = (seed * 1664525 + 1013904223) >>> 0;
        return seed / 4294967296;
      };
      for (let i = 0; i < 17000; i++) {
        const value = 130 + Math.floor(random() * 70);
        context.fillStyle = `rgba(${value},${value - 5},${value - 15},${0.025 + random() * 0.07})`;
        context.fillRect(Math.floor(random() * 512), Math.floor(random() * 512), 1 + random() * 2, 1);
      }
      context.lineWidth = 1;
      for (let x = 0; x < 512; x += 4) {
        context.strokeStyle = x % 8 ? 'rgba(142,124,97,.045)' : 'rgba(255,255,248,.22)';
        context.beginPath();
        context.moveTo(x + 0.5, 0);
        context.lineTo(x + 0.5, 512);
        context.stroke();
      }
      for (let y = 0; y < 512; y += 4) {
        context.strokeStyle = y % 8 ? 'rgba(142,124,97,.05)' : 'rgba(255,255,248,.18)';
        context.beginPath();
        context.moveTo(0, y + 0.5);
        context.lineTo(512, y + 0.5);
        context.stroke();
      }
      const texture = new THREE.CanvasTexture(canvas);
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(8, 4);
      texture.anisotropy = 4;
      return texture;
    }

    const linenTexture = makeLinenTexture();
    const palette = [0xebdab6, 0xf3e6ca, 0xe9d6ad, 0xefe0bf, 0xe6d2a5, 0xf0e2c2, 0xecdbb6];
    const fabricMaterials = palette.map(color => new THREE.MeshStandardMaterial({
      color, map: linenTexture, roughness: 0.96, metalness: 0
    }));

    function surface(t, theta, extra) {
      const inflate = extra || 1;
      const radial = Math.sin(t);
      return new THREE.Vector3(
        centerX + radiusX * Math.cos(t),
        centerY + radiusY * radial * Math.cos(theta) * inflate,
        radiusZ * radial * Math.sin(theta) * inflate
      );
    }

    function section(tStart, tEnd, thetaStart, thetaEnd, tSegments, thetaSegments, inflate) {
      const geometry = new THREE.BufferGeometry();
      const positions = [], normals = [], uvs = [], indices = [];
      for (let i = 0; i <= tSegments; i++) {
        const t = tStart + (tEnd - tStart) * i / tSegments;
        for (let j = 0; j <= thetaSegments; j++) {
          const theta = thetaStart + (thetaEnd - thetaStart) * j / thetaSegments;
          const position = surface(t, theta, inflate);
          positions.push(position.x, position.y, position.z);
          const normal = new THREE.Vector3(
            (position.x - centerX) / (radiusX * radiusX),
            (position.y - centerY) / (radiusY * radiusY),
            position.z / (radiusZ * radiusZ)
          ).normalize();
          normals.push(normal.x, normal.y, normal.z);
          uvs.push(theta / (Math.PI * 2), t / Math.PI);
        }
      }
      for (let i = 0; i < tSegments; i++) {
        for (let j = 0; j < thetaSegments; j++) {
          const a = i * (thetaSegments + 1) + j;
          const b = a + thetaSegments + 1;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeBoundingSphere();
      return geometry;
    }

    // Fourteen sewn gores form a continuous, soft elliptical gas envelope.
    const gores = 14;
    for (let gore = 0; gore < gores; gore++) {
      const thetaStart = gore * Math.PI * 2 / gores;
      const thetaEnd = (gore + 1) * Math.PI * 2 / gores;
      mesh(section(0, Math.PI, thetaStart, thetaEnd, 48, 4, 1), fabricMaterials[gore % palette.length]);
      const seamPoints = [];
      for (let i = 0; i <= 56; i++) {
        const t = 0.145 + (Math.PI - 0.29) * i / 56;
        seamPoints.push(surface(t, thetaStart, 1.005));
      }
      const seamCurve = new THREE.CatmullRomCurve3(seamPoints);
      mesh(new THREE.TubeGeometry(seamCurve, 56, 0.016, 5, false), seamMat);
    }

    function circumference(x, material, thickness, xOffset, inflation, segments, radialSegments) {
      const actualX = x + (xOffset || 0);
      const t = Math.acos(THREE.MathUtils.clamp((actualX - centerX) / radiusX, -1, 1));
      const points = [];
      for (let i = 0; i < 64; i++) {
        points.push(surface(t, i * Math.PI * 2 / 64, inflation || 1.005));
      }
      const curve = new THREE.CatmullRomCurve3(points, true);
      return mesh(new THREE.TubeGeometry(curve, segments || 64, thickness, radialSegments || 6, true), material);
    }

    // Slender ashwood hoops carry understated brass edging and small rivets.
    const bands = [-4.78, -2.66, -0.65, 2.0, 3.95];
    const rivetGeometry = new THREE.SphereGeometry(1, 8, 6);
    for (const x of bands) {
      circumference(x, wood, 0.047, 0, 1.012, 64, 6);
      circumference(x, brass, 0.009, -0.041, 1.016, 64, 4);
      circumference(x, brass, 0.009, 0.041, 1.016, 64, 4);
      const t = Math.acos((x - centerX) / radiusX);
      for (let i = 0; i < 6; i++) {
        const theta = Math.PI / 6 + i * Math.PI / 3;
        const position = surface(t, theta, 1.043);
        const rivet = mesh(rivetGeometry, rivetMat);
        rivet.position.copy(position);
        rivet.scale.set(0.028, 0.028, 0.028);
      }
    }

    // Leather tip collars and rounded golden closures follow the balloon curve.
    for (const t of [0.185, Math.PI - 0.185]) {
      const x = centerX + radiusX * Math.cos(t);
      circumference(x, endLeather, 0.037, 0, 1.028, 48, 5);
      circumference(x, stitchMat, 0.009, t < 1 ? -0.026 : 0.026, 1.035, 48, 4);
    }
    mesh(section(0, 0.157, 0, Math.PI * 2, 8, 32, 1.035), brass);
    mesh(section(Math.PI - 0.157, Math.PI, 0, Math.PI * 2, 8, 32, 1.035), brass);

    function emblemTexture() {
      if (typeof document === 'undefined') return null;
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 384;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#654832';
      context.strokeStyle = '#654832';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = 'bold 166px Georgia, serif';
      context.fillText('CAPY', 512, 139);
      context.font = '48px Georgia, serif';
      context.fillText('01', 512, 278);
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(347, 279);
      context.lineTo(448, 279);
      context.moveTo(576, 279);
      context.lineTo(677, 279);
      context.stroke();
      context.lineWidth = 8;
      context.lineCap = 'round';
      for (const side of [-1, 1]) {
        const base = side < 0 ? 247 : 777;
        for (let feather = 0; feather < 3; feather++) {
          context.beginPath();
          context.moveTo(base, 167 + feather * 21);
          context.quadraticCurveTo(base + side * 78, 145 + feather * 21, base + side * (145 - feather * 18), 117 + feather * 27);
          context.stroke();
        }
        context.beginPath();
        context.moveTo(base, 206);
        context.quadraticCurveTo(base + side * 67, 216, base + side * 117, 210);
        context.stroke();
      }
      const texture = new THREE.CanvasTexture(canvas);
      if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      return texture;
    }

    const emblemMap = emblemTexture();
    if (emblemMap) {
      const decalMat = new THREE.MeshStandardMaterial({
        map: emblemMap, transparent: true, roughness: 0.94,
        depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1,
        side: THREE.DoubleSide
      });
      // The lettering is curved to the skin; no flat rectangular backing shows.
      for (const side of [-1, 1]) {
        const positions = [], uvs = [], indices = [];
        const across = 24, vertical = 8;
        for (let j = 0; j <= vertical; j++) {
          const v = j / vertical;
          const y = centerY + (v - 0.5) * 0.92;
          for (let i = 0; i <= across; i++) {
            const u = i / across;
            const x = 0.675 + side * (u - 0.5) * 2.4;
            const radial = Math.sqrt(Math.max(0.001,
              1 - Math.pow((x - centerX) / radiusX, 2) - Math.pow((y - centerY) / radiusY, 2)
            ));
            const z = side * (radiusZ * radial + 0.013);
            positions.push(x, y, z);
            uvs.push(u, v);
          }
        }
        for (let j = 0; j < vertical; j++) {
          for (let i = 0; i < across; i++) {
            const a = j * (across + 1) + i;
            const b = a + across + 1;
            indices.push(a, a + 1, b, a + 1, b + 1, b);
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        const emblem = mesh(geometry, decalMat);
        emblem.castShadow = false;
      }
    }

    return { group };
  };
})();
