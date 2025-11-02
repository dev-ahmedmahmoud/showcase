'use client';

import InteractionHotspot from './InteractionHotspot';

export default function Room() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.8} metalness={0.2} />
      </mesh>

      {/* Walls - gaming room aesthetic */}
      {/* Back wall */}
      <mesh position={[0, 2.5, -5]} receiveShadow>
        <boxGeometry args={[20, 5, 0.2]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Side walls */}
      <mesh position={[-10, 2.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      <mesh position={[10, 2.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 5, 0.2]} />
        <meshStandardMaterial color="#0a0a0a" />
      </mesh>

      {/* Props - Placeholder geometry for PC, PS5, Phone */}
      
      {/* PC Rig - left side */}
      <group position={[-4, 0, -3]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.8, 1, 0.8]} />
          <meshStandardMaterial color="#2a2a2a" emissive="#ff0080" emissiveIntensity={0.2} />
        </mesh>
        <InteractionHotspot id="pc" position={[-4, 0.02, -2]} />
      </group>

      {/* PS5 TV - center back */}
      <group position={[0, 1.5, -4.5]}>
        <mesh castShadow>
          <boxGeometry args={[3, 2, 0.1]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#00ff80" emissiveIntensity={0.3} />
        </mesh>
        <InteractionHotspot id="ps5" position={[0, 0.02, -3]} />
      </group>

      {/* Phone on table - right side */}
      <group position={[4, 0.8, -1]}>
        {/* Table */}
        <mesh position={[0, -0.3, 0]} castShadow>
          <boxGeometry args={[1.5, 0.1, 1]} />
          <meshStandardMaterial color="#3a3a3a" />
        </mesh>
        {/* Phone */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.15, 0.01, 0.3]} />
          <meshStandardMaterial color="#1a1a1a" emissive="#0080ff" emissiveIntensity={0.4} />
        </mesh>
        <InteractionHotspot id="phone" position={[4, 0.02, -0.5]} />
      </group>

      {/* Ambient geometry - decorative cubes with RGB */}
      <mesh position={[-6, 0.5, 2]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#ff0080" emissive="#ff0080" emissiveIntensity={0.5} />
      </mesh>

      <mesh position={[6, 0.5, 2]} castShadow>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="#00ff80" emissive="#00ff80" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}
