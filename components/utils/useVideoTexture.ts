"use client";

import { useEffect, useRef } from "react";
import { VideoTexture } from "three";

interface VideoTextureHandle {
  texture: VideoTexture;
  video: HTMLVideoElement;
}

export function useVideoTexture(source: string): VideoTextureHandle {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const textureRef = useRef<VideoTexture | null>(null);
  const lastSourceRef = useRef<string | null>(null);

  // Create video and texture only once per source
  if (!videoRef.current || lastSourceRef.current !== source) {
    if (textureRef.current) {
      textureRef.current.dispose();
    }
    const video = document.createElement("video");
    video.muted = true;
    video.src = source;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.playsInline = true;
    videoRef.current = video;
    textureRef.current = new VideoTexture(video);
    lastSourceRef.current = source;
  }

  useEffect(() => {
    const video = videoRef.current!;
    const texture = textureRef.current!;
    video.load();
    video.currentTime = 0;
    video.play().catch(() => {});

    return () => {
      video.pause();
      // Do not clear video.src to avoid breaking texture on hot reload
      // texture.dispose(); // Do not dispose to persist across reloads
    };
  }, [source]);

  return { video: videoRef.current!, texture: textureRef.current! };
}
