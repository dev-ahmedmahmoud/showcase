import { forwardRef, memo, useEffect, useRef, useState } from "react";
import { HotspotId } from "@/components/utils/SceneContext";
import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Group, AnimationMixer } from "three";

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

const Tv = forwardRef(function Tv(
  {
    position,
    rotation,
    scale,
    isTouch,
    handleHotspotClick,
  }: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    isTouch: boolean;
    handleHotspotClick: (hotspot?: HotspotId) => void;
  },
  ref
) {
  const tv = useGLTF("/models/tv.glb");
  const tvScreenTexture = useTexture("/tv.png");

  const [isTvHovered, setIsTvHovered] = useState(isTouch);

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
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
        rotation={[0, Math.PI / 0.95, 0]}
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
          ref={ref}
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
    </group>
  );
});

function TvUnit({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
}) {
  const tvUnit = useGLTF("/models/tv_unit.glb");
  const ps5 = useGLTF("/models/ps5.glb");
  const vrHeadset = useGLTF("/models/vr.glb");
  const psLamp = useGLTF("/models/playstation_lamp.glb");
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive
        object={tvUnit.scene.clone()}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={1.8}
        castShadow
      />

      {/* PS5 Console */}
      <primitive
        object={ps5.scene.clone()}
        position={[0.15, 0.64, -1.1]}
        rotation={[0, Math.PI / 2, 0]}
        scale={2}
        castShadow
      />

      {/* VR Headset on TV Unit */}
      <primitive
        object={vrHeadset.scene.clone()}
        position={[0, 0.685, 0.8]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.8}
        castShadow
      />

      {/* PlayStation Lamp on TV Unit */}
      <primitive
        object={psLamp.scene.clone()}
        position={[0, 0.9, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.065}
        castShadow
      />
    </group>
  );
}

function Speakers({
  position,
  rotation,
  distance,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  distance: number,
  scale: number;
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Left Speaker */}
      <MemoizedAnimatedSpeaker
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={0.3}
      />

      {/* Right Speaker */}
      <MemoizedAnimatedSpeaker
        position={[0 + distance, 0, 0]}
        rotation={[0, 0, 0]}
        scale={0.3}
      />
    </group>
  );
}

const PS5Setup = forwardRef(function PS5Setup(
  {
    isTouch,
    handleHotspotClick,
  }: {
    isTouch: boolean;
    handleHotspotClick: (hotspot?: HotspotId) => void;
  },
  ref
) {
  const psLampWall = useGLTF("/models/ps_lamp.glb");

  return (
    <group>
      <Tv
        ref={ref}
        position={[1.9, 1.425, -0.095]}
        rotation={[0, 0, 0]}
        scale={1}
        isTouch={isTouch}
        handleHotspotClick={handleHotspotClick}
      />

      <TvUnit
        position={[1.8, 0, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1}
      />

      <Speakers
        position={[3.6, 0.9, -0.44]}
        rotation={[0, Math.PI, 0]}
        distance={3.5}
        scale={1}
      />

      {/* PlayStation Lamp above TV */}
      <primitive
        object={psLampWall.scene.clone()}
        position={[2, 3.1, -0.15]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={5}
        castShadow
      />
    </group>
  );
});

export default PS5Setup;
