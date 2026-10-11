"use client";

import { isValidWalkablePosition } from "@/components/utils/pathfinding";
import { useScene } from "@/components/utils/SceneContext";
import { useTexture } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";

export default function Floor() {
  const floorTextures = useTexture({
    map: "/textures/floor/diff.jpg",
    normalMap: "/textures/floor/nor.jpg",
    roughnessMap: "/textures/floor/arm.jpg",
  });
  const { setTargetPosition } = useScene();

  const handleFloorClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const clickPosition = event.point;

    // Validate that the clicked position is walkable (not on furniture)
    if (!isValidWalkablePosition(clickPosition)) {
      // Invalid position: clicked on furniture or too close to obstacles
      return;
    }

    // Clone the position to ensure React detects the change
    setTargetPosition(clickPosition.clone());
  };

  return (
    <group>
      {/* L-SHAPED FLOOR - Two sections */}
      {/* PC Section (Left part of L) - 5.1x9 meters (width reduced by 15%, length increased by 1.5x) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-2.5, 0, -4.5]}
        receiveShadow
        name="floor"
        onClick={handleFloorClick}
      >
        <planeGeometry args={[2, 9]} />
        <meshStandardMaterial
          map={floorTextures.map}
          normalMap={floorTextures.normalMap}
          roughnessMap={floorTextures.roughnessMap}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* PS5/Living Section (Right part of L) - 6.8x9 meters (width reduced by 15%, length increased by 1.5x) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.9, 0, -4.5]}
        receiveShadow
        name="floor"
        onClick={handleFloorClick}
      >
        <planeGeometry args={[6.8, 9]} />
        <meshStandardMaterial
          map={floorTextures.map}
          normalMap={floorTextures.normalMap}
          roughnessMap={floorTextures.roughnessMap}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      {/* ============================================ */}
    </group>
  );
}

// Same URL order as the useTexture objects in Floor and Walls (Object.values order = cache key)
useTexture.preload([
  "/textures/floor/diff.jpg",
  "/textures/floor/nor.jpg",
  "/textures/floor/arm.jpg",
]);
