import * as THREE from 'three';

// Editorial direction and timing, not absolute source coordinates.
export const CAMERA_DIRECTION = {
  detailHeight: .20, detailDepth: .09, // Upper frame: rail/post junction at the foot of its flight.
  clearance: .10, // Fraction of upper-flight width, outside its left-hand steelwork.
  revealDirection: [-.85, .18, 1],
  framingMargin: 1.04, portraitFraming: 1.32,
  segments: [2.4, 3.2, 3.4, 2.4],
  openingHold: .4,
};

export function buildCameraPath(model, camera) {
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model, true);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  // These exact source mesh names identify the standalone upper flight inspected in the GLB.
  const frame = model.getObjectByName('Cube112_StairBody_0') ?? model.getObjectByName('Cube.112_StairBody_0');
  const steps = model.getObjectByName('Cube112_Steps_0') ?? model.getObjectByName('Cube.112_Steps_0');
  if (!frame?.isMesh || !steps?.isMesh) throw Error('Expected upper stair-flight landmarks are missing');
  const frameBox = new THREE.Box3().setFromObject(frame, true);
  const treadBox = new THREE.Box3().setFromObject(steps, true);
  const flight = frameBox.getSize(new THREE.Vector3());
  const tread = treadBox.getSize(new THREE.Vector3());
  const clearance = flight.x * CAMERA_DIRECTION.clearance;
  const seed = new THREE.Vector3(frameBox.min.x, frameBox.min.y + flight.y * CAMERA_DIRECTION.detailHeight, frameBox.max.z - flight.z * CAMERA_DIRECTION.detailDepth);
  // Find a real vertex at the rail/post junction rather than aiming at an empty box corner.
  const detail = new THREE.Vector3(); let nearest = Infinity;
  const point = new THREE.Vector3(); const positions = frame.geometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    point.fromBufferAttribute(positions, i).applyMatrix4(frame.matrixWorld);
    const distance = point.distanceToSquared(seed);
    if (distance < nearest) { nearest = distance; detail.copy(point); }
  }
  const railHeight = detail.y - treadBox.min.y;
  const sideX = Math.min(frameBox.min.x, box.min.x);
  const vector = (x, y, z) => new THREE.Vector3(x, y, z);
  const treadAt = fraction => vector(treadBox.getCenter(new THREE.Vector3()).x, THREE.MathUtils.lerp(treadBox.min.y, treadBox.max.y, fraction), THREE.MathUtils.lerp(treadBox.max.z, treadBox.min.z, fraction));
  const p2 = treadAt(.43); p2.set(sideX - clearance * 2.4, p2.y + railHeight * .84, p2.z);
  const p3 = treadAt(.82); p3.set(sideX - clearance * 4.5, p3.y + railHeight, p3.z);
  const topTarget = treadBox.getCenter(new THREE.Vector3()); topTarget.y += railHeight * .4;
  // Open with the upper architecture, approach its real foreground rail, then arrive.
  const establish = topTarget.clone().add(vector(-flight.x * 3.2, flight.y * .22, tread.z * .52));
  const direction = new THREE.Vector3(...CAMERA_DIRECTION.revealDirection).normalize();
  const target = center.clone();
  const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  // Reserve left typography on desktop. Mobile uses the whole canvas.
  const availableWidth = camera.aspect >= 1 ? .64 : .90;
  const tanH = tanV * camera.aspect * availableWidth;
  let distance = 0;
  const corners = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
    const corner = vector(x, y, z); corners.push(corner);
    const rel = corner.clone().sub(target); const depth = rel.dot(direction);
    distance = Math.max(distance, Math.abs(rel.dot(right)) / tanH + depth, Math.abs(rel.dot(up)) / tanV + depth);
  }
  distance *= CAMERA_DIRECTION.framingMargin * (camera.aspect < 1 ? CAMERA_DIRECTION.portraitFraming : 1);
  const reveal = target.clone().addScaledVector(direction, distance);
  const arrivalApproach = target.clone().addScaledVector(direction, distance * 1.14);
  const points = [establish, p3, p2, arrivalApproach, reveal];
  const t2 = treadAt(.57); t2.y += railHeight * .35;
  const t3 = treadAt(.87); t3.y += railHeight * .28;
  const targets = [topTarget, t3, t2, target.clone(), target];
  const positionCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const targetCurve = new THREE.CatmullRomCurve3(targets, false, 'centripetal');
  // A conservative X-plane bound guarantees camera clearance across the whole assembly.
  let minClearance = Infinity;
  for (let i = 0; i <= 512; i++) minClearance = Math.min(minClearance, box.min.x - positionCurve.getPoint(i / 512).x);
  if (minClearance <= clearance * .3) throw Error('Camera route is too close to the outer steelwork');
  return { box, size, center, frameBox, treadBox, detail, clearance, railHeight, corners, reveal, positionCurve, targetCurve, points, targets, minClearance, near: Math.min(clearance * .025, size.length() * .0002), far: distance * 1.14 + size.length() * 2.5 };
}
