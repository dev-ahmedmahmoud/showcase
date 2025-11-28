"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, PointLight, Color, MeshStandardMaterial } from "three";

function AnimatedHexagon({
  position,
  offset = 0,
}: {
  position: [number, number, number];
  offset?: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight | null>(null);
  const darkPink = new Color("#c71585"); // Dark pink
  const purple = new Color("#9932cc"); // Purple
  const darkBlue = new Color("#191970"); // Dark blue

  useFrame((state) => {
    const time = state.clock.elapsedTime + offset;

    // Cycle through 5 colors: dark pink → purple → dark blue → purple → dark pink
    const cycle = (time * 0.4) % 5;
    let lerpedColor;

    if (cycle < 1) {
      // Dark pink → Purple
      lerpedColor = darkPink.clone().lerp(purple, cycle);
    } else if (cycle < 2) {
      // Purple → Dark blue
      lerpedColor = purple.clone().lerp(darkBlue, cycle - 1);
    } else if (cycle < 3) {
      // Dark blue → Purple
      lerpedColor = darkBlue.clone().lerp(purple, cycle - 2);
    } else if (cycle < 4) {
      // Purple → Dark pink
      lerpedColor = purple.clone().lerp(darkPink, cycle - 3);
    } else {
      // Hold on dark pink
      lerpedColor = darkPink.clone();
    }

    const intensity = Math.sin(time * 2) * 0.5 + 0.5; // Oscillates between 0 and 1

    if (meshRef.current) {
      const material = meshRef.current.material;
      if (
        !Array.isArray(material) &&
        material instanceof MeshStandardMaterial
      ) {
        material.emissive.copy(lerpedColor);
        material.emissiveIntensity = 3 + intensity * 3; // 3 to 6
      }
    }

    if (lightRef.current) {
      lightRef.current.color.copy(lerpedColor);
      lightRef.current.intensity = 2 + intensity * 2; // 2 to 4
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={position}
        rotation={[Math.PI / 2, Math.PI / 2, 0]}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.03, 6]} />
        <meshStandardMaterial
          color="#c71585"
          emissive="#c71585"
          emissiveIntensity={5}
        />
      </mesh>
    </>
  );
}

export default function PS5WallRGBHexagons() {
  //RGB Hexagon Lights - Right Side of TV (Honeycomb Pattern with Gradient Animation)
  return (
    <group>
      <group position={[-0.5, 1.8, -0.1]}>
        <group>
          <AnimatedHexagon position={[-0.48, 0.5, 0]} offset={0.3} />
          <AnimatedHexagon position={[-0.48, 0.066, 0]} offset={1.3} />
          <AnimatedHexagon position={[-0.48, -0.37, 0]} offset={2.3} />
        </group>

        <group position={[-0.1, 0.022, 0]}>
          <AnimatedHexagon position={[0, 0.26, 0]} offset={0.8} />
          <AnimatedHexagon position={[0, -0.17, 0]} offset={1.8} />
          <AnimatedHexagon position={[0, -0.6, 0]} offset={2.8} />
        </group>
      </group>

      {/* RGB Hexagon Lights - Left Side of TV (Honeycomb Pattern with Gradient Animation) */}
      <group position={[4.6, 1.8, -0.1]}>
        <group>
          <AnimatedHexagon position={[0, 0.5, 0]} offset={0.3} />
          <AnimatedHexagon position={[0, 0.066, 0]} offset={1.3} />
          <AnimatedHexagon position={[0, -0.37, 0]} offset={2.3} />
        </group>

        <group position={[0.11, 0.025, 0]}>
          <AnimatedHexagon position={[-0.48, 0.26, 0]} offset={0.8} />
          <AnimatedHexagon position={[-0.48, -0.17, 0]} offset={1.8} />
          <AnimatedHexagon position={[-0.48, -0.6, 0]} offset={2.8} />
        </group>
      </group>
    </group>
  );
}
