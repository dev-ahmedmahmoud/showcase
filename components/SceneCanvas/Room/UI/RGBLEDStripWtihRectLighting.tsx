export default function RGBLEDStripWithRectLight({
  position,
  rotation,
  width,
  height,
  intensity,
  color,
  stripColorIntensity,
}: {
  position?: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  intensity?: number;
  color?: string;
  stripColorIntensity?: number;
}) {
  return (
    <group position={position} rotation={rotation}>
      <rectAreaLight
        position={[0, 0, 0]}
        rotation={[-Math.PI / 4, 0, 0]}
        width={width}
        height={height}
        intensity={intensity}
        color={color}
      />

      <mesh position={[0, -0.45, 0.485]} rotation={[0, 0, 0]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={stripColorIntensity}
        />
      </mesh>
    </group>
  );
}
