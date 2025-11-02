# 3D Models Directory

This directory should contain your GLB (binary glTF) 3D models.

## Required Models

### Avatar (`avatar.glb`)
- **Source**: [Mixamo](https://www.mixamo.com)
- **Requirements**:
  - Rigged humanoid character (any style)
  - Must include animations: Idle, Walk, Pointing (or similar gesture)
  - Recommended polycount: 5k-15k triangles
  - Export as FBX from Mixamo, convert to GLB using Blender

**Mixamo Export Settings:**
1. Select a character (e.g., "X Bot", "Y Bot")
2. Download with animations:
   - Idle
   - Walking
   - Pointing (or "Angry Gesture", "Waving")
3. Format: FBX for Unity (.fbx)
4. Frames per second: 30
5. Skin: With Skin

**Converting to GLB in Blender:**
1. File → Import → FBX
2. File → Export → glTF 2.0 (.glb)
3. Include: Selected Objects, Animations
4. Format: glTF Binary (.glb)

### Room (Optional)
You can create a custom room model in Blender and export it, or use the procedural room geometry already in `Room.tsx`.

### Props (Optional Enhancement)
- Gaming PC case
- Monitor/TV
- Desk
- Gaming chair
- Decorative items

## Free Model Sources

- **Mixamo**: Characters and animations (requires Adobe account)
- **Poly Haven**: CC0 licensed models and textures
- **Sketchfab**: Filter by "Downloadable" + license
- **CGTrader**: Free section (check licenses)
- **TurboSquid**: Free models (check licenses)

## Model Optimization Tips

1. **Reduce Polycount**: Use Blender's Decimate modifier
2. **Compress Textures**: Resize to power-of-2 (1024x1024, 2048x2048)
3. **Use Draco Compression**: Reduces file size significantly
4. **Bake Lighting**: For static objects, bake ambient occlusion/lighting to textures
5. **Single Material**: Merge materials when possible to reduce draw calls

## glTF Validation

Before using models, validate them:
```bash
npm install -g gltf-validator
gltf-validator avatar.glb
```

## Current Setup

The app will work with placeholder geometry until you add actual models. The `Avatar.tsx` component currently uses simple capsule geometry as a placeholder.

To activate real model loading:
1. Place your `avatar.glb` file in this directory
2. Uncomment the model loading code in `components/SceneCanvas/Avatar.tsx`
3. Adjust animation names if different from defaults

## Performance Targets

- Desktop: 60fps
- Mobile: 30fps  
- VR: 72-90fps (depends on headset)

Keep total scene polycount under:
- Desktop: 500k triangles
- Mobile: 100k triangles
- VR: 200k triangles
