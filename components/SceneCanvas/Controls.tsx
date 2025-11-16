// Controls.tsx
"use client";
import { forwardRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES } from "../utils/animationHelpers";
import { TOUCH } from "three";

type Props = {
  enabled: boolean | undefined;
};

const Controls = forwardRef<any | null, Props>(({ enabled = false }, ref) => {
  // drei will forward the underlying three OrbitControls instance via the ref
  return (
    <OrbitControls
      ref={ref}
      enabled={enabled}
      enablePan={enabled}
      enableRotate={false}
      enableZoom={false}
      enableDamping
      dampingFactor={0.08}
      target0={DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES}
      touches={{
        ONE: TOUCH.DOLLY_PAN, // One finger = rotate
      }}
      // minPolarAngle={Math.PI / 3}
      // maxPolarAngle={Math.PI / 3}
    />
  );
});
Controls.displayName = "Controls";
export default Controls;
