# WebXR Portfolio Showroom - AI Coding Instructions

## Project Overview
Interactive WebXR portfolio showcasing frontend/VR development in a 3D L-shaped gaming room. Built with Next.js 16 App Router + React 19 + Three.js. Features avatar navigation with pathfinding, 4 interaction hotspots (PC, PS5 TV, phone, portrait), RGB mood lighting, and full VR headset support.

**Current State**: Fully functional with Mixamo character model (walk/idle animations), real 3D furniture models (desk, chair, couch, bed, TV, phone, speakers), animated LED elements, video-playing phone screen, and RGB ceiling hexagons. Avatar uses custom pathfinding algorithm with obstacle avoidance.

## Tech Stack
- **Framework**: Next.js 16.0.1 (App Router), React 19.2.0, TypeScript (strict)
- **3D/WebXR**: Three.js r181 via `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`
- **Animation**: GSAP 3.13, Three.js AnimationMixer
- **Pathfinding**: Custom recursive path-finding with obstacle avoidance (see `pathfinding.ts`)
- **Styling**: Tailwind CSS v4 with PostCSS plugin (`@import "tailwindcss"` syntax)

## Critical Architecture Patterns

### 1. SSR Prevention for Three.js
All 3D components must avoid server-side rendering. Two patterns enforced:

```tsx
// Pattern 1: Dynamic import in page component (app/page.tsx)
const SceneCanvas = dynamic(() => import('@/components/SceneCanvas'), { ssr: false });

// Pattern 2: 'use client' directive in all SceneCanvas/* components
'use client';
import { useFrame } from '@react-three/fiber';
```

**Why**: Three.js requires browser APIs (`window`, `WebGL`). Next.js 16 server components crash without these guards.

### 2. State Management via SceneContext
Global scene state flows through React Context (`components/utils/SceneContext.tsx`):

```tsx
interface SceneContextType {
  focusedHotspot: 'pc' | 'ps5' | 'phone' | 'portrait' | null;
  targetPosition: Vector3 | null;         // Where avatar should walk
  currentPath: SimplePath | null;         // Active pathfinding path
  isAvatarMoving: boolean;
}
```

**Data flow**:
1. User clicks hotspot → `Room.tsx` calls `setFocusedHotspot()` + `setTargetPosition()`
2. `Avatar.tsx` reads `targetPosition` → calculates path → starts walking
3. `TopBar.tsx` reads `focusedHotspot` → shows contextual CTA button
4. Avatar reaches destination → calls `setIsAvatarMoving(false)` → plays pointing animation

### 3. Pathfinding Architecture
**Location**: `components/utils/pathfinding.ts` (750+ lines)

**Key concepts**:
- **Obstacle definitions**: Hardcoded `OBSTACLES` array with box/circle shapes for furniture (desk, couch, TV stand, bed, etc.)
- **Wall definitions**: `WALLS` array defines L-shaped room boundaries as line segments
- **Collision detection**: `checkLineObstacleCollision()` samples points along path, checks against all obstacles
- **Recursive waypoint generation**: `findAllPaths()` recursively tries waypoints around obstacles, returns ALL possible paths
- **Path ranking**: Paths sorted by collision-free status first, then distance

**Common pathfinding issues**:
- New furniture added to `Room.tsx` but not to `OBSTACLES` array → avatar walks through furniture
- Obstacle dimensions mismatch actual model scale → paths too tight or unnecessarily wide
- **Fix pattern**: Update `OBSTACLES` in `pathfinding.ts` when adding/moving furniture in `Room.tsx`

```tsx
// Example: Adding a new desk obstacle
const OBSTACLES: ObstacleShape[] = [
  // Existing obstacles...
  { 
    type: 'box', 
    center: new Vector3(-2.6, 0, -6.4), 
    width: 3.35,  // Match desk scale in Room.tsx
    depth: 3.0, 
    rotation: Math.PI / 2 
  },
];
```

### 4. Room Layout & Interaction Hotspots
**L-shaped floor plan** (defined in `Room.tsx`):
- **PC Section** (left): `[-3.6, 0, -9]` to `[-1.5, 0, 0]` — contains desk, monitor, chair
- **Living Section** (right): `[-1.5, 0, -9]` to `[5.3, 0, 0]` — contains TV, couch, bed, table
- **Hotspot positions** (clickable interaction points):
  - `pc`: Monitor at `[-2.6, -0.38, -6.4]` → CTA: "About Me"
  - `ps5`: TV screen at `[1.9, 1.425, -0.095]` → CTA: "Check VR Game"
  - `phone`: Phone on table at `[2.1, 0.63, -1.55]` → CTA: "Reach Out"
  - `portrait`: Wall art at `[1.4, 2, -8.85]` → CTA: "View All Projects"

