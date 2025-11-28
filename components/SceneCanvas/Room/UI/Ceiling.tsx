"use client";

export default function Ceiling({ ceilingHeightOffset = 0 }: { ceilingHeightOffset?: number }) {
  return (
    <group>
      {/* CEILING - Matches L-shape floor */}
      {/* PC Section Ceiling - Dark base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-2.7, 4.005 + ceilingHeightOffset, -6.75]}>
        <planeGeometry args={[2, 4.65]} />
        <meshStandardMaterial color="#0a0a1a" side={2} />
      </mesh>
      {/* PS5 Section Ceiling - Dark base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[1.8, 4.005 + ceilingHeightOffset, -4.5]}>
        <planeGeometry args={[7, 9.2]} />
        <meshStandardMaterial color="#0a0a1a" side={2} />
      </mesh>

      {/* ============================================ */}
    </group>
  );
}
