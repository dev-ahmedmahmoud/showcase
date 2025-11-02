# Quick Start: Adding Your First 3D Model

This guide will get you from placeholder geometry to a real animated character in ~30 minutes.

## Step 1: Get a Character from Mixamo (10 mins)

1. **Go to Mixamo**: https://www.mixamo.com
2. **Sign in** with Adobe account (free)
3. **Select a Character**:
   - Browse the Characters tab
   - Popular choices: "X Bot", "Y Bot", "Mutant", "Knight"
   - Click on any character you like

4. **Download with Idle Animation**:
   - In the Animations panel, search "Idle"
   - Select "Idle" animation
   - Click **Download**
   - Settings:
     - Format: **FBX for Unity (.fbx)**
     - Skin: **With Skin**
     - FPS: **30**
     - Keyframe Reduction: **None**
   - Download

5. **Download Walk Animation**:
   - Search "Walking"
   - Select "Walking" or "Walk" animation
   - Click **Download** with same settings
   - Download

6. **Download Pointing Animation**:
   - Search "Pointing" or "Angry Gesture" or "Wave"
   - Select any gesture animation you like
   - Click **Download** with same settings
   - Download

## Step 2: Convert to GLB using Blender (10 mins)

### Install Blender (if not already)
- Download from https://www.blender.org/download/
- Free and open-source

### Import and Convert

1. **Open Blender** → New File

2. **Delete default cube**: Select cube, press X, confirm

3. **Import FBX**:
   - File → Import → FBX (.fbx)
   - Select your downloaded Idle FBX
   - Click "Import FBX"

4. **Import Additional Animations**:
   - File → Import → FBX (.fbx)
   - Select Walk animation FBX
   - **IMPORTANT**: Check "Automatic Bone Orientation" OFF
   - Import
   - Repeat for Pointing animation

5. **Verify Animations**:
   - In the Dope Sheet (bottom panel), you should see multiple actions
   - Rename them in the Action Editor: "idle", "walk", "pointing"

6. **Export as GLB**:
   - Select the character armature (the skeleton)
   - File → Export → glTF 2.0 (.glb/.gltf)
   - Settings:
     - Format: **glTF Binary (.glb)**
     - Include: **Selected Objects** (checked)
     - Transform: **+Y Up** (checked)
     - Data:
       - Compression: **None** (or enable Draco if you have it)
       - Animation: **Animation** (checked)
       - Shape Keys: **Shape Keys** (checked)
   - File name: `avatar.glb`
   - Click **Export glTF 2.0**

## Step 3: Add to Your Project (5 mins)

1. **Copy GLB File**:
   ```bash
   # Place the exported avatar.glb in public/models/
   cp path/to/avatar.glb public/models/avatar.glb
   ```

2. **Update Avatar.tsx**:

   Open `components/SceneCanvas/Avatar.tsx` and replace the placeholder section:

   ```tsx
   // BEFORE (comment out or delete):
   // const { scene, animations } = useGLTF(modelPath) as AvatarGLTF;
   // const { actions, mixer } = useAnimations(animations, groupRef);

   // AFTER (uncomment):
   const { scene, animations } = useGLTF(modelPath) as AvatarGLTF;
   const { actions, mixer } = useAnimations(animations, groupRef);
   ```

   Then find the placeholder geometry section and replace:

   ```tsx
   // BEFORE:
   return (
     <group ref={groupRef} position={[0, 0, 0]}>
       <mesh position={[0, 1, 0]} castShadow>
         <capsuleGeometry args={[0.3, 1, 8, 16]} />
         <meshStandardMaterial color="#3b82f6" />
       </mesh>
       {/* ... more placeholder geometry ... */}
     </group>
   );

   // AFTER:
   return (
     <group ref={groupRef} position={[0, 0, 0]}>
       <primitive object={scene} scale={0.01} />
     </group>
   );
   ```

   **Note**: Adjust the `scale` value based on your model size. Mixamo characters are typically large, so 0.01 is a good starting point.

3. **Configure Animation Names**:

   In the same file, update the animation mapping to match your Mixamo animation names:

   ```tsx
   useEffect(() => {
     if (actions) {
       // Map your animation names (check Blender Action Editor for exact names)
       const idleAction = actions['idle'] || actions['Idle'];
       const walkAction = actions['walk'] || actions['Walking'];
       
       if (idleAction) {
         idleAction.play();
         setAvatarState('idle');
       }
     }
   }, [actions]);
   ```

4. **Save and Test**:
   - The dev server will hot-reload
   - Check http://localhost:3000
   - You should see your character!

## Step 4: Troubleshooting

### Character is too big/small
- Adjust the `scale` prop: `<primitive object={scene} scale={0.01} />`
- Try values: 0.005, 0.01, 0.02, 0.05

### Character is sideways or upside down
- Add rotation: `<primitive object={scene} scale={0.01} rotation={[0, Math.PI, 0]} />`

### Animations don't play
1. Check animation names in Blender (Dope Sheet → Action Editor)
2. Update the animation name mapping in `Avatar.tsx`
3. Console.log `actions` to see available animations:
   ```tsx
   useEffect(() => {
     if (actions) {
       console.log('Available animations:', Object.keys(actions));
     }
   }, [actions]);
   ```

### Character is all black
- Add better lighting or check if materials imported correctly
- Try: `<primitive object={scene} scale={0.01} castShadow receiveShadow />`

### Model won't load
- Verify file path: `public/models/avatar.glb`
- Check browser console for 404 errors
- Ensure file extension is `.glb` not `.glb.glb`

## Optional: No Blender Alternative

If you don't want to use Blender, you can:

1. **Use online converter**:
   - https://products.aspose.app/3d/conversion/fbx-to-glb
   - Upload your FBX, download GLB
   - **Note**: May not preserve all animations correctly

2. **Use gltf-transform CLI**:
   ```bash
   npm install -g @gltf-transform/cli
   gltf-transform optimize input.glb output.glb
   ```

## Next Steps After First Model

1. ✅ Test clicking hotspots → character should walk
2. ✅ Verify animations play (idle, walk)
3. 🎨 Adjust lighting to showcase your character
4. 🎥 Record a demo video for your portfolio
5. 🚀 Deploy to Vercel

## Free Model Alternatives to Mixamo

- **Ready Player Me**: https://readyplayer.me (custom avatars)
- **Sketchfab**: https://sketchfab.com (filter: Downloadable + Rigged)
- **Poly Haven**: https://polyhaven.com (CC0 models)

---

**Time Investment**: ~30 minutes  
**Difficulty**: Beginner-friendly  
**Result**: Animated 3D character in your portfolio! 🎉
