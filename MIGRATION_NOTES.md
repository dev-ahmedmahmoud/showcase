# Migration / Performance / Stability Notes

Started: 2026-10-11. Working log for: upgrading deps to latest, fixing crash / slow-load causes,
improving performance without hurting visual quality.

**Golden rule:** never guess, never assume, verify in code (incl. library source in `node_modules`)
before acting. No false alarms, no over-engineering.

> If context is lost: read this whole file first. "Status" section says what is done / next.

---

## 0. Status

| # | Item | Status |
|---|------|--------|
| 1 | Codebase scan (all source files read) | DONE |
| 2 | Baseline: `npm ci`, `next build`, `eslint` | DONE (build OK, lint 20 err / 13 warn) |
| 3 | Baseline runtime measurement (headless Chrome: bytes, load time, screenshots) | DONE (see F8-F10, baseline table) |
| 4 | Dependency upgrade | DONE (C1) |
| 5 | Code fixes | DONE: C2 shadows, C3 video, C4 clone/preload/pc_chair, C6 lint, C7 docs |
| 6 | Asset optimization (GLB) | DONE (C5) |
| 7 | Re-measure + visual compare + full E2E vs original | DONE (§6: 43/43, original 41/43) |
| 8 | Nothing committed yet — all changes are in the working tree | awaiting owner review |

---

## 1. Environment facts (verified)

- Node v26.3.0, npm 11.16.0 (local machine).
- `node_modules` was absent at start; installed with `npm ci` from existing lockfile.
- There is a stray `/Users/ahmedmahmoud/package-lock.json` (91 bytes, `{}` package.json in home dir).
  Next.js 16 picks the **home dir** as workspace root because of it and prints:
  `Next.js inferred your workspace root, but it may not be correct ... selected the directory of /Users/ahmedmahmoud/package-lock.json`.
- Installed versions at baseline (from lockfile): next 16.1.7, react 19.2.0, three 0.181.0,
  @react-three/fiber 9.4.0, drei 10.7.6, xr 6.6.27, gsap 3.13.0, eslint 9.39.0, typescript 5.9.3,
  tailwindcss 4.1.16, eslint-config-next 16.0.1.

## 2. Latest versions on npm (checked 2026-10-11 via `npm view`)

| package | current range | latest | decision |
|---|---|---|---|
| next | `16.1` (exact → 16.1.7) | 16.4.0 | upgrade (security, see §3) |
| react / react-dom | `19.2.0` exact | 19.3.0 | upgrade (fiber 9.8.1 peer: `>=19 <19.4` ✓) |
| @react-three/fiber | ^9.4.0 | 9.8.1 | upgrade |
| @react-three/drei | ^10.7.6 | 10.7.9 | upgrade |
| @react-three/xr | ^6.6.27 | 6.6.31 | upgrade |
| three / @types/three | ^0.181.0 | 0.186.1 / 0.186.0 | upgrade |
| gsap | ^3.13.0 | 3.15.0 | upgrade |
| three-pathfinding | ^1.3.0 | 1.3.0 | **REMOVE** – never imported (grep of app/ components/ = 0 hits) |
| eslint | ^9 | 10.12.0 | **stay on 9 (9.39.5)** – eslint-config-next 16.4.0 depends on eslint-plugin-react 7.37.5 (peer `eslint ^9.7` max), eslint-plugin-import 2.32.0 (peer max ^9), eslint-plugin-jsx-a11y 6.10.2 (peer max ^9). ESLint 10 would be a peer conflict. |
| eslint-config-next | 16.0.1 | 16.4.0 | upgrade (match next) |
| typescript | ^5 | 7.0.2 | **use 6.0.3, not 7** – TS 7 package `main` exports only `./lib/version.cjs` (no classic compiler API), and typescript-eslint 8.71.1 peer is `typescript >=4.8.4 <6.1.0`. |
| tailwindcss / @tailwindcss/postcss | ^4 | 4.3.3 | upgrade within ^4 |
| @types/node | ^20 | 26.6.5 | TBD (types only) |
| @types/react / -dom | ^19 | 19.3.0 | upgrade within ^19 |

## 3. Findings (all verified; file:line refs are pre-change)

### F1 — CRITICAL security: Next.js 16.1.7
`npm audit --omit=dev` → `next 9.3.4-canary.0 - 16.3.7  Severity: critical` (DoS in Server Components,
middleware bypasses, RCE in Image Optimization w/ AVIF, SSRF, cache poisoning…). Fix: next 16.4.0.
`package.json` pinned `"next": "16.1"` so it could never pick up patches.

### F2 — Load time: 84.5 MB of GLB models, geometry uncompressed
Measured with `@gltf-transform/core` script (scratchpad `tools/summary.mjs`):

```
file                  MB    nodes meshes tris    texN maxRes texMB gpuMB(est RGBA8+mips) exts
bed.glb               5.93  17    8      106222  2    1024   1.99  5.6
character.glb         1.57  92    9      23638   15   1024   0.25  36.5   (3 anims)
controller1.glb       3.77  143   69     111676  6    1024   0.41  33.5
controller2.glb       1.34  11    7      20649   18   1024   0.92  100.6  KHR_mesh_quantization
controller3.glb       6.66  10    5      352584  4    1024   0.13  22.4   KHR_mesh_quantization
controller4.glb       6.19  3     1      51216   1    8192   4.62  178.9  KHR_materials_unlit
couch.glb             4.23  5     1      7136    3    1024   3.91  16.8
desk.glb              6.11  6     4      8852    16   1024   5.58  89.5
headset1.glb          3.92  11    7      112400  0    -      0     0
headset2.glb          4.51  22    10     146006  0    -      0     0
meta.glb              6.68  5     1      76260   3    1024   1.57  16.8
monitor.glb           3.48  34    17     33405   1    4096   2.41  22.4
pc.glb                4.89  10    6      378700  0    -      0     0      KHR_mesh_quantization
pc_chair.glb          1.17  32    15     21142   34   1024   0.72  190.1  (NOT RENDERED, see F4)
pegboard.glb          2.68  5     1      73530   0    -      0     0
phone.glb             0.18  9     5      3524    0
playstation_lamp.glb  2.68  3     1      3236    2    4096   2.55  178.9
ps5.glb               2.63  19    7      162490  4    1024   0.10  22.4
ps_lamp.glb           0.17  9     5      2538    0
ps_portal.glb         1.78  1     1      63754   1    1024   0.07  5.6
purifier.glb          5.74  6     2      166940  1    1024   0.44  5.6
speaker.glb           0.49  27    16     14136   1    4096   0.01  89.5
sweeper.glb           0.20  20    11     2775    0
table.glb             0.51  16    6      14364   0
tv.glb                0.04  6     2      510     0
tv_unit.glb           2.11  11    4      41996   0
vr.glb                2.54  1     1      88648   1    1024   0.09  5.6
wall_display.glb      2.29  7     2      636     4    1024   2.21  22.4
TOTAL file 84.5 MB, texture bytes 28.0 MB, est. texture VRAM ~1043 MB
```
- ~56 MB of the 84.5 MB is raw float32 vertex data. No file uses `EXT_meshopt_compression` / Draco.
- drei `useGLTF` already registers `MeshoptDecoder` by default (`node_modules/@react-three/drei/core/Gltf.js:21-22`,
  decoder WASM is embedded in `three-stdlib/libs/MeshoptDecoder.js`, no CDN). three-stdlib GLTFLoader supports
  `EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp` (`three-stdlib/loaders/GLTFLoader.js:253-259`).
  → Meshopt-compressed GLBs load with **zero code changes**.

### F3 — Probable crash cause on mobile / Quest: texture VRAM
Estimated ~1 GB of texture VRAM (sum above; pc_chair's 190 MB is decoded but never uploaded since it isn't rendered).
Single textures at 8192² (controller4 — a small controller hung on the pegboard at scale 1.8) and 4096²
(playstation_lamp at scale 0.065, speaker, monitor). One 8192² RGBA8 texture with mips ≈ 358 MB / 2 (see table) —
far beyond what tiny on-screen objects can display.

### F4 — `pc_chair.glb` downloaded but never rendered
`components/SceneCanvas/Room/UI/PcSetup.tsx:65` `const pcChair = useGLTF("/models/pc_chair.glb");` —
`pcChair` is never used (eslint `no-unused-vars` confirms). Costs 1.17 MB download + decoding 34 textures,
and blocks the Room Suspense boundary until loaded.

### F5 — Every re-render re-clones every GLB scene
All furniture uses `<primitive object={x.scene.clone()} />` inline in JSX (PcSetup, PS5Setup, PhoneOnTable,
Portrait, RoomFurnish, Pegboards). R3F 9 reconciler (`node_modules/@react-three/fiber/dist/events-f8cd670d.esm.js:1596`):
`if (instance.type === 'primitive' && oldProps.object !== newProps.object) reconstruct = true;` → old object removed,
new deep clone added (`swapInstances`, same file 1488-1552). Re-renders are frequent:
- `SceneContent` (SceneCanvas/index.tsx:32) consumes `useScene()`; SceneProvider value object is recreated on every
  state change (SceneContext.tsx:55) → every floor click / avatar start / avatar stop / hotspot change re-renders
  SceneContent → Room → RoomContent → all children (none memoized) → **all ~40 primitives re-cloned**, incl.
  Pegboards (15 clones, ~1.5 M triangles of node hierarchy).
- Hover on monitor/TV/phone/portrait sets local state → that component's models are re-cloned on every hover in/out.
Causes CPU spikes / hitches on interaction. Fix: memoize clones (`useMemo(() => gltf.scene.clone(), [gltf.scene])`).

### F6 — Unused dependency `three-pathfinding`
Declared in package.json, never imported.

