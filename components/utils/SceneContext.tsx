'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Vector3 } from 'three';

export type HotspotId = 'pc' | 'ps5' | 'phone' | null;

interface SceneContextType {
  focusedHotspot: HotspotId;
  setFocusedHotspot: (id: HotspotId) => void;
  isAvatarMoving: boolean;
  setIsAvatarMoving: (moving: boolean) => void;
  targetPosition: Vector3 | null;
  setTargetPosition: (pos: Vector3 | null) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

export function SceneProvider({ children }: { children: ReactNode }) {
  const [focusedHotspot, setFocusedHotspot] = useState<HotspotId>(null);
  const [isAvatarMoving, setIsAvatarMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);

  return (
    <SceneContext.Provider
      value={{
        focusedHotspot,
        setFocusedHotspot,
        isAvatarMoving,
        setIsAvatarMoving,
        targetPosition,
        setTargetPosition,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within SceneProvider');
  }
  return context;
}
