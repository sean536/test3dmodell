# FORM / WERK

A German-language editorial website for a fictional metal construction and design studio. HTML, CSS, vanilla JavaScript, Three.js and GSAP. No application framework or backend.

## Run

Node.js 22.12+ or 24 is supported by the pinned Vite version.

```sh
npm ci --cache /workspace/.npm-cache
npm run check
npm run dev -- --port 5173
```

Build: `npm run build`. Serve the production build: `npm run preview -- --port 4173`.

## Supplied staircase

The actual optimized GLB is installed at `public/models/staircase_modular_frame_-_steel.glb`. It is 12.66 MiB, with eight meshes and 55,128 triangles. Detailed hierarchy, bounds, original orientation, textures, GPU estimates, camera design and verification are in [MODEL_REPORT.md](MODEL_REPORT.md).

Inspect before previewing a replacement asset:

```sh
node tools/inspect-model.mjs public/models/staircase_modular_frame_-_steel.glb
```

The metadata preflight reports local accessor bounds. Transformed world bounds and image resolutions are measured after loading as `window.modelReport`. `window.cinematicDiagnostics` exposes passive camera/render diagnostics. During development only, `window.cinematicPreview.seek(0..1)` holds a chosen shot for inspection; `resume()` resumes the film.

## Structure

- `index.html`: navigation, hero, statement, projects, process, material, workshop, contact and inquiry dialog.
- `src/style.css`: graphite/off-white design tokens, editorial layouts, responsive styles, focus and reduced motion.
- `src/main.js`: accessible menu, category selection, inquiry text-file download, lazy scene import.
- `src/model-inspection.js`: GLB header and JSON complexity inspection before decoding.
- `src/scene.js`: loading, measured world bounds, normalization, lighting, GSAP sequence, scroll influence and cleanup.
- `src/camera-path.js`: real geometry landmarks, camera/target curves, clearance, framing and timing.
- `public/draco/`: decoders copied from the pinned Three.js package (its MIT license applies).
- `tools/inspect-model.mjs`: offline metadata report.

Project, material and workshop visual fields are explicitly labeled placeholders. No client work, workshop photography or business contact information has been invented. The contact dialog downloads a draft locally; it does not send email or submit to a backend. Configure a real recipient/backend before production use.

## Model, camera and lighting

See [MODEL_REPORT.md](MODEL_REPORT.md) for the complete design. `src/camera-path.js` measures the real upper frame and treads, selects a real steel junction vertex, builds a close diagonal flight-side route, and fits the full assembly reveal. Adjust `CAMERA_DIRECTION` for route proportions and sequence timing; adjust `LIGHTING` in `src/scene.js` for lighting/exposure. The source orientation and four material texture sets are retained. No model rotation or orbit controls are used.

The 37.7-second film uses a continuous camera and target spline. Typography returns during withdrawal; ordinary scroll reveals the existing content while retaining restrained camera influence. Mobile/reduced-motion users see a static full reveal. Idle and hidden/offscreen rendering stop; DPR stays at or below 1.5. No real-time shadows, post-processing, particles or HDRI downloads.

## Validation and risks

Build and syntax checks pass. Actual GLB, desktop camera movement, responsive framing, visibility pause and still-mode resize are checked in Chromium. See the model report and `/workspace/evidence/staircase/` for evidence. Cloud software graphics verification does not establish hardware frame rate. Texture residency is approximately 58.7 MiB plus 3.1 MiB geometry, before renderer/driver/framebuffer overhead; real-device profiling remains needed. Vite reports the existing large scene-chunk warning.

The source asset is attributed to brandon_grey under CC BY 4.0. See `public/models/ATTRIBUTION.txt` and the footer attribution link. Project/workshop photography remains explicitly labeled placeholders; the inquiry downloads a local draft and does not send mail.
