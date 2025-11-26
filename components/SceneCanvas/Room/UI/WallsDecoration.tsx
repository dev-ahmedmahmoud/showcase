import PcAreaWallDecoration from "./PcAreaWallDecoration";
import PS5AreaWallDecoration from "./PS5AreaWallDecoration";
import PortraitDisplayWallDecoration from "./PortraitDisplayWallDecoration";
import Pegboards from "./Pegboards";

export default function WallsDecoration({ isVR }: { isVR: boolean }) {
  return (
    <group>
      {!isVR && <Pegboards />}
      <PcAreaWallDecoration />
      <PS5AreaWallDecoration />
      <PortraitDisplayWallDecoration />
    </group>
  );
}
