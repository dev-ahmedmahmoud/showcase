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
import { isTouchDevice, isVRHeadsetBrowser } from "../utils/helperFunc";
import Controls from "./Controls";
import { DEFAULT_CAMERA_LOOK_AT_FOR_MOBILE_DEVICES } from "../utils/animationHelpers";
import VRAvatar from "./VRAvatar";
// VRAvatars will be imported when created


// XR store is only initialized if running in a VR headset browser
let xrStore: ReturnType<typeof createXRStore> | null = null;


interface SceneContentProps {
  cameraRef: React.RefObject<Camera | null>;
  toggleControlsRef: React.RefObject<((enabled: boolean) => void) | null>;
  isVR: boolean;
}

function SceneContent({ cameraRef, toggleControlsRef, isVR }: SceneContentProps) {
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
      {/* Camera control and Controls only for non-VR */}
      {!isVR && <CameraController controlsRef={controlsRef} controlsEnabled={isTouch} />}

      {/* Lighting */}
      <Lighting />

      {/* Scene */}
      <Room toggleControls={toggleControls} isVR={isVR} />
      {/* Avatar logic: VR = arms only (handled later), else full avatar */}
      {!isVR && <Avatar />}
      {isVR && <VRAvatar />}

      {/* Click indicator only for non-VR */}
      {!isVR && <ClickIndicator position={targetPosition} />}

      {/* Debug visualization */}
      {/* <PathDebugger /> */}

      {/* Controls - rotate enabled on mobile/tablet only, not in VR */}
      {!isVR && <Controls ref={controlsRef} enabled={isTouch} />}

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
  const [isPresenting, setIsPresenting] = useState(false);
  const [isVR, setIsVR] = useState(false);

  useEffect(() => {
    (async () => {
      if (await isVRHeadsetBrowser()) {
        xrStore = createXRStore();
        setIsVR(true);
      }
    })();
  }, []);

  const handleEnterVR = () => {
    xrStore?.enterVR();
    setIsPresenting(true);
  };

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
        <color attach="background" args={["#000000"]} />
        {isVR ? (
          <XR store={xrStore!}>
            <SceneContent
              cameraRef={cameraRef}
              toggleControlsRef={toggleControlsRef}
              isVR={true}
            />
          </XR>
        ) : (
          <SceneContent
            cameraRef={cameraRef}
            toggleControlsRef={toggleControlsRef}
            isVR={false}
          />
        )}
      </Canvas>
    </div>
  );
}
