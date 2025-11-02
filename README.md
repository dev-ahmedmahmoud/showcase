# WebXR Portfolio Showroom

An interactive 3D portfolio showcasing frontend development and VR skills in a stylish gaming-room environment. Built with Next.js 16, React 19, Three.js, and WebXR support for VR headsets.

## Features

- 🎮 **Interactive 3D Environment** - Gaming-room aesthetic with RGB lighting
- 👤 **Animated Avatar** - Character that walks to interaction points
- 🎯 **Three Hotspots** - PC (About Me), PS5 TV (VR Game), Phone (Contact)
- 🥽 **VR Support** - Full WebXR support for VR headsets (Quest, etc.)
- 📱 **Responsive** - Works on Desktop, Tablet, and Mobile
- ⚡ **Smooth Transitions** - GSAP-powered camera movements
- 🎨 **RGB Mood Lighting** - Dynamic colored lights for atmosphere

## Tech Stack

- **Framework**: Next.js 16.0.1 (App Router)
- **React**: 19.2.0
- **3D/WebXR**: Three.js, @react-three/fiber, @react-three/drei, @react-three/xr
- **Animation**: GSAP, Three.js AnimationMixer
- **Styling**: Tailwind CSS v4
- **TypeScript**: Strict mode enabled

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd showcase

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### VR Testing

To test in VR:
1. Click "Enter VR" button at the bottom of the screen
2. Put on your VR headset (Quest, Vive, etc.)
3. Use controller rays to interact with hotspots

## Project Structure

```
showcase/
├── app/
│   ├── layout.tsx          # Root layout with fonts
│   ├── page.tsx            # Main page with SceneCanvas
│   └── globals.css         # Tailwind v4 config
├── components/
│   ├── SceneCanvas/
│   │   ├── index.tsx       # Main R3F Canvas with XR
│   │   ├── Room.tsx        # 3D room and props
│   │   ├── Avatar.tsx      # Animated character
│   │   ├── InteractionHotspot.tsx  # Clickable hotspots
│   │   └── Lighting.tsx    # RGB mood lighting
│   ├── UI/
│   │   ├── TopBar.tsx      # CTA buttons & Back button
│   │   └── Loader.tsx      # Loading progress
│   └── utils/
│       ├── SceneContext.tsx     # React context for scene state
│       ├── animationHelpers.ts  # Animation state machine
│       └── pathfinding.ts       # Movement calculations
└── public/
    └── models/             # GLB 3D models (to be added)
```

## Next Steps

### Phase 1: Add 3D Models
1. Download a rigged character from [Mixamo](https://www.mixamo.com)
2. Add walk, idle, and pointing animations
3. Place in `public/models/avatar.glb`
4. Uncomment model loading code in `Avatar.tsx`

### Phase 2: Enhance Room
1. Get free 3D models from [Poly Haven](https://polyhaven.com) or [Sketchfab](https://sketchfab.com)
2. Replace placeholder geometry with realistic props
3. Add more detail to gaming setup

### Phase 3: Optimize Performance
1. Use Draco compression for large models
2. Bake lightmaps for static geometry
3. Add LODs (Level of Detail) for complex meshes
4. Target: 60fps Desktop, 30fps Mobile, 72-90fps VR

### Phase 4: Polish
1. Add spatial audio for ambience
2. Implement analytics tracking
3. Add loading screen with progress
4. Create demo video for portfolio

## Development Commands

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Run production build
npm run lint     # Run ESLint
```

## Deployment

Deploy to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/showcase)

Or manually:
```bash
npm run build
vercel deploy
```

## Resources

- **Models**: [Mixamo](https://www.mixamo.com), [Poly Haven](https://polyhaven.com), [Sketchfab](https://sketchfab.com)
- **Textures**: [Poly Haven Textures](https://polyhaven.com/textures), [AmbientCG](https://ambientcg.com)
- **3D Editor**: [Blender](https://www.blender.org) (free, open-source)
- **Docs**: [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber), [Three.js](https://threejs.org/docs), [WebXR](https://immersiveweb.dev)

## License

MIT

## Credits

Built following the WebXR Portfolio Showroom specification. Fonts from [Vercel's Geist](https://vercel.com/font).

