"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { SceneProvider } from "@/components/utils/SceneContext";
import TopBar from "@/components/UI/TopBar";
import type { Camera } from "three";

// Load SceneCanvas dynamically to avoid SSR issues with Three.js
const SceneCanvas = dynamic(() => import("@/components/SceneCanvas"), {
  ssr: false,
});

export default function Home() {
  const cameraRef = useRef<Camera | null>(null);
  const toggleControlsRef = useRef<(enabled: boolean) => void>(null);

  return (
    <SceneProvider>
      <main className="relative h-screen w-screen overflow-hidden bg-black">
        <TopBar cameraRef={cameraRef} toggleControlsRef={toggleControlsRef} />
        <SceneCanvas
          cameraRef={cameraRef}
          toggleControlsRef={toggleControlsRef}
        />
      </main>
    </SceneProvider>
  );
}
