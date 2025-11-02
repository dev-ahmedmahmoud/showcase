'use client';

import { useScene, type HotspotId } from '@/components/utils/SceneContext';

const HOTSPOT_CONTENT: Record<Exclude<HotspotId, null>, { title: string; cta: string; href: string }> = {
  pc: {
    title: 'Frontend Development',
    cta: 'About Me',
    href: '/about',
  },
  ps5: {
    title: 'VR Game Development',
    cta: 'Check VR Game',
    href: '/vr-game',
  },
  phone: {
    title: 'Get In Touch',
    cta: 'Reach Out',
    href: '/contact',
  },
};

export default function TopBar() {
  const { focusedHotspot, setFocusedHotspot, setTargetPosition } = useScene();

  const handleGoBack = () => {
    setFocusedHotspot(null);
    setTargetPosition(null);
  };

  const showBackButton = focusedHotspot !== null;
  const content = focusedHotspot ? HOTSPOT_CONTENT[focusedHotspot] : null;

  return (
    <div className="pointer-events-none fixed top-0 left-0 right-0 z-50 flex items-start justify-between p-6">
      {/* CTA Button - appears when hotspot is focused */}
      <div className="pointer-events-auto">
        {content && (
          <div className="flex flex-col gap-2 rounded-lg bg-black/80 backdrop-blur-sm p-4 text-white transition-all duration-300">
            <span className="text-sm font-medium text-zinc-400">{content.title}</span>
            <a
              href={content.href}
              className="flex h-10 items-center justify-center rounded-full bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              {content.cta}
            </a>
          </div>
        )}
      </div>

      {/* Back Button - appears during interaction */}
      {showBackButton && (
        <button
          onClick={handleGoBack}
          className="pointer-events-auto flex h-10 items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-5 text-sm font-medium text-white transition-all hover:bg-white/20"
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
    </div>
  );
}