### F7 — Lint baseline (eslint-config-next 16.0.1): 20 errors, 13 warnings
- `components/utils/useVideoTexture.ts` — 14× `react-hooks/refs` (refs read/written during render).
- `Avatar.tsx:105`, `PathDebugger.tsx:86`, `SceneContext.tsx:37` — `react-hooks/set-state-in-effect`.
- `Loader.tsx:8` — `react-hooks/purity` (`Date.now()` in `useRef` initializer).
- `helperFunc.ts:32` — `no-explicit-any`.
- `inspect-fbx.js` — 2× `no-require-imports` (also: script points to `public/models/character/mesh.fbx`, which does not exist).
- warnings: unused vars/imports (Avatar `Group`, index `forwardRef`, PcSetup `pcChair`/`focusedHotspot`, Portrait `e`×3,
  helperFunc `platform`×2, useVideoTexture `texture`), `no-unused-expressions` ×2 (`!isPresenting && completeTourStep(...)`),
  `exhaustive-deps` Avatar:109.
- `next build` passes (TypeScript OK).

### F8 — Suspense load WATERFALL (biggest "delayed loading" cause in code)
Baseline network timeline (headless Chrome, localhost, `next start`, cache disabled; scratchpad `tools/profile.mjs`,
output `profile-baseline-2.txt`). Request start times (ms):
```
character.glb 320 (the only preloaded asset: Avatar.tsx:190 useGLTF.preload)
floor textures 1416 → monitor/pegboard/wall_display/... 1446-1484 → controller1 1707 → tv/phone/speaker/desk/bed 2017-2068
→ controller2 2145 → ps5 2363 → vr/controller3 2925 → pc 3052 → purifier 3074 → meta 3639 → controller4 3884
→ couch 3994 → pc_chair 4382 → pc_display.png 4906 → ps_portal 5565 → headset1 5726 → headset2 6066 (done 6726)
```
Requests are issued in sequential batches: with React 19 a suspending component stops rendering of its siblings, so
each component's `useGLTF` is only called after the previous component's assets resolve. On localhost this is ~6.7 s;
on a real network each step adds RTT + bandwidth sequencing. Fix: module-level `useGLTF.preload(...)` /
`useTexture.preload(...)` so every request starts at module evaluation. Cache key compatibility verified:
`useLoader` key = `[loader, ...urls]` (`fiber/dist/events-f8cd670d.esm.js:1236-1249`), drei `useGLTF.preload` passes
the same loader (`drei/core/Gltf.js:26-27`), `useTexture` with object input uses `Object.values(input)`
(`drei/core/Texture.js:9`) → preload must pass the same URL array in the same order.

### F9 — ~139 duplicate video downloads during load (useVideoTexture creates <video> in render)
Same timeline: `/phone.mp4` requested **67×**, `/project1.mp4` **72×** before the loader disappears.
`useVideoTexture.ts:17-30` creates `document.createElement("video")` + `src` during render, guarded only by refs.
`PhoneOnTable` and `Portrait` are inside the suspending Room tree; every suspended retry render is discarded by
React (refs of a never-committed component are not kept) → a fresh `<video>` with `src` is created per retry and the
browser starts downloading it. Those orphan elements are never paused/released. This is exactly what the
`react-hooks/refs` lint errors flag. Fix: create video/texture in an effect (commit phase only).

### F10 — 4.5 s main-thread long task after downloads finish
Long-task observer: one task of 4521-4897 ms right after the last GLB lands (then loader disappears). That's the
first render uploading/compiling everything (~1 GB est. texture VRAM, F3). Mitigated by F3 fix (texture caps).

### Baseline numbers (before any change)
| run | loader gone | transferred | requests | fps (desktop GPU) | JS heap |
|---|---|---|---|---|---|
| 1st (cold disk) | 41.2 s | 78.3 MB | 211 | 60 | 190 MB |
| 2nd | 11.8 s | – | – | – | – |
| 3rd | 11.3 s | – | – | – | – |
Screenshot: scratchpad `shots/baseline-default-view.png`. Renderer: ANGLE Metal, AMD Radeon Pro 5300M. No console errors.
(Transfer < file sizes because `next start` gzips responses.)

### Noted, intentionally NOT changed (would alter look/behaviour, or not a verified problem)
- `rectAreaLight` used 5× but `RectAreaLightUniformsLib.init()` is never called (grep: 0 hits in app/components/drei).
  three's WebGLLights reads `UniformsLib.LTC_FLOAT_1` (`three/src/renderers/webgl/WebGLLights.js:407`) which is only
  populated by that init. Changing it would change the scene's lighting → left as is (author's call).
- `castShadow` on `<primitive>` only sets the root Object3D flag, not child meshes (three checks per-mesh), so those
  props have no effect; only the avatar meshes cast shadows (Avatar.tsx:36-41). Not a cost, left as is.
- Pathfinding recursion (`findAllPaths`) is bounded (candidates are pre-validated so recursion mostly terminates at
  depth+1; fallback only at depth<2). Runs once per click. Not a verified perf problem.
