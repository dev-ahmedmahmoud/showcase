"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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
  tourStep: HotspotId | null;
  completeTourStep: (step: HotspotId) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

const TOUR_ORDER: HotspotId[] = ["portrait", "pc", "ps5", "phone"];

export function SceneProvider({ children }: { children: ReactNode }) {
  const [focusedHotspot, setFocusedHotspot] = useState<HotspotId | null>(null);
  const [isAvatarMoving, setIsAvatarMoving] = useState(false);
  const [targetPosition, setTargetPosition] = useState<Vector3 | null>(null);
  const [currentPath, setCurrentPath] = useState<SimplePath | null>(null);
  const [tourStep, setTourStep] = useState<HotspotId | null>(null);

  useEffect(() => {
    // Initialize tour step from localStorage
    const visitedSteps = JSON.parse(localStorage.getItem("visitedHotspots") || "[]");
    const nextStep = TOUR_ORDER.find((step) => !visitedSteps.includes(step));
    // localStorage only exists on the client, so this cannot be a useState initializer (SSR mismatch)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourStep(nextStep || null);
  }, []);

  const completeTourStep = (step: HotspotId) => {
    if (tourStep !== step) return;

    const visitedSteps = JSON.parse(localStorage.getItem("visitedHotspots") || "[]");
    if (!visitedSteps.includes(step)) {
      const newVisitedSteps = [...visitedSteps, step];
      localStorage.setItem("visitedHotspots", JSON.stringify(newVisitedSteps));

      const nextStep = TOUR_ORDER.find((s) => !newVisitedSteps.includes(s));
      setTourStep(nextStep || null);
    }
  };

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
        tourStep,
        completeTourStep,
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
