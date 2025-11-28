import { useGLTF } from "@react-three/drei";

export default function RoomFurnish() {
  const sweeper = useGLTF("/models/sweeper.glb");
  const bed = useGLTF("/models/bed.glb");
  const purifier = useGLTF("/models/purifier.glb");
  const couch = useGLTF("/models/couch.glb");

  return (
    <group>
      <primitive
        object={couch.scene.clone()}
        position={[2, 0.15, -3]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[1.5, 2.5, 1.5]}
        castShadow
      />
      <primitive
        object={sweeper.scene.clone()}
        position={[0.3, 0.15, -8.2]}
        scale={0.2}
      />
      <primitive
        object={bed.scene.clone()}
        rotation={[0, -Math.PI / 2, 0]}
        position={[2.8, 0, -6.4]}
        scale={1.5}
      />
      <primitive
        object={purifier.scene.clone()}
        rotation={[0, -Math.PI / 7.3, 0]}
        position={[-1, 0, -4]}
        scale={0.3}
      />
    </group>
  );
}
