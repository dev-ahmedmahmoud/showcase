import { useEffect } from "react";

/**
 * Simple FPS meter for @react-three/fiber scenes.
 * Only renders in development and only when enabled.
 * Usage: <FPSMeter enabled={isVR && process.env.NODE_ENV === 'development'} />
 */
export default function FPSMeter({ enabled = false }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return;
    let last = performance.now();
    let frames = 0;
    let fps = 0;
    const el = document.createElement("div");
    el.style.position = "fixed";
    el.style.top = "8px";
    el.style.left = "8px";
    el.style.background = "rgba(0,0,0,0.7)";
    el.style.color = "#0f0";
    el.style.font = "bold 14px monospace";
    el.style.padding = "4px 10px";
    el.style.zIndex = "9999";
    el.style.borderRadius = "6px";
    el.textContent = "FPS: 0";
    document.body.appendChild(el);
    let running = true;
    function loop() {
      if (!running) return;
      frames++;
      const now = performance.now();
      if (now - last > 500) {
        fps = Math.round((frames * 1000) / (now - last));
        el.textContent = `FPS: ${fps}`;
        frames = 0;
        last = now;
      }
      requestAnimationFrame(loop);
    }
    loop();
    return () => {
      running = false;
      el.remove();
    };
  }, [enabled]);
  return null;
}
