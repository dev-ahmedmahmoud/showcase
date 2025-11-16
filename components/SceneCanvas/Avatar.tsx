'use client';

import { Suspense, useRef, useEffect, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { useScene } from '@/components/utils/SceneContext';
import { calculateSmoothPath, type SimplePath } from '@/components/utils/pathfinding';

interface AvatarProps {
  modelPath?: string;
}

function AvatarModel({ modelPath = '/models/character.glb' }: AvatarProps) {
  const groupRef = useRef<Group>(null);
  const [avatarState, setAvatarState] = useState<'idle' | 'walking' | 'pointing'>('idle');
  const currentAnimationRef = useRef<'idle' | 'walking' | 'pointing'>('idle');
  const { targetPosition, setIsAvatarMoving, setFocusedHotspot, currentPath, setCurrentPath } = useScene();

  // Load GLB model
  const { scene, animations } = useGLTF(modelPath);
  
  // Set initial position to center of room
  useEffect(() => {
    if (groupRef.current && !targetPosition) {
      groupRef.current.position.set(0.5, 0, -4);
    }
  }, [targetPosition]);

  // Setup model
  useEffect(() => {
    if (scene) {
      scene.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      
      // Log available animations
      console.log('GLB Animations available:', animations.length);
      animations.forEach((anim, i) => {
        console.log(`  [${i}] ${anim.name} - Duration: ${anim.duration.toFixed(2)}s`);
      });
    }
  }, [scene, animations]);

  // Load animations from GLB
  const { actions } = useAnimations(animations, groupRef);

  // Movement parameters
  const moveSpeed = 2; // units per second
  const rotationSpeed = 5; // radians per second
  
  // Helper function to switch animations immediately
  const switchAnimation = (newState: 'idle' | 'walking' | 'pointing') => {
    if (!actions || currentAnimationRef.current === newState) return;
    
    const actionNames = Object.keys(actions);
    const idleAction = actionNames.find(name => name.toLowerCase().includes('idle'));
    const walkAction = actionNames.find(name => name.toLowerCase().includes('walk'));
    
    // Stop all animations
    if (walkAction && actions[walkAction]) {
      actions[walkAction].stop();
    }
    if (idleAction && actions[idleAction]) {
      actions[idleAction].stop();
    }
    
    // Play the appropriate animation
    if (newState === 'idle' && idleAction && actions[idleAction]) {
      actions[idleAction].reset().play();
      console.log('IMMEDIATELY switched to idle animation');
    } else if (newState === 'walking' && walkAction && actions[walkAction]) {
      actions[walkAction].reset().play();
      console.log('IMMEDIATELY switched to walk animation');
    }
    
    currentAnimationRef.current = newState;
  };

  // Initialize idle animation on mount - ensure it plays immediately
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    const actionNames = Object.keys(actions);
    const idleAction = actionNames.find(name => name.toLowerCase().includes('idle'));
    
    if (idleAction && actions[idleAction]) {
      // Force play idle animation immediately on load
      actions[idleAction].reset().play();
      currentAnimationRef.current = 'idle';
      console.log('Initial idle animation started');
    }
  }, [actions]);

  useEffect(() => {
    if (targetPosition && groupRef.current) {
      const currentPos = groupRef.current.position.clone();
      const path = calculateSmoothPath(currentPos, targetPosition);
      setCurrentPath(path);
      setAvatarState('walking');
      setIsAvatarMoving(true);
      switchAnimation('walking');
    }
  }, [targetPosition, setIsAvatarMoving, setCurrentPath]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // If no path, ensure we're in idle state
    if (!currentPath) {
      if (avatarState !== 'idle') {
        setAvatarState('idle');
        setIsAvatarMoving(false);
        switchAnimation('idle');
      }
      return;
    }

    const target = currentPath.getCurrentTarget();
    if (!target) {
      // Path complete - return to idle immediately
      console.log('PATH COMPLETE - Switching to idle NOW');
      setCurrentPath(null);
      setAvatarState('idle');
      setIsAvatarMoving(false);
      switchAnimation('idle');
      return;
    }

    // Move toward target
    const currentPos = groupRef.current.position;
    const direction = new Vector3().subVectors(target, currentPos);
    const distance = direction.length();

    if (distance < 0.1) {
      // Reached waypoint
      currentPath.markCurrentReached();
      
      // Check if this was the last waypoint
      const nextTarget = currentPath.getCurrentTarget();
      if (!nextTarget) {
        // No more waypoints - stop immediately
        console.log('LAST WAYPOINT REACHED - Switching to idle NOW');
        setCurrentPath(null);
        setAvatarState('idle');
        setIsAvatarMoving(false);
        switchAnimation('idle');
      }
      return;
    }

    // Ensure we're in walking state while moving
    if (avatarState !== 'walking') {
      setAvatarState('walking');
      switchAnimation('walking');
    }

    // Move
    direction.normalize();
    const moveAmount = moveSpeed * delta;
    currentPos.add(direction.multiplyScalar(Math.min(moveAmount, distance)));

    // Instantly rotate to face movement direction (no smooth rotation)
    const targetRotation = Math.atan2(direction.x, direction.z);
    groupRef.current.rotation.y = targetRotation;
  });

  // Render the GLB character model
  return (
    <group ref={groupRef} position={[-1, 0, -2]}>
      <primitive 
        object={scene} 
        scale={1.5}
        dispose={null}
      />
    </group>
  );
}

// Main Avatar component with Suspense boundary
export default function Avatar(props: AvatarProps) {
  return (
    <Suspense fallback={null}>
      <AvatarModel {...props} />
    </Suspense>
  );
}

// Preload the GLB model
useGLTF.preload('/models/character.glb');
