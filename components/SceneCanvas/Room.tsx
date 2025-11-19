"use client";

import { Suspense, useEffect, useRef, useState, memo } from "react";
import {
  AnimationMixer,
  Group,
  Color,
  Camera,
  Mesh,
  MeshStandardMaterial,
  PointLight,
} from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { HotspotId, useScene } from "@/components/utils/SceneContext";
import { isValidWalkablePosition } from "@/components/utils/pathfinding";
import Loader from "@/components/UI/Loader";
import Portrait from "./Portrait";
import { animateCamera } from "../utils/animationHelpers";
import { isTouchDevice } from "../utils/helperFunc";
import { useVideoTexture } from "../utils/useVideoTexture";

const applyStandardMaterialEffect = (
  group: Group | null,
  effect: (material: MeshStandardMaterial) => void
) => {
  if (!group) return;
  group.traverse((object) => {
    if (object instanceof Mesh) {
      const material = object.material;
      if (
        !Array.isArray(material) &&
        material instanceof MeshStandardMaterial
      ) {
        effect(material);
      }
    }
  });
};

const applyTransparentOpacity = (group: Group | null, opacity: number) => {
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

function AnimatedSpeaker({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const speaker = useGLTF("/models/speaker.glb");
  const groupRef = useRef<Group>(null);
  const mixerRef = useRef<AnimationMixer | null>(null);

  useEffect(() => {
    if (
      !groupRef.current ||
      !speaker.animations ||
      speaker.animations.length === 0
    ) {
      return;
    }

    // Create mixer on the cloned scene
    const clonedScene = groupRef.current.children[0];
    if (!clonedScene) return;

    const mixer = new AnimationMixer(clonedScene);
    mixerRef.current = mixer;

    // Play all animations in the speaker model
    speaker.animations.forEach((clip) => {
      const action = mixer.clipAction(clip);
      action.play();
    });

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
      }
    };
  }, [speaker, position]);

  useFrame((state, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={speaker.scene.clone()} castShadow />
    </group>
  );
}

// Memoize AnimatedSpeaker to prevent re-renders
const MemoizedAnimatedSpeaker = memo(AnimatedSpeaker);

function CeilingHexagon({
  position,
  offset = 0,
}: {
  position: [number, number, number];
  offset?: number;
}) {
  const groupRef = useRef<Group>(null);
  const lightRef = useRef<PointLight | null>(null);
  const darkBlue = new Color("#0040ff"); // Dark blue
  const darkPurple = new Color("#4B0082"); // Dark purple (indigo)

  useFrame((state) => {
    const time = state.clock.elapsedTime + offset;

    // Alternate between dark blue and dark purple
    const cycle = (time * 0.4) % 2;
    let lerpedColor;

    if (cycle < 1) {
      // Dark blue → Dark purple
      lerpedColor = darkBlue.clone().lerp(darkPurple, cycle);
    } else {
      // Dark purple → Dark blue
      lerpedColor = darkPurple.clone().lerp(darkBlue, cycle - 1);
    }

    const intensity = Math.sin(time * 1.5) * 0.3 + 0.7;

    applyStandardMaterialEffect(groupRef.current, (material) => {
      material.emissive.copy(lerpedColor);
      material.emissiveIntensity = 3 + intensity * 2;
    });

    if (lightRef.current) {
      lightRef.current.color.copy(lerpedColor);
      lightRef.current.intensity = 2 + intensity * 10;
    }
  });

  // Create 6 edges for hollow hexagon
  const edges = [];
  const radius = 1.8; // Increased from 1.2 for larger, more prominent hexagons
  const thickness = 0.08; // Slightly thicker edges for better visibility
  for (let i = 0; i < 6; i++) {
    const angle1 = (Math.PI / 3) * i;
    const angle2 = (Math.PI / 3) * (i + 1);
    const x1 = Math.cos(angle1) * radius;
    const y1 = Math.sin(angle1) * radius;
    const x2 = Math.cos(angle2) * radius;
    const y2 = Math.sin(angle2) * radius;

    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const rotation = Math.atan2(y2 - y1, x2 - x1);

    edges.push({ x: centerX, y: centerY, length, rotation });
  }

  return (
    <>
      <group
        ref={groupRef}
        position={position}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
      >
        {edges.map((edge, i) => (
          <mesh
            key={i}
            position={[edge.x, edge.y, 0]}
            rotation={[0, 0, edge.rotation]}
          >
            <boxGeometry args={[edge.length, thickness, thickness]} />
            <meshStandardMaterial
              color="#0040ff"
              emissive="#0040ff"
              emissiveIntensity={4}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
      {/* <pointLight
        ref={lightRef}
        position={[position[0], position[1] - 0.15, position[2]]}
        intensity={2.5}
        distance={4}
        color="#0040ff"
      /> */}
    </>
  );
}

function AnimatedHexagon({
  position,
  offset = 0,
}: {
  position: [number, number, number];
  offset?: number;
}) {
  const meshRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight | null>(null);
  const darkPink = new Color("#c71585"); // Dark pink
  const purple = new Color("#9932cc"); // Purple
  const darkBlue = new Color("#191970"); // Dark blue

  useFrame((state) => {
    const time = state.clock.elapsedTime + offset;

    // Cycle through 5 colors: dark pink → purple → dark blue → purple → dark pink
    const cycle = (time * 0.4) % 5;
    let lerpedColor;

    if (cycle < 1) {
      // Dark pink → Purple
      lerpedColor = darkPink.clone().lerp(purple, cycle);
    } else if (cycle < 2) {
      // Purple → Dark blue
      lerpedColor = purple.clone().lerp(darkBlue, cycle - 1);
    } else if (cycle < 3) {
      // Dark blue → Purple
      lerpedColor = darkBlue.clone().lerp(purple, cycle - 2);
    } else if (cycle < 4) {
      // Purple → Dark pink
      lerpedColor = purple.clone().lerp(darkPink, cycle - 3);
    } else {
      // Hold on dark pink
      lerpedColor = darkPink.clone();
    }

    const intensity = Math.sin(time * 2) * 0.5 + 0.5; // Oscillates between 0 and 1

    if (meshRef.current) {
      const material = meshRef.current.material;
      if (
        !Array.isArray(material) &&
        material instanceof MeshStandardMaterial
      ) {
        material.emissive.copy(lerpedColor);
        material.emissiveIntensity = 3 + intensity * 3; // 3 to 6
      }
    }

    if (lightRef.current) {
      lightRef.current.color.copy(lerpedColor);
      lightRef.current.intensity = 2 + intensity * 2; // 2 to 4
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={position}
        rotation={[Math.PI / 2, Math.PI / 2, 0]}
      >
        <cylinderGeometry args={[0.25, 0.25, 0.03, 6]} />
        <meshStandardMaterial
          color="#c71585"
          emissive="#c71585"
          emissiveIntensity={5}
        />
      </mesh>
      {/* <pointLight
        ref={lightRef}
        position={[position[0], position[1], position[2] + 0.05]}
        intensity={3}
        distance={2}
        color="#c71585"
      /> */}
    </>
  );
}

function AnimatedLEDPanel({
  position,
}: {
  position: [number, number, number];
}) {
  const meshRef = useRef<Mesh>(null);
  const darkPink = new Color("#c71585"); // Dark pink
  const purple = new Color("#9932cc"); // Purple
  const darkBlue = new Color("#191970"); // Dark blue

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Cycle through 5 colors: dark pink → purple → dark blue → purple → dark pink
    const cycle = (time * 0.4) % 5;
    let lerpedColor;

    if (cycle < 1) {
      // Dark pink → Purple
      lerpedColor = darkPink.clone().lerp(purple, cycle);
    } else if (cycle < 2) {
      // Purple → Dark blue
      lerpedColor = purple.clone().lerp(darkBlue, cycle - 1);
    } else if (cycle < 3) {
      // Dark blue → Purple
      lerpedColor = darkBlue.clone().lerp(purple, cycle - 2);
    } else if (cycle < 4) {
      // Purple → Dark pink
      lerpedColor = purple.clone().lerp(darkPink, cycle - 3);
    } else {
      // Hold on dark pink
      lerpedColor = darkPink.clone();
    }

    const intensity = Math.sin(time * 3) * 0.3 + 0.7; // Oscillates between 0.4 and 1

    if (meshRef.current) {
      const material = meshRef.current.material;
      if (
        !Array.isArray(material) &&
        material instanceof MeshStandardMaterial
      ) {
        material.emissive.copy(lerpedColor);
        material.emissiveIntensity = 2 + intensity * 2; // 2 to 4
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[Math.PI / 2, 0, 0]}>
      <boxGeometry args={[0.4, 0.02, 0.02]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#c71585"
        emissiveIntensity={3}
      />
    </mesh>
  );
}

function PhoneScreen() {
  const { texture: videoTexture } = useVideoTexture("/phone.mp4");

  return (
    <mesh position={[0.005, -0.01, 0.0115]} rotation={[0, 0, 0]}>
      <planeGeometry args={[0.19, 0.35]} />
      <meshBasicMaterial
        map={videoTexture}
        toneMapped={false}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

function RoomContent({
  cameraRef,
  toggleControls,
}: {
  cameraRef: Camera;
  toggleControls: (enabled: boolean) => void;
}) {
  const tv = useGLTF("/models/tv.glb");
  const couch = useGLTF("/models/couch.glb");
  const tvUnit = useGLTF("/models/tv_unit.glb");
  const ps5 = useGLTF("/models/ps5.glb");
  const vrHeadset = useGLTF("/models/vr.glb");
  const psLamp = useGLTF("/models/playstation_lamp.glb");
  const psLampWall = useGLTF("/models/ps_lamp.glb");
  const table = useGLTF("/models/table.glb");
  const phone = useGLTF("/models/phone.glb");
  const monitor = useGLTF("/models/monitor.glb");
  const desk = useGLTF("/models/desk.glb");
  const pc = useGLTF("/models/pc.glb");
  const keyboard = useGLTF("/models/keyboard.glb");
  const mouse = useGLTF("/models/mouse.glb");
  const meta = useGLTF("/models/meta.glb");
  const pcChair = useGLTF("/models/pc_chair.glb");
  const pegboard = useGLTF("/models/pegboard.glb");
  const controller1 = useGLTF("/models/controller1.glb");
  const controller2 = useGLTF("/models/controller2.glb");
  const controller3 = useGLTF("/models/controller3.glb");
  const controller4 = useGLTF("/models/controller4.glb");
  const psPortal = useGLTF("/models/ps_portal.glb");
  const headset1 = useGLTF("/models/headset1.glb");
  const headset2 = useGLTF("/models/headset2.glb");
  const sweeper = useGLTF("/models/sweeper.glb");
  const bed = useGLTF("/models/bed.glb");
  const purifier = useGLTF("/models/purifier.glb");
  const wallTextures = useTexture({
    map: "/textures/floor/diff.jpg",
    normalMap: "/textures/floor/nor.jpg",
    roughnessMap: "/textures/floor/arm.jpg",
  });
  const floorTextures = useTexture({
    map: "/textures/floor/diff.jpg",
    normalMap: "/textures/floor/nor.jpg",
    roughnessMap: "/textures/floor/arm.jpg",
  });
  const tvScreenTexture = useTexture("/tv.png");
  const pcDisplayTexture = useTexture("/pc_display.png");
  const { setTargetPosition, setFocusedHotspot } = useScene();

  // Check if touch device
  const isTouch = isTouchDevice();

  // Hover states for hotspots - always true on touch devices
  const [isTvHovered, setIsTvHovered] = useState(isTouch);
  const [isMonitorHovered, setIsMonitorHovered] = useState(isTouch);
  const [isPhoneHovered, setIsPhoneHovered] = useState(isTouch);

  // Refs for highlight mesh groups to animate opacity
  const tvHighlightRef = useRef<Group>(null);
  const monitorHighlightRef = useRef<Group>(null);
  const phoneHighlightRef = useRef<Group>(null);

  // Pulsing animation for touch devices
  useFrame((state) => {
    if (!isTouch) return;

    const time = state.clock.elapsedTime;
    // Pulse opacity between 0.0 and 0.8 with a smooth sine wave
    const opacity = 0.0 + (Math.sin(time * 2) + 1) * 0.25; // Range: 0.3 to 0.8

    // Animate TV highlight
    applyTransparentOpacity(tvHighlightRef.current, opacity);

    // Animate Monitor highlight
    applyTransparentOpacity(monitorHighlightRef.current, opacity);

    // Animate Phone highlight
    applyTransparentOpacity(phoneHighlightRef.current, opacity);
  });

  const handleHotspotClick = (hotspot?: HotspotId) => {
    if (!hotspot) return;

    toggleControls(false);
    animateCamera(cameraRef, hotspot);
    setFocusedHotspot(hotspot);
  };

  const handleFloorClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const clickPosition = event.point;

    // Validate that the clicked position is walkable (not on furniture)
    if (!isValidWalkablePosition(clickPosition)) {
      // Invalid position: clicked on furniture or too close to obstacles
      return;
    }

    // Clone the position to ensure React detects the change
    setTargetPosition(clickPosition.clone());
  };

  return (
    <group>
      {/* L-SHAPED FLOOR - Two sections */}
      {/* PC Section (Left part of L) - 5.1x9 meters (width reduced by 15%, length increased by 1.5x) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[-2.5, 0, -4.5]}
        receiveShadow
        name="floor"
        onClick={handleFloorClick}
      >
        <planeGeometry args={[2, 9]} />
        <meshStandardMaterial
          map={floorTextures.map}
          normalMap={floorTextures.normalMap}
          roughnessMap={floorTextures.roughnessMap}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* PS5/Living Section (Right part of L) - 6.8x9 meters (width reduced by 15%, length increased by 1.5x) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[1.9, 0, -4.5]}
        receiveShadow
        name="floor"
        onClick={handleFloorClick}
      >
        <planeGeometry args={[6.8, 9]} />
        <meshStandardMaterial
          map={floorTextures.map}
          normalMap={floorTextures.normalMap}
          roughnessMap={floorTextures.roughnessMap}
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>

      {/* CEILING - Matches L-shape floor */}
      {/* PC Section Ceiling - Dark base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[-2.7, 4.005, -6.75]}>
        <planeGeometry args={[2, 4.65]} />
        <meshStandardMaterial color="#0a0a1a" side={2} />
      </mesh>
      {/* PS5 Section Ceiling - Dark base */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[1.8, 4.005, -4.5]}>
        <planeGeometry args={[7, 9.2]} />
        <meshStandardMaterial color="#0a0a1a" side={2} />
      </mesh>

      {/* Ceiling Hexagon Lights - Proper honeycomb tessellation */}
      <group position={[1.8, 3.99, -4.5]}>
        {/* Perfect honeycomb: radius=1.8, spacing=3.12 (radius*√3) horizontal, 2.7 (radius*1.5) vertical */}

        <CeilingHexagon position={[-1.58, -0.03, 2.7]} />

        <CeilingHexagon position={[-4.6, -0.01, -2.7]} />

        <CeilingHexagon position={[-1.58, -0.01, -2.7]} />

        {/* Center hexagon */}
        <CeilingHexagon position={[0, 0, 0]} />

        {/* Left neighbor - shares edge */}
        <CeilingHexagon position={[-3.12, 0, 0]} />

        {/* Top-right - offset honeycomb position */}
        <CeilingHexagon position={[1.56, 0, -2.7]} />

        {/* Bottom-right - offset honeycomb position */}
        <CeilingHexagon position={[1.56, 0, 2.7]} />
      </group>

      {/* WALLS - L-SHAPED ROOM */}

      {/* PC Section Walls */}
      {/* Left wall (PC section) */}
      <mesh
        position={[-3.6, 2, -6.7]}
        rotation={[0, Math.PI / 2, 0]}
        receiveShadow
      >
        <boxGeometry args={[4.62, 4, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* PS5 Section Walls */}
      {/* Back wall (PS5 section) */}
      <mesh position={[0.8, 2, -9]} receiveShadow>
        <boxGeometry args={[9, 4, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* Front wall (PS5 section) - right part */}
      <mesh position={[1.8, 2, 0]} receiveShadow>
        <boxGeometry args={[6.95, 4, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* Inner Walls - Creating the L-shape partition */}
      {/* Vertical inner wall (separates PC from PS5 section) */}
      <mesh position={[-1.6, 2, -2.25]} receiveShadow>
        <boxGeometry args={[0.2, 4, 4.5]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* 4 stacked Pegboard on vertical inner wall */}
      <group position={[-1.5, 2, -2.9]}>
        {/* Pegboards */}
        <primitive
          object={pegboard.scene.clone()}
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={0.25}
          castShadow
        />
        <primitive
          object={pegboard.scene.clone()}
          position={[0, 0, 1.25]}
          rotation={[0, 0, 0]}
          scale={0.25}
          castShadow
        />
        <primitive
          object={pegboard.scene.clone()}
          position={[0, 0.5, 0]}
          rotation={[0, 0, 0]}
          scale={0.25}
          castShadow
        />
        <primitive
          object={pegboard.scene.clone()}
          position={[0, 0.5, 1.25]}
          rotation={[0, 0, 0]}
          scale={0.25}
          castShadow
        />

        {/* Controllers - 8 total (each type appears twice) */}
        {/* Controller 1 - Top Left & Bottom Right */}
        <primitive
          object={controller1.scene.clone()}
          position={[0.05, -0.2, -0.3]}
          rotation={[0, Math.PI / 2, 0]}
          scale={2.2}
          castShadow
        />
        <primitive
          object={controller1.scene.clone()}
          position={[0.05, -0.2, 1.55]}
          rotation={[0, Math.PI / 2, 0]}
          scale={2.2}
          castShadow
        />

        {/* Controller 2 - Top Right & Bottom Left */}
        <primitive
          object={controller2.scene.clone()}
          position={[0.05, 0.52, 1.55]}
          rotation={[0, 0, 0]}
          scale={1.8}
          castShadow
        />
        <primitive
          object={controller2.scene.clone()}
          position={[0.05, 0.52, -0.3]}
          rotation={[0, 0, 0]}
          scale={1.8}
          castShadow
        />

        {/* Controller 3 - Middle Left (both) */}
        <primitive
          object={controller3.scene.clone()}
          position={[0.05, 0.45, 0.35]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.006}
          castShadow
        />
        <primitive
          object={controller3.scene.clone()}
          position={[0.05, 0.45, 0.9]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.006}
          castShadow
        />

        {/* Controller 4 - Center (both) */}
        <primitive
          object={controller4.scene.clone()}
          position={[-0.225, -0.05, 0.35]}
          rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          scale={1.8}
          castShadow
        />
        <primitive
          object={controller4.scene.clone()}
          position={[-0.225, -0.05, 0.9]}
          rotation={[Math.PI / 2, 0, -Math.PI / 2]}
          scale={1.8}
          castShadow
        />

        {/* ps portal and headsets - Center (both) */}
        <primitive
          object={headset1.scene.clone()}
          position={[0.11, 0.22, -0.3]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.09}
          castShadow
        />
        <primitive
          object={headset2.scene.clone()}
          position={[0.11, -0.225, 1.7]}
          rotation={[0, 0, 0]}
          scale={0.065}
          castShadow
        />
        <primitive
          object={psPortal.scene.clone()}
          position={[0.11, 0.12, 0.6]}
          rotation={[0, Math.PI / 2, 0]}
          scale={0.5}
          castShadow
        />
      </group>

      {/* Horizontal inner wall (connects to vertical wall) */}
      <mesh position={[-2.5, 2, -4.5]} receiveShadow>
        <boxGeometry args={[2, 4, 0.2]} />
        <meshStandardMaterial
          map={wallTextures.map}
          normalMap={wallTextures.normalMap}
          roughnessMap={wallTextures.roughnessMap}
        />
      </mesh>

      {/* ============================================ */}
      {/* PC SETUP AREA (Left section of L)          */}
      {/* ============================================ */}

      {/* PC Desk */}
      <primitive
        object={desk.scene.clone()}
        position={[-2.6, 0, -6.425]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[3.35, 2, 3]} // [width (X), height (Y), depth (Z)]
        castShadow
      />

      {/* PC Tower */}
      <primitive
        object={pc.scene.clone()}
        position={[-2.2, 1.8, -8.65]}
        rotation={[0, 0, 0]}
        scale={2}
        castShadow
      />

      {/* Mouse on desk */}
      <primitive
        object={mouse.scene.clone()}
        position={[-2, 1.4, -7.6]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1.5}
        castShadow
      />

      {/* Keyboard on desk */}
      <primitive
        object={keyboard.scene.clone()}
        position={[-2, 1.6, -6.75]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1}
        castShadow
      />

      {/* Meta quest on desk */}
      <primitive
        object={meta.scene.clone()}
        position={[-2, 1.67, -5.6]}
        rotation={[0, Math.PI / 1.5, 0]}
        scale={1.3}
        castShadow
      />

      {/* Monitor - PC Interaction Point */}
      {monitor && monitor.scene && (
        <group
          position={[-2.6, -0.38, -6.4]}
          rotation={[0, Math.PI / 0.5, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleHotspotClick("pc");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!isTouch) {
              setIsMonitorHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            if (!isTouch) {
              setIsMonitorHovered(false);
              document.body.style.cursor = "auto";
            }
          }}
        >
          {/* Monitor GLB Model */}
          <primitive object={monitor.scene.clone()} scale={1} castShadow />

          {/* Curved Monitor Display with texture */}
          <mesh
            position={[1.17, 2.985, 1.2]}
            rotation={[0, Math.PI * 5.57, 0]}
            scale={[-2.6, 1, 1]}
          >
            <cylinderGeometry
              args={[
                1.2, // radiusTop - adjust this
                1.2, // radiusBottom - adjust this
                0.95, // height (width of screen) - adjust this
                32, // radialSegments (smoothness)
                1, // heightSegments
                true, // openEnded
                0, // thetaStart
                Math.PI * 0.4, // thetaLength (half cylinder for curve)
              ]}
            />
            <meshBasicMaterial
              map={pcDisplayTexture}
              toneMapped={false}
              side={2}
            />
          </mesh>

          {/* Highlight Frame - Curved to match monitor - Only show on hover */}
          {isMonitorHovered && (
            <group ref={monitorHighlightRef}>
              <mesh
                position={[1.17, 2.985, 1.275]}
                rotation={[0, Math.PI * 5.57, 0]}
                scale={[-2.65, 1.05, 1.05]}
              >
                <cylinderGeometry
                  args={[1.25, 1.25, 0.98, 32, 1, true, 0, Math.PI * 0.4]}
                />
                <meshBasicMaterial
                  color="#ff0080"
                  transparent
                  opacity={isTouch ? 0.0 : 0.6}
                  side={2}
                />
              </mesh>
            </group>
          )}

          <rectAreaLight
            position={[0, 3, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            width={3}
            height={1.135}
            intensity={30}
            color="#ffffff"
          />
        </group>
      )}

      {/* Gaming Chair */}
      <primitive
        object={pcChair.scene.clone()}
        position={[-0.5, 0.5, -6.7]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={0.007}
        castShadow
      />

      {/* RGB LED Strips on wall behind PC */}
      <mesh position={[-2.6, 3.5, -6.425]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#ff0080"
          emissive="#ff0080"
          emissiveIntensity={2}
        />
      </mesh>

      <rectAreaLight
        position={[-2.65, 3.5, -6.425]}
        rotation={[0, Math.PI / 2, 0]}
        width={1}
        height={1.135}
        intensity={80}
        color="#ff0080"
      />

      {/* ============================================ */}
      {/* PS5 LIVING AREA (Right section of L)       */}
      {/* ============================================ */}

      {/* TV Stand */}
      <primitive
        object={tvUnit.scene.clone()}
        position={[2, 0, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1.8}
        castShadow
      />

      {/* PS5 Console */}
      <primitive
        object={ps5.scene.clone()}
        position={[1, 0.75, -0.4]}
        rotation={[0, 0, 0]}
        scale={1.5}
        castShadow
      />

      {/* VR Headset on TV Unit */}
      <primitive
        object={vrHeadset.scene.clone()}
        position={[2.8, 0.68, -0.4]}
        rotation={[0, Math.PI / 0.9, 0]}
        scale={1}
        castShadow
      />

      {/* PlayStation Lamp on TV Unit */}
      <primitive
        object={psLamp.scene.clone()}
        position={[2, 0.9, -0.5]}
        rotation={[0, 0, 0]}
        scale={0.07}
        castShadow
      />

      {/* Left Speaker */}
      <MemoizedAnimatedSpeaker
        position={[0.3, 0.9, -0.3]}
        rotation={[0, Math.PI, 0]}
        scale={0.3}
      />

      {/* Right Speaker */}
      <MemoizedAnimatedSpeaker
        position={[3.5, 0.9, -0.3]}
        rotation={[0, -Math.PI, 0]}
        scale={0.3}
      />

      {/* TV Screen - PS5 Interaction Point */}
      <group
        position={[1.9, 1.425, -0.095]}
        onClick={(e) => {
          e.stopPropagation();
          handleHotspotClick("ps5");
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (!isTouch) {
            setIsTvHovered(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          if (!isTouch) {
            setIsTvHovered(false);
            document.body.style.cursor = "auto";
          }
        }}
      >
        <primitive
          rotation={[1.9, Math.PI / 0.95, 0]}
          object={tv.scene.clone()}
          castShadow
        />

        {/* Glowing TV Screen with texture */}
        <mesh position={[0.05, 0.58, -0.215]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2, 1.135]} />
          <meshBasicMaterial map={tvScreenTexture} toneMapped={false} />
        </mesh>

        {/* Highlight Frame - Rectangular frame around TV screen - Only show on hover */}
        {isTvHovered && (
          <group
            ref={tvHighlightRef}
            position={[0.05, 0.58, -0.215]}
            rotation={[0, Math.PI, 0]}
          >
            {/* Top edge */}
            <mesh position={[0, 0.58, 0]}>
              <boxGeometry args={[2.1, 0.03, 0.02]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Bottom edge */}
            <mesh position={[0, -0.58, 0]}>
              <boxGeometry args={[2.1, 0.03, 0.02]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Left edge */}
            <mesh position={[-1.05, 0, 0]}>
              <boxGeometry args={[0.03, 1.17, 0.02]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Right edge */}
            <mesh position={[1.05, 0, 0]}>
              <boxGeometry args={[0.03, 1.17, 0.02]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
          </group>
        )}

        <rectAreaLight
          position={[0, 1.0, -0.12]}
          rotation={[-Math.PI / 4, 0, 0]}
          width={2}
          height={1.135}
          intensity={80}
          color="#9932cc"
        />

        {/* Additional point light to simulate leds behind TV */}
        <pointLight
          position={[0, 0.58, -1]}
          intensity={2}
          distance={3}
          color="#9932cc"
          decay={2}
        />
      </group>

      {/* PlayStation Lamp above TV */}
      <primitive
        object={psLampWall.scene.clone()}
        position={[1.9, 3.1, -0.15]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={5}
        castShadow
      />

      {/* Couch - 3-seater */}
      <primitive
        object={couch.scene.clone()}
        position={[2, 0.15, -3]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[1.5, 2.5, 1.5]}
        castShadow
      />

      {/* Coffee Table (next to couch) */}
      <primitive
        object={table.scene.clone()}
        position={[2.1, 0, -1.55]}
        rotation={[0, 0, 0]}
        scale={0.85}
        castShadow
      />

      {/* Phone on coffee table - Phone Interaction Point */}
      <group
        position={[2.1, 0.63, -1.55]}
        rotation={[-Math.PI / 2, 0, Math.PI / 6]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          handleHotspotClick("phone");
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (!isTouch) {
            setIsPhoneHovered(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          if (!isTouch) {
            setIsPhoneHovered(false);
            document.body.style.cursor = "auto";
          }
        }}
      >
        <primitive object={phone.scene.clone()} scale={0.2} castShadow />

        {/* Phone Screen Display - Video with realistic lighting */}
        <PhoneScreen />

        {/* Highlight Frame - Phone shape (rounded rectangle) - Only show on hover */}
        {isPhoneHovered && (
          <group ref={phoneHighlightRef} position={[0.005, -0.01, 0.012]}>
            {/* Top edge */}
            <mesh position={[0, 0.22, 0]}>
              <boxGeometry args={[0.2, 0.012, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Bottom edge */}
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[0.2, 0.012, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Left edge */}
            <mesh position={[-0.1, 0, 0]}>
              <boxGeometry args={[0.012, 0.36, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Right edge */}
            <mesh position={[0.1, 0, 0]}>
              <boxGeometry args={[0.012, 0.36, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
          </group>
        )}

        {/* Subtle spot light for realistic screen reflection on table */}
        <spotLight
          position={[0.1, 0.3, 0]}
          angle={Math.PI}
          penumbra={1}
          intensity={90.8}
          distance={2}
          color="#9932cc"
        />
      </group>

      {/* LED Strip behind TV */}
      <mesh position={[1.4, 1.8, -0.05]}>
        <boxGeometry args={[2.6, 0.05, 0.05]} />
        <meshStandardMaterial
          color="#00ff80"
          emissive="#00ff80"
          emissiveIntensity={2}
        />
      </mesh>

      {/* RGB Hexagon Lights - Right Side of TV (Honeycomb Pattern with Gradient Animation) */}
      <group position={[-0.5, 1.8, -0.1]}>
        <group>
          <AnimatedHexagon position={[-0.48, 0.5, 0]} offset={0.3} />
          <AnimatedHexagon position={[-0.48, 0.066, 0]} offset={1.3} />
          <AnimatedHexagon position={[-0.48, -0.37, 0]} offset={2.3} />
        </group>

        <group position={[-0.1, 0.022, 0]}>
          <AnimatedHexagon position={[0, 0.26, 0]} offset={0.8} />
          <AnimatedHexagon position={[0, -0.17, 0]} offset={1.8} />
          <AnimatedHexagon position={[0, -0.6, 0]} offset={2.8} />
        </group>
      </group>

      {/* RGB Hexagon Lights - Left Side of TV (Honeycomb Pattern with Gradient Animation) */}
      <group position={[4.6, 1.8, -0.1]}>
        <group>
          <AnimatedHexagon position={[0, 0.5, 0]} offset={0.3} />
          <AnimatedHexagon position={[0, 0.066, 0]} offset={1.3} />
          <AnimatedHexagon position={[0, -0.37, 0]} offset={2.3} />
        </group>

        <group position={[0.11, 0.025, 0]}>
          <AnimatedHexagon position={[-0.48, 0.26, 0]} offset={0.8} />
          <AnimatedHexagon position={[-0.48, -0.17, 0]} offset={1.8} />
          <AnimatedHexagon position={[-0.48, -0.6, 0]} offset={2.8} />
        </group>
      </group>

      {/* Animated LED Panel Lights Behind TV */}
      <group position={[1.9, 1.8, -0.08]}>
        {/* 3x3 grid of LED panels */}
        <AnimatedLEDPanel position={[-1.2, 0.8, -0.2]} />
        <AnimatedLEDPanel position={[-0.6, 0.8, -0.2]} />
        <AnimatedLEDPanel position={[0, 0.8, -0.2]} />
        <AnimatedLEDPanel position={[0.6, 0.8, -0.2]} />
        <AnimatedLEDPanel position={[1.2, 0.8, -0.2]} />

        <AnimatedLEDPanel position={[-1.2, 0.2, -0.2]} />
        <AnimatedLEDPanel position={[-0.6, 0.2, -0.2]} />
        <AnimatedLEDPanel position={[0, 0.2, -0.2]} />
        <AnimatedLEDPanel position={[0.6, 0.2, -0.2]} />
        <AnimatedLEDPanel position={[1.2, 0.2, -0.2]} />

        <AnimatedLEDPanel position={[-1.2, -0.4, -0.2]} />
        <AnimatedLEDPanel position={[-0.6, -0.4, -0.2]} />
        <AnimatedLEDPanel position={[0, -0.4, -0.2]} />
        <AnimatedLEDPanel position={[0.6, -0.4, -0.2]} />
        <AnimatedLEDPanel position={[1.2, -0.4, -0.2]} />
      </group>

      {/* Interactive Portrait Display - Opposite wall from PS5 TV */}
      <Portrait position={[1.4, 2, -8.85]} onClick={handleHotspotClick} />

      {/* Other room furniture */}
      <group>
        <primitive
          object={sweeper.scene.clone()}
          position={[1.3, 0.15, -8.2]}
          scale={0.2}
        />
        <primitive
          object={bed.scene.clone()}
          rotation={[0, -Math.PI / 2, 0]}
          position={[2.8, 0, -6.4]}
          scale={1.5}
        />
        <primitive
          object={purifier.scene.clone()}
          rotation={[0, -Math.PI / 7.3, 0]}
          position={[-1, 0, -4]}
          scale={0.3}
        />
      </group>
    </group>
  );
}

export default function Room({
  toggleControls,
}: {
  toggleControls: (enabled: boolean) => void;
}) {
  const { camera } = useThree();

  return (
    <Suspense fallback={<Loader />}>
      <RoomContent cameraRef={camera} toggleControls={toggleControls} />
    </Suspense>
  );
}
