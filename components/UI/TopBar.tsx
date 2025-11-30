"use client";

import Link from "next/link";
import type { Camera } from "three";
import { isTouchDevice } from "../utils/helperFunc";
import { links } from "../utils/data";
import { animateCamera } from "../utils/animationHelpers";
import { HotspotId, useScene } from "@/components/utils/SceneContext";

const HOTSPOT_ORDER: HotspotId[] = ["pc", "portrait", "phone", "ps5"];

const HOTSPOT_CONTENT: Record<
  Exclude<HotspotId, null>,
  { title: string; cta: string; href: string }
> = {
  pc: {
    title: "Curious?",
    cta: "About Me",
    href: Array.isArray(links.pc) ? links.pc[0].project : links.pc.project,
  },
  ps5: {
    title: "XR Development",
    cta: "Check The XR Experience",
    href: Array.isArray(links.ps5) ? links.ps5[0].project : links.ps5.project,
  },
  phone: {
    title: "Get In Touch",
    cta: "Reach Out",
    href: Array.isArray(links.phone) ? links.phone[0].project : links.phone.project,
  },
  portrait: {
    title: "My Projects",
    cta: "View All Projects",
    href: Array.isArray(links.allProjects) ? links.allProjects[0].project : links.allProjects.project,
  },
};

interface TopBarProps {
  cameraRef: React.RefObject<Camera | null>;
  toggleControlsRef: React.RefObject<((enabled: boolean) => void) | null>;
}

export default function TopBar({ cameraRef, toggleControlsRef }: TopBarProps) {
  const { focusedHotspot, setFocusedHotspot, setTargetPosition } = useScene();

  const onAnimateBackToDefaultPositionComplete = () =>
    toggleControlsRef?.current?.(true);

  const handleGoBack = () => {
    setFocusedHotspot(null);
    setTargetPosition(null);
    if (cameraRef.current) {
      animateCamera(
        cameraRef.current,
        undefined,
        isTouchDevice() ? onAnimateBackToDefaultPositionComplete : undefined
      );
    }
  };

  const showBackButton = focusedHotspot !== null;
  const content = focusedHotspot ? HOTSPOT_CONTENT[focusedHotspot] : null;

  // Arrow navigation logic
  const currentIndex = focusedHotspot
    ? HOTSPOT_ORDER.indexOf(focusedHotspot)
    : -1;
  const canNavigate = currentIndex !== -1;
  const handlePrev = () => {
    if (!canNavigate) return;
    const prevIndex =
      (currentIndex - 1 + HOTSPOT_ORDER.length) % HOTSPOT_ORDER.length;
    if (cameraRef.current) {
      animateCamera(cameraRef.current, HOTSPOT_ORDER[prevIndex]);
    }
    setFocusedHotspot(HOTSPOT_ORDER[prevIndex]);
    setTargetPosition(null);
  };
  const handleNext = () => {
    if (!canNavigate) return;
    const nextIndex = (currentIndex + 1) % HOTSPOT_ORDER.length;
    if (cameraRef.current) {
      animateCamera(cameraRef.current, HOTSPOT_ORDER[nextIndex]);
    }
    setFocusedHotspot(HOTSPOT_ORDER[nextIndex]);
    setTargetPosition(null);
  };

  return (
    <>
      {/* Cyberpunk Arrow Navigators - center sides, double size */}
      {canNavigate && (
        <button
          onClick={handlePrev}
          className="pointer-events-auto fixed bottom-1/8 left-4 flex h-24 w-24 items-center justify-center z-50 md:top-1/2 md:-translate-y-1/2 md:left-2"
          aria-label="Previous hotspot"
          style={{ outline: "none" }}
        >
          <span className="absolute inset-0 rounded-full bg-linear-to-br from-cyan-400 via-purple-500 to-fuchsia-500 opacity-80 blur-[6px] scale-110" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-black/80 border-4 border-cyan-400 shadow-2xl">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0ff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </span>
        </button>
      )}

      {canNavigate && (
        <button
          onClick={handleNext}
          className="pointer-events-auto fixed bottom-1/8 right-4 flex h-24 w-24 items-center justify-center z-50 md:top-1/2 md:-translate-y-1/2 md:right-2"
          aria-label="Next hotspot"
          style={{ outline: "none" }}
        >
          <span className="absolute inset-0 rounded-full bg-linear-to-br from-fuchsia-500 via-purple-500 to-cyan-400 opacity-80 blur-[6px] scale-110" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-black/80 border-4 border-purple-400 shadow-2xl">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#a0f"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </span>
        </button>
      )}

      {/* Top bar with CTA and Back button (original layout) */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 flex items-end justify-between p-6">
        {/* Back Button - appears during interaction */}
        {showBackButton && (
          <button
            onClick={handleGoBack}
            className="pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-linear-to-r from-cyan-500 to-purple-500/80 px-5 text-sm font-semibold text-white shadow-md backdrop-blur-sm transition-all hover:from-cyan-400 hover:to-purple-400 hover:scale-105"
            aria-label="Go back to room view"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Go Back
          </button>
        )}

        {/* CTA Button - appears when hotspot is focused */}
        <div className="pointer-events-auto">
          {content && (
            <div className="flex flex-col gap-2 rounded-lg bg-transparent transition-all duration-300">
              <span className="text-sm font-semibold text-white">
                {content.title}
              </span>
              <Link
                href={content.href}
                target="_blank"
                className="flex h-10 items-center justify-center rounded-full bg-linear-to-r from-cyan-500 to-purple-500 px-6 text-sm font-semibold text-white shadow-lg transition-colors hover:from-cyan-400 hover:to-purple-400 hover:scale-105"
              >
                {content.cta}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