- Unused public files (`hands.fbx`, `character_mixamo_fixed.fbx`, `textures/ceiling/*`, `phone.png`, default svgs)
  are never requested by the client → no runtime cost. Left in place (owner's assets).

---

## 4. Change log (every line added / removed)

### C1 — Dependency upgrade (`package.json`, `package-lock.json`)
`package.json` diff (original saved at scratchpad `package.json.orig`):
```
- "@react-three/drei": "^10.7.6",      + "@react-three/drei": "^10.7.9",
- "@react-three/fiber": "^9.4.0",      + "@react-three/fiber": "^9.8.1",
- "@react-three/xr": "^6.6.27",        + "@react-three/xr": "^6.6.31",
- "gsap": "^3.13.0",                   + "gsap": "^3.15.0",
- "next": "16.1",                      + "next": "^16.4.0",
- "react": "19.2.0",                   + "react": "^19.3.0",
- "react-dom": "19.2.0",               + "react-dom": "^19.3.0",
- "three": "^0.181.0",                 + "three": "^0.186.1",
- "three-pathfinding": "^1.3.0",       (removed – unused, F6)
- "@tailwindcss/postcss": "^4",        + "@tailwindcss/postcss": "^4.3.3",
- "@types/node": "^20",                + "@types/node": "^24",   (Node 20 is EOL; 24 = current LTS line; types only)
- "@types/react": "^19",               + "@types/react": "^19.3.0",
- "@types/react-dom": "^19",           + "@types/react-dom": "^19.3.0",
- "@types/three": "^0.181.0",          + "@types/three": "^0.186.0",
- "eslint": "^9",                      + "eslint": "^9.39.5",
- "eslint-config-next": "16.0.1",      + "eslint-config-next": "^16.4.0",
- "tailwindcss": "^4",                 + "tailwindcss": "^4.3.3",
- "typescript": "^5"                   + "typescript": "~6.0.3"  (not 7, see §2)
```
Commands: `npm install`, `npm audit fix` (non-breaking only), `npm update three-stdlib` (2.36.0 → 2.36.1, transitive of drei).
Installed result: next 16.4.0, react/react-dom 19.3.0, three 0.186.1, fiber 9.8.1, drei 10.7.9, xr 6.6.31,
gsap 3.15.0, eslint 9.39.5, typescript 6.0.3, tailwindcss 4.3.3, eslint-config-next 16.4.0, three-stdlib 2.36.1.

Verification:
- `npm audit --omit=dev` → **0 vulnerabilities** (was: critical next + moderate fflate + others).
- `npm audit` (incl. dev) → 5 high, all in dev-only lint chain `eslint-config-next → @next/eslint-plugin-next →
  fast-glob → micromatch → braces`; npm's only "fix" is downgrading to eslint-config-next 14 → not applied.
- `next build` ✓ (Next 16.4.0, TS 6.0.3). Next 16.4 now *ignores* the stray `~/package-lock.json`
  ("outside the current Git repository") → the planned `turbopack.root` config change is **not needed**; not done.
- `eslint`: identical issue set as baseline (no new rules firing).
- Runtime (headless Chrome, `next start`): renders identically to baseline (`shots/upgrade-only.png`), 60 fps,
  loader gone 31.8 s (cold first run) / 11.4 s / 9.7 s (warm). Transfer ~70-72 MB, ~200-209 requests.
- New console warnings, both emitted from **R3F 9.8.1 internals** with three 0.186:
  - `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` — `fiber/dist/events-*.esm.js:1054`
    `clock: new THREE.Clock()`. Not app code → cannot fix without patching fiber; harmless.
  - `THREE.WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead.` — fiber sets
    `PCFSoftShadowMap` for `<Canvas shadows>` (`events-*.esm.js:1582-1591`); three falls back
    (`three/src/renderers/webgl/WebGLShadowMap.js:101`). Fixed in C2 by asking for PCF explicitly (same result, no warning).
- Measurement note: first run after a build is "cold" (30-40 s); compare warm runs.

### C2 — `components/SceneCanvas/index.tsx`
```
- import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
+ import { useState, useEffect, useCallback, useRef } from "react";        (forwardRef unused – lint warning)
-        shadows
+        shadows="percentage"
```
Why: R3F maps `shadows` (boolean) → `PCFSoftShadowMap`, which three 0.186 removed and silently replaces with
`PCFShadowMap` + console warning. `"percentage"` → `PCFShadowMap` (fiber `events-9ce18a08.esm.js` types map) =
exactly what three already rendered, without the warning. Verified: warning gone in E2E console capture.

### C3 — Video textures created in commit phase (fixes F9)
`components/utils/useVideoTexture.ts` — rewritten (full new file):
- old: created `<video>` + `VideoTexture` during render behind refs (`if (!videoRef.current || lastSourceRef.current !== source)`),
  disposed textures during render, never released old video elements, returned `{video, texture}` non-null.
- new: `useEffect([source])` creates `<video>` (muted, crossOrigin anonymous, loop, playsInline, src) +
  `new VideoTexture(video)`, calls `play()`, and on `loadeddata` does `setHandle({source, video, texture})`.
  Effect cleanup: removes listener; if that handle was never displayed → `release()` immediately.
  Second effect `[handle]`: cleanup releases the previously displayed handle *after* its replacement is committed
  (or on unmount). `release()` = `pause()`, `texture.dispose()` (also cancels rVFC – verified in
  `three/src/textures/VideoTexture.js dispose()`), `removeAttribute("src")`, `load()` (frees the media resource).
  Return type now `VideoTextureHandle | null` (`{source, texture, video}`), exported interface.
  Side benefit: the previous slide stays on screen until the next one has a frame (no black flash).
- Why mesh is conditionally rendered instead of `map={null}`: R3F never sets `material.needsUpdate`
  (only `needsUpdate` in fiber is for shadowMap), three only recompiles a program on specific changes, so a
  null→texture `map` would never show (USE_MAP define missing). Verified by grep in fiber + WebGLRenderer.

`components/SceneCanvas/Room/UI/Portrait.tsx`:
```
-  const videoRef = useRef<HTMLVideoElement | null>(null);
-  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
-  const { texture: videoTexture, video } = useVideoTexture(currentSlide);
-  useEffect(() => { …pause previous video, track videoRef… }, [video]);
-  useEffect(() => { …clearTimeout, read videoRef, wait loadedmetadata or poll every 100 ms
-                    (untracked setTimeout retry), setTimeout(next slide, duration)… }, [currentIndex]);
+  const videoHandle = useVideoTexture(currentSlide);
+  const videoTexture = videoHandle?.texture;
+  // Auto-slide functionality based on video duration
+  useEffect(() => {
+    if (!videoHandle || videoHandle.source !== currentSlide) return;   // only time the slide on screen
+    const duration = videoHandle.video.duration;                        // known: handle exists after loadeddata
+    if (!Number.isFinite(duration)) return;
+    const timer = setTimeout(() => setCurrentIndex((prev) => (prev + 1) % PROJECT_VIDEOS.length), duration * 1000);
+    return () => clearTimeout(timer);
+  }, [videoHandle, currentSlide]);
```
(pausing the old video is now done by the hook's release.)

`components/SceneCanvas/Room/UI/PhoneOnTable.tsx`:
```
-  const { texture: videoTexture } = useVideoTexture("/phone.mp4");
+  const videoTexture = useVideoTexture("/phone.mp4")?.texture;
-        <mesh position={[0.005, -0.01, 0.0115]} …> … </mesh>
+        {videoTexture && ( <mesh position={[0.005, -0.01, 0.0115]} …> … </mesh> )}   (same mesh/material, wrapped)
```

### C4 — Clone once per mount (fixes F5), drop pc_chair (F4), preload everything (fixes F8)
New file `components/utils/Model.tsx`:
```tsx
"use client";
import { useMemo } from "react";
import type { Object3D } from "three";
import type { ThreeElements } from "@react-three/fiber";
type ModelProps = Omit<ThreeElements["primitive"], "object"> & { object: Object3D };
// Clones a loaded GLTF scene once per mount. An inline `scene.clone()` creates a new
// object on every render, which makes R3F remove and re-add the whole model each time.
export default function Model({ object, ...props }: ModelProps) {
  const clone = useMemo(() => object.clone(), [object]);
  return <primitive object={clone} {...props} />;
}
```
Mechanical replacement (node script, 33 sites) `<primitive … object={X.scene.clone()}` → `<Model … object={X.scene}`
(all other props unchanged) + `import Model from "@/components/utils/Model";` after the last import in:
Portrait (1: wallDisplay), PhoneOnTable (2: table, phone), PcSetup (4: desk, pc, meta, monitor),
PS5Setup (7: speaker, tv, tvUnit, ps5, vrHeadset, psLamp, psLampWall), RoomFurnish (4: couch, sweeper, bed, purifier),
Pegboards (15). Avatar's `<primitive object={scene} …/>` (single, uncloned) unchanged.
Fiber 9.8.1 still reconstructs on object change (`events-9ce18a08.esm.js:16905`) → fix still needed after upgrade.

`PcSetup.tsx`:
```
-  const pcChair = useGLTF("/models/pc_chair.glb");                      (F4, never rendered)
-  const { focusedHotspot, tourStep, completeTourStep } = useScene();
+  const { tourStep, completeTourStep } = useScene();                   (focusedHotspot unused)
```
Module-level preloads appended (comment: `// Start downloads at module load instead of waiting for the Suspense waterfall`):
- PcSetup: `useGLTF.preload` monitor, desk, pc, meta + `useTexture.preload("/pc_display.png")`
- PhoneOnTable: table, phone
- Portrait: wall_display
- RoomFurnish: sweeper, bed, purifier, couch
- Pegboards: pegboard, controller1-4, ps_portal, headset1, headset2
- PS5Setup: speaker, tv, ps_lamp + `useTexture.preload("/tv.png")`; and
  `if (!isTouchDevice()) { tv_unit, ps5, vr, playstation_lamp }` — mirrors the render condition
  `{!isTouch && <TvUnit …/>}` (Room passes `isTouch = isTouchDevice()`), so touch devices still don't download them.
  Added `import { isTouchDevice } from "@/components/utils/helperFunc";`
- Floor: `useTexture.preload(["/textures/floor/diff.jpg","/textures/floor/nor.jpg","/textures/floor/arm.jpg"])`
  (same order as `Object.values({map, normalMap, roughnessMap})` in Floor & Walls → same cache key).
- Avatar already had `useGLTF.preload("/models/character.glb")`.

Line endings: these files are CRLF in the working tree (index is LF, `core.autocrlf=input`). Inserted lines were
normalized to CRLF with `perl -pi -e 's/\r?\n/\r\n/'` so no file is mixed. New files (Model.tsx,
useVideoTexture.ts) are LF. Git stores LF either way.

### C5 — GLB optimization (fixes F2, F3) — `public/models/*.glb` (27 files; character.glb untouched)
Tooling (scratchpad only, not project deps): `@gltf-transform/core|extensions|functions` 4.x, `meshoptimizer`, `sharp`.
Script `scratchpad/tools/optimize.mjs` — per file:
1. Textures: if max side > 2048 → resize to fit 2048 (lanczos3, aspect kept). Colour (sRGB) textures → WebP q90;
   data maps (normal / occlusion / metallicRoughness …) → **lossless** WebP. If not resized and WebP isn't smaller
   → original image kept. (Own logic because gltf-transform `compressTexture` always swaps on mime change even if
   larger — verified `functions/dist/index.js:5671`.) `EXT_texture_webp` added when used.
2. `dedup()`, `prune({keepLeaves, keepAttributes, keepIndices, keepSolidTextures, keepExtras: true})` (only drops
   unreferenced data; defaults would also strip leaves/attributes/solid textures).
3. `meshopt({ level: 'medium' })` = reorder + quantize (pos 14 bit, normal 10 bit, uv 12 bit) +
   `EXT_meshopt_compression` (default 'high' would cut normals to 8 bit → not used).
Originals: git HEAD + `scratchpad/models-orig/`.

Results: GLBs 82.9 → 28.9 MB (processed files); textures 27.1 → 12.6 MB; 5 oversized textures downscaled
(controller4 8192×4096 → 2048×1024, playstation_lamp 2× 4096² → 2048², speaker 4096² → 2048²,
monitor 4096×1024 → 2048×512); 47 colour → WebP q90, 22 data → lossless WebP, 51 kept as is.
Integrity check (`tools/rendered.mjs`, per node instance): rendered triangles and draw calls **identical** for
every file (prune "Removed Primitive" messages = duplicates merged by dedup, now shared by nodes).
Loader support verified (F2): drei `useGLTF` registers MeshoptDecoder (embedded WASM); three-stdlib GLTFLoader
handles EXT_meshopt_compression / EXT_texture_webp.
Visual check: same camera views before/after, pixel diff + 2× side-by-side crops (couch, pegboard incl.
controller4, desk) → no visible difference; diffs only from time-based animation (hexagons, avatar idle, videos).

### C6 — Zero-risk lint fixes (behaviour-identical)
```
components/SceneCanvas/Avatar.tsx
-import { Group, Vector3, Mesh, Object3D } from "three";
+import { Vector3, Mesh, Object3D } from "three";
components/UI/Loader.tsx                                   (react-hooks/purity: Date.now() in render)
-  const mountTimeRef = useRef<number>(Date.now());
-    const startTime = mountTimeRef.current;
+    const startTime = Date.now();                          (inside the existing mount effect)
components/SceneCanvas/Room/UI/Portrait.tsx (3×)
-        onClick={(e) => onLinkClick("project" | "github" | "all projects", session)}
+        onClick={() => onLinkClick(…same…, session)}
components/SceneCanvas/Room/UI/PcSetup.tsx / PhoneOnTable.tsx
-            !isPresenting && completeTourStep("pc");      /  ("phone")
+            if (!isPresenting) completeTourStep("pc");     /  ("phone")
components/utils/helperFunc.ts
-  const uaData = (navigator as any).userAgentData;
+  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
-  const platform = nav.platform || '';                    (2×, unused in isTablet / isMobile)
```
Lint: baseline 20 errors / 13 warnings → **4 errors / 1 warning**. Intentionally left (fix would change behaviour or
touch unused/dead code — owner's call):
- `SceneContext.tsx:37` set-state-in-effect — reads localStorage after mount; this is the SSR-safe pattern
  (SceneProvider is server-rendered as part of the client page).
- `PathDebugger.tsx:86` set-state-in-effect — debug component, not mounted (commented out in SceneCanvas).
- `inspect-fbx.js` 2× no-require-imports — standalone node script; points to `public/models/character/mesh.fbx`
  which doesn't exist. Delete or add to eslint ignores — owner's call.
- `Avatar.tsx:109` exhaustive-deps (`switchAnimation`) — adding it would re-run the effect on every render.
`npm run lint` therefore still exits non-zero (4 errors above).

### C7 — Docs
- `README.md`: `Next.js 16.0.1` → `16.4`, `React 19.2.0` → `19.3`, `Node.js 20+` → `Node.js 20.9+ (required by Next.js 16)`
  (next@16.4.0 `engines.node >=20.9.0`).
- `.github/copilot-instructions.md` (AI assistant guidance — the old text taught the buggy patterns):
  versions (Next 16.4 / React 19.3 / TS 6, three r186, GSAP 3.15); hotspot example `<primitive object={model.scene.clone()} />`
  → `<Model object={model.scene} />`; "Loading GLB Models" section rewritten (Model component, module-level
  `useGLTF.preload`, why inline clone is wrong, compress new GLBs); "Video Texture Pattern" rewritten to use
  `useVideoTexture` + conditional mesh, and why `<video>` must not be created during render.

## 5. E2E test suite (scratchpad `tools/e2e.mjs`)
Real headless Chrome (GPU, ANGLE Metal), `next start` prod build, one browser, one context per scenario, closed after.
Finds 3D hotspots by projecting world positions through the live camera (captured via three's `__THREE_DEVTOOLS__`
observe hook + wrapping `renderer.render`) → no test hooks in app code. Scenarios:
1. desktop-load-and-hotspots: load metrics, no duplicate asset requests, pc_chair not requested, mp4 requests bounded,
   hover cursor, click PC/portrait/TV/phone → TopBar titles, Go Back, next/prev arrow cycle, CTA href, tour storage.
2. desktop-avatar-walk-and-hitches: avatar walks to 4 floor points (positions asserted), frame stats while walking,
   hover in/out stress on 4 hotspots ×6, 12 rapid floor clicks.
3. desktop-portrait-carousel: Html buttons, VISIT PROJECT → window.open URLs per slide, next/prev, 30 rapid slide
   changes (request count, heap delta), auto-advance after video duration (durations 39.7 / 43.8 / 36.7 s).
4. mobile-iphone (iPhone 15 emulation, touch): TvUnit models NOT downloaded, single-finger pan moves camera, tap hotspots.
5. vr-browser-path: Quest UA + `isSessionSupported` stub → XR store branch renders, hotspot click works.
6. resize: 4 viewport sizes, hotspot still works.

### Results after C1-C5 (run `e2e/c5-assets`): 38/43 — the 5 "failures" are all the known R3F-internal
`THREE.Clock` deprecation warning (see C1); every functional check passed.
| metric | baseline | after C1-C4 | after C5 |
|---|---|---|---|
| loader gone, desktop warm | 9.7-11.4 s | 7.0-8.8 s | **6.2 s** |
| transferred | 70-78 MB | 68 MB | **33.6 MB** |
| requests | 201-211 | 138-139 | 139 |
| mp4 requests during load | 139 | 5-6 | 5 |
| in-scene texture VRAM (est.) | – | 992 MB | **606 MB** |
| main-thread long task at load | 4.1-4.9 s | 4.1-4.4 s | **3.2 s** |
| iPhone emulation load | – | – | 4.6 s, 31.9 MB, 523 MB tex |
| frames while walking / hover stress / rapid clicks (max) | – | – | 17 / 17 / 17 ms |
CPU profile at load (C4 state): `render` 5066 ms inclusive, `texSubImage2D` 2987 ms self → long task = GPU upload.
A single 1.7 s first-click hitch seen once (cold first run) did **not** reproduce in 3 further runs → no change made.
drei `<Preload all/>` runs once on mount (`[]` deps, `drei/core/Preload.js`) while Room is still suspended → it
precompiles an almost empty scene. No measurable hitch results → left as is (noted only).

## 6. FINAL verification (all changes C1-C7, clean `rm -rf .next && npm run build`)
Full suite run `e2e/final`: **43/43 checks passed** (Clock warning is whitelisted as known R3F-internal and still
reported). Original code run through the same suite (git worktree of HEAD, its own `npm ci` + build):
41/43 — its 2 failures are exactly the fixed bugs (pc_chair requested; 126 mp4 requests). All interaction checks
pass on both → **no functional regression**.

| metric (same machine, headless Chrome + GPU) | original (HEAD) | final |
|---|---|---|
| desktop: loader gone (warm) | 9.4-11.4 s | 4.5-6.2 s |
| desktop: transferred / requests | 69.7-78 MB / 201-294 | 33.3 MB / 139 |
| **desktop @ 20 Mbps throttle: loader gone** | **43.6 s** | **16.1 s** |
| iPhone 15 emulation: load / transfer | 8.6 s / 64.2 MB | 4.9 s / 31.6 MB |
| VR-browser path: load | 10.6 s | 4.7 s |
| mp4 requests during load | 126-139 | 5 |
| in-scene texture VRAM (est.) desktop / iPhone | 992 / 774 MB | 606 / 523 MB |
| load-time main-thread long task | 4.1-4.9 s | 2.7-3.2 s |
| JS heap after interaction scenario (6 samples each) | 200-222 MB | 105-116 MB |
| scene objects re-created by 3 hover toggles on the monitor | **857** | **0** |
| scene contents when loader disappears | 98 objects (room appears ~3 s later) | 953-955 (full room) |

Notes on honesty / limits:
- "Room appears ~3 s after loader" in the original: observed with `tools/scenecount.mjs` (objects in scene sampled
  each second after the loader vanished: 4 → 98 → 98 → 98 → 955). Not root-caused (original code only); not
  present after the changes. It also means the original's "loader gone" numbers *understate* its real time-to-room.
- Frame-time comparison under interaction stress was **inconclusive**: the machine's load average was 8-20
  (WindowServer ~98 % CPU, other apps) and interleaved A/B runs (orig, new, orig, new) overlapped. No frame-time
  claim is made. F5 is instead verified deterministically by the object re-creation count (857 → 0).
- Not testable here: real VR session (immersive-vr) and real phones/Quest GPUs. The VR-browser code path (store
  creation, non-presenting rendering, hotspot click) was tested with UA + `isSessionSupported` stub only.

## 7. Open items / optional next steps (NOT done — need owner decision; each would trade some fidelity)
1. Triangle budget: ~2.87 M triangles rendered on desktop (2.58 M on touch). Largest: pc.glb 378 k,
   controller3.glb 352 k (rendered twice at scale 0.006 on the pegboard → ~700 k tris for two tiny objects),
   ps5 162 k, purifier 167 k, headset2 146 k, headset1 112 k, controller1 112 k (×2), bed 106 k.
   Mesh simplification (meshoptimizer, small error) on these would help Quest/mobile frame rate; not done because
   it changes geometry and could not be validated on target devices here.
2. Remaining VRAM ~606 MB is mostly many 1024² textures on small props (controller2: 18 textures ≈ 100 MB;
   desk: 16 ≈ 90 MB). Downscaling small props to 512 would roughly halve VRAM; visual cost on tiny props is
   likely invisible but it is a quality trade-off → owner's call. KTX2/Basis would cut VRAM most but needs a
   transcoder and is lossy.
3. `pc_display.png` (5042×1143, ~30 MB VRAM) kept full-res on purpose (close-up hero screen).
4. Rect-area lights without `RectAreaLightUniformsLib.init()` (see "Noted" above).
5. `THREE.Clock` deprecation warning comes from @react-three/fiber 9.8.1 itself; goes away when fiber updates.
6. Unused files still in repo: `public/models/pc_chair.glb` (now unreferenced), `hands.fbx`,
   `character_mixamo_fixed.fbx`, `public/textures/ceiling/*`, `phone.png`, default svgs, `inspect-fbx.js`,
   `three-pathfinding` mention in copilot-instructions. No runtime cost; delete if desired.
7. Dev-only audit: 5 high in eslint-config-next's dependency chain (braces) — waits on upstream.

## 8. How to reproduce the measurements
Scratchpad tools (session-local; copy them into the repo if you want to keep them):
`tools/summary.mjs` (GLB stats), `tools/optimize.mjs <in> <out> 2048` (asset pipeline), `tools/rendered.mjs`
(geometry integrity), `tools/measure.mjs <url> <shot> [Mbps]`, `tools/profile.mjs` (request timeline + long tasks),
`tools/cpuprofile.mjs`, `tools/e2e.mjs <url> <outDir> [scenario]`, `tools/churn.mjs`, `tools/scenecount.mjs`,
`tools/imgdiff.mjs`. All need `npx next start` running; run one server + one browser at a time.

## Appendix A — full diff of source/doc changes (vs HEAD 27913b7; excludes package-lock.json and binary GLBs)

New file `components/utils/Model.tsx` is shown in full in C4. GLB changes: see C5 (27 binary files under `public/models`, all except `character.glb`).

```diff
diff --git a/.github/copilot-instructions.md b/.github/copilot-instructions.md
index 5263f7f..7bca72b 100644
--- a/.github/copilot-instructions.md
+++ b/.github/copilot-instructions.md
@@ -6,9 +6,9 @@ Interactive WebXR portfolio showcasing frontend/VR development in a 3D L-shaped
 **Current State**: Fully functional with Mixamo character model (walk/idle animations), real 3D furniture models (desk, chair, couch, bed, TV, phone, speakers), animated LED elements, video-playing phone screen, and RGB ceiling hexagons. Avatar uses custom pathfinding algorithm with obstacle avoidance.
 
 ## Tech Stack
-- **Framework**: Next.js 16.0.1 (App Router), React 19.2.0, TypeScript (strict)
-- **3D/WebXR**: Three.js r181 via `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`
-- **Animation**: GSAP 3.13, Three.js AnimationMixer
+- **Framework**: Next.js 16.4 (App Router), React 19.3, TypeScript 6 (strict)
+- **3D/WebXR**: Three.js r186 via `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`
+- **Animation**: GSAP 3.15, Three.js AnimationMixer
 - **Pathfinding**: Custom recursive path-finding with obstacle avoidance (see `pathfinding.ts`)
 - **Styling**: Tailwind CSS v4 with PostCSS plugin (`@import "tailwindcss"` syntax)
 
@@ -101,7 +101,7 @@ const OBSTACLES: ObstacleShape[] = [
     document.body.style.cursor = 'auto';
   }}
 >
-  <primitive object={model.scene.clone()} />
+  <Model object={model.scene} />
 </group>
 ```
 
@@ -167,20 +167,32 @@ npm run lint     # ESLint v9 flat config
 
 ### Loading GLB Models
 ```tsx
-// Standard pattern (see Room.tsx)
+// Standard pattern (see Room/UI/PcSetup.tsx)
+import Model from '@/components/utils/Model';
 const desk = useGLTF('/models/desk.glb');
 
-// Later in JSX
-<primitive 
-  object={desk.scene.clone()}  // ALWAYS clone to reuse models
+// Later in JSX — Model clones the scene ONCE per mount (useMemo)
+<Model
+  object={desk.scene}
   position={[-2.6, 0, -6.4]}
   rotation={[0, Math.PI / 2, 0]}
   scale={[3.35, 2, 3]}
   castShadow
 />
+
+// At module level: start the download immediately (avoids the Suspense waterfall)
+useGLTF.preload('/models/desk.glb');
 ```
 
-**Why `.clone()`**: Without cloning, multiple instances share transformations (position/rotation update all instances).
+**Why `Model`**: Each instance needs its own clone (an Object3D can only have one parent), but NEVER write
+`object={x.scene.clone()}` inline — that creates a new object on every render and R3F then removes and re-adds
+the whole model each time.
+
+**Why `preload`**: with React 19 a suspending component stops its siblings from rendering, so without
+module-level `useGLTF.preload` / `useTexture.preload` the assets download one component at a time.
+
+**New GLBs**: compress before committing (meshopt + WebP textures, max 2048px) — drei's `useGLTF` decodes
+`EXT_meshopt_compression` and `EXT_texture_webp` out of the box. See MIGRATION_NOTES.md (C5).
 
 ### Loading Textures
 ```tsx
@@ -291,29 +303,23 @@ const MemoizedAnimatedSpeaker = memo(AnimatedSpeaker);
 ```
 
 ### Video Texture Pattern
-For screens playing video (phone screen):
+For screens playing video (phone screen, portrait) use `components/utils/useVideoTexture.ts`:
 
 ```tsx
-const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
-
-useEffect(() => {
-  const video = document.createElement('video');
-  video.src = '/videos/demo.mp4';
-  video.loop = true;
-  video.muted = true;
-  video.playsInline = true;
-  video.play();
-  
-  const texture = new VideoTexture(video);
-  setVideoTexture(texture);
-  
-  return () => video.pause();
-}, []);
-
-// Apply to material
-<meshStandardMaterial map={videoTexture} emissive="#ffffff" />
+const videoTexture = useVideoTexture('/phone.mp4')?.texture; // null until the first frame is loaded
+
+// Render the mesh only once the texture exists (a null → texture map would need material.needsUpdate)
+{videoTexture && (
+  <mesh>
+    <planeGeometry args={[0.19, 0.35]} />
+    <meshBasicMaterial map={videoTexture} toneMapped={false} />
+  </mesh>
+)}
 ```
 
+Never create `<video>` elements during render: components inside a suspending tree are rendered (and
+discarded) many times before they commit, and each discarded render would start another download.
+
 ### useFrame Color Cycling Pattern
 RGB mood lighting uses sine-wave interpolation:
 
diff --git a/README.md b/README.md
index 8cbde9f..04e5468 100644
--- a/README.md
+++ b/README.md
@@ -14,8 +14,8 @@ An interactive 3D portfolio showcasing frontend development and VR skills in a s
 
 ## Tech Stack
 
-- **Framework**: Next.js 16.0.1 (App Router)
-- **React**: 19.2.0
+- **Framework**: Next.js 16.4 (App Router)
+- **React**: 19.3
 - **3D/WebXR**: Three.js, @react-three/fiber, @react-three/drei, @react-three/xr
 - **Animation**: GSAP, Three.js AnimationMixer
 - **Styling**: Tailwind CSS v4
@@ -25,7 +25,7 @@ An interactive 3D portfolio showcasing frontend development and VR skills in a s
 
 ### Prerequisites
 
-- Node.js 20+ installed
+- Node.js 20.9+ installed (required by Next.js 16)
 - npm or yarn package manager
 
 ### Installation
diff --git a/components/SceneCanvas/Avatar.tsx b/components/SceneCanvas/Avatar.tsx
index d9f4d66..f80ea92 100644
--- a/components/SceneCanvas/Avatar.tsx
+++ b/components/SceneCanvas/Avatar.tsx
@@ -1,7 +1,7 @@
 "use client";
 
 import { Suspense, useRef, useEffect, useState } from "react";
-import { Group, Vector3, Mesh, Object3D } from "three";
+import { Vector3, Mesh, Object3D } from "three";
 import { useFrame } from "@react-three/fiber";
 import { useGLTF, useAnimations } from "@react-three/drei";
 import { useScene } from "@/components/utils/SceneContext";
diff --git a/components/SceneCanvas/Room/UI/Floor.tsx b/components/SceneCanvas/Room/UI/Floor.tsx
index e3c3d4d..71b715f 100644
--- a/components/SceneCanvas/Room/UI/Floor.tsx
+++ b/components/SceneCanvas/Room/UI/Floor.tsx
@@ -69,3 +69,10 @@ export default function Floor() {
     </group>
   );
 }
+
+// Same URL order as the useTexture objects in Floor and Walls (Object.values order = cache key)
+useTexture.preload([
+  "/textures/floor/diff.jpg",
+  "/textures/floor/nor.jpg",
+  "/textures/floor/arm.jpg",
+]);
diff --git a/components/SceneCanvas/Room/UI/PS5Setup.tsx b/components/SceneCanvas/Room/UI/PS5Setup.tsx
index 7b4f519..d163d16 100644
--- a/components/SceneCanvas/Room/UI/PS5Setup.tsx
+++ b/components/SceneCanvas/Room/UI/PS5Setup.tsx
@@ -4,6 +4,8 @@ import { useGLTF, useTexture, Text } from "@react-three/drei";
 import { useXR } from "@react-three/xr";
 import { links } from "@/components/utils/data";
 import GuideArrow from "./GuideArrow";
+import { isTouchDevice } from "@/components/utils/helperFunc";
+import Model from "@/components/utils/Model";
 
 function AnimatedSpeaker({
   position,
@@ -18,7 +20,7 @@ function AnimatedSpeaker({
 
   return (
     <group position={position} rotation={rotation} scale={scale}>
-      <primitive object={speaker.scene.clone()} castShadow />
+      <Model object={speaker.scene} castShadow />
     </group>
   );
 }
@@ -117,9 +119,9 @@ const Tv = forwardRef(function Tv(
         }
       }}
     >
-      <primitive
+      <Model
         rotation={[0, Math.PI / 0.95, 0]}
-        object={tv.scene.clone()}
+        object={tv.scene}
         castShadow
       />
 
@@ -212,8 +214,8 @@ function TvUnit({
   const psLamp = useGLTF("/models/playstation_lamp.glb");
   return (
     <group position={position} rotation={rotation} scale={scale}>
-      <primitive
-        object={tvUnit.scene.clone()}
+      <Model
+        object={tvUnit.scene}
         position={[0, 0, 0]}
         rotation={[0, 0, 0]}
         scale={1.8}
@@ -221,8 +223,8 @@ function TvUnit({
       />
 
       {/* PS5 Console */}
-      <primitive
-        object={ps5.scene.clone()}
+      <Model
+        object={ps5.scene}
         position={[0.15, 0.64, -1.1]}
         rotation={[0, Math.PI / 2, 0]}
         scale={2}
@@ -230,8 +232,8 @@ function TvUnit({
       />
 
       {/* VR Headset on TV Unit */}
-      <primitive
-        object={vrHeadset.scene.clone()}
+      <Model
+        object={vrHeadset.scene}
         position={[0.05, 0.685, 0.95]}
         rotation={[0, Math.PI / 2, 0]}
         scale={0.8}
@@ -239,8 +241,8 @@ function TvUnit({
       />
 
       {/* PlayStation Lamp on TV Unit */}
-      <primitive
-        object={psLamp.scene.clone()}
+      <Model
+        object={psLamp.scene}
         position={[0, 0.9, 0.065]}
         rotation={[0, Math.PI / 2, 0]}
         scale={0.065}
@@ -335,8 +337,8 @@ const PS5Setup = forwardRef(function PS5Setup(
       />
 
       {/* PlayStation Lamp above TV */}
-      <primitive
-        object={psLampWall.scene.clone()}
+      <Model
+        object={psLampWall.scene}
         position={[1.86, 3.1, -0.15]}
         rotation={[0, -Math.PI / 2, 0]}
         scale={5}
@@ -347,3 +349,16 @@ const PS5Setup = forwardRef(function PS5Setup(
 });
 
 export default PS5Setup;
+
+// Start downloads at module load instead of waiting for the Suspense waterfall
+useGLTF.preload("/models/speaker.glb");
+useGLTF.preload("/models/tv.glb");
+useGLTF.preload("/models/ps_lamp.glb");
+useTexture.preload("/tv.png");
+// TvUnit is only rendered on non-touch devices (see PS5Setup above)
+if (!isTouchDevice()) {
+  useGLTF.preload("/models/tv_unit.glb");
+  useGLTF.preload("/models/ps5.glb");
+  useGLTF.preload("/models/vr.glb");
+  useGLTF.preload("/models/playstation_lamp.glb");
+}
diff --git a/components/SceneCanvas/Room/UI/PcSetup.tsx b/components/SceneCanvas/Room/UI/PcSetup.tsx
index 438fd04..cf27450 100644
--- a/components/SceneCanvas/Room/UI/PcSetup.tsx
+++ b/components/SceneCanvas/Room/UI/PcSetup.tsx
@@ -4,6 +4,7 @@ import { HotspotId, useScene } from "@/components/utils/SceneContext";
 import { useXR } from "@react-three/xr";
 import { links } from "@/components/utils/data";
 import GuideArrow from "./GuideArrow";
+import Model from "@/components/utils/Model";
 
 function PcSetupHighlight({ onLinkClick }: { onLinkClick: () => void }) {
   const session = useXR((state) => state.session);
@@ -62,10 +63,9 @@ const PcSetup = forwardRef(function PcSetup(
   const desk = useGLTF("/models/desk.glb");
   const pc = useGLTF("/models/pc.glb");
   const meta = useGLTF("/models/meta.glb");
-  const pcChair = useGLTF("/models/pc_chair.glb");
   const pcDisplayTexture = useTexture("/pc_display.png");
 
-  const { focusedHotspot, tourStep, completeTourStep } = useScene();
+  const { tourStep, completeTourStep } = useScene();
 
   const [isMonitorHovered, setIsMonitorHovered] = useState(isTouch && !isPresenting);
 
@@ -81,8 +81,8 @@ const PcSetup = forwardRef(function PcSetup(
       {/* ============================================ */}
 
       {/* PC Desk */}
-      <primitive
-        object={desk.scene.clone()}
+      <Model
+        object={desk.scene}
         position={[0.2, -0.3, -12.425]}
         rotation={[0, Math.PI / 2, 0]}
         scale={[0.79, 0.5, 0.5]} // [width (X), height (Y), depth (Z)]
@@ -90,8 +90,8 @@ const PcSetup = forwardRef(function PcSetup(
       />
 
       {/* PC Tower */}
-      <primitive
-        object={pc.scene.clone()}
+      <Model
+        object={pc.scene}
         position={[-2.3, 1.76, -8.45]}
         rotation={[0, 0, 0]}
         scale={2}
@@ -99,8 +99,8 @@ const PcSetup = forwardRef(function PcSetup(
       />
 
       {/* Meta quest on desk */}
-      <primitive
-        object={meta.scene.clone()}
+      <Model
+        object={meta.scene}
         position={[-2.2, 1.6, -5.4]}
         rotation={[0, Math.PI / 1.5, 0]}
         scale={1.3}
@@ -115,7 +115,7 @@ const PcSetup = forwardRef(function PcSetup(
           onClick={(e) => {
             e.stopPropagation();
             handleHotspotClick("pc");
-            !isPresenting && completeTourStep("pc");
+            if (!isPresenting) completeTourStep("pc");
           }}
           onPointerOver={(e) => {
             e.stopPropagation();
@@ -132,7 +132,7 @@ const PcSetup = forwardRef(function PcSetup(
           }}
         >
           {/* Monitor GLB Model */}
-          <primitive object={monitor.scene.clone()} scale={1} castShadow />
+          <Model object={monitor.scene} scale={1} castShadow />
 
           {/* Curved Monitor Display with texture */}
           <mesh
@@ -222,3 +222,10 @@ const PcSetup = forwardRef(function PcSetup(
   );
 });
 export default PcSetup;
+
+// Start downloads at module load instead of waiting for the Suspense waterfall
+useGLTF.preload("/models/monitor.glb");
+useGLTF.preload("/models/desk.glb");
+useGLTF.preload("/models/pc.glb");
+useGLTF.preload("/models/meta.glb");
+useTexture.preload("/pc_display.png");
diff --git a/components/SceneCanvas/Room/UI/Pegboards.tsx b/components/SceneCanvas/Room/UI/Pegboards.tsx
index b444f24..d6297ca 100644
--- a/components/SceneCanvas/Room/UI/Pegboards.tsx
+++ b/components/SceneCanvas/Room/UI/Pegboards.tsx
@@ -1,6 +1,7 @@
 "use client";
 
 import { useGLTF } from "@react-three/drei";
+import Model from "@/components/utils/Model";
 
 export default function Pegboards() {
   const pegboard = useGLTF("/models/pegboard.glb");
@@ -16,29 +17,29 @@ export default function Pegboards() {
   return (
     <group position={[-1.47, 2, -2.9]}>
       {/* Pegboards */}
-      <primitive
-        object={pegboard.scene.clone()}
+      <Model
+        object={pegboard.scene}
         position={[0, 0, 0]}
         rotation={[0, 0, 0]}
         scale={[0.5, 0.25, 0.25]}
         castShadow
       />
-      <primitive
-        object={pegboard.scene.clone()}
+      <Model
+        object={pegboard.scene}
         position={[0, 0, 1.25]}
         rotation={[0, 0, 0]}
         scale={[0.5, 0.25, 0.25]}
         castShadow
       />
-      <primitive
-        object={pegboard.scene.clone()}
+      <Model
+        object={pegboard.scene}
         position={[0, 0.5, 0]}
         rotation={[0, 0, 0]}
         scale={[0.5, 0.25, 0.25]}
         castShadow
       />
-      <primitive
-        object={pegboard.scene.clone()}
+      <Model
+        object={pegboard.scene}
         position={[0, 0.5, 1.25]}
         rotation={[0, 0, 0]}
         scale={[0.5, 0.25, 0.25]}
@@ -47,15 +48,15 @@ export default function Pegboards() {
 
       {/* Controllers - 8 total (each type appears twice) */}
       {/* Controller 1 - Top Left & Bottom Right */}
-      <primitive
-        object={controller1.scene.clone()}
+      <Model
+        object={controller1.scene}
         position={[0.05, -0.2, -0.3]}
         rotation={[0, Math.PI / 2, 0]}
         scale={2.2}
         castShadow
       />
-      <primitive
-        object={controller1.scene.clone()}
+      <Model
+        object={controller1.scene}
         position={[0.05, -0.2, 1.55]}
         rotation={[0, Math.PI / 2, 0]}
         scale={2.2}
@@ -63,15 +64,15 @@ export default function Pegboards() {
       />
 
       {/* Controller 2 - Top Right & Bottom Left */}
-      <primitive
-        object={controller2.scene.clone()}
+      <Model
+        object={controller2.scene}
         position={[0.05, 0.52, 1.55]}
         rotation={[0, 0, 0]}
         scale={1.8}
         castShadow
       />
-      <primitive
-        object={controller2.scene.clone()}
+      <Model
+        object={controller2.scene}
         position={[0.05, 0.52, -0.3]}
         rotation={[0, 0, 0]}
         scale={1.8}
@@ -79,15 +80,15 @@ export default function Pegboards() {
       />
 
       {/* Controller 3 - Middle Left (both) */}
-      <primitive
-        object={controller3.scene.clone()}
+      <Model
+        object={controller3.scene}
         position={[0.05, 0.45, 0.35]}
         rotation={[0, Math.PI / 2, 0]}
         scale={0.006}
         castShadow
       />
-      <primitive
-        object={controller3.scene.clone()}
+      <Model
+        object={controller3.scene}
         position={[0.05, 0.45, 0.9]}
         rotation={[0, Math.PI / 2, 0]}
         scale={0.006}
@@ -95,15 +96,15 @@ export default function Pegboards() {
       />
 
       {/* Controller 4 - Center (both) */}
-      <primitive
-        object={controller4.scene.clone()}
+      <Model
+        object={controller4.scene}
         position={[-0.225, -0.05, 0.35]}
         rotation={[Math.PI / 2, 0, -Math.PI / 2]}
         scale={1.8}
         castShadow
       />
-      <primitive
-        object={controller4.scene.clone()}
+      <Model
+        object={controller4.scene}
         position={[-0.225, -0.05, 0.9]}
         rotation={[Math.PI / 2, 0, -Math.PI / 2]}
         scale={1.8}
@@ -111,22 +112,22 @@ export default function Pegboards() {
       />
 
       {/* ps portal and headsets - Center (both) */}
-      <primitive
-        object={headset1.scene.clone()}
+      <Model
+        object={headset1.scene}
         position={[0.11, 0.22, -0.3]}
         rotation={[0, Math.PI / 2, 0]}
         scale={0.09}
         castShadow
       />
-      <primitive
-        object={headset2.scene.clone()}
+      <Model
+        object={headset2.scene}
         position={[0.11, -0.225, 1.7]}
         rotation={[0, 0, 0]}
         scale={0.065}
         castShadow
       />
-      <primitive
-        object={psPortal.scene.clone()}
+      <Model
+        object={psPortal.scene}
         position={[0.11, 0.12, 0.6]}
         rotation={[0, Math.PI / 2, 0]}
         scale={0.5}
@@ -135,3 +136,13 @@ export default function Pegboards() {
     </group>
   );
 }
+
+// Start downloads at module load instead of waiting for the Suspense waterfall
+useGLTF.preload("/models/pegboard.glb");
+useGLTF.preload("/models/controller1.glb");
+useGLTF.preload("/models/controller2.glb");
+useGLTF.preload("/models/controller3.glb");
+useGLTF.preload("/models/controller4.glb");
+useGLTF.preload("/models/ps_portal.glb");
+useGLTF.preload("/models/headset1.glb");
+useGLTF.preload("/models/headset2.glb");
diff --git a/components/SceneCanvas/Room/UI/PhoneOnTable.tsx b/components/SceneCanvas/Room/UI/PhoneOnTable.tsx
index ff55276..0150c0a 100644
--- a/components/SceneCanvas/Room/UI/PhoneOnTable.tsx
+++ b/components/SceneCanvas/Room/UI/PhoneOnTable.tsx
@@ -6,6 +6,7 @@ import { HotspotId, useScene } from "@/components/utils/SceneContext";
 import { useXR } from "@react-three/xr";
 import { links } from "@/components/utils/data";
 import GuideArrow from "./GuideArrow";
+import Model from "@/components/utils/Model";
 
 function PhoneOnTableHighlight({ onLinkClick }: { onLinkClick?: () => void }) {
   const session = useXR((state) => state.session);
@@ -63,7 +64,7 @@ const PhoneOnTable = forwardRef(function PhoneOnTable(
 ) {
   const table = useGLTF("/models/table.glb");
   const phone = useGLTF("/models/phone.glb");
-  const { texture: videoTexture } = useVideoTexture("/phone.mp4");
+  const videoTexture = useVideoTexture("/phone.mp4")?.texture;
 
   const [isPhoneHovered, setIsPhoneHovered] = useState(isTouch && !isPresenting);
   const { completeTourStep, tourStep } = useScene();
@@ -74,8 +75,8 @@ const PhoneOnTable = forwardRef(function PhoneOnTable(
 
   return (
     <group>
-      <primitive
-        object={table.scene.clone()}
+      <Model
+        object={table.scene}
         position={[2.1, 0, -1.55]}
         rotation={[0, 0, 0]}
         scale={0.85}
@@ -89,7 +90,7 @@ const PhoneOnTable = forwardRef(function PhoneOnTable(
         onClick={(e: ThreeEvent<MouseEvent>) => {
           e.stopPropagation();
           handleHotspotClick("phone");
-          !isPresenting && completeTourStep("phone");
+          if (!isPresenting) completeTourStep("phone");
         }}
         onPointerOver={(e: ThreeEvent<PointerEvent>) => {
           e.stopPropagation();
@@ -105,18 +106,20 @@ const PhoneOnTable = forwardRef(function PhoneOnTable(
           }
         }}
       >
-        <primitive object={phone.scene.clone()} scale={0.2} castShadow />
+        <Model object={phone.scene} scale={0.2} castShadow />
 
         {/* Phone Screen Display - Video with realistic lighting */}
-        <mesh position={[0.005, -0.01, 0.0115]} rotation={[0, 0, 0]}>
-          <planeGeometry args={[0.19, 0.35]} />
-          <meshBasicMaterial
-            map={videoTexture}
-            toneMapped={false}
-            transparent
-            opacity={0.95}
-          />
-        </mesh>
+        {videoTexture && (
+          <mesh position={[0.005, -0.01, 0.0115]} rotation={[0, 0, 0]}>
+            <planeGeometry args={[0.19, 0.35]} />
+            <meshBasicMaterial
+              map={videoTexture}
+              toneMapped={false}
+              transparent
+              opacity={0.95}
+            />
+          </mesh>
+        )}
 
         {/* Highlight Frame - Phone shape (rounded rectangle) - Only show on hover */}
         {isPhoneHovered && (
@@ -189,3 +192,7 @@ const PhoneOnTable = forwardRef(function PhoneOnTable(
 });
 
 export default PhoneOnTable;
+
+// Start downloads at module load instead of waiting for the Suspense waterfall
+useGLTF.preload("/models/table.glb");
+useGLTF.preload("/models/phone.glb");
diff --git a/components/SceneCanvas/Room/UI/Portrait.tsx b/components/SceneCanvas/Room/UI/Portrait.tsx
index d2257ee..8b9efe8 100644
--- a/components/SceneCanvas/Room/UI/Portrait.tsx
+++ b/components/SceneCanvas/Room/UI/Portrait.tsx
@@ -11,6 +11,7 @@ import { useVideoTexture } from "../../../utils/useVideoTexture";
 import { isTouchDevice } from "../../../utils/helperFunc";
 import { links } from "@/components/utils/data";
 import GuideArrow from "./GuideArrow";
+import Model from "@/components/utils/Model";
 
 // Project videos
 const PROJECT_VIDEOS = [
@@ -176,7 +177,7 @@ function PortraitHighlight({
       <VRButton
         position={[-0.45, 0, 0]}
         shape={visitShape}
-        onClick={(e) => onLinkClick("project", session)}
+        onClick={() => onLinkClick("project", session)}
         colors={["#06b6d4", "#a855f7"]}
         outlineColor="#06b6d4"
       >
@@ -195,7 +196,7 @@ function PortraitHighlight({
       <VRButton
         position={[0.45, 0, 0]}
         shape={visitShape}
-        onClick={(e) => onLinkClick("github", session)}
+        onClick={() => onLinkClick("github", session)}
         colors={["#06b6d4", "#a855f7"]}
         outlineColor="#a855f7"
       >
@@ -251,7 +252,7 @@ function PortraitHighlight({
       <VRButton
         position={[0, -0.45, 0]}
         shape={seeAllShape}
-        onClick={(e) => onLinkClick("all projects", session)}
+        onClick={() => onLinkClick("all projects", session)}
         colors={["#06b6d4", "#a855f7"]}
         outlineColor="#06b6d4"
       >
@@ -278,8 +279,6 @@ export default function Portrait({
   const wallDisplay = useGLTF("/models/wall_display.glb");
   const meshRef = useRef<Mesh>(null);
   const [currentIndex, setCurrentIndex] = useState(0);
-  const videoRef = useRef<HTMLVideoElement | null>(null);
-  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
   const isTouch = isTouchDevice();
 
   const [isHovered, setIsHovered] = useState(isTouch && !isPresenting);
@@ -295,66 +294,24 @@ export default function Portrait({
     completeTourStep("portrait");
   };
 
-  const { texture: videoTexture, video } = useVideoTexture(currentSlide);
-
-  useEffect(() => {
-    const previousVideo = videoRef.current;
-    if (previousVideo && previousVideo !== video) {
-      previousVideo.pause();
-    }
-
-    videoRef.current = video;
-
-    return () => {
-      if (videoRef.current === video) {
-        videoRef.current = null;
-      }
-    };
-  }, [video]);
+  const videoHandle = useVideoTexture(currentSlide);
+  const videoTexture = videoHandle?.texture;
 
   // Auto-slide functionality based on video duration
   useEffect(() => {
-    // Clear existing timer
-    if (autoSlideTimerRef.current) {
-      clearTimeout(autoSlideTimerRef.current);
-    }
+    // Only time the slide that is actually on screen (the previous one stays visible while the next loads)
+    if (!videoHandle || videoHandle.source !== currentSlide) return;
 
-    const video = videoRef.current;
-    if (!video) return;
-
-    const scheduleNextSlide = () => {
-      // Wait for video metadata to load to get duration
-      if (
-        video.duration &&
-        !isNaN(video.duration) &&
-        isFinite(video.duration)
-      ) {
-        const duration = video.duration * 1000; // Convert to milliseconds
-
-        autoSlideTimerRef.current = setTimeout(() => {
-          setCurrentIndex((prev) => (prev + 1) % PROJECT_VIDEOS.length);
-        }, duration);
-      } else {
-        // Fallback: if duration not available, wait and try again
-        setTimeout(scheduleNextSlide, 100);
-      }
-    };
+    // Metadata is available: the handle is only returned after "loadeddata"
+    const duration = videoHandle.video.duration;
+    if (!Number.isFinite(duration)) return;
 
-    // Try to schedule immediately if metadata is loaded
-    if (video.readyState >= 1) {
-      scheduleNextSlide();
-    } else {
-      // Wait for metadata to load
-      video.addEventListener("loadedmetadata", scheduleNextSlide);
-    }
+    const timer = setTimeout(() => {
+      setCurrentIndex((prev) => (prev + 1) % PROJECT_VIDEOS.length);
+    }, duration * 1000);
 
-    return () => {
-      if (autoSlideTimerRef.current) {
-        clearTimeout(autoSlideTimerRef.current);
-      }
-      video.removeEventListener("loadedmetadata", scheduleNextSlide);
-    };
-  }, [currentIndex]);
+    return () => clearTimeout(timer);
+  }, [videoHandle, currentSlide]);
 
   // Manual navigation
   const handlePrevious = (e: ReactMouseEvent<HTMLButtonElement> | ThreeEvent<MouseEvent>) => {
@@ -412,8 +369,8 @@ export default function Portrait({
   return (
     <group position={position} rotation={rotation}>
       {/* Wall Display GLB Model */}
-      <primitive
-        object={wallDisplay.scene.clone()}
+      <Model
+        object={wallDisplay.scene}
         position={[0, 0, 0]}
         rotation={[-Math.PI / 2, Math.PI, Math.PI / 2]}
         scale={[4, 10.5, 5]}
@@ -589,3 +546,6 @@ export default function Portrait({
     </group>
   );
 }
+
+// Start downloads at module load instead of waiting for the Suspense waterfall
+useGLTF.preload("/models/wall_display.glb");
diff --git a/components/SceneCanvas/Room/UI/RoomFurnish.tsx b/components/SceneCanvas/Room/UI/RoomFurnish.tsx
index 97dd68f..5c20151 100644
--- a/components/SceneCanvas/Room/UI/RoomFurnish.tsx
+++ b/components/SceneCanvas/Room/UI/RoomFurnish.tsx
@@ -1,4 +1,5 @@
 import { useGLTF } from "@react-three/drei";
+import Model from "@/components/utils/Model";
 
 export default function RoomFurnish() {
   const sweeper = useGLTF("/models/sweeper.glb");
@@ -8,26 +9,26 @@ export default function RoomFurnish() {
 
   return (
     <group>
-      <primitive
-        object={couch.scene.clone()}
+      <Model
+        object={couch.scene}
         position={[2, 0.15, -3]}
         rotation={[0, -Math.PI / 2, 0]}
         scale={[1.5, 2.5, 1.5]}
         castShadow
       />
-      <primitive
-        object={sweeper.scene.clone()}
+      <Model
+        object={sweeper.scene}
         position={[0.3, 0.15, -8.2]}
         scale={0.2}
       />
-      <primitive
-        object={bed.scene.clone()}
+      <Model
+        object={bed.scene}
         rotation={[0, -Math.PI / 2, 0]}
         position={[2.8, 0, -6.4]}
         scale={1.5}
       />
-      <primitive
-        object={purifier.scene.clone()}
+      <Model
+        object={purifier.scene}
         rotation={[0, -Math.PI / 7.3, 0]}
         position={[-1, 0, -4]}
         scale={0.3}
@@ -35,3 +36,9 @@ export default function RoomFurnish() {
     </group>
   );
 }
+
+// Start downloads at module load instead of waiting for the Suspense waterfall
+useGLTF.preload("/models/sweeper.glb");
+useGLTF.preload("/models/bed.glb");
+useGLTF.preload("/models/purifier.glb");
+useGLTF.preload("/models/couch.glb");
diff --git a/components/SceneCanvas/index.tsx b/components/SceneCanvas/index.tsx
index 7fb11a7..f96da2b 100644
--- a/components/SceneCanvas/index.tsx
+++ b/components/SceneCanvas/index.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
+import { useState, useEffect, useCallback, useRef } from "react";
 import { Canvas, useThree } from "@react-three/fiber";
 import { XR, createXRStore } from "@react-three/xr";
 import { Preload } from "@react-three/drei";
@@ -146,7 +146,7 @@ export default function SceneCanvas({
   return (
     <div className="relative h-screen w-screen">
       <Canvas
-        shadows
+        shadows="percentage"
         gl={{
           antialias: true,
           alpha: false,
diff --git a/components/UI/Loader.tsx b/components/UI/Loader.tsx
index 1e5fad9..e33291e 100644
--- a/components/UI/Loader.tsx
+++ b/components/UI/Loader.tsx
@@ -5,7 +5,6 @@ import { createRoot, type Root } from "react-dom/client";
 
 export default function Loader() {
   const [progress, setProgress] = useState(0);
-  const mountTimeRef = useRef<number>(Date.now());
   const rootRef = useRef<Root | null>(null);
   const containerRef = useRef<HTMLDivElement | null>(null);
   const progressBarRef = useRef<HTMLDivElement | null>(null);
@@ -16,7 +15,7 @@ export default function Loader() {
 
   // Progress simulation with logarithmic curve
   useEffect(() => {
-    const startTime = mountTimeRef.current;
+    const startTime = Date.now();
     const updateProgress = () => {
       const elapsed = Date.now() - startTime;
       let newProgress;
diff --git a/components/utils/helperFunc.ts b/components/utils/helperFunc.ts
index 7115388..93340cd 100644
--- a/components/utils/helperFunc.ts
+++ b/components/utils/helperFunc.ts
@@ -29,7 +29,7 @@ export async function isVRHeadsetBrowser() {
 // Detects if browser is in mobile emulation mode (DevTools, Android Studio, Xcode Simulator)
 export function isEmulatedMobile() {
   if (typeof window === "undefined") return false;
-  const uaData = (navigator as any).userAgentData;
+  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
   if (uaData && uaData.mobile !== undefined) {
     return uaData.mobile;
   }
@@ -68,7 +68,6 @@ export function isTablet() {
   if (typeof window === "undefined") return false;
   const nav = window.navigator;
   const ua = nav.userAgent;
-  const platform = nav.platform || '';
   // iPad real or emulated
   if (/iPad/.test(ua)) return true;
   // iPad emulation: UA is Macintosh, touch support, iPad viewport
@@ -88,7 +87,6 @@ export function isMobile() {
   if (typeof window === "undefined") return false;
   const nav = window.navigator;
   const ua = nav.userAgent;
-  const platform = nav.platform || '';
   // iPhone real or emulated
   if (/iPhone|iPod/.test(ua)) return true;
   // Android phones: Android + Mobile, not Tablet
diff --git a/components/utils/useVideoTexture.ts b/components/utils/useVideoTexture.ts
index 0dbdd46..d24e61b 100644
--- a/components/utils/useVideoTexture.ts
+++ b/components/utils/useVideoTexture.ts
@@ -1,47 +1,62 @@
 "use client";
 
-import { useEffect, useRef } from "react";
+import { useEffect, useState } from "react";
 import { VideoTexture } from "three";
 
-interface VideoTextureHandle {
+export interface VideoTextureHandle {
+  source: string;
   texture: VideoTexture;
   video: HTMLVideoElement;
 }
 
-export function useVideoTexture(source: string): VideoTextureHandle {
-  const videoRef = useRef<HTMLVideoElement | null>(null);
-  const textureRef = useRef<VideoTexture | null>(null);
-  const lastSourceRef = useRef<string | null>(null);
+const release = ({ video, texture }: VideoTextureHandle) => {
+  video.pause();
+  texture.dispose();
+  // Drop the media resource so the browser stops buffering it
+  video.removeAttribute("src");
+  video.load();
+};
 
-  // Create video and texture only once per source
-  if (!videoRef.current || lastSourceRef.current !== source) {
-    if (textureRef.current) {
-      textureRef.current.dispose();
-    }
+// The video element is created in an effect (commit phase only). Creating it during
+// render started a new download for every render React discarded while suspended.
+// Returns null until the first frame of `source` is available; while a new source
+// loads, the previous handle keeps being returned (no black frame between slides).
+export function useVideoTexture(source: string): VideoTextureHandle | null {
+  const [handle, setHandle] = useState<VideoTextureHandle | null>(null);
+
+  useEffect(() => {
     const video = document.createElement("video");
     video.muted = true;
-    video.src = source;
     video.crossOrigin = "anonymous";
     video.loop = true;
     video.playsInline = true;
-    videoRef.current = video;
-    textureRef.current = new VideoTexture(video);
-    lastSourceRef.current = source;
-  }
+    video.src = source;
+    const next: VideoTextureHandle = {
+      source,
+      video,
+      texture: new VideoTexture(video),
+    };
+    let shown = false;
 
-  useEffect(() => {
-    const video = videoRef.current!;
-    const texture = textureRef.current!;
-    video.load();
-    video.currentTime = 0;
+    const onLoaded = () => {
+      shown = true;
+      setHandle(next);
+    };
+    video.addEventListener("loadeddata", onLoaded, { once: true });
     video.play().catch(() => {});
 
     return () => {
-      video.pause();
-      // Do not clear video.src to avoid breaking texture on hot reload
-      // texture.dispose(); // Do not dispose to persist across reloads
+      video.removeEventListener("loadeddata", onLoaded);
+      // A displayed handle is released by the effect below once it gets replaced
+      if (!shown) release(next);
     };
   }, [source]);
 
-  return { video: videoRef.current!, texture: textureRef.current! };
+  // Release the displayed video/texture after its replacement is committed (or on unmount)
+  useEffect(() => {
+    if (!handle) return;
+    return () => release(handle);
+  }, [handle]);
+
+  return handle;
 }
diff --git a/package.json b/package.json
index fdb70e9..00096f0 100644
--- a/package.json
+++ b/package.json
@@ -9,25 +9,24 @@
     "lint": "eslint"
   },
   "dependencies": {
-    "@react-three/drei": "^10.7.6",
-    "@react-three/fiber": "^9.4.0",
-    "@react-three/xr": "^6.6.27",
-    "gsap": "^3.13.0",
-    "next": "16.1",
-    "react": "19.2.0",
-    "react-dom": "19.2.0",
-    "three": "^0.181.0",
-    "three-pathfinding": "^1.3.0"
+    "@react-three/drei": "^10.7.9",
+    "@react-three/fiber": "^9.8.1",
+    "@react-three/xr": "^6.6.31",
+    "gsap": "^3.15.0",
+    "next": "^16.4.0",
+    "react": "^19.3.0",
+    "react-dom": "^19.3.0",
+    "three": "^0.186.1"
   },
   "devDependencies": {
-    "@tailwindcss/postcss": "^4",
-    "@types/node": "^20",
-    "@types/react": "^19",
-    "@types/react-dom": "^19",
-    "@types/three": "^0.181.0",
-    "eslint": "^9",
-    "eslint-config-next": "16.0.1",
-    "tailwindcss": "^4",
-    "typescript": "^5"
+    "@tailwindcss/postcss": "^4.3.3",
+    "@types/node": "^24",
+    "@types/react": "^19.3.0",
+    "@types/react-dom": "^19.3.0",
+    "@types/three": "^0.186.0",
+    "eslint": "^9.39.5",
+    "eslint-config-next": "^16.4.0",
+    "tailwindcss": "^4.3.3",
+    "typescript": "~6.0.3"
   }
 }
```
