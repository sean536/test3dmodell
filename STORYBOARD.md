# FORMWERK fictional company presentation

This is demo copy, not verified company history, clients or business statistics. The supplied “26 JAHRE” is retained as fictional script text; it is not calculated from the current date. Named references have no external links and carry a visible fictional-reference disclaimer. No reference video was available in this workspace; composition follows the supplied written storyboard.

## Timing, features and copy

Times begin after asset readiness. The first 0.6 seconds are staircase-only. Camera travel uses continuous centripetal position/target curves and power2 acceleration/deceleration; the model never moves. Captions reveal only during stationary holds, fade over 0.22 seconds and begin disappearing 0.35 seconds before travel. A travel-state guard immediately hides residual captions if a slow renderer skips a fade frame.

| Destination | Travel | Hold | Actual feature / text |
| --- | --- | --- | --- |
| Introduction | — | 0–2.80 s | Whole measured assembly; FORMWERK / METALLBAU · FORM · DESIGN, from 0.60 s |
| Precision | 2.80–5.20 s | 5.20–7.50 s | Nearest real upper-flight steel junction vertex, `Cube112_StairBody_0`; 01 — PRÄZISION / 55.000+ GEOMETRISCHE ELEMENTE AUF EIN SYSTEM REDUZIERT. / Planung · Konstruktion · Fertigung |
| Experience | 7.50–9.15 s | 9.15–11.00 s | Ascending along measured upper-flight treads, `Cube112_Steps_0`; 02 — ERFAHRUNG / SEIT 1998 / 26 JAHRE / METALL · FORM · KONSTRUKTION |
| Projects | 11.00–12.40 s | 12.40–15.45 s | Real `Cube111_StairBodyPlat_0` landing; 03 — PROJEKTE / 240+ REALISIERTE PROJEKTE / BERLIN · MÜNCHEN · ZÜRICH / SELECTED REFERENCES — DEMO: VITRA CAMPUS EXTENSION, SOHO HOUSE BERLIN, NATIONALGALERIE — SPECIAL STRUCTURE, ETH ZÜRICH PAVILION |
| Material | 15.45–17.20 s | 17.20–19.40 s | Actual transformed landing-frame steel vertex; 04 — MATERIAL / STAHL / EDELSTAHL / ALUMINIUM / MATERIAL IST NICHT OBERFLÄCHE. MATERIAL IST STRUKTUR. |
| Homepage | 19.40–22.10 s | Final still | Diagonal withdrawal to bounds-fitted complete assembly; FORMWERK, METALLBAU / FORM / DESIGN, ARCHITEKTUR BEGINNT MIT STRUKTUR., PROJEKT ANFRAGEN →; existing navigation |

Narrative text intervals: 0.60–2.45, 5.30–7.15, 9.25–10.65, 12.50–15.10, 17.30–19.05 seconds (followed by the 0.22-second fade). Identity begins at 22.10; navigation begins at 22.75; services/CTA at 23.00; interaction unlock at 24.00 seconds. Loading, hidden-tab pauses and constrained-device frame delays are excluded from nominal timings.

## Measured camera destinations

These are normalized scene coordinates for a 1440×900 viewport, not source units or meters. Scale remains reciprocal of the actual model diagonal. The route's smooth exterior-plane constraint may adjust X by a negligible amount near a detail. Final position is fitted again on resize using bounds, FOV and aspect ratio.

| Destination | Position X, Y, Z | Look target X, Y, Z |
| --- | --- | --- |
| Introduction | −1.026510, 0.252873, 1.207659 | 0, 0, 0 |
| Precision | −0.085651, 0.159075, 0.137220 | −0.074412, 0.157576, 0.129167 |
| Experience | −0.108670, 0.296615, −0.089166 | −0.037130, 0.258821, −0.103718 |
| Projects | −0.186975, 0.167589, 0.277864 | 0.000268, 0.116354, 0.180594 |
| Material | −0.083568, 0.125178, 0.219482 | −0.073827, 0.124054, 0.216110 |
| Homepage | −0.916527, 0.194088, 1.078267 | 0, 0, 0 |

The final frame remains on the same canvas and camera. Desktop view offset reserves left-side space for the identity; no scene change or black fade occurs.

## Interaction and performance

Existing initial HTML scroll lock, fixed body, hidden lower sections, body inert and capture-phase input guards remain active through all narrative stops and the 1.9-second homepage reveal. Only the final ready state restores scrolling, links, menu, CTA and website sections. Captions are noninteractive. Reduced motion bypasses the film and reveals the final composition immediately; mobile retains the existing still fallback and short UI reveal. Failure paths unlock the accessible website.

GLB bytes, textures, normalization and light rig are unchanged. No scene geometry, texture resolution, post-processing or extra render loop was added. Existing DPR ≤1.5, visibility pause, idle rendering and disposal remain. Approximately 58.7 MiB of textures plus 3.1 MiB of geometry and double-sided fragment cost remain; macro shots expose the existing 1K texture limits. Cloud software rendering is not hardware performance evidence.

## Verification

Existing syntax checks, explicit syntax checks for story/camera/intro modules and production build pass. The existing scene-chunk warning remains (about 643 kB minified, 174 kB gzip). Geometry checks sampled 512 route segments against actual model triangles at desktop/intermediate/portrait aspects, checked exterior-plane clearance and opening/final framing. Native Chromium verified the natural stop sequence, stationary caption positions, locked scroll/navigation/contact, final unlock and CTA focus restoration, mobile navigation/overflow and reduced motion. Screenshots and measured destinations are stored in `/workspace/evidence/story-*`.

Changed implementation files: `index.html`, `src/main.js`, `src/style.css`, `src/scene.js`, `src/camera-path.js`, new `src/story.js`. Documentation: `README.md`, `MODEL_REPORT.md`, this file. Lower website sections retain their structure and content apart from the requested company-name/footer branding.
