'use client';

import dynamic from 'next/dynamic';
import TopBar from '@/components/UI/TopBar';

// Load SceneCanvas dynamically to avoid SSR issues with Three.js
const SceneCanvas = dynamic(() => import('@/components/SceneCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <p className="text-white text-lg">Loading 3D experience...</p>
    </div>
  ),
});

export default function Home() {
  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <TopBar />
      <SceneCanvas />
    </main>
  );
}
