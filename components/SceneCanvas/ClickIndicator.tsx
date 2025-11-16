'use client';

import { useRef, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';

interface ClickIndicatorProps {
  position: Vector3 | null;
  onComplete?: () => void;
}

export default function ClickIndicator({ position, onComplete }: ClickIndicatorProps) {
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!meshRef.current || !position) return;

    // Reset and animate
    timeRef.current = 0;
    meshRef.current.position.copy(position);
    meshRef.current.scale.set(0.1, 1, 0.1);
    meshRef.current.visible = true;

    // Reset material opacity
    if (meshRef.current.material && 'opacity' in meshRef.current.material) {
      (meshRef.current.material as any).opacity = 1;
    }

    // Kill any existing animations on this mesh
    gsap.killTweensOf(meshRef.current.scale);
    gsap.killTweensOf(meshRef.current.material);

    // Animate scale and fade out
    gsap.to(meshRef.current.scale, {
      x: 1.5,
      z: 1.5,
      duration: 0.8,
      ease: 'power2.out',
    });

    gsap.to(meshRef.current.material, {
      opacity: 0,
      duration: 0.8,
      ease: 'power2.out',
      onComplete: () => {
        if (meshRef.current) {
          meshRef.current.visible = false;
        }
        onComplete?.();
      },
    });
  }, [position, onComplete]);

  useFrame((state, delta) => {
    if (meshRef.current && meshRef.current.visible) {
      timeRef.current += delta * 3;
      // Add a ripple wave effect
      meshRef.current.rotation.z = timeRef.current;
    }
  });

  if (!position) return null;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.3, 0.4, 32]} />
      <meshBasicMaterial
        color="#00ffff"
        transparent
        opacity={1}
        depthWrite={false}
      />
    </mesh>
  );
}
