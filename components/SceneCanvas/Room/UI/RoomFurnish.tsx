import { useGLTF } from "@react-three/drei";
import Model from "@/components/utils/Model";

export default function RoomFurnish() {
  const sweeper = useGLTF("/models/sweeper.glb");
  const bed = useGLTF("/models/bed.glb");
  const purifier = useGLTF("/models/purifier.glb");
  const couch = useGLTF("/models/couch.glb");

  return (
    <group>
      <Model
        object={couch.scene}
        position={[2, 0.15, -3]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[1.5, 2.5, 1.5]}
        castShadow
      />
      <Model
        object={sweeper.scene}
        position={[0.3, 0.15, -8.2]}
        scale={0.2}
      />
      <Model
        object={bed.scene}
        rotation={[0, -Math.PI / 2, 0]}
        position={[2.8, 0, -6.4]}
        scale={1.5}
      />
      <Model
        object={purifier.scene}
        rotation={[0, -Math.PI / 7.3, 0]}
        position={[-1, 0, -4]}
        scale={0.3}
      />
    </group>
  );
}

// Start downloads at module load instead of waiting for the Suspense waterfall
useGLTF.preload("/models/sweeper.glb");
useGLTF.preload("/models/bed.glb");
useGLTF.preload("/models/purifier.glb");
useGLTF.preload("/models/couch.glb");
