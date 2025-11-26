import PS5WallLighting from "./PS5WallLighting";
import PS5WallRGBHexagons from "./PS5WallRGBHexagons";

export default function PS5AreaWallDecoration() {
  return (
    <group>
      <PS5WallRGBHexagons />
      <PS5WallLighting />
    </group>
  );
}
