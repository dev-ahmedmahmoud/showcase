"use client";

import { Suspense, useEffect, useRef, useState, memo } from "react";
import {
  AnimationMixer,
  Group,
  Camera,
  Mesh,
} from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { HotspotId, useScene } from "@/components/utils/SceneContext";
import Loader from "@/components/UI/Loader";
import Portrait from "./Room/UI/Portrait";
import { animateCamera } from "../utils/animationHelpers";
import { isTouchDevice } from "../utils/helperFunc";
import {
  Walls,
  Ceiling,
  Floor,
  CeilingDecoration,
  WallsDecoration,
  PcSetup,
  PhoneOnTable,
  RoomFurnish,
  PS5Setup
} from "./Room/UI";

const applyTransparentOpacity = (group: Group | null, opacity: number) => {
  if (!group) return;
  group.traverse((object) => {
    if (object instanceof Mesh) {
      const material = object.material;
      if (!Array.isArray(material) && material.transparent) {
        material.opacity = opacity;
      }
    }
  });
};

function RoomContent({
  cameraRef,
  toggleControls,
  isVR,
  isPresenting,
}: {
  cameraRef: Camera;
  toggleControls: (enabled: boolean) => void;
  isVR: boolean;
  isPresenting: boolean;
}) {
  const WALL_HEIGHT_OFFSET = isVR && isPresenting ? 2 : 0;

  const { setFocusedHotspot } = useScene();

  // Check if touch device
  const isTouch = isTouchDevice();

  // Refs for highlight mesh groups to animate opacity
  const tvHighlightRef = useRef<Group>(null);
  const monitorHighlightRef = useRef<Group>(null);
  const phoneHighlightRef = useRef<Group>(null);

  // Pulsing animation for touch devices
  useFrame((state) => {
    if (!isTouch) return;

    const time = state.clock.elapsedTime;
    // Pulse opacity between 0.0 and 0.8 with a smooth sine wave
    const opacity = 0.0 + (Math.sin(time * 2) + 1) * 0.25; // Range: 0.3 to 0.8

    // Animate TV highlight
    applyTransparentOpacity(tvHighlightRef.current, opacity);

    // Animate Monitor highlight
    applyTransparentOpacity(monitorHighlightRef.current, opacity);

    // Animate Phone highlight
    applyTransparentOpacity(phoneHighlightRef.current, opacity);
  });

  const handleHotspotClick = (hotspot?: HotspotId) => {
    if (!hotspot) return;

    toggleControls(false);
    animateCamera(cameraRef, hotspot);
    setFocusedHotspot(hotspot);
  };

  return (
    <group scale={isPresenting ? 0.6 : 1}>
      <Floor />
      <Ceiling ceilingHeightOffset={WALL_HEIGHT_OFFSET} />
      <CeilingDecoration ceilingHeightOffset={WALL_HEIGHT_OFFSET} />
      <Walls wallHeightOffset={WALL_HEIGHT_OFFSET * 2} />
      <WallsDecoration isVR={isVR && isPresenting} />
      <group>
        <PcSetup
          ref={monitorHighlightRef}
          isTouch={isTouch}
          handleHotspotClick={handleHotspotClick}
          isPresenting={isPresenting}
        />
        <PhoneOnTable
          ref={phoneHighlightRef}
          isTouch={isTouch}
          handleHotspotClick={handleHotspotClick}
          isPresenting={isPresenting}
        />
        <PS5Setup
          ref={tvHighlightRef}
          isTouch={isTouch}
          handleHotspotClick={handleHotspotClick}
          isPresenting={isPresenting}
        />
        <Portrait position={[0.3, 2, -8.85]} onClick={handleHotspotClick} isPresenting={isPresenting} />
        <RoomFurnish />
      </group>
    </group>
  );
}

export default function Room({
  toggleControls,
  isVR,
  isPresenting,
}: {
  toggleControls: (enabled: boolean) => void;
  isVR: boolean;
  isPresenting: boolean;
}) {
  const { camera } = useThree();
  return (
    <Suspense fallback={<Loader />}>
      <RoomContent
        cameraRef={camera}
        toggleControls={toggleControls}
        isVR={isVR}
        isPresenting={isPresenting}
      />
    </Suspense>
  );
}
