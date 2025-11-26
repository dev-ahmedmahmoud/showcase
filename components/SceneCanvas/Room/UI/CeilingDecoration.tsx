"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, PointLight, Color, Mesh, MeshStandardMaterial } from "three";

const applyStandardMaterialEffect = (
  group: Group | null,
  effect: (material: MeshStandardMaterial) => void
) => {
  if (!group) return;
  group.traverse((object) => {
    if (object instanceof Mesh) {
      const material = object.material;
      if (
        !Array.isArray(material) &&
        material instanceof MeshStandardMaterial
      ) {
        effect(material);
      }
    }
  });
};

function CeilingHexagon({
  position,
  offset = 0,
}: {
  position: [number, number, number];
  offset?: number;
}) {
  const groupRef = useRef<Group>(null);
  const lightRef = useRef<PointLight | null>(null);
  const darkBlue = new Color("#0040ff"); // Dark blue
  const darkPurple = new Color("#4B0082"); // Dark purple (indigo)

  useFrame((state) => {
    const time = state.clock.elapsedTime + offset;

    // Alternate between dark blue and dark purple
    const cycle = (time * 0.4) % 2;
    let lerpedColor;

    if (cycle < 1) {
      // Dark blue → Dark purple
      lerpedColor = darkBlue.clone().lerp(darkPurple, cycle);
    } else {
      // Dark purple → Dark blue
      lerpedColor = darkPurple.clone().lerp(darkBlue, cycle - 1);
    }

    const intensity = Math.sin(time * 1.5) * 0.3 + 0.7;

    applyStandardMaterialEffect(groupRef.current, (material) => {
      material.emissive.copy(lerpedColor);
      material.emissiveIntensity = 3 + intensity * 2;
    });

    if (lightRef.current) {
      lightRef.current.color.copy(lerpedColor);
      lightRef.current.intensity = 2 + intensity * 10;
    }
  });

  // Create 6 edges for hollow hexagon
  const edges = [];
  const radius = 1.8; // Increased from 1.2 for larger, more prominent hexagons
  const thickness = 0.08; // Slightly thicker edges for better visibility
  for (let i = 0; i < 6; i++) {
    const angle1 = (Math.PI / 3) * i;
    const angle2 = (Math.PI / 3) * (i + 1);
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const rotation = Math.atan2(y2 - y1, x2 - x1);

    edges.push({ x: centerX, y: centerY, length, rotation });
  }

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        {edges.map((edge, i) => (
          <mesh
            key={i}
            position={[edge.x, edge.y, 0]}
            rotation={[0, 0, edge.rotation]}
          >
            <boxGeometry args={[edge.length, thickness, thickness]} />
            <meshStandardMaterial
              color="#0040ff"
              emissive="#0040ff"
              emissiveIntensity={4}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function CeilingDecoration() {
  return (
    //Ceiling Hexagon Lights - Proper honeycomb tessellation
    <group position={[2.3, 3.99, -4.5]}>
      {/* Perfect honeycomb: radius=1.8, spacing=3.12 (radius*√3) horizontal, 2.7 (radius*1.5) vertical */}

      <CeilingHexagon position={[-1.58, -0.03, 2.7]} />

      <CeilingHexagon position={[-4.6, -0.01, -2.7]} />

      <CeilingHexagon position={[-1.58, -0.01, -2.7]} />

      {/* Center hexagon */}
      <CeilingHexagon position={[0, 0, 0]} />

      {/* Left neighbor - shares edge */}
      <CeilingHexagon position={[-3.12, 0, 0]} />

      {/* Top-right - offset honeycomb position */}
      <CeilingHexagon position={[1.56, 0, -2.7]} />

      {/* Bottom-right - offset honeycomb position */}
      <CeilingHexagon position={[1.56, 0, 2.7]} />
    </group>
  );
}
