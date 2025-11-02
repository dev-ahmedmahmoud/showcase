# WebXR Portfolio Showroom - Development Guide

## ✅ What's Been Built

### Core Infrastructure
- ✅ Next.js 16 + React 19 + TypeScript setup
- ✅ Tailwind CSS v4 configuration
- ✅ Three.js + React Three Fiber + XR ecosystem installed
- ✅ Complete component architecture

### 3D Scene Components
- ✅ **SceneCanvas** - Main R3F Canvas with XR support
- ✅ **Room** - Gaming room with placeholder geometry (floor, walls, props)
- ✅ **Avatar** - Character controller with movement and state machine (placeholder capsule for now)
- ✅ **InteractionHotspot** - 3 clickable/selectable hotspots (PC, PS5, Phone)
- ✅ **Lighting** - RGB mood lighting with colored point lights

### UI Components
- ✅ **TopBar** - Dynamic CTA buttons based on focused hotspot + Back button
- ✅ **Loader** - Asset loading progress indicator

### Utilities
- ✅ **SceneContext** - React context for scene state management
- ✅ **animationHelpers** - Animation state machine for avatar
- ✅ **pathfinding** - Simple path calculation (straight-line for MVP)

## 🎯 Current Status

The app is **fully functional** with placeholder geometry:
- ✅ Server running on http://localhost:3000
- ✅ 3D scene renders with RGB lighting
- ✅ Three hotspots are clickable
- ✅ Avatar (placeholder capsule) moves when hotspots clicked
- ✅ Camera follows avatar (via OrbitControls for now)
- ✅ TopBar shows contextual CTAs
- ✅ "Enter VR" button ready for WebXR
- ✅ Responsive layout

## 🚀 Next Steps

### Priority 1: Add Real 3D Models (1-2 days)
1. **Get Avatar from Mixamo**:
   - Go to https://www.mixamo.com
   - Select a character (X Bot, Y Bot, or any)
   - Download with animations: Idle, Walk, Pointing
   - Convert FBX to GLB using Blender (see `public/models/README.md`)
   - Place as `public/models/avatar.glb`
   - Uncomment model loading code in `Avatar.tsx`

2. **Optional: Replace Room Geometry**:
   - Current room uses primitive boxes (functional but basic)
   - Can add detailed 3D models from Poly Haven or Sketchfab
   - Or enhance existing geometry with better materials/textures

### Priority 2: Camera Transitions (1 day)
- Currently uses OrbitControls (good for testing)
- Need GSAP-based camera transitions to over-shoulder view
- Implement in `SceneCanvas/index.tsx` based on `focusedHotspot` state

### Priority 3: VR Polish (1-2 days)
- Test XR button functionality with actual headset
- Add VR controller interaction (ray select)
- Implement comfort features (fade transitions, vignette)
- Optimize for VR framerate (72-90fps)

### Priority 4: Performance Optimization (1 day)
- Compress models with Draco
- Bake lightmaps for static geometry
- Add LODs for complex meshes
- Test on mobile devices

### Priority 5: Content & Polish (1 day)
- Update hotspot CTAs with real links
- Add actual portfolio content pages
- Implement analytics tracking
- Create demo video/screenshots

## 📝 Known Issues

### TypeScript Warning
- `Cannot find module './globals.css'` - This is a false positive
- CSS imports work fine at runtime
- Can be safely ignored or fixed with `declare module '*.css'` in a type definition file

### XR Controller Events
- Using standard `onClick` for now
- Will work with touch/pointer on desktop/mobile
- VR controller rays will need testing with actual headset

## 🧪 Testing Checklist

- [x] Desktop: Scene loads and hotspots clickable
- [x] Mobile: Touch events work (test on actual device)
- [ ] VR: Controller rays select hotspots (needs headset)
- [ ] Performance: Maintain 60fps on desktop
- [ ] Performance: Maintain 30fps on mobile
- [ ] Performance: Maintain 72-90fps in VR

## 🎨 Customization Guide

### Change Hotspot Positions
Edit `components/SceneCanvas/Room.tsx`:
```tsx
<InteractionHotspot id="pc" position={[-4, 0.02, -2]} />
```

### Change CTA Buttons
Edit `components/UI/TopBar.tsx`:
```tsx
const HOTSPOT_CONTENT = {
  pc: { title: 'Your Title', cta: 'Button Text', href: '/your-link' },
  // ...
}
```

### Adjust Lighting Colors
Edit `components/SceneCanvas/Lighting.tsx`:
```tsx
<pointLight position={[-3, 2, 2]} color="#ff0080" intensity={2} />
```

### Modify Avatar Movement Speed
Edit `components/SceneCanvas/Avatar.tsx`:
```tsx
const moveSpeed = 2; // units per second
const rotationSpeed = 5; // radians per second
```

## 📚 Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Helpers](https://github.com/pmndrs/drei)
- [WebXR API](https://immersiveweb.dev/)
- [Mixamo Characters](https://www.mixamo.com)
- [Poly Haven Models](https://polyhaven.com)
- [Three.js Examples](https://threejs.org/examples)

## 🐛 Debugging Tips

### Scene Not Rendering
1. Check browser console for errors
2. Verify all dependencies installed: `npm install`
3. Clear Next.js cache: `rm -rf .next`

### Performance Issues
1. Open Chrome DevTools → Performance
2. Check FPS counter
3. Reduce polycount or light count
4. Disable shadows if needed

### VR Not Working
1. Ensure HTTPS (WebXR requires secure context)
2. Check browser console for WebXR errors
3. Verify headset connected and browser supports WebXR
4. Test in Oculus Browser or Chrome with WebXR flag

## 💡 Pro Tips

1. **Start Desktop-First**: Build and test all interactions on desktop before VR
2. **Use Chrome DevTools**: Three.js Inspector extension is invaluable
3. **Keep FPS High**: Monitor performance constantly, optimize early
4. **Test Early**: Try VR as soon as possible to catch comfort issues
5. **Iterate Quickly**: Use placeholder geometry to test interactions first

## 🎬 Demo Video Script

For portfolio/job applications, record a 20-30s video showing:
1. Desktop view with camera orbit
2. Clicking each hotspot (PC, PS5, Phone)
3. Avatar walking to each location
4. CTA buttons appearing
5. "Enter VR" transition
6. VR controller interaction

## 📞 Support

Check `.github/copilot-instructions.md` for detailed architectural guidance and conventions.

---

**Status**: MVP Foundation Complete ✅  
**Next Milestone**: Add Real 3D Models  
**Time to Full Feature**: ~5-7 days  
**Current State**: Functional with placeholder geometry
