'use client';

import { useRef, useEffect, useState } from 'react';
import { Group, Vector3, AnimationMixer } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useScene } from '@/components/utils/SceneContext';
import { calculateSmoothPath, type SimplePath } from '@/components/utils/pathfinding';
import type { GLTF } from 'three-stdlib';

// Placeholder type - will be replaced with actual model type
type AvatarGLTF = GLTF & {
  nodes: any;
  materials: any;
};

interface AvatarProps {
  modelPath?: string;
}

export default function Avatar({ modelPath = '/models/avatar.glb' }: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const [currentPath, setCurrentPath] = useState<SimplePath | null>(null);
  const [avatarState, setAvatarState] = useState<'idle' | 'walking' | 'pointing'>('idle');
  const { targetPosition, setIsAvatarMoving, setFocusedHotspot } = useScene();

  // Load model and animations (placeholder until actual model is added)
  // const { scene, animations } = useGLTF(modelPath) as AvatarGLTF;
  // const { actions, mixer } = useAnimations(animations, groupRef);

  // Movement parameters
  const moveSpeed = 2; // units per second
  const rotationSpeed = 5; // radians per second

  useEffect(() => {
    if (targetPosition && groupRef.current) {
      const currentPos = groupRef.current.position.clone();
      const path = calculateSmoothPath(currentPos, targetPosition);
      setCurrentPath(path);
      setAvatarState('walking');
      setIsAvatarMoving(true);
    }
  }, [targetPosition, setIsAvatarMoving]);

  useFrame((state, delta) => {
    if (!groupRef.current || !currentPath) return;

    const target = currentPath.getCurrentTarget();
    if (!target) {
      // Path complete
      setCurrentPath(null);
      setAvatarState('pointing');
      setIsAvatarMoving(false);
      
      // Return to idle after pointing
      setTimeout(() => {
        setAvatarState('idle');
      }, 2000);
      return;
    }

    // Move toward target
    const currentPos = groupRef.current.position;
    const direction = new Vector3().subVectors(target, currentPos);
    const distance = direction.length();

    if (distance < 0.1) {
      // Reached waypoint
      currentPath.markCurrentReached();
      return;
    }

    // Move
    direction.normalize();
    const moveAmount = moveSpeed * delta;
    currentPos.add(direction.multiplyScalar(Math.min(moveAmount, distance)));

    // Rotate to face movement direction
    const targetRotation = Math.atan2(direction.x, direction.z);
    const currentRotation = groupRef.current.rotation.y;
    const rotationDiff = targetRotation - currentRotation;
    const normalizedDiff = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff));
    groupRef.current.rotation.y += Math.sign(normalizedDiff) * Math.min(Math.abs(normalizedDiff), rotationSpeed * delta);
  });

  // Placeholder avatar until actual model is loaded
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Simple capsule representation for MVP */}
      <mesh position={[0, 1, 0]} castShadow>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      {/* Head indicator */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#60a5fa" />
      </mesh>

      {/* Direction indicator (nose) */}
      <mesh position={[0, 1.8, 0.25]} castShadow>
        <coneGeometry args={[0.1, 0.2, 8]} />
        <meshStandardMaterial color="#1e3a8a" />
      </mesh>
    </group>
  );
}

// Preload the model (when actual model path is available)
// useGLTF.preload('/models/avatar.glb');
