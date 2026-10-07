# Staircase model inspection and cinematic integration

Inspected the optimized attachment **before** changing the film. The copied GLB is byte-identical to the attachment.

## Asset

| Property | Measured result |
| --- | --- |
| File size | 13,278,640 bytes / 12.66 MiB |
| Default scenes | 1 (`Sketchfab_Scene`) |
| Nodes | 14: six transform/group nodes and eight mesh nodes |
| Meshes / primitives | 8 / 8 |
| Triangles | 55,128 |
| Vertices | 54,898 |
| Materials | 4: StairBodyPlat, StepsPlat, StairBody, Steps |
| Texture/image count | 11 / 11, embedded; four JPEG base-color maps, four PNG metallic/roughness maps, three PNG normal maps |
| Image resolutions | Every image is 1024 × 1024 |
| Required extensions | None; no Draco/KTX2 decoder needed by this asset |
| Source world bounds min | (-0.421660, -11.287873, -7.488329) |
| Source world bounds max | (2.714843, 7.279135, 1.634622) |
| Dimensions X/Y/Z | 3.136503 × 18.567009 × 9.122951 source scene units |
| Center | (1.146592, -2.004369, -2.926854) |
| Source/world orientation | Mesh data is Z-up; export transforms produce Y-up. Local +Z → world +Y; local +Y → world −Z; X preserved. No extra rotation applied. |
| Runtime normalization | Reciprocal of measured diagonal ≈ 0.04779278; source hierarchy orientation preserved |

Do not assume source units are certified meters; the GLB does not declare that physical measurement. Export hierarchy has compensating 0.01/100 scales and ±90° rotations. Precise bounds were computed from transformed vertices, not untransformed accessor boxes.

## Hierarchy

```text
Sketchfab_Scene
└─ Sketchfab_model
   └─ ae43f9e019e54fe19b683b58dad275d6.fbx
      └─ RootNode
         ├─ Cube.111
         │  ├─ Cube.111_StairBodyPlat_0       295 triangles
         │  └─ Cube.111_StepsPlat_0         2,378
         ├─ Cube.112
         │  ├─ Cube.112_StairBody_0         1,488
         │  └─ Cube.112_Steps_0            10,290
         └─ Cube.109
            ├─ Cube.109_StairBodyPlat_0       587
            ├─ Cube.109_StepsPlat_0         4,756
            ├─ Cube.109_StairBody_0         4,464
            └─ Cube.109_Steps_0            30,870
```

This is a tall assembly of four stair flights with landing/railing frames, not a solid building shell. Eight draw calls in the full reveal; close shots correctly cull some meshes.

## Cost and duplication

Geometry attributes and 32-bit indices total **3,269,504 bytes (~3.12 MiB)**. Eleven RGBA8 texture uploads with full mip chains cost approximately **61,516,456 bytes (~58.67 MiB)**. Combined asset GPU buffer/texture estimate: **~61.79 MiB**, before environment, framebuffers, antialiasing, driver overhead or transient loading allocations. CPU decode may retain encoded bytes plus roughly 44 MiB of decoded RGBA pixels and geometry.

No exact duplicate complete geometries or encoded images were found. Decoded thumbnail comparisons also differ. Four distinct texture/material sets are already shared by the eight meshes. Repeated stairs and rails are intentional modular construction; deleting them would change the supplied architecture. No merge or asset rewrite was necessary. Original double-sided materials are retained so the close sequence does not lose thin surfaces; this increases fragment work.

## Camera and light changes

`src/camera-path.js` replaces the five provisional box-fraction shots with seven measured waypoints and two continuous centripetal Catmull–Rom curves (position and look target). It identifies the actual upper-flight frame and tread meshes by name and measures their transformed bounds. It chooses an actual rail-junction vertex near the foot of that flight:

**(-0.410371, 1.292703, -0.224200)** in original source world coordinates.

The opening camera sits close outside that junction, looking across the post and diagonal steel with the tread pattern behind it. It moves diagonally upward beside the flight: railing members cross the foreground while the opposite rail and treads separate in depth. It then rises alongside the upper end, withdraws from the landing, and reveals the whole assembly from an oblique architectural view. Six eased traversals plus an opening hold total **37.7 seconds**. There are no scene swaps, model rotations, OrbitControls or black fades.

All positions/targets derive from the real frame/tread/assembly bounds or the real junction vertex. Full reveal distance is fitted to projected bounding-box corners, field of view and aspect ratio. Near plane derives from rail clearance and model diagonal; far plane includes the reveal distance and full model depth. A 512-sample route check found **≥0.1455 source units** of clearance outside the assembly's leftmost X plane, so the camera cannot enter the steel at those samples. This conservative plane bound is stronger than only checking the selected flight; it is not an exhaustive continuous triangle collision proof.

Desktop framing moves gently right as the camera withdraws, leaving the existing title on the left. Title returns during the last 14% of travel. Scrolling reveals the unchanged website while adding a restrained vertical camera offset during withdrawal. Mouse influence is capped and begins after completion. The skip control traverses the remaining curve in two seconds rather than jumping. Portrait mobile/reduced-motion fallback shows the full assembly above the title; it renders on demand instead of continuously.

`src/scene.js` owns loading, measured normalization, renderer, light rig, animation, scroll, lifecycle and diagnostics. `CAMERA_DIRECTION` in `src/camera-path.js` controls route proportions, framing and segment timing. `LIGHTING` in `src/scene.js` controls exposure and intensities.

Two directional lights placed relative to the measured model bounds provide a neutral warm key and restrained cool rim. Hemisphere fill and a small generated room environment retain dark steel structure while supplying metal reflections. Source color/metal/roughness maps are preserved; tread normal-map strength is reduced to 0.5, frame normal maps to 0.8, to control harsh highlight noise. No real-time shadows or post-processing.

## Safeguards and validation

DPR ≤1.5; one application render loop; tab/hero visibility pause; static mobile/reduced-motion fallback; idle rendering stops after the desktop reveal; resource disposal and context-loss fallback; bounded anisotropy; complexity guards and slow-render fallback. Scene imports remain lazy. The film continues within the existing site architecture; only model attribution is added to the footer.

Validation evidence lives in `/workspace/evidence/staircase/`. Static syntax and production build pass. Chromium checks exercise real loading, live camera travel, selected shot compositions, responsive reveal, tab/offscreen pause and static fallback/resize. Additional geometry checks tested 256 camera-route segments against the actual triangles at 1440/900, 768/900 and 375/900 aspect ratios: no intersections, all eight assembly bounding-box corners inside the reveal frustum, and valid bounds-derived near/far planes. Browser checks also verify two-second skip completion, idle desktop rendering stops, pointer composition retention and runtime reduced-motion changes.

Browser uses the cloud's software graphics path: submission-time diagnostics are **not** hardware GPU profiling or proof of smooth MacBook performance.

Remaining performance risks: ~59 MiB texture residency, high-DPR antialiased framebuffer cost, double-sided fragment work, first-load JPEG/PNG decode/shader compilation, visible 1K texture softness in macro shots. No unsafe shader or high-resolution HDRI was added. Real MacBook/mobile hardware profiling remains needed. Vite retains its >500 kB scene-chunk warning (~711 kB uncompressed / ~200 kB gzip).

## Attribution

The asset's metadata credits **brandon_grey** and **CC BY 4.0**. See `public/models/ATTRIBUTION.txt` for source, license and presentation modifications. No model geometry or texture files were replaced.
