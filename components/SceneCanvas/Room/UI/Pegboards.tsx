"use client";

import { useGLTF } from "@react-three/drei";
import Model from "@/components/utils/Model";

export default function Pegboards() {
  const pegboard = useGLTF("/models/pegboard.glb");
  const controller1 = useGLTF("/models/controller1.glb");
  const controller2 = useGLTF("/models/controller2.glb");
  const controller3 = useGLTF("/models/controller3.glb");
  const controller4 = useGLTF("/models/controller4.glb");
  const psPortal = useGLTF("/models/ps_portal.glb");
  const headset1 = useGLTF("/models/headset1.glb");
  const headset2 = useGLTF("/models/headset2.glb");

  // 4 stacked Pegboard on vertical inner wall
  return (
    <group position={[-1.47, 2, -2.9]}>
      {/* Pegboards */}
      <Model
        object={pegboard.scene}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={[0.5, 0.25, 0.25]}
        castShadow
      />
      <Model
        object={pegboard.scene}
        position={[0, 0, 1.25]}
        rotation={[0, 0, 0]}
        scale={[0.5, 0.25, 0.25]}
        castShadow
      />
      <Model
        object={pegboard.scene}
        position={[0, 0.5, 0]}
        rotation={[0, 0, 0]}
        scale={[0.5, 0.25, 0.25]}
        castShadow
      />
      <Model
        object={pegboard.scene}
        position={[0, 0.5, 1.25]}
        rotation={[0, 0, 0]}
        scale={[0.5, 0.25, 0.25]}
        castShadow
      />

      {/* Controllers - 8 total (each type appears twice) */}
      {/* Controller 1 - Top Left & Bottom Right */}
      <Model
        object={controller1.scene}
        position={[0.05, -0.2, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
        scale={2.2}
        castShadow
      />
      <Model
        object={controller1.scene}
        position={[0.05, -0.2, 1.55]}
        rotation={[0, Math.PI / 2, 0]}
        scale={2.2}
        castShadow
      />

      {/* Controller 2 - Top Right & Bottom Left */}
      <Model
        object={controller2.scene}
        position={[0.05, 0.52, 1.55]}
        rotation={[0, 0, 0]}
        scale={1.8}
        castShadow
      />
      <Model
        object={controller2.scene}
        position={[0.05, 0.52, -0.3]}
        rotation={[0, 0, 0]}
        scale={1.8}
        castShadow
      />

      {/* Controller 3 - Middle Left (both) */}
      <Model
        object={controller3.scene}
        position={[0.05, 0.45, 0.35]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.006}
        castShadow
      />
      <Model
        object={controller3.scene}
        position={[0.05, 0.45, 0.9]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.006}
        castShadow
      />

      {/* Controller 4 - Center (both) */}
      <Model
        object={controller4.scene}
        position={[-0.225, -0.05, 0.35]}
        rotation={[Math.PI / 2, 0, -Math.PI / 2]}
        scale={1.8}
        castShadow
      />
      <Model
        object={controller4.scene}
        position={[-0.225, -0.05, 0.9]}
        rotation={[Math.PI / 2, 0, -Math.PI / 2]}
        scale={1.8}
        castShadow
      />

      {/* ps portal and headsets - Center (both) */}
      <Model
        object={headset1.scene}
        position={[0.11, 0.22, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.09}
        castShadow
      />
      <Model
        object={headset2.scene}
        position={[0.11, -0.225, 1.7]}
        rotation={[0, 0, 0]}
        scale={0.065}
        castShadow
      />
      <Model
        object={psPortal.scene}
        position={[0.11, 0.12, 0.6]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.5}
        castShadow
      />
    </group>
  );
}

// Start downloads at module load instead of waiting for the Suspense waterfall
useGLTF.preload("/models/pegboard.glb");
useGLTF.preload("/models/controller1.glb");
useGLTF.preload("/models/controller2.glb");
useGLTF.preload("/models/controller3.glb");
useGLTF.preload("/models/controller4.glb");
useGLTF.preload("/models/ps_portal.glb");
useGLTF.preload("/models/headset1.glb");
useGLTF.preload("/models/headset2.glb");
