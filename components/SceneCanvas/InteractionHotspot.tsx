'use client';

import { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useScene, type HotspotId } from '@/components/utils/SceneContext';

interface InteractionHotspotProps {
  id: HotspotId;
  position: [number, number, number];
  onActivate?: () => void;
}

export default function InteractionHotspot({ id, position, onActivate }: InteractionHotspotProps) {
  const meshRef = useRef<Mesh>(null);
  const { setFocusedHotspot, setTargetPosition } = useScene();

  // Animate the hotspot (gentle pulse)
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const handlePointerDown = () => {
    if (id) {
      setFocusedHotspot(id);
      setTargetPosition(new Vector3(...position));
      onActivate?.();
    }
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerDown={handlePointerDown}
      onClick={handlePointerDown}
    >
      {/* Visual affordance - glowing disc */}
      <cylinderGeometry args={[0.3, 0.3, 0.05, 32]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#00ffff"
        emissiveIntensity={1}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
