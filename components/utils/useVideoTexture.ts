"use client";

import { useEffect, useState } from "react";
import { VideoTexture } from "three";

export interface VideoTextureHandle {
  source: string;
  texture: VideoTexture;
  video: HTMLVideoElement;
}

const release = ({ video, texture }: VideoTextureHandle) => {
  video.pause();
  texture.dispose();
  // Drop the media resource so the browser stops buffering it
  video.removeAttribute("src");
  video.load();
};

// The video element is created in an effect (commit phase only). Creating it during
// render started a new download for every render React discarded while suspended.
// Returns null until the first frame of `source` is available; while a new source
// loads, the previous handle keeps being returned (no black frame between slides).
export function useVideoTexture(source: string): VideoTextureHandle | null {
  const [handle, setHandle] = useState<VideoTextureHandle | null>(null);

  useEffect(() => {
    const video = document.createElement("video");
    video.muted = true;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.playsInline = true;
    video.src = source;
    const next: VideoTextureHandle = {
      source,
      video,
      texture: new VideoTexture(video),
    };
    let shown = false;

    const onLoaded = () => {
      shown = true;
      setHandle(next);
    };
    video.addEventListener("loadeddata", onLoaded, { once: true });
    video.play().catch(() => {});

    return () => {
      video.removeEventListener("loadeddata", onLoaded);
      // A displayed handle is released by the effect below once it gets replaced
      if (!shown) release(next);
    };
  }, [source]);

  // Release the displayed video/texture after its replacement is committed (or on unmount)
  useEffect(() => {
    if (!handle) return;
    return () => release(handle);
  }, [handle]);

  return handle;
}
