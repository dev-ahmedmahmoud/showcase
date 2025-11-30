"use client";

import { useTexture } from "@react-three/drei";

export default function Walls({
  wallHeightOffset = 0,
}: {
  wallHeightOffset?: number;
}) {
  const wallTextures = useTexture({
    map: "/textures/floor/diff.jpg",
    normalMap: "/textures/floor/nor.jpg",
    roughnessMap: "/textures/floor/arm.jpg",
  });
  return (
    <group>
      {/* WALLS - L-SHAPED ROOM */}

      {/* PC Section Walls */}
      {/* Left wall (PC section) */}
      <mesh
        position={[-3.6, 2, -6.7]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[4.62, 4 + wallHeightOffset, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* PS5 Section Walls */}
      {/* Front of TV (PS5 section) */}
      <mesh position={[0.8, 2, -9]} receiveShadow>
        <boxGeometry args={[9, 4 + wallHeightOffset, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* Behind TV (PS5 section) */}
      <mesh position={[1.8, 2, 0]} receiveShadow>
        <boxGeometry args={[6.95, 4 + wallHeightOffset, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* Next to TV (PS5 section) */}
      <mesh position={[5.4, 2, -4.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9.25, 4 + wallHeightOffset, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>


      {/* Inner Walls - Creating the L-shape partition */}
      {/* Vertical inner wall (separates PC from PS5 section) */}
      <mesh position={[-1.6, 2, -2.25]} receiveShadow>
        <boxGeometry args={[0.2, 4 + wallHeightOffset, 4.3]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* Horizontal inner wall (connects to vertical wall) */}
      <mesh position={[-2.5, 2, -4.5]} receiveShadow>
        <boxGeometry args={[2, 4 + wallHeightOffset, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* ============================================ */}
    </group>
  );
}
