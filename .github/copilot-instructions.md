# VR Showcase Project - AI Coding Instructions

## Project Overview
This is a Next.js 16 (App Router) + React 19 + TypeScript VR showcase application using Tailwind CSS v4. The project follows Next.js App Router conventions with server components by default.

## Tech Stack
- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0 (latest with enhanced server components)
- **Styling**: Tailwind CSS v4 (using `@tailwindcss/postcss` plugin)
- **TypeScript**: Strict mode enabled
- **Fonts**: Geist Sans & Geist Mono (optimized via `next/font/google`)

## Project Structure
```
app/                    # App Router pages & layouts
  layout.tsx           # Root layout with Geist fonts and dark mode support
  page.tsx             # Home page
  globals.css          # Tailwind CSS v4 config with CSS variables
public/                # Static assets (SVG icons)
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

## VR-Specific Considerations
This project is intended as a VR showcase. When adding VR features:
- Consider using WebXR-compatible libraries
- Implement responsive layouts that work both in 2D and VR contexts
- Test dark mode extensively as VR headsets often use dark environments

## Architecture Notes
- **React 19 Features**: This uses React 19's enhanced server component capabilities
- **Tailwind v4**: New version uses PostCSS plugin architecture, not JIT compiler
- **Next.js 16**: Leverages latest App Router optimizations and server actions

## Common Tasks
- **New Page**: Create `app/[route]/page.tsx`
- **New Layout**: Create `app/[route]/layout.tsx` for nested layouts
- **API Route**: Create `app/api/[route]/route.ts` with HTTP method exports
- **Metadata**: Export `metadata` object or `generateMetadata()` function from pages/layouts
- **Fonts**: Already configured in `app/layout.tsx`, apply via CSS variables in `globals.css`
