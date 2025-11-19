"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { Preload } from "@react-three/drei";
import type { Camera } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Lighting from "./Lighting";
import Room from "./Room";
import Avatar from "./Avatar";
import CameraController from "./CameraController";
import ClickIndicator from "./ClickIndicator";
// import PathDebugger from './PathDebugger';
import { useScene } from "@/components/utils/SceneContext";
import { isTouchDevice } from "../utils/helperFunc";
import Controls from "./Controls";
import { DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES } from "../utils/animationHelpers";

// Create XR store for VR support with custom button (disable default overlay)

interface SceneContentProps {
  cameraRef: React.RefObject<Camera | null>;
  toggleControlsRef: React.RefObject<((enabled: boolean) => void) | null>;
}

function SceneContent({ cameraRef, toggleControlsRef }: SceneContentProps) {
  const { targetPosition } = useScene();
  const [isTouch] = useState<boolean | undefined>(() => isTouchDevice());
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const toggleControls = useCallback((enable: boolean) => {
    if (controlsRef.current) {
      if (enable) {
        controlsRef.current.target.copy(DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES);
      }
      controlsRef.current.enabled = enable;
    }
  }, []);

  // Forward camera reference to parent
  useEffect(() => {
    if (cameraRef) {
      cameraRef.current = camera;
      toggleControlsRef.current = toggleControls;
    }
  }, [camera, cameraRef, toggleControls, toggleControlsRef]);

  return (
    <>
      {/* Camera control */}
      <CameraController controlsRef={controlsRef} controlsEnabled={isTouch} />

      {/* Lighting */}
      <Lighting />

      {/* Scene */}
      <Room toggleControls={toggleControls} />
      <Avatar />

      {/* Click indicator */}
      <ClickIndicator position={targetPosition} />

      {/* Debug visualization */}
      {/* <PathDebugger /> */}

      {/* Controls - rotate enabled on mobile/tablet only */}
      <Controls ref={controlsRef} enabled={isTouch} />

      {/* Preload assets */}
      <Preload all />
    </>
  );
}

interface SceneCanvasProps {
  cameraRef: React.RefObject<Camera | null>;
  toggleControlsRef: React.RefObject<((enabled: boolean) => void) | null>;
}

export default function SceneCanvas({
  cameraRef,
  toggleControlsRef,
}: SceneCanvasProps) {
  return (
    <div className="relative h-screen w-screen">
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{ visibility: "visible" }}
      >
        {/* Black background to hide the loading process */}
        <color attach="background" args={["#000000"]} />
        <SceneContent
            cameraRef={cameraRef}
            toggleControlsRef={toggleControlsRef}
          />
      </Canvas>
    </div>
  );
}
