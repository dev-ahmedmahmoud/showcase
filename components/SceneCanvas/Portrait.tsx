"use client";

import { useRef, useState, useEffect } from "react";
import { Mesh, VideoTexture, Group } from "three";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import { HotspotId, useScene } from "@/components/utils/SceneContext";
import { isTouchDevice } from "../utils/helperFunc";

// Project videos
const PROJECT_VIDEOS = [
  { video: "/project1.mp4", link: "https://portfolio.ahmedmahmoud.de" },
  { video: "/project2.mp4", link: "https://iphone15replica.ahmedmahmoud.de" },
];

interface PortraitProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  onClick?: (hotspot: HotspotId) => void;
}

export default function Portrait({
  position,
  rotation = [0, 0, 0],
  onClick,
}: PortraitProps) {
  const wallDisplay = useGLTF("/models/wall_display.glb");
  const meshRef = useRef<Mesh>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTouch = isTouchDevice();
  const [isHovered, setIsHovered] = useState(isTouch);
  const highlightRef = useRef<Group>(null);
  const { focusedHotspot } = useScene();

  const isActive = focusedHotspot === "portrait";
  const currentSlide = PROJECT_VIDEOS[currentIndex];

  const handlePortraitClick = (e: any) => {
    e.stopPropagation();
    onClick?.("portrait");
  };

  // Load and play video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause();
    }

    const video = document.createElement("video");
    video.src = currentSlide.video;
    video.crossOrigin = "anonymous";
    video.loop = true;
    video.muted = true;
    video.playsInline = true;

    video.play().catch((err) => console.log("Video autoplay failed:", err));

    const texture = new VideoTexture(video);
    setVideoTexture(texture);
    videoRef.current = video;

    return () => {
      video.pause();
      video.src = "";
    };
  }, [currentSlide.video]);

  // Auto-slide functionality based on video duration
  useEffect(() => {
    // Clear existing timer
    if (autoSlideTimerRef.current) {
      clearTimeout(autoSlideTimerRef.current);
    }

    const video = videoRef.current;
    if (!video) return;

    const scheduleNextSlide = () => {
      // Wait for video metadata to load to get duration
      if (
        video.duration &&
        !isNaN(video.duration) &&
        isFinite(video.duration)
      ) {
        const duration = video.duration * 1000; // Convert to milliseconds

        autoSlideTimerRef.current = setTimeout(() => {
          setCurrentIndex((prev) => (prev + 1) % PROJECT_VIDEOS.length);
        }, duration);
      } else {
        // Fallback: if duration not available, wait and try again
        setTimeout(scheduleNextSlide, 100);
      }
    };

    // Try to schedule immediately if metadata is loaded
    if (video.readyState >= 1) {
      scheduleNextSlide();
    } else {
      // Wait for metadata to load
      video.addEventListener("loadedmetadata", scheduleNextSlide);
    }

    return () => {
      if (autoSlideTimerRef.current) {
        clearTimeout(autoSlideTimerRef.current);
      }
      video.removeEventListener("loadedmetadata", scheduleNextSlide);
    };
  }, [currentIndex]);

  // Manual navigation
  const handlePrevious = (e: any) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + PROJECT_VIDEOS.length) % PROJECT_VIDEOS.length
    );
  };

  const handleNext = (e: any) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % PROJECT_VIDEOS.length);
  };

  const handleLinkClick = () => {
    window.open(currentSlide.link, "_blank");
  };

  // Pulse animation for video scale
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 1;
      meshRef.current.scale.set(pulse, pulse, 1);
    }

    // Pulsing opacity animation for highlight on touch devices
    if (isTouch && highlightRef.current) {
      const time = state.clock.elapsedTime;
      // Pulse opacity between 0.0 and 0.8 with a smooth sine wave
      const opacity = 0.0 + (Math.sin(time * 2) + 1) * 0.25; // Range: 0.3 to 0.8

      highlightRef.current.children.forEach((child: any) => {
        if (child.material && child.material.transparent) {
          child.material.opacity = opacity;
        }
      });
    }
  });

  return (
    <group position={position} rotation={rotation}>
      {/* Wall Display GLB Model */}
      <primitive
        object={wallDisplay.scene.clone()}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, Math.PI, Math.PI / 2]}
        scale={[4, 10.5, 5]}
        castShadow
      />

      {/* Highlight Frame - Portrait shape (rectangular) - Only show on hover */}
      {isHovered && (
        <group ref={highlightRef} position={[0, 0.1, 0.035]}>
          {/* Top edge */}
          <mesh position={[0.05, 0.72, 0]}>
            <boxGeometry args={[1.975, 0.03, 0.015]} />
            <meshBasicMaterial
              color="#0040ff"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
          {/* Bottom edge */}
          <mesh position={[0.05, -0.72, 0]}>
            <boxGeometry args={[1.975, 0.03, 0.015]} />
            <meshBasicMaterial
              color="#0040ff"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
          {/* Left edge */}
          <mesh position={[-0.92, 0, 0]}>
            <boxGeometry args={[0.03, 1.4, 0.015]} />
            <meshBasicMaterial
              color="#0040ff"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
          {/* Right edge */}
          <mesh position={[1.03, 0, 0]}>
            <boxGeometry args={[0.03, 1.4, 0.015]} />
            <meshBasicMaterial
              color="#0040ff"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
        </group>
      )}

      {/* RGB LED Strips on wall over the portrait */}
      <mesh position={[0, 1, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[2, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#0040ff"
          emissive="#0040ff"
          emissiveIntensity={3}
        />
      </mesh>

      <rectAreaLight
        position={[0, 1.0, -0.12]}
        rotation={[-Math.PI / 4, 0, 0]}
        width={2}
        height={1.135}
        intensity={80}
        color="#0040ff"
      />

      {/* Video Display Screen */}
      {videoTexture && (
        <mesh
          ref={meshRef}
          position={[0, 0.1, 0.03]}
          onClick={handlePortraitClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!isTouch) {
              setIsHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            if (!isTouch) {
              setIsHovered(false);
              document.body.style.cursor = "auto";
            }
          }}
        >
          <planeGeometry args={[1.5, 1]} />
          <meshBasicMaterial map={videoTexture} toneMapped={false} />
        </mesh>
      )}

      {/* Interactive UI when hotspot is active */}
      {isActive && (
        <Html
          position={[0, 0, 0.1]}
          center
          distanceFactor={1}
          style={{
            width: "600px",
            pointerEvents: "auto",
          }}
        >
          <div className="flex items-center justify-between gap-6">
            {/* Previous Button - Cyberpunk style */}
            <button
              onClick={handlePrevious}
              className="w-24 h-24 relative bg-linear-to-br from-cyan-500/20 to-purple-500/20 text-cyan-400 flex items-center justify-center transition-all hover:scale-110 backdrop-blur-md border-2 border-cyan-400 hover:border-cyan-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.5)] group"
              style={{
                fontSize: "48px",
                clipPath:
                  "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
              }}
            >
              <span className="group-hover:text-white transition-colors">
                ‹
              </span>
            </button>

            {/* Link Button - Cyberpunk style */}
            <button
              onClick={handleLinkClick}
              className="px-12 py-6 relative bg-linear-to-r from-cyan-500 to-purple-500 text-white font-bold text-2xl hover:from-cyan-400 hover:to-purple-400 transition-all hover:scale-105 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.3)] hover:shadow-[0_0_40px_rgba(0,255,255,0.6)] border-2 border-cyan-300"
              style={{
                clipPath:
                  "polygon(10% 0%, 90% 0%, 100% 20%, 100% 80%, 90% 100%, 10% 100%, 0% 80%, 0% 20%)",
                textShadow: "0 0 10px rgba(0,255,255,0.8)",
              }}
            >
              VISIT PROJECT
            </button>

            {/* Next Button - Cyberpunk style */}
            <button
              onClick={handleNext}
              className="w-24 h-24 relative bg-linear-to-br from-purple-500/20 to-cyan-500/20 text-purple-400 flex items-center justify-center transition-all hover:scale-110 backdrop-blur-md border-2 border-purple-400 hover:border-purple-300 hover:shadow-[0_0_30px_rgba(138,43,226,0.5)] group"
              style={{
                fontSize: "48px",
                clipPath:
                  "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
              }}
            >
              <span className="group-hover:text-white transition-colors">
                ›
              </span>
            </button>
          </div>

          {/* Progress Indicator - Cyberpunk style */}
          <div className="flex justify-center gap-3 mt-6">
            {PROJECT_VIDEOS.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentIndex
                    ? "bg-linear-to-r from-cyan-400 to-purple-400 w-16 shadow-[0_0_10px_rgba(0,255,255,0.8)]"
                    : "bg-cyan-400/30 w-8 hover:bg-cyan-400/50"
                }`}
              />
            ))}
          </div>
        </Html>
      )}
    </group>
  );
}
