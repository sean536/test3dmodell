import * as THREE from 'three';

// Editorial direction and timing, not absolute source coordinates.
export const CAMERA_DIRECTION = {
  detailHeight: .20, detailDepth: .09, // Upper frame: rail/post junction at the foot of its flight.
  clearance: .10, // Fraction of upper-flight width, outside its left-hand steelwork.
  revealDirection: [-.85, .18, 1],
  framingMargin: 1.04, portraitFraming: 1.32,
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
  const precision = detail.clone().add(vector(-clearance * 1.5, clearance * .2, flight.z * .026));
  const experience = treadAt(.82); experience.set(sideX - clearance * 4.5, experience.y + railHeight, experience.z);
  const experienceTarget = treadAt(.87); experienceTarget.y += railHeight * .28;
  const platform = model.getObjectByName('Cube111_StairBodyPlat_0') ?? model.getObjectByName('Cube.111_StairBodyPlat_0');
  if (!platform?.isMesh) throw Error('Expected upper landing is missing');
  const platformBox = new THREE.Box3().setFromObject(platform, true);
  const landing = platformBox.getSize(new THREE.Vector3());
  const platformTarget = platformBox.getCenter(new THREE.Vector3());
  const projects = vector(sideX - landing.x * .75, platformBox.max.y + landing.y * .35, platformBox.max.z + landing.z * .8);
  const materialSeed = vector(platformBox.min.x, platformBox.min.y + landing.y * .66, platformBox.max.z - landing.z * .14);
  const materialDetail = new THREE.Vector3(); nearest = Infinity;
  const platformPositions = platform.geometry.attributes.position;
  for (let i = 0; i < platformPositions.count; i++) {
    point.fromBufferAttribute(platformPositions, i).applyMatrix4(platform.matrixWorld);
    const distance = point.distanceToSquared(materialSeed);
    if (distance < nearest) { nearest = distance; materialDetail.copy(point); }
  }
  const material = materialDetail.clone().add(vector(-clearance * 1.3, clearance * .15, clearance * .45));
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
  const wide = target.clone().addScaledVector(direction, distance * 1.12);
  wide.y += size.y * .04;
  const points = [wide, precision, experience, projects, material, reveal];
  const targets = [target.clone(), detail.clone(), experienceTarget, platformTarget, materialDetail, target];
  // Smoothly confine spline overshoot to the measured exterior clearance corridor.
  // Soft minimum preserves continuous derivatives; there is no position clamp/camera cut.
  const ceiling = box.min.x - clearance * .75;
  const softness = clearance * .2;
  class ExteriorCurve extends THREE.CatmullRomCurve3 {
    getPoint(t, output = new THREE.Vector3()) {
      super.getPoint(t, output);
      output.x = Math.min(output.x, ceiling) - softness * Math.log1p(Math.exp(-Math.abs(output.x - ceiling) / softness));
      return output;
    }
  }
  const positionCurve = new ExteriorCurve(points, false, 'centripetal');
  const targetCurve = new THREE.CatmullRomCurve3(targets, false, 'centripetal');
  // A conservative X-plane bound guarantees camera clearance across the whole assembly.
  let minClearance = Infinity;
  for (let i = 0; i <= 512; i++) minClearance = Math.min(minClearance, box.min.x - positionCurve.getPoint(i / 512).x);
  if (minClearance <= clearance * .3) throw Error('Camera route is too close to the outer steelwork');
  return { box, size, center, frameBox, treadBox, platformBox, materialDetail, detail, clearance, railHeight, corners, reveal, positionCurve, targetCurve, points, targets, minClearance, near: Math.min(clearance * .025, size.length() * .0002), far: distance * 1.14 + size.length() * 2.5 };
}
