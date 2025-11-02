# Architecture Overview

## Component Hierarchy

```
app/page.tsx (Home)
├── UI/TopBar (React DOM Overlay)
│   ├── CTA Buttons (dynamic based on hotspot)
│   └── Back Button (conditional)
│
└── SceneCanvas (Dynamic Import, Client-Side)
    └── SceneProvider (Context)
        └── Canvas (R3F)
            └── XR (WebXR Provider)
                ├── Suspense
                │   ├── Lighting
                │   │   ├── AmbientLight
                │   │   ├── DirectionalLight
                │   │   └── PointLights (RGB x4)
                │   │
                │   ├── Room
                │   │   ├── Floor (Plane)
                │   │   ├── Walls (Boxes)
                │   │   ├── Props (PC, TV, Phone)
                │   │   └── InteractionHotspots x3
                │   │       ├── PC Hotspot
                │   │       ├── PS5 Hotspot
                │   │       └── Phone Hotspot
                │   │
                │   ├── Avatar
                │   │   ├── Character Model (GLB)
                │   │   ├── AnimationMixer
                │   │   └── Movement Logic
                │   │
                │   ├── OrbitControls (Desktop)
                │   └── Preload
                │
                └── Loader (Fallback)
```

## Data Flow

```
User Interaction Flow:
┌─────────────────────────────────────────────────────────┐
│ 1. User clicks/taps/selects hotspot                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 2. InteractionHotspot.handlePointerDown()              │
│    - Calls setFocusedHotspot(id)                       │
│    - Calls setTargetPosition(position)                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│ 3. SceneContext updates global state                   │
│    - focusedHotspot: 'pc' | 'ps5' | 'phone'          │
│    - targetPosition: Vector3                           │
└────────┬───────────────────────────┬────────────────────┘
         │                           │
         ▼                           ▼
┌────────────────────┐    ┌─────────────────────────────┐
│ 4a. TopBar         │    │ 4b. Avatar                  │
│  - Reads context   │    │  - Reads targetPosition     │
│  - Shows CTA       │    │  - Creates path             │
│  - Shows Back btn  │    │  - Starts walking animation │
└────────────────────┘    └─────────────────────────────┘
                                      │
                                      ▼
                          ┌─────────────────────────────┐
                          │ 5. Avatar reaches target    │
                          │  - Stops walking            │
                          │  - Plays pointing animation │
                          │  - Sets isAvatarMoving false│
                          └─────────────────────────────┘
```

## State Management

```
SceneContext (React Context)
├── focusedHotspot: HotspotId | null
│   └── Controls which CTA button shows in TopBar
│
├── isAvatarMoving: boolean
│   └── Tracks if avatar is currently walking
│
├── targetPosition: Vector3 | null
│   └── Where avatar should walk to
│
└── Consumers:
    ├── TopBar (reads focusedHotspot)
    ├── Avatar (reads targetPosition)
    └── InteractionHotspot (writes all)
```

## Animation State Machine

```
Avatar States:
┌──────┐
│ IDLE │ ◄─────────┐
└──┬───┘           │
   │ moveTo()      │
   ▼               │
┌─────────┐        │
│ WALKING │        │
└────┬────┘        │
     │ arrive      │
     ▼             │
┌────────┐         │
│ ARRIVE │         │
└────┬───┘         │
     │             │
     ▼             │
┌──────────┐       │
│ POINTING │───────┘
└──────────┘ (2s timeout)
```

## File Organization by Concern

```
Presentation Layer (UI):
├── app/page.tsx                    # Main page layout
├── components/UI/TopBar.tsx        # Overlay UI
└── components/UI/Loader.tsx        # Loading state

3D Scene Layer:
├── components/SceneCanvas/index.tsx          # Canvas setup
├── components/SceneCanvas/Room.tsx           # Static geometry
├── components/SceneCanvas/Avatar.tsx         # Dynamic character
├── components/SceneCanvas/InteractionHotspot.tsx  # Interaction points
└── components/SceneCanvas/Lighting.tsx       # Light sources

State Management:
└── components/utils/SceneContext.tsx  # Global scene state

Business Logic:
├── components/utils/pathfinding.ts      # Movement calculations
└── components/utils/animationHelpers.ts # Animation state machine
```

## Technology Stack Layers

```
┌─────────────────────────────────────────┐
│ User Interface (HTML/CSS)               │
│ - TopBar, Loader                        │
│ - Tailwind CSS v4                       │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ React Layer                             │
│ - Next.js 16 (App Router)              │
│ - React 19 (Server + Client)           │
│ - Context API for state                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ 3D Framework Layer                      │
│ - @react-three/fiber (R3F)             │
│ - @react-three/drei (Helpers)          │
│ - @react-three/xr (WebXR)              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ Graphics Engine                         │
│ - Three.js (WebGL wrapper)             │
│ - AnimationMixer                        │
│ - glTF loader                          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│ Browser APIs                            │
│ - WebGL / WebGPU                       │
│ - WebXR Device API                     │
│ - RequestAnimationFrame                │
└─────────────────────────────────────────┘
```

## Performance Optimization Points

```
Asset Loading:
├── Lazy load SceneCanvas (dynamic import)
├── Suspense boundaries for async loading
├── useGLTF.preload() for critical models
└── Draco compression for large meshes

Rendering:
├── Baked lightmaps for static geometry
├── LOD (Level of Detail) for complex models
├── Frustum culling (automatic in Three.js)
└── Shadow map resolution tuning

Animation:
├── Single AnimationMixer per character
├── Blend between animations (fade in/out)
└── Update animations only when needed (useFrame)

State Updates:
├── Context updates trigger re-renders strategically
├── Memoization for expensive calculations
└── Ref-based updates for high-frequency changes
```

## WebXR Integration Points

```
Desktop/Mobile Mode:
User Input → Pointer Events → Raycasting → Mesh.onClick
                                              │
                                              ▼
                                    InteractionHotspot

VR Mode:
Controller → Ray → XR Hit Test → Mesh.onSelect
                                     │
                                     ▼
                           InteractionHotspot
                           (same handler!)
```

## Deployment Architecture

```
Development:
┌────────────┐
│ npm run dev│
│ (Turbopack)│
└──────┬─────┘
       │
       ▼
localhost:3000

Production:
┌────────────────┐
│ npm run build  │
│ (Next.js)      │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Static Export  │
│ + Server Funcs │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Vercel CDN     │
│ + Edge Runtime │
└───────┬────────┘
        │
        ▼
   Your Domain
```

---

## Key Design Decisions

### Why Dynamic Import for SceneCanvas?
- Three.js doesn't work with SSR (no `window`, `document`)
- Dynamic import with `ssr: false` ensures client-only rendering
- Improves initial page load time

### Why React Context for Scene State?
- Share state between DOM UI (TopBar) and 3D scene (Avatar)
- Lightweight compared to Redux/Zustand for this scope
- Easy to understand and debug

### Why Placeholder Geometry Initially?
- Allows testing interactions without waiting for 3D models
- Faster iteration during development
- Models can be swapped easily later

### Why GSAP for Camera Transitions?
- Predictable timeline-based animations
- Better easing functions than CSS
- Works well with Three.js camera properties

### Why Straight-Line Pathfinding First?
- Simpler to implement and debug
- Works well in open room environment
- Can be upgraded to navmesh later if needed

---

*See `.github/copilot-instructions.md` for detailed coding conventions and patterns.*
