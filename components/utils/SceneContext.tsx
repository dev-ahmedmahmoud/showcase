"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { Vector3 } from "three";
import type { SimplePath } from "./pathfinding";

export type HotspotId = "pc" | "ps5" | "phone" | "portrait";

interface SceneContextType {
  focusedHotspot: HotspotId | null;
  setFocusedHotspot: (id: HotspotId | null) => void;
  isAvatarMoving: boolean;
  setIsAvatarMoving: (moving: boolean) => void;
  targetPosition: Vector3 | null;
  setTargetPosition: (pos: Vector3 | null) => void;
  currentPath: SimplePath | null;
  setCurrentPath: (path: SimplePath | null) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [focusedHotspot, setFocusedHotspot] = useState<HotspotId | null>(null);
  const [isAvatarMoving, setIsAvatarMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [currentPath, setCurrentPath] = useState<SimplePath | null>(null);

  return (
    <SceneContext.Provider
      value={{
        focusedHotspot,
        setFocusedHotspot,
        isAvatarMoving,
        setIsAvatarMoving,
        targetPosition,
        setTargetPosition,
        currentPath,
        setCurrentPath,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error("useScene must be used within SceneProvider");
  }
  return context;
}