**Hotspot interaction pattern**:
```tsx
// In Room.tsx - All hotspots use this pattern
<group
  onClick={(e) => {
    e.stopPropagation();           // Prevent floor click handler
    setFocusedHotspot('pc');       // Update context
  }}
  onPointerOver={(e) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  }}
  onPointerOut={() => {
    document.body.style.cursor = 'auto';
  }}
>
  <primitive object={model.scene.clone()} />
</group>
```

### 5. Tailwind v4 CSS Architecture
**Critical differences from v3**:
- Use `@import "tailwindcss"` (NOT `@tailwind base/components/utilities`)
- Custom theme values via `@theme inline` block in `globals.css`
- CSS variables in `:root` map to utilities: `bg-background`, `text-foreground`

```css
/* globals.css - Actual pattern used */
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

## Development Commands & Workflow

```bash
npm run dev      # Turbopack dev server on localhost:3000
npm run build    # Production build (type-checks + builds)
npm run start    # Serve production build locally
npm run lint     # ESLint v9 flat config
```

**Turbopack caveats**:
- Hot reload works for React components but may miss Three.js material changes
- If 3D scene doesn't update, hard refresh (Ctrl+Shift+R) to clear WebGL cache

## Common Gotchas & Solutions

### Issue: "Cannot find module './globals.css'"
**Cause**: TypeScript doesn't recognize CSS imports by default  
**Solution**: Ignore warning (runtime works) or add `declare module '*.css'` to type definitions

### Issue: Avatar walks through furniture
**Cause**: `OBSTACLES` array in `pathfinding.ts` doesn't match `Room.tsx` furniture  
**Solution**: After moving/adding furniture in `Room.tsx`, update corresponding obstacle in `pathfinding.ts` with same position/scale

### Issue: VR "Enter VR" button not showing
**Cause**: WebXR not supported in browser OR `xrStore` not configured correctly  
**Solution**: 
1. Check `isXRSupported` state in `SceneCanvas/index.tsx`
2. Test in Oculus Browser or Chrome with WebXR flag enabled
3. Requires HTTPS in production (WebXR security requirement)

### Issue: Performance drops in VR
**Causes & Solutions**:
- Too many point lights (>8) → Use `rectAreaLight` or baked lightmaps
- No frustum culling → Enable via `<OrbitControls />` or camera position checks
- Heavy models not compressed → Run Draco compression in Blender
- Target: 72fps (Quest 2) or 90fps (Quest 3)

## Asset Loading Patterns

### Loading GLB Models
```tsx
// Standard pattern (see Room.tsx)
const desk = useGLTF('/models/desk.glb');

// Later in JSX
<primitive 
  object={desk.scene.clone()}  // ALWAYS clone to reuse models
  position={[-2.6, 0, -6.4]}
  rotation={[0, Math.PI / 2, 0]}
  scale={[3.35, 2, 3]}
  castShadow
/>
```

**Why `.clone()`**: Without cloning, multiple instances share transformations (position/rotation update all instances).

### Loading Textures
```tsx
// Multi-texture loading (see Room.tsx floor)
const textures = useTexture({
  map: '/textures/floor/diff.jpg',
  normalMap: '/textures/floor/nor.jpg',
  roughnessMap: '/textures/floor/arm.jpg',
});

// Apply to material
<meshStandardMaterial 
  map={textures.map}
  normalMap={textures.normalMap}
  roughnessMap={textures.roughnessMap}
/>
```

## TypeScript Patterns

### Path Aliases
```tsx
// Use @/* for absolute imports (configured in tsconfig.json)
import { useScene } from '@/components/utils/SceneContext';
import Avatar from '@/components/SceneCanvas/Avatar';
```

### Type-Only Imports
```tsx
// Optimize bundle size with type-only imports
import type { Vector3, Group } from 'three';
import type { HotspotId } from '@/components/utils/SceneContext';
```

## Animation State Machine (Avatar)
**Current**: Mixamo character (`/models/character.glb`) with idle/walk animations loaded via `useAnimations` hook  
**Planned**: Add pointing animation refinement

**State flow** (in `Avatar.tsx`):
```
idle → [targetPosition set] → walking
walking → [distance < 0.1] → pointing
pointing → [2s timeout] → idle
```

**Movement logic** (`useFrame` hook):
1. Read `currentPath.getCurrentTarget()` from context
2. Calculate direction vector to target
3. Move at `moveSpeed * delta` toward target
4. Rotate to face direction at `rotationSpeed * delta`
5. When waypoint reached, call `currentPath.markCurrentReached()`

## XR/VR Implementation

### XR Store Configuration
```tsx
// SceneCanvas/index.tsx
const xrStore = createXRStore({ domOverlay: false });

