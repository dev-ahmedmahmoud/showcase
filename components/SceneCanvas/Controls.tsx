// Controls.tsx
"use client";
import { forwardRef, useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES } from "../utils/animationHelpers";
import { TOUCH } from "three";

type Props = {
  enabled: boolean | undefined;
};

const ROOM_PAN_LIMITS = {
  minZ: -8.0,
  maxZ: -0.8,
  targetY: DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES.y,
};

type OrbitControlsInternal = OrbitControlsImpl & {
  pan?: (deltaX: number, deltaY: number) => void;
};

const Controls = forwardRef<OrbitControlsImpl | null, Props>(
  ({ enabled = false }, ref) => {
    const isClampingRef = useRef(false);

    useEffect(() => {
      if (!enabled || typeof ref === "function") return;
      const controls = ref?.current as OrbitControlsInternal | null;
      if (!controls) return;

      const originalPan = controls.pan?.bind(controls);
      if (originalPan) {
        controls.pan = function panOnlyHorizontal(deltaX: number) {
          originalPan(deltaX, 0); // ignore vertical delta
        };
      }

      const clampPan = () => {
        if (isClampingRef.current) return;

        const target = controls.target;
        const camera = controls.object;
        const offsetZ = camera.position.z - target.z;
        const offsetY = camera.position.y - target.y;

        const clampedZ = Math.min(
          Math.max(target.z, ROOM_PAN_LIMITS.minZ),
          ROOM_PAN_LIMITS.maxZ
        );
        const clampedY = ROOM_PAN_LIMITS.targetY;
        const hasChange = clampedZ !== target.z || clampedY !== target.y;

        if (!hasChange) return;

        isClampingRef.current = true;
        target.z = clampedZ;
        target.y = clampedY;
        camera.position.z = target.z + offsetZ;
        camera.position.y = target.y + offsetY;
        controls.update();
        isClampingRef.current = false;
      };

      clampPan();
      controls.addEventListener("change", clampPan);
      return () => {
        controls.removeEventListener("change", clampPan);
        if (originalPan) {
          controls.pan = originalPan;
        }
      };
    }, [enabled, ref]);

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
        target={DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES}
        touches={{
          ONE: TOUCH.PAN, // Allow single-finger drag to pan
          TWO: TOUCH.DOLLY_PAN, // Two fingers can also pan (and would zoom if enabled)
        }}
      />
    );
  }
);
Controls.displayName = "Controls";
export default Controls;
