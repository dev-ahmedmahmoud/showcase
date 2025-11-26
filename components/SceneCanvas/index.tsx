"use client";

import { useState, useEffect, useCallback, useRef, forwardRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { XR, createXRStore } from "@react-three/xr";
import { Preload } from "@react-three/drei";
import type { Camera, Group } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import Lighting from "./Lighting";
import Room from "./Room";
import Avatar from "./Avatar";
import CameraController from "./CameraController";
import ClickIndicator from "./ClickIndicator";
// import PathDebugger from './PathDebugger';
import { useScene } from "@/components/utils/SceneContext";
import { isTouchDevice, isVRHeadsetBrowser } from "../utils/helperFunc";
import Controls from "./Controls";
import { DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES } from "../utils/animationHelpers";
import FPSMeter from "../utils/FPSMeter";
// VRAvatars will be imported when created

// XR store is only initialized if running in a VR headset browser
let xrStore: ReturnType<typeof createXRStore> | null = null;

interface SceneContentProps {
  cameraRef: React.RefObject<Camera | null>;
  toggleControlsRef: React.RefObject<((enabled: boolean) => void) | null>;
  isVR: boolean;
  isPresenting: boolean;
}

const SceneContent = forwardRef(function SceneContent(
  { cameraRef, toggleControlsRef, isVR, isPresenting }: SceneContentProps,
  ref
) {
  const { targetPosition } = useScene();
  const [isTouch] = useState<boolean | undefined>(() => isTouchDevice());
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  const toggleControls = useCallback((enable: boolean) => {
    if (controlsRef.current) {
      if (enable) {
        controlsRef.current.target.copy(
          DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES
        );
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
    <group ref={ref}>
      {/* Camera control and Controls only for non-VR */}
      {!isPresenting && (
        <CameraController
          controlsRef={controlsRef}
          controlsEnabled={isVR && isPresenting ? false : isTouch}
        />
      )}

      {/* Lighting */}
      <Lighting />

      {/* Scene */}
      <Room
        toggleControls={toggleControls}
        isVR={isVR}
        isPresenting={isPresenting}
      />
      {/* Avatar logic: VR = arms only (handled later), else full avatar */}
      {!isPresenting && <Avatar />}

      {/* Click indicator only for non-VR */}
      {!isPresenting && <ClickIndicator position={targetPosition} />}

      {/* Debug visualization */}
      {/* <PathDebugger /> */}

      {/* Controls - rotate enabled on mobile/tablet only, not in VR */}
      {!isPresenting && (
        <Controls
          ref={controlsRef}
          enabled={isVR && isPresenting ? false : isTouch}
        />
      )}

      {/* Preload assets */}
      <Preload all />
      {/* FPS meter for VR dev mode only */}
      {process.env.NODE_ENV === "development" && <FPSMeter enabled />}
    </group>
  );
});

interface SceneCanvasProps {
  cameraRef: React.RefObject<Camera | null>;
  toggleControlsRef: React.RefObject<((enabled: boolean) => void) | null>;
}

export default function SceneCanvas({
  cameraRef,
  toggleControlsRef,
}: SceneCanvasProps) {
  const [isPresenting, setIsPresenting] = useState(false);
  const [isVR, setIsVR] = useState(false);
  const worldRef = useRef<Group>(null);

  useEffect(() => {
    (async () => {
      if (await isVRHeadsetBrowser()) {
        xrStore = createXRStore();
        setIsVR(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (isPresenting && worldRef.current) {
      // Example: spawn user at (5, 0, -3)
      const spawn = { x: 0.5, y: 0, z: -4 };
      // Move the world so the user's head (0,0,0) matches the spawn
      worldRef.current.position.set(-spawn.x, -spawn.y, -spawn.z)
    }
  }, [isPresenting, cameraRef.current]);

  const handleEnterVR = () => {
    xrStore?.enterVR();
    setIsPresenting(true);
  };

  // VR-specific renderer optimizations
  // const onCreated = (state: any) => {
  //   if (isVR) {
  //     // Lower pixel ratio for VR
  //     state.gl.setPixelRatio(1);
  //     // Lower shadow map resolution
  //     if (state.gl.shadowMap) {
  //       state.gl.shadowMap.enabled = true;
  //       state.gl.shadowMap.type = 2; // PCFSoftShadowMap
  //     }
  //   }
  // };

  return (
    <div className="relative h-screen w-screen">
      {/* Custom Enter VR button for VR-capable browsers and WebXR support */}
      {isVR && xrStore && !isPresenting && (
        <button
          style={{
            position: "absolute",
            zIndex: 10,
            top: 24,
            right: 24,
            padding: "12px 24px",
            background: "#111",
            color: "#fff",
            borderRadius: "8px",
            fontSize: "1.2rem",
            border: "none",
            cursor: "pointer",
          }}
          onClick={handleEnterVR}
        >
          Enter VR
        </button>
      )}
      <Canvas
        shadows
        gl={{
          antialias: true,
          alpha: false,
        }}
        style={{ visibility: "visible" }}
      >
        {/* Black background to hide the loading process */}
        <color attach="background" args={["#ffffff"]} />
        {isVR ? (
          <XR store={xrStore!}>
            <SceneContent
              ref={worldRef}
              cameraRef={cameraRef}
              toggleControlsRef={toggleControlsRef}
              isVR={true}
              isPresenting={isPresenting}
            />
          </XR>
        ) : (
          <SceneContent
            cameraRef={cameraRef}
            toggleControlsRef={toggleControlsRef}
            isVR={false}
            isPresenting={false}
          />
        )}
      </Canvas>
    </div>
  );
}
