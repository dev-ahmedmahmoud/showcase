import RGBLEDStripWithRectLight from "./RGBLEDStripWtihRectLighting";

export default function PortraitDisplayWallDecoration() {
  return (
    <group>
      <RGBLEDStripWithRectLight
        position={[0.3, 3.55, -8.4]}
        rotation={[0, Math.PI, 0]}
        width={2}
        height={2}
        intensity={80}
        color="#0040ff"
        stripColorIntensity={2}
      />
    </group>
  );
}
