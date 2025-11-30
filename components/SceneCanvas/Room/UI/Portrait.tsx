"use client";

import { useRef, useState, useEffect } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { Mesh, Group } from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, useGLTF, Text } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import { HotspotId, useScene } from "@/components/utils/SceneContext";
import { useVideoTexture } from "../../../utils/useVideoTexture";
import { isTouchDevice } from "../../../utils/helperFunc";
import { links } from "@/components/utils/data";

const applyHighlightOpacity = (group: Group | null, opacity: number) => {
  if (!group) return;
  group.traverse((object) => {
    if (object instanceof Mesh) {
      const material = object.material;
      if (!Array.isArray(material) && material.transparent) {
        material.opacity = opacity;
      }
    }
  });
};

// Project videos
const PROJECT_VIDEOS = [
  "/project1.mp4",
  "/project2.mp4",
  "/project3.mp4",
];

interface PortraitProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  onClick?: (hotspot: HotspotId) => void;
  isPresenting?: boolean;
}

interface PortraitHighlightProps {
  onPrevious: (e: ThreeEvent<MouseEvent>) => void;
  onNext: (e: ThreeEvent<MouseEvent>) => void;
  onLinkClick: (type: "project" | "github" | "all projects", session?: XRSession) => void;
  currentIndex: number;
  totalSlides: number;
}

function PortraitHighlight({
  onPrevious,
  onNext,
  onLinkClick,
  currentIndex,
  totalSlides,
}: PortraitHighlightProps) {
  const session = useXR(state => state.session);

  return (
    <group position={[0, -0.6, 0.2]}>
      {/* Previous Button */}
      <mesh
        position={[-0.6, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onPrevious(e);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#0040ff" transparent opacity={0.5} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {"<"}
        </Text>
      </mesh>

      {/* Visit Project Button */}
      <mesh
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onLinkClick("project", session);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color="#0040ff" transparent opacity={0.5} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          PROJECT
        </Text>
      </mesh>

      {/* Visit Project Github Button */}
      <mesh
        position={[1, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onLinkClick("github", session);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[0.8, 0.2]} />
        <meshBasicMaterial color="#0040ff" transparent opacity={0.5} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          GITHUB
        </Text>
      </mesh>

      {/* Next Button */}
      <mesh
        position={[1.6, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onNext(e);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[0.2, 0.2]} />
        <meshBasicMaterial color="#0040ff" transparent opacity={0.5} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.1}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {">"}
        </Text>
      </mesh>

      {/* Progress Indicator */}
      <group position={[0, -0.2, 0]}>
        {Array.from({ length: totalSlides }).map((_, index) => (
          <mesh
            key={index}
            position={[(index - (totalSlides - 1) / 2) * 0.1, 0, 0]}
          >
            <circleGeometry args={[0.02, 32]} />
            <meshBasicMaterial
              color={index === currentIndex ? "#00ffff" : "#0040ff"}
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>

      { /* Visit all projects button */}
      <mesh
        position={[0, -0.4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onLinkClick("all projects", session);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "auto")}
      >
        <planeGeometry args={[2, 0.2]} />
        <meshBasicMaterial color="#0040ff" transparent opacity={0.5} />
        <Text
          position={[0, 0, 0.01]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          SEE ALL PROJECTS
        </Text>
      </mesh>
    </group>
  );
}

export default function Portrait({
  position,
  rotation = [0, 0, 0],
  onClick,
  isPresenting,
}: PortraitProps) {
  const wallDisplay = useGLTF("/models/wall_display.glb");
  const meshRef = useRef<Mesh>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTouch = isTouchDevice();
  const [isHovered, setIsHovered] = useState(isTouch && !isPresenting);
  const highlightRef = useRef<Group>(null);
  const { focusedHotspot } = useScene();

  const isActive = focusedHotspot === "portrait";
  const currentSlide = PROJECT_VIDEOS[currentIndex];

  const handlePortraitClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick?.("portrait");
  };

  const { texture: videoTexture, video } = useVideoTexture(currentSlide);

  useEffect(() => {
    const previousVideo = videoRef.current;
    if (previousVideo && previousVideo !== video) {
      previousVideo.pause();
    }

    videoRef.current = video;

    return () => {
      if (videoRef.current === video) {
        videoRef.current = null;
      }
    };
  }, [video]);

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
  const handlePrevious = (e: ReactMouseEvent<HTMLButtonElement> | ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setCurrentIndex(
      (prev) => (prev - 1 + PROJECT_VIDEOS.length) % PROJECT_VIDEOS.length
    );
  };

  const handleNext = (e: ReactMouseEvent<HTMLButtonElement> | ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % PROJECT_VIDEOS.length);
  };

  const handleLinkClick = (type: "project" | "github" | "all projects", session?: XRSession) => {
    if (session) {
      session.end();
    }
    if (type === "all projects") {
      if (!Array.isArray(links.allProjects)) {
        window.open(links.allProjects.project, "_blank");
      }
    } else {
      if (Array.isArray(links.portrait)) {
        window.open(links.portrait[currentIndex][type], "_blank");
      }
    }
  };

  // Pulse animation for video scale
  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.02 + 1;
      meshRef.current.scale.set(pulse, pulse, 1);
    }

    // Pulsing opacity animation for highlight on touch devices
    if (isTouch && !isPresenting && highlightRef.current) {
      const time = state.clock.elapsedTime;
      const opacity = 0.0 + (Math.sin(time * 2) + 1) * 0.25; // Range: 0.3 to 0.8

      applyHighlightOpacity(highlightRef.current, opacity);
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
        <group ref={highlightRef} position={[-0.05, 0.1, 0.035]}>
          {/* Top edge */}
          <mesh position={[0.055, 0.715, 0]}>
            <boxGeometry args={[1.978, 0.03, 0.015]} />
            <meshBasicMaterial
              color="#0040ff"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
          {/* Bottom edge */}
          <mesh position={[0.055, -0.715, 0]}>
            <boxGeometry args={[1.978, 0.03, 0.015]} />
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

      {/* Video Display Screen */}
      {videoTexture && (
        <mesh
          ref={meshRef}
          position={[0, 0.1, 0.03]}
          onClick={handlePortraitClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!isTouch && !isPresenting) {
              setIsHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            if (!isTouch && !isPresenting) {
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
      {isPresenting && (
        <PortraitHighlight
          onPrevious={handlePrevious}
          onNext={handleNext}
          onLinkClick={handleLinkClick}
          currentIndex={currentIndex}
          totalSlides={PROJECT_VIDEOS.length}
        />
      )}

      {isActive && !isPresenting && (
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
              onClick={(e) => {
                e.stopPropagation();
                handleLinkClick("project");
              }}
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
                className={`h-1 rounded-full transition-all ${index === currentIndex
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
