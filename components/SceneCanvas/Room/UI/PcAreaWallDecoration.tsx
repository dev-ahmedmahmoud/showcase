import RGBLEDStripWithRectLight from "./RGBLEDStripWtihRectLighting";

export default function PcAreaWallDecoration() {
  return (
    <group>
      {/* RGB Strip Wall Light above PC Desk */}
      <RGBLEDStripWithRectLight
        position={[-3, 4, -6.7]}
        rotation={[0, -Math.PI / 2, 0]}
        width={2}
        height={1.135}
        intensity={80}
        color="#ff0080"
        stripColorIntensity={2}
      />
    </group>
  );
}