// Manual enter button (NOT default overlay)
<button onClick={() => xrStore.enterVR()}>Enter VR</button>
```

### Input Parity Pattern
Desktop/mobile clicks and VR controller selects use SAME handlers:
```tsx
// Desktop/touch
onClick={(e) => { /* handler */ }}

// VR controllers (future)
onSelectStart={(e) => { /* same handler */ }}
```

## Advanced Patterns

### AnimationMixer Management
For GLB models with animations (speakers, avatar), use ref-based mixer pattern:

```tsx
// Room.tsx AnimatedSpeaker pattern
const mixerRef = useRef<AnimationMixer | null>(null);

useEffect(() => {
  const clonedScene = groupRef.current.children[0];
  const mixer = new AnimationMixer(clonedScene);
  mixerRef.current = mixer;
  
  model.animations.forEach((clip) => {
    mixer.clipAction(clip).play();
  });
  
  return () => mixer.stopAllAction(); // Cleanup
}, [model]);

useFrame((state, delta) => {
  mixerRef.current?.update(delta);
});
```

**Why separate mixer per instance**: Each cloned model needs its own mixer to animate independently.

### React.memo for Animated Components
Static animated components (speakers, ceiling hexagons) should be memoized:

```tsx
const MemoizedAnimatedSpeaker = memo(AnimatedSpeaker);
// Prevents re-renders when parent (Room) state changes
```

### Video Texture Pattern
For screens playing video (phone screen):

```tsx
const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);

useEffect(() => {
  const video = document.createElement('video');
  video.src = '/videos/demo.mp4';
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.play();
  
  const texture = new VideoTexture(video);
  setVideoTexture(texture);
  
  return () => video.pause();
}, []);

// Apply to material
<meshStandardMaterial map={videoTexture} emissive="#ffffff" />
```

### useFrame Color Cycling Pattern
RGB mood lighting uses sine-wave interpolation:

```tsx
useFrame((state) => {
  const time = state.clock.elapsedTime;
  const cycle = (time * 0.4) % 5; // 5-color cycle
  
  let lerpedColor;
  if (cycle < 1) {
    lerpedColor = color1.clone().lerp(color2, cycle);
  } else if (cycle < 2) {
    lerpedColor = color2.clone().lerp(color3, cycle - 1);
  }
  // ...more transitions
  
  meshRef.current.material.emissive.copy(lerpedColor);
});
```

**Performance note**: Only animate materials/lights in `useFrame` if needed. Use `memo()` to prevent unnecessary component re-renders.

## Known Limitations & TODOs

1. **Avatar**: Currently using Mixamo character with walk/idle animations — pointing animation needs refinement
2. **Camera**: Currently `OrbitControls` — needs GSAP transitions to over-shoulder views
3. **Pathfinding**: Custom recursive algorithm (788 lines) — works well but verbose, consider `three-pathfinding` library if adding complex multi-floor navigation
4. **VR Testing**: Not tested with actual headset — needs Quest 2/3 validation
5. **Mobile**: Touch tested on desktop browser only — needs real device testing
6. **Performance**: Many animated speakers/hexagons — may need LOD or culling on low-end devices

## Windows-Specific Development Notes
**Shell**: PowerShell (pwsh.exe) — use forward slashes `/` in npm scripts, backslashes `\` in PowerShell commands
**Line endings**: Git should use LF for consistency — verify `.gitattributes` if cloning on Windows

## Project Context Files
- **ARCHITECTURE.md**: Component hierarchy, data flow diagrams, technology layers
- **DEVELOPMENT.md**: Build status checklist, customization guide, debugging tips  
- **BUILD-COMPLETE.md**: Current implementation status, next steps, success metrics
- **QUICKSTART.md**: Step-by-step guide to add first 3D model from Mixamo
- **README.md**: Quick start, feature list, Next.js deployment instructions
