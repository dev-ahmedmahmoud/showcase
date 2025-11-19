"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot, type Root } from "react-dom/client";

export default function Loader() {
  const [progress, setProgress] = useState(0);
  const mountTimeRef = useRef<number>(Date.now());
  const rootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const percentRef = useRef<HTMLDivElement | null>(null);
  const messageRef = useRef<HTMLDivElement | null>(null);

  // Progress simulation with logarithmic curve
  useEffect(() => {
    const startTime = mountTimeRef.current;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      let newProgress;
      if (elapsed < 3000) {
        newProgress = (elapsed / 3000) * 95;
      } else if (elapsed < 5000) {
        newProgress = 95 + ((elapsed - 3000) / 2000) * 4;
      } else {
        newProgress = 99;
      }
      setProgress(Math.min(newProgress, 99));
    };
    updateProgress();
    const interval = setInterval(updateProgress, 50);
    return () => clearInterval(interval);
  }, []);

  // Get loading message based on progress
  const getLoadingMessage = (p: number) => {
    if (p < 30) return "Loading 3D models...";
    if (p < 60) return "Loading textures...";
    if (p < 90) return "Initializing scene...";
    return "Almost ready...";
  };

  // Render loader to document.body via createRoot (static UI, only update progress bar/message directly)
  useEffect(() => {
    if (!containerRef.current) {
      containerRef.current = document.createElement("div");
      document.body.appendChild(containerRef.current);
      rootRef.current = createRoot(containerRef.current);
      rootRef.current.render(
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black">
          <div className="flex flex-col items-center gap-6">
            <div className="text-4xl font-bold text-white mb-4">
              Loading Experience
            </div>
            <div className="w-80 h-2 overflow-hidden rounded-full bg-white/10 border border-cyan-500/30">
              <div
                ref={progressBarRef}
                className="h-full bg-linear-to-r from-cyan-500 to-purple-500 transition-all duration-100 ease-out"
                style={{ width: `0%` }}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <div
                ref={percentRef}
                className="text-2xl font-mono font-bold text-cyan-400"
              >
                0%
              </div>
            </div>
            <div
              ref={messageRef}
              className="text-sm text-gray-400 animate-pulse"
            >
              {getLoadingMessage(0)}
            </div>
          </div>
        </div>
      );
    }
    // Cleanup on unmount
    return () => {
      if (rootRef.current && containerRef.current) {
        rootRef.current.unmount();
        document.body.removeChild(containerRef.current);
        rootRef.current = null;
        containerRef.current = null;
      }
    };
  }, []);

  // Only update progress bar, percent, and message on progress change
  useEffect(() => {
    if (progressBarRef.current) {
      progressBarRef.current.style.width = `${progress}%`;
    }
    if (percentRef.current) {
      percentRef.current.textContent = `${Math.floor(progress)}%`;
    }
    if (messageRef.current) {
      messageRef.current.textContent = getLoadingMessage(progress);
    }
  }, [progress]);

  return null;
}
