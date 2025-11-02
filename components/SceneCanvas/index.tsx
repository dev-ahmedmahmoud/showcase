'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { OrbitControls, Preload } from '@react-three/drei';
import { SceneProvider } from '@/components/utils/SceneContext';
import Lighting from './Lighting';
import Room from './Room';
import Avatar from './Avatar';
import Loader from '@/components/UI/Loader';

// Create XR store for VR support
const xrStore = createXRStore();

export default function SceneCanvas() {
  return (
    <SceneProvider>
      <div className="relative h-screen w-screen">
        {/* XR Enter Button */}
        <button
          onClick={() => xrStore.enterVR()}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:bg-zinc-200 hover:scale-105"
        >
          Enter VR
        </button>

        <Canvas
          shadows
          camera={{
            position: [0, 3, 8],
            fov: 50,
            near: 0.1,
            far: 1000,
          }}
          gl={{
            antialias: true,
            alpha: false,
          }}
        >
          <XR store={xrStore}>
            <Suspense fallback={<Loader />}>
              {/* Lighting */}
              <Lighting />

              {/* Scene */}
              <Room />
              <Avatar />

              {/* Controls - desktop only */}
              <OrbitControls
                enablePan={false}
                enableZoom={true}
                minDistance={3}
                maxDistance={15}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.5}
                target={[0, 1, 0]}
              />

              {/* Preload assets */}
              <Preload all />
            </Suspense>
          </XR>
        </Canvas>
      </div>
    </SceneProvider>
  );
}
