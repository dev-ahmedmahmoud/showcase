'use client';

import { Html, useProgress } from '@react-three/drei';

export default function Loader() {
  const { progress } = useProgress();

  return (
    <Html center>
      <div className="flex flex-col items-center gap-4 text-white">
        <div className="h-1 w-64 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full bg-white transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm font-medium">Loading experience... {progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
}
