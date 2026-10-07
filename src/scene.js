import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { intro } from './intro.js';
import { inspectGLB } from './model-inspection.js';
import { buildCameraPath, CAMERA_DIRECTION } from './camera-path.js';

export { CAMERA_DIRECTION };
export const MODEL_URL = '/models/staircase_modular_frame_-_steel.glb';
const LIMITS = { bytes: 64 * 1024 * 1024, triangles: 750000, meshes: 500, textureEdge: 4096 };
const LIGHTING = { exposure: .92, environment: .8, key: 2.6, rim: 3.2, fill: .35 };

export async function initScene() {
  const container = document.querySelector('#scene');
  const state = document.querySelector('#model-state');
  const hero = document.querySelector('#hero');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 700px)');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#111210');
  const camera = new THREE.PerspectiveCamera(42);
  const motion = { progress: 0, scroll: 0 };
  const mouse = new THREE.Vector2();
  const offset = new THREE.Vector2();
  const resources = { geometries: new Set(), materials: new Set(), textures: new Set() };
  const cameraPosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  let renderer, model, environment, path, timeline, scrollTrigger;
  let frame = 0, lastFrame = 0, renderCount = 0, slowFrames = 0;
  let disposed = false, completed = false, visible = true, previewHeld = false, awaitingHomepage = false;
  let projectionShift = NaN;
  let scrollOffset = 0;
  const diagnostics = { ready: false, phase: 'loading', renderCount: 0 };
  window.cinematicDiagnostics = diagnostics;
  const observer = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    synchronize();
  });
  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame); frame = 0;
    timeline?.kill(); scrollTrigger?.kill(); observer.disconnect();
    resources.geometries.forEach(item => item.dispose());
    resources.materials.forEach(item => item.dispose());
    resources.textures.forEach(item => item.dispose());
    environment?.dispose(); renderer?.dispose(); renderer?.domElement.remove();
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', pointer);
    window.removeEventListener('pagehide', pageHide);
    window.removeEventListener('pageshow', synchronize);
    window.removeEventListener('homepage-ready', homepageReady);
    intro.dispose();
    document.removeEventListener('visibilitychange', synchronize);
    reduced.removeEventListener('change', motionPreference);
    mobile.removeEventListener('change', motionPreference);

    diagnostics.ready = false; diagnostics.phase = 'disposed';
    delete window.cinematicPreview;
  }
  function fail(message, error) {
    dispose(); diagnostics.phase = 'fallback';
    document.body.classList.remove('has-model');
    state.hidden = false; state.textContent = message;
    intro.reveal({ instant: true });
    if (error) console.warn('3D presentation unavailable:', error.message);
  }
  function pageHide(event) {
    if (!event.persisted) dispose();
    else { cancelAnimationFrame(frame); frame = 0; timeline?.pause(); }
  }
  function resize() {
    if (!renderer || disposed) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.clearViewOffset();
    path = buildCameraPath(model, camera);
    camera.near = path.near; camera.far = path.far; camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(container.clientWidth, container.clientHeight);
    projectionShift = NaN;
    Object.assign(diagnostics, { near: camera.near, far: camera.far, dpr: renderer.getPixelRatio(), clearance: path.minClearance, detail: path.detail.toArray(), pathPoints: path.points.map(p => p.toArray()) });
    synchronize();
  }
  function homepageReady() { resize(); ScrollTrigger.refresh(); synchronize(); }
  function pointer(event) {
    if (!intro.unlocked || !completed || reduced.matches || mobile.matches) return;
    mouse.set((event.clientX / innerWidth - .5) * .012, (event.clientY / innerHeight - .5) * .008);
    synchronize();
  }
  function finish() {
    if (!completed) awaitingHomepage = true;
    completed = true; motion.progress = 1;
    synchronize();
  }
  function motionPreference() {
    if (reduced.matches || mobile.matches) { timeline?.pause(); mouse.set(0, 0); offset.set(0, 0); scrollOffset = 0; awaitingHomepage = true; finish(); }
    projectionShift = NaN;
    synchronize();
  }
  function synchronize() {
    if (!renderer || !path || disposed) return;
    const active = !document.hidden && visible;
    if (!active) { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; timeline?.pause(); diagnostics.paused = true; return; }
    diagnostics.paused = false;
    if (!completed && !previewHeld && !reduced.matches && !mobile.matches) {
      timeline?.resume();
    }
    if (!frame) frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    const still = reduced.matches || mobile.matches;
    const delta = Math.min(now - lastFrame || 16, 100); lastFrame = now;
    offset.lerp(still ? new THREE.Vector2() : mouse, 1 - Math.exp(-delta / 250));
    const desiredScroll = still || !intro.unlocked ? 0 : motion.scroll;
    scrollOffset = THREE.MathUtils.lerp(scrollOffset, desiredScroll, 1 - Math.exp(-delta / 300));
    path.positionCurve.getPoint(motion.progress, cameraPosition);
    path.targetCurve.getPoint(motion.progress, cameraTarget);
    // Pointer and scroll influence begin only as the composition withdraws from the steel.
    const revealBlend = THREE.MathUtils.smoothstep(motion.progress, .67, 1);
    cameraPosition.x += offset.x * path.size.x * revealBlend;
    cameraPosition.y += offset.y * path.size.y * revealBlend + scrollOffset * path.size.y * .025 * revealBlend;
    camera.position.copy(cameraPosition); camera.lookAt(cameraTarget);
    const shift = still && camera.aspect < 1 ? 0 : revealBlend * .16;
    if (projectionShift !== shift) {
      camera.setViewOffset(container.clientWidth, container.clientHeight, -container.clientWidth * shift, still && camera.aspect < 1 ? container.clientHeight * .10 : 0, container.clientWidth, container.clientHeight);
      projectionShift = shift;
    }
    const start = performance.now(); renderer.render(scene, camera);
    const renderMs = performance.now() - start;
    if (awaitingHomepage) { awaitingHomepage = false; intro.reveal({ instant: reduced.matches }); }
    slowFrames = renderMs > 90 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    Object.assign(diagnostics, { renderCount: ++renderCount, progress: motion.progress, completed, position: camera.position.toArray(), target: cameraTarget.toArray(), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures, renderSubmitMs: renderMs, phase: still ? 'still' : completed ? 'reveal' : 'film' });
    if (slowFrames > 12) { fail('Die 3D-Ansicht wurde aus Leistungsgründen pausiert. Alle Inhalte bleiben verfügbar.'); return; }
    const moving = !still && ((!completed && !previewHeld) || offset.distanceToSquared(mouse) > 1e-9 || Math.abs(scrollOffset - desiredScroll) > 1e-4);
    if (moving) frame = requestAnimationFrame(render);
  }
  try {
    const response = await fetch(MODEL_URL);
    if (!response.ok || response.headers.get('content-type')?.includes('text/html')) { fail('Die 3D-Ansicht wartet auf das bereitgestellte Treppenmodell.'); return; }
    if (Number(response.headers.get('content-length')) > LIMITS.bytes) { fail('Das Modell ist für die sichere 3D-Ansicht zu groß.'); return; }
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > LIMITS.bytes) { fail('Das Modell ist für die sichere 3D-Ansicht zu groß.'); return; }
    const preflight = inspectGLB(buffer); window.modelPreflight = preflight;
    if (preflight.triangles > LIMITS.triangles || preflight.meshInstances > LIMITS.meshes) { fail('Das Modell überschreitet das sichere Detailbudget.'); return; }
    const draco = new DRACOLoader().setDecoderPath('/draco/');
    const loader = new GLTFLoader().setDRACOLoader(draco);
    let gltf;
    try { gltf = await loader.parseAsync(buffer, '/models/'); } finally { draco.dispose(); }
    model = gltf.scene; model.updateMatrixWorld(true);
    const stats = { bytes: buffer.byteLength, triangles: 0, meshes: 0, materials: 0, textures: [], bounds: null, geometryBytes: 0 };
    model.traverse(object => {
      if (!object.isMesh) return;
      stats.meshes++;
      const geometry = object.geometry;
      stats.triangles += (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
      resources.geometries.add(geometry);
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        resources.materials.add(material);
        Object.values(material).forEach(value => { if (value?.isTexture) resources.textures.add(value); });
      });
      object.castShadow = false; object.receiveShadow = false;
    });
    resources.geometries.forEach(geometry => {
      stats.geometryBytes += Object.values(geometry.attributes).reduce((bytes, attribute) => bytes + attribute.array.byteLength, 0) + (geometry.index?.array.byteLength ?? 0);
    });
    stats.materials = resources.materials.size;
    resources.textures.forEach(texture => {
      stats.textures.push({ width: texture.image?.width ?? null, height: texture.image?.height ?? null });
      texture.anisotropy = 2; // Limited grazing-angle detail, no high anisotropy budget.
    });
    const box = new THREE.Box3().setFromObject(model, true);
    const center = box.getCenter(new THREE.Vector3()); const dimensions = box.getSize(new THREE.Vector3());
    stats.bounds = { min: box.min.toArray(), max: box.max.toArray(), center: center.toArray(), dimensions: dimensions.toArray() };
    window.modelReport = stats;
    if (stats.triangles > LIMITS.triangles || stats.meshes > LIMITS.meshes || stats.textures.some(t => Math.max(t.width, t.height) > LIMITS.textureEdge)) { fail('Das Modell überschreitet das sichere Detailbudget.'); return; }
    const diagonal = dimensions.length();
    if (!Number.isFinite(diagonal) || diagonal <= 0) throw Error('Model has no usable bounds');
    // Normalize by the measured diagonal, retaining the source Y-up orientation.
    const group = new THREE.Group(); model.position.sub(center); group.add(model); group.scale.setScalar(1 / diagonal); scene.add(group); scene.updateMatrixWorld(true);
    stats.normalizationScale = 1 / diagonal;
    resources.materials.forEach(material => {
      // Preserve the four source texture sets; soften exaggerated tread normal highlights.
      if (material.normalMap) material.normalScale.setScalar(material.name.startsWith('Steps') ? .5 : .8);
      material.envMapIntensity = material.name.startsWith('Steps') ? .75 : 1;
    });
    renderer = new THREE.WebGLRenderer({ antialias: !mobile.matches, alpha: false, powerPreference: 'low-power' });
    renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = LIGHTING.exposure; renderer.shadowMap.enabled = false;
    container.appendChild(renderer.domElement);
    renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); fail('Die 3D-Ansicht ist nicht verfügbar. Alle Inhalte bleiben zugänglich.'); });
    const pmrem = new THREE.PMREMGenerator(renderer); const room = new RoomEnvironment();
    environment = pmrem.fromScene(room, .04); scene.environment = environment.texture; scene.environmentIntensity = LIGHTING.environment;
    room.dispose(); pmrem.dispose();
    const normalizedBox = new THREE.Box3().setFromObject(model, true); const d = normalizedBox.getSize(new THREE.Vector3());
    const key = new THREE.DirectionalLight('#f4f0e4', LIGHTING.key);
    key.position.set(normalizedBox.min.x - d.x * 3, normalizedBox.max.y + d.y * .25, normalizedBox.max.z + d.z * .7); scene.add(key);
    const rim = new THREE.DirectionalLight('#d0d7d8', LIGHTING.rim);
    rim.position.set(normalizedBox.max.x + d.x * 3, d.y * .25, normalizedBox.min.z - d.z * .5); scene.add(rim);
    scene.add(new THREE.HemisphereLight('#d3d7cc', '#111210', LIGHTING.fill));
    gsap.registerPlugin(ScrollTrigger);
    resize();
    diagnostics.ready = true; state.hidden = true; document.body.classList.add('has-model'); intro.start();
    if (reduced.matches || mobile.matches) finish();
    else {
      timeline = gsap.timeline({ paused: true, onComplete: finish });
      timeline.to(motion, { progress: 0, duration: CAMERA_DIRECTION.openingHold });
      CAMERA_DIRECTION.segments.forEach((duration, index) => timeline.to(motion, { progress: (index + 1) / CAMERA_DIRECTION.segments.length, duration, ease: 'sine.inOut' }));
    }
    scrollTrigger = ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', onUpdate: self => { motion.scroll = reduced.matches || !intro.unlocked ? 0 : self.progress; synchronize(); } });
    observer.observe(hero);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', pointer, { passive: true });
    window.addEventListener('pagehide', pageHide); window.addEventListener('pageshow', synchronize);
    document.addEventListener('visibilitychange', synchronize);
    reduced.addEventListener('change', motionPreference); mobile.addEventListener('change', motionPreference);
    window.addEventListener('homepage-ready', homepageReady);
    if (import.meta.env.DEV) window.cinematicPreview = {
      seek(progress) { previewHeld = true; timeline?.pause(); motion.progress = THREE.MathUtils.clamp(progress, 0, 1); completed = motion.progress === 1; if (completed) awaitingHomepage = true; synchronize(); },
      resume() { previewHeld = false; awaitingHomepage = false; if (!completed) timeline?.resume(); synchronize(); },
    };
    console.info('Measured staircase GLB:', stats);
    synchronize();
  } catch (error) { fail('Die 3D-Ansicht ist nicht verfügbar. Alle Inhalte bleiben zugänglich.', error); }
  return dispose;
}
