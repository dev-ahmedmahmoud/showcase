import { forwardRef, useState } from "react";
import { HotspotId } from "@/components/utils/SceneContext";
import { useGLTF, useTexture, Text } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import { links } from "@/components/utils/data";

function AnimatedSpeaker({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}) {
  const speaker = useGLTF("/models/speaker.glb");

  return (
    <group position={position} rotation={rotation} scale={scale}>
      <primitive object={speaker.scene.clone()} castShadow />
    </group>
  );
}

function PS5SetupHighlight() {
  const session = useXR((state) => state.session);

  const handleLinkClick = () => {
    if (session) {
      session.end();
    }

    if (!Array.isArray(links.ps5)) {
      window.open(links.ps5.project, "_blank");
    }
  };

  return (
    <mesh
      position={[0, 1.5, -0.5]}
      rotation={[0, Math.PI, 0]}
      onClick={(e) => {
        e.stopPropagation();
        handleLinkClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <planeGeometry args={[1.5, 0.4]} />
      <meshBasicMaterial color="#9932cc" transparent opacity={0.5} />
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        CHECK OUT MY XR WORK
      </Text>
    </mesh>
  );
}

const Tv = forwardRef(function Tv(
  {
    position,
    rotation,
    scale,
    isTouch,
    handleHotspotClick,
    isPresenting,
  }: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: number;
    isTouch: boolean;
    handleHotspotClick: (hotspot?: HotspotId) => void;
    isPresenting?: boolean;
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
        if (!isTouch && !isPresenting) {
          setIsTvHovered(true);
          document.body.style.cursor = "pointer";
        }
      }}
      onPointerOut={() => {
        if (!isTouch && !isPresenting) {
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
      <mesh position={[0.032, 0.572, -0.215]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2, 1.135]} />
        <meshBasicMaterial map={tvScreenTexture} toneMapped={false} />
      </mesh>

      {/* Highlight Frame - Rectangular frame around TV screen - Only show on hover */}
      {isTvHovered && (
        <group
          ref={ref}
          position={[0.03, 0.58, -0.215]}
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
          <mesh position={[-1.035, 0, 0]}>
            <boxGeometry args={[0.03, 1.17, 0.02]} />
            <meshBasicMaterial
              color="#9932cc"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
          {/* Right edge */}
          <mesh position={[1.035, 0, 0]}>
            <boxGeometry args={[0.03, 1.17, 0.02]} />
            <meshBasicMaterial
              color="#9932cc"
              transparent
              opacity={isTouch ? 0.0 : 0.6}
            />
          </mesh>
        </group>
      )}

      {/* VR UI - Visit Project Button */}
      {isPresenting && <PS5SetupHighlight />}
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
        position={[0.05, 0.685, 0.95]}
        rotation={[0, Math.PI / 2, 0]}
        scale={0.8}
        castShadow
      />

      {/* PlayStation Lamp on TV Unit */}
      <primitive
        object={psLamp.scene.clone()}
        position={[0, 0.9, 0.065]}
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
      {/* Left Speakers */}
      <group position={[0, 0, 0]}>
        <AnimatedSpeaker
          position={[0, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.5, 1, 1]}
        />
        <AnimatedSpeaker
          position={[0, 0.72, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.5, 1, 1]}
        />
      </group>

      {/* Right Speakers */}
      <group position={[distance, 0, 0]}>
        <AnimatedSpeaker
          position={[0, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.5, 1, 1]}
        />
        <AnimatedSpeaker
          position={[0, 0.72, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[0.5, 1, 1]}
        />
      </group>

    </group>
  );
}

const PS5Setup = forwardRef(function PS5Setup(
  {
    isTouch,
    handleHotspotClick,
    isPresenting,
  }: {
    isTouch: boolean;
    handleHotspotClick: (hotspot?: HotspotId) => void;
    isPresenting?: boolean;
  },
  ref
) {
  const psLampWall = useGLTF("/models/ps_lamp.glb");

  return (
    <group>
      <Tv
        ref={ref}
        position={[1.825, 1.425, -0.095]}
        rotation={[0, 0, 0]}
        scale={1}
        isTouch={isTouch}
        handleHotspotClick={handleHotspotClick}
        isPresenting={isPresenting}
      />

      {!isTouch && <TvUnit
        position={[1.8, 0, -0.3]}
        rotation={[0, Math.PI / 2, 0]}
        scale={1}
      />}

      <Speakers
        position={[3.6, 1.4, -0.44]}
        rotation={[0, Math.PI, 0]}
        distance={3.5}
        scale={1}
      />

      {/* PlayStation Lamp above TV */}
      <primitive
        object={psLampWall.scene.clone()}
        position={[1.86, 3.1, -0.15]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={5}
        castShadow
      />
    </group>
  );
});

export default PS5Setup;
