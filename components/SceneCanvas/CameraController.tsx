"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { animateCamera } from "../utils/animationHelpers";

interface ICameraControllerProps {
  controlsRef: React.RefObject<any>;
  controlsEnabled: boolean | undefined;
}

export default function CameraController({
  controlsRef,
  controlsEnabled,
}: ICameraControllerProps) {
  const { camera } = useThree();

  useEffect(() => {
    if (controlsEnabled === undefined) return;

    const controls = controlsRef?.current ?? null;
    const shouldManageControls = !!controls && !!controlsEnabled;

    // disable temporarily only if controls are enabled on this device
    if (shouldManageControls) {
      controls.reset();
    }
    // Animate camera to initial position
    animateCamera(camera);
  }, [camera, controlsEnabled]);

  return null;
}
