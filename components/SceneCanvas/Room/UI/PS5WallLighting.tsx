import RGBLEDStripWithRectLight from "./RGBLEDStripWtihRectLighting";

function AnimatedLEDPanel({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, 0]}>
      <boxGeometry args={[0.4, 0.02, 0.05]} />
      <meshStandardMaterial
        color="#9932cc"
        emissive="#9932cc"
        emissiveIntensity={3}
      />
    </mesh>
  );
}

export default function PS5WallLighting() {
  return (
    <group>
      <RGBLEDStripWithRectLight
        position={[1.85, 3.25, -0.61]}
        rotation={[0, 0, 0]}
        width={2.8}
        height={2}
        intensity={40}
        color="#9932cc"
        stripColorIntensity={2}
      />

      {/* Animated LED Panel Lights Behind TV */}
      <group position={[1.875, 2.1, -0.08]}>
        {/* 3x3 grid of LED panels */}
        <AnimatedLEDPanel position={[-1.2, 0.2, -0.025]} />
        <AnimatedLEDPanel position={[-0.6, 0.2, -0.025]} />
        <AnimatedLEDPanel position={[0, 0.2, -0.025]} />
        <AnimatedLEDPanel position={[0.6, 0.2, -0.025]} />
        <AnimatedLEDPanel position={[1.2, 0.2, -0.025]} />

        <AnimatedLEDPanel position={[-1.2, -0.4, -0.025]} />
        <AnimatedLEDPanel position={[-0.6, -0.4, -0.025]} />
        <AnimatedLEDPanel position={[0, -0.4, -0.025]} />
        <AnimatedLEDPanel position={[0.6, -0.4, -0.025]} />
        <AnimatedLEDPanel position={[1.2, -0.4, -0.025]} />
      </group>
    </group>
  );
}
