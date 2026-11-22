(function () {
  'use strict';

  window.createCapybara = function (THREE) {
    const group = new THREE.Group();
    group.name = 'Captain Capy';
    const head = new THREE.Group();
    const fur = new THREE.MeshStandardMaterial({ color: 0xa8794e, roughness: 0.97 });
    const faceFur = new THREE.MeshStandardMaterial({ color: 0xb88b5e, roughness: 0.93 });
    const muzzleFur = new THREE.MeshStandardMaterial({ color: 0xc3996b, roughness: 0.94 });
    const warmFur = new THREE.MeshStandardMaterial({ color: 0x967048, roughness: 1 });
    const innerEar = new THREE.MeshStandardMaterial({ color: 0xb37861, roughness: 0.94 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x4d372b, roughness: 0.85 });
    const leather = new THREE.MeshStandardMaterial({ color: 0x614031, roughness: 0.77 });
    const leatherEdge = new THREE.MeshStandardMaterial({ color: 0x865b3d, roughness: 0.8 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xd9af60, metalness: 0.78, roughness: 0.31 });
    const brassDark = new THREE.MeshStandardMaterial({ color: 0x8c6630, metalness: 0.62, roughness: 0.42 });
    const scarfMat = new THREE.MeshStandardMaterial({ color: 0xeee1c0, roughness: 0.98, side: THREE.DoubleSide });
    const scarfStripe = new THREE.MeshStandardMaterial({ color: 0xbb7951, roughness: 0.91 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x251f1c, roughness: 0.25 });
    const highlightMat = new THREE.MeshStandardMaterial({ color: 0xfff9de, roughness: 0.25 });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x79b9b3, roughness: 0.18, metalness: 0.2,
      transparent: true, opacity: 0.48, depthWrite: false, side: THREE.DoubleSide
    });
    const sphereGeo = new THREE.SphereGeometry(1, 24, 16);
    const smallSphereGeo = new THREE.SphereGeometry(1, 12, 8);

    function mesh(geometry, material, parent) {
      const object = new THREE.Mesh(geometry, material);
      object.castShadow = true;
      object.receiveShadow = true;
      (parent || group).add(object);
      return object;
    }

    function ellipsoid(position, scale, material, parent, small) {
      const object = mesh(small ? smallSphereGeo : sphereGeo, material, parent);
      object.position.set(...position);
      object.scale.set(...scale);
      return object;
    }

    function tube(points, radius, material, parent, segments) {
      const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
      return mesh(new THREE.TubeGeometry(curve, segments || 20, radius, 6, false), material, parent);
    }

    function limb(a, b, radius, material) {
      const begin = new THREE.Vector3(...a);
      const end = new THREE.Vector3(...b);
      const length = begin.distanceTo(end);
      const object = mesh(new THREE.CylinderGeometry(radius * 0.88, radius, length, 14), material);
      object.position.copy(begin).add(end).multiplyScalar(0.5);
      object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(begin).normalize());
      ellipsoid(a, [radius, radius, radius], material, group, true);
      ellipsoid(b, [radius * 0.92, radius * 0.92, radius * 0.92], material, group, true);
    }

    function roundMuzzle() {
      const geometry = new THREE.BufferGeometry();
      const positions = [], indices = [];
      const rings = 18, slices = 32;
      const signedPower = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
      for (let i = 0; i <= rings; i++) {
        const latitude = -Math.PI / 2 + Math.PI * i / rings;
        const cv = signedPower(Math.cos(latitude), 0.77);
        const sv = signedPower(Math.sin(latitude), 0.77);
        for (let j = 0; j <= slices; j++) {
          const longitude = 2 * Math.PI * j / slices;
          positions.push(
            0.46 * cv * signedPower(Math.cos(longitude), 0.68),
            0.285 * sv,
            0.418 * cv * signedPower(Math.sin(longitude), 0.68)
          );
        }
      }
      for (let i = 0; i < rings; i++) {
        for (let j = 0; j < slices; j++) {
          const a = i * (slices + 1) + j;
          const b = a + slices + 1;
          indices.push(a, b, a + 1, a + 1, b, b + 1);
        }
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();
      return geometry;
    }

    // Capybaras have a heavy barrel body, a long flat muzzle, and very small ears.
    ellipsoid([-0.22, 0.71, 0], [0.59, 0.72, 0.535], fur);
    ellipsoid([-0.31, 0.43, 0], [0.58, 0.43, 0.565], fur);
    ellipsoid([0.27, 0.69, 0], [0.235, 0.5, 0.43], muzzleFur);
    ellipsoid([-0.03, 1.16, 0], [0.41, 0.35, 0.43], faceFur);
    group.add(head);
    ellipsoid([0.17, 1.55, 0], [0.67, 0.505, 0.49], faceFur, head);
    const muzzle = mesh(roundMuzzle(), muzzleFur, head);
    muzzle.position.set(0.72, 1.405, 0);
    ellipsoid([0.68, 1.195, 0], [0.47, 0.105, 0.375], faceFur, head);

    for (const side of [-1, 1]) {
      const ear = ellipsoid([-0.15, 1.994, side * 0.387], [0.145, 0.158, 0.092], fur, head, true);
      ear.rotation.x = side * 0.14;
      const inset = ellipsoid([-0.126, 2.005, side * 0.457], [0.094, 0.101, 0.017], innerEar, head, true);
      inset.rotation.x = side * 0.14;

      const nostril = ellipsoid([1.169, 1.463, side * 0.205], [0.017, 0.032, 0.052], dark, head, true);
      nostril.rotation.x = side * 0.15;
      tube([[1.174, 1.34, 0], [1.146, 1.306, side * 0.20], [1.028, 1.30, side * 0.369], [0.957, 1.329, side * 0.404]], 0.007, warmFur, head, 14);

      // The elbows and broad paws reach out to the helm.
      limb([0.06, 1.05, side * 0.444], [0.37, 0.847, side * 0.555], 0.147, fur);
      limb([0.37, 0.847, side * 0.555], [0.82, 0.978, side * 0.389], 0.125, faceFur);
      const paw = ellipsoid([0.875, 0.969, side * 0.377], [0.192, 0.12, 0.151], faceFur, group, true);
      paw.rotation.z = 0.2;
      for (let f = -1; f <= 1; f++) {
        const z = side * 0.377 + f * 0.071;
        tube([[1.003, 0.958, z], [1.011, 0.916, z], [0.971, 0.901, z]], 0.0055, warmFur, group, 5);
      }

      ellipsoid([0.16, 0.148, side * 0.457], [0.31, 0.146, 0.211], faceFur, group, true);
      for (let f = -1; f <= 1; f++) {
        const z = side * 0.457 + f * 0.089;
        ellipsoid([0.395, 0.141, z], [0.035, 0.02, 0.036], dark, group, true);
      }

      // Fine pale whiskers sit low on the broad snout.
      for (let w = 0; w < 3; w++) {
        tube([[0.967, 1.39 - w * 0.055, side * 0.391], [0.90 - w * 0.03, 1.414 - w * 0.054, side * 0.50], [0.793 - w * 0.04, 1.442 - w * 0.059, side * 0.642]], 0.0035, muzzleFur, head, 9);
      }
    }
    tube([[1.179, 1.435, 0], [1.184, 1.38, 0], [1.174, 1.341, 0]], 0.006, warmFur, head, 6);

    // A stitched leather flying cap; the small ears poke out at its sides.
    const cap = mesh(new THREE.SphereGeometry(1, 32, 16, 0, Math.PI * 2, 0, 1.13), leather, head);
    cap.scale.set(0.691, 0.568, 0.514);
    cap.position.set(0.165, 1.551, 0);
    tube([[-0.459, 1.818, 0], [-0.29, 2.024, 0], [0.171, 2.12, 0], [0.589, 1.996, 0], [0.771, 1.813, 0]], 0.006, leatherEdge, head, 22);
    tube([[0.632, 1.891, -0.311], [0.724, 1.816, -0.18], [0.758, 1.794, 0], [0.724, 1.816, 0.18], [0.632, 1.891, 0.311]], 0.016, leatherEdge, head, 20);
    for (const side of [-1, 1]) {
      const flap = ellipsoid([-0.189, 1.568, side * 0.489], [0.164, 0.249, 0.048], leather, head, true);
      flap.rotation.x = side * -0.13;
      tube([[-0.325, 1.676, side * 0.507], [-0.336, 1.509, side * 0.526], [-0.215, 1.339, side * 0.525], [-0.077, 1.513, side * 0.524]], 0.0055, leatherEdge, head, 16);
      const buckle = mesh(new THREE.TorusGeometry(0.047, 0.011, 6, 14), brassDark, head);
      buckle.position.set(-0.186, 1.391, side * 0.548);
      buckle.rotation.x = side * 0.06;
      const rivet = ellipsoid([-0.249, 1.604, side * 0.545], [0.025, 0.025, 0.011], brass, head, true);
      rivet.castShadow = false;
    }

    // A continuous leather goggle strap passes around the back of the head.
    const strapPoints = [];
    for (let i = 0; i <= 28; i++) {
      const a = 2 * Math.PI * i / 28;
      strapPoints.push([0.106 + Math.cos(a) * 0.602, 1.743 - 0.026 * Math.cos(a), Math.sin(a) * 0.489]);
    }
    tube(strapPoints, 0.04, leather, head, 52);

    for (const side of [-1, 1]) {
      const goggles = new THREE.Group();
      goggles.name = side > 0 ? 'Starboard aviator lens' : 'Port aviator lens';
      goggles.position.set(0.614, 1.783, side * 0.335);
      const normal = new THREE.Vector3(0.851, 0.14, side * 0.506).normalize();
      goggles.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
      head.add(goggles);
      const pad = mesh(new THREE.TorusGeometry(0.21, 0.058, 9, 30), leather, goggles);
      pad.scale.set(1.105, 0.905, 0.83);
      pad.position.z = -0.015;
      const frame = mesh(new THREE.TorusGeometry(0.209, 0.027, 9, 32), brass, goggles);
      frame.scale.set(1.105, 0.905, 1);
      frame.position.z = 0.045;
      const innerRim = mesh(new THREE.TorusGeometry(0.181, 0.007, 5, 32), brassDark, goggles);
      innerRim.scale.set(1.105, 0.905, 1);
      innerRim.position.z = 0.054;
      ellipsoid([0.002, 0.011, -0.005], [0.081, 0.079, 0.021], eyeMat, goggles, true);
      ellipsoid([-0.021, 0.043, 0.017], [0.020, 0.023, 0.008], highlightMat, goggles, true);
      const lens = mesh(new THREE.CircleGeometry(0.188, 32), glassMat, goggles);
      lens.scale.set(1.105, 0.905, 1);
      lens.position.z = 0.06;
      lens.castShadow = false;
      const sheen = mesh(new THREE.CircleGeometry(1, 18), new THREE.MeshStandardMaterial({ color: 0xe7fff5, transparent: true, opacity: 0.64, roughness: 0.28, depthWrite: false }), goggles);
      sheen.scale.set(0.026, 0.087, 1);
      sheen.position.set(-0.086, 0.066, 0.062);
      sheen.rotation.z = -0.6;
      sheen.castShadow = false;
      for (const a of [0.21, Math.PI - 0.21, Math.PI + 0.21, Math.PI * 2 - 0.21]) {
        ellipsoid([Math.cos(a) * 0.228, Math.sin(a) * 0.19, 0.064], [0.014, 0.014, 0.007], brassDark, goggles, true);
      }
    }
    tube([[0.801, 1.813, -0.126], [0.864, 1.808, 0], [0.801, 1.813, 0.126]], 0.016, brass, head, 12);

    // Cream scarf, with two loose tails flowing behind the pilot.
    const collar = mesh(new THREE.TorusGeometry(0.37, 0.105, 10, 34), scarfMat);
    collar.rotation.x = Math.PI / 2;
    collar.scale.set(1.14, 1.02, 0.87);
    collar.position.set(-0.032, 1.15, 0);
    const scarfPiping = mesh(new THREE.TorusGeometry(0.426, 0.012, 6, 34), scarfStripe);
    scarfPiping.rotation.x = Math.PI / 2;
    scarfPiping.scale.set(1.07, 0.99, 1);
    scarfPiping.position.set(-0.032, 1.169, 0);
    ellipsoid([-0.278, 1.168, 0.411], [0.123, 0.119, 0.102], scarfMat, group, true);
    const tails = [];
    for (let tailIndex = 0; tailIndex < 2; tailIndex++) {
      const geometry = new THREE.BufferGeometry();
      const segments = 14;
      const positions = new Float32Array((segments + 1) * 2 * 3);
      const indices = [];
      for (let i = 0; i < segments; i++) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setIndex(indices);
      const ribbon = mesh(geometry, scarfMat);
      tails.push({ geometry, segments, tailIndex, positions });
    }

    // Little amber hairs give the silhouette the feel of coarse capybara fur.
    for (const side of [-1, 1]) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const x = -0.57 + col * 0.168 + (row % 2) * 0.035;
          const y = 0.43 + row * 0.17;
          const nx = (x + 0.22) / 0.59, ny = (y - 0.71) / 0.72;
          const surface = Math.sqrt(Math.max(0.08, 1 - nx * nx - ny * ny));
          const z = side * (surface * 0.539 + 0.003);
          tube([[x - 0.013, y - 0.024, z], [x + 0.015, y + 0.019, z + side * 0.005]], 0.0037, warmFur, group, 3);
        }
      }
    }

    function update(t) {
      head.rotation.z = Math.sin(t * 1.17) * 0.008;
      for (const tail of tails) {
        const { positions, segments, tailIndex, geometry } = tail;
        const length = tailIndex ? 1.065 : 1.34;
        for (let i = 0; i <= segments; i++) {
          const s = i / segments;
          const wave = Math.sin(t * 3.7 - s * 7.4 + tailIndex * 1.9);
          const width = (0.09 - s * 0.023) * (tailIndex ? 0.79 : 1);
          for (let edge = 0; edge < 2; edge++) {
            const index = (i * 2 + edge) * 3;
            positions[index] = -0.30 - length * s;
            positions[index + 1] = 1.18 + 0.28 * s + wave * 0.068 * s - tailIndex * 0.118 * s;
            positions[index + 2] = 0.421 + Math.sin(s * 3.2 + t * 1.7) * 0.067 * s + (edge ? width : -width);
          }
        }
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
      }
    }
    update(0);
    return { group, update };
  };
})();
