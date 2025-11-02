# WebXR Portfolio Showroom - AI Coding Instructions

## Project Overview
This is an interactive WebXR portfolio showcasing frontend career in a 3D gaming-room environment. Built with Next.js 16 (App Router) + React 19 + TypeScript + Three.js, featuring a rigged avatar, interactive hotspots, and full VR headset support. The project follows Next.js App Router conventions with server components where possible, and client components for WebXR/Three.js interactivity.

## Tech Stack
- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0 (latest with enhanced server components)
- **3D/WebXR**: Three.js via `@react-three/fiber`, `@react-three/drei`, `@react-three/xr`
- **Animation**: GSAP for camera/UI transitions, Three.js AnimationMixer for character
- **Pathfinding**: `three-pathfinding` for navmesh-based character movement
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/postcss` plugin)
- **TypeScript**: Strict mode enabled
- **Fonts**: Geist Sans & Geist Mono (optimized via `next/font/google`)

## Project Structure
```
app/                    # App Router pages & layouts
  layout.tsx           # Root layout with Geist fonts and dark mode support
  page.tsx             # Home page - wraps SceneCanvas
  globals.css          # Tailwind CSS v4 config with CSS variables
components/
  SceneCanvas/         # R3F canvas and XR wrapper
    index.tsx          # Main canvas wrapper with XR provider
    Room.tsx           # 3D room model with hotspots
    Avatar.tsx         # Rigged character with animations
    InteractionHotspot.tsx  # Clickable/selectable interaction points
    Lighting.tsx       # RGB mood lighting setup
  UI/
    TopBar.tsx         # CTA buttons + Back button
    Loader.tsx         # Asset loading progress
  utils/
    pathfinding.ts     # Navmesh pathfinding helpers
    animationHelpers.ts # Animation state machine utilities
public/
  models/              # GLB files (avatar, room, props)
```

## Key Conventions

### Component Patterns
- **Default to Server Components**: All components in `app/` are server components unless marked with `'use client'`
- **Export Pattern**: Use `export default function ComponentName()` for page/layout exports
- **Type Imports**: Use `import type { ... }` for type-only imports to optimize bundles

### Styling Approach
- **Tailwind v4 Syntax**: Use `@import "tailwindcss"` (not `@tailwind` directives)
- **CSS Variables**: Define design tokens in `:root` within `globals.css` using `@theme inline`
- **Dark Mode**: Automatic dark mode via `prefers-color-scheme` media queries
- **Utility-First**: Long className strings are standard (see `app/page.tsx` for examples)
- **Custom Colors**: Access via `bg-background`, `text-foreground` (mapped from CSS variables)

### TypeScript Configuration
- **Path Alias**: Use `@/*` for absolute imports from project root (e.g., `import { X } from "@/components/X"`)
- **Strict Mode**: All strict checks enabled
- **JSX**: Uses `react-jsx` transform (no need to import React)
- **Module Resolution**: `bundler` mode for Next.js compatibility

### File Naming & Organization
- Use lowercase with hyphens for directories when adding new folders
- Use PascalCase for component files (`.tsx`)
- Keep all route files in `app/` directory structure

## Development Workflow

### Essential Commands
```bash
npm run dev        # Start dev server on localhost:3000 (hot reload enabled)
npm run build      # Production build (checks types & linting)
npm run start      # Run production build locally
npm run lint       # Run ESLint (Next.js config with TypeScript support)
```

### ESLint Configuration
- Uses ESLint v9 flat config format (`eslint.config.mjs`)
- Includes `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Image Optimization
- Always use `next/image` component for images (see `app/page.tsx`)
- Static assets go in `public/` (referenced as `/filename.ext`)
- Add `priority` prop for above-the-fold images
- Use `className="dark:invert"` for SVG logos that need dark mode support

## WebXR & VR-Specific Considerations
- **Three interaction hotspots**: PC rig, PS5 TV, phone on table - trigger avatar movement + camera transitions + contextual CTAs
- **Input parity**: Pointer/touch (desktop/mobile) and VR controller ray selects must map to same hotspot activation logic
- **VR comfort**: Never teleport user's head position - use fade/vignette during transitions, keep framerate targets (72-90fps)
- **Camera behavior**: 
  - Desktop: smooth GSAP-based transitions to over-shoulder view when hotspot activated
  - VR: avatar moves, camera follows naturally without forcing head movement
- **Avatar state machine**: `idle → walking → arrive → pointing → idle`
- **Pathfinding**: Use `three-pathfinding` with navmesh for obstacle avoidance, or straight-line movement for MVP
- **XR Entry**: Provide explicit "Enter VR" button via `@react-three/xr` XRButton component

## Architecture Notes
- **React 19 Features**: This uses React 19's enhanced server component capabilities
- **Tailwind v4**: New version uses PostCSS plugin architecture, not JIT compiler
- **Next.js 16**: Leverages latest App Router optimizations and server actions

## Component Architecture & Responsibilities

### SceneCanvas/index.tsx
- Wraps `<Canvas>` from `@react-three/fiber` with `<XR>` from `@react-three/xr`
- Handles pointer clicks, taps, and VR controller ray selects
- Provides `SceneContext` for sharing camera/character state between UI & scene

### Room.tsx
- Loads 3D room model (GLB) with RGB mood lighting
- Places 3 hotspots with unique IDs: `pc`, `ps5`, `phone`
- Optionally loads navmesh for pathfinding

### Avatar.tsx
- Loads rigged GLB character with AnimationMixer
- API: `moveTo(position)`, `playGesture(name)`, `isMoving` state
- State machine: idle → walking → arrive → pointing

### InteractionHotspot.tsx
- Visual affordance (glowing disc or prop) with invisible collider
- Handles `onPointerDown` (desktop/touch) and XR `onSelect` events
- Triggers avatar movement and camera target change

### TopBar.tsx
- Dynamic CTA button based on focused hotspot ("About Me", "Check VR Game", "Reach Out")
- "Go Back" button appears during interaction, returns to default view

## Asset Optimization
- Use GLB (binary glTF) format exclusively
- Load via `useGLTF` from `@react-three/drei`
- Consider Draco compression for large meshes
- Bake lightmaps for static geometry to reduce runtime lights
- Target framerates: Desktop 60fps, Mobile 30fps, VR 72-90fps

## Common Tasks
- **New Page**: Create `app/[route]/page.tsx`
- **New Layout**: Create `app/[route]/layout.tsx` for nested layouts
- **Add 3D Component**: Create in `components/SceneCanvas/` with `'use client'` directive
- **Load Model**: Use `useGLTF('/models/filename.glb')` from drei, place GLB in `public/models/`
- **Metadata**: Export `metadata` object or `generateMetadata()` function from pages/layouts
- **Animation**: Use `useAnimations` hook from drei or Three.js AnimationMixer directly
