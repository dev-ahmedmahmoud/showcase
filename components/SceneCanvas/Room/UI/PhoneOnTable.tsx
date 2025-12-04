import { forwardRef, useState } from "react";
import { useVideoTexture } from "@/components/utils/useVideoTexture";
import { useGLTF, Text } from "@react-three/drei";
import { ThreeEvent } from "@react-three/fiber";
import { HotspotId, useScene } from "@/components/utils/SceneContext";
import { useXR } from "@react-three/xr";
import { links } from "@/components/utils/data";
import GuideArrow from "./GuideArrow";

function PhoneOnTableHighlight({ onLinkClick }: { onLinkClick?: () => void }) {
  const session = useXR((state) => state.session);

  const handleLinkClick = () => {
    if (session) {
      if (onLinkClick) {
        onLinkClick();
      }
      session.end();
    }

    if (!Array.isArray(links.phone)) {
      window.open(links.phone.project, "_blank");
    }
  };

  return (
    <mesh
      position={[0, 0.4, 0]}
      rotation={[0, 0, Math.PI / 30]}
      onClick={(e) => {
        e.stopPropagation();
        handleLinkClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <planeGeometry args={[0.5, 0.15]} />
      <meshBasicMaterial color="#9932cc" transparent opacity={0.5} />
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.05}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        REACH OUT
      </Text>
    </mesh>
  );
}

const PhoneOnTable = forwardRef(function PhoneOnTable(
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
  const table = useGLTF("/models/table.glb");
  const phone = useGLTF("/models/phone.glb");
  const { texture: videoTexture } = useVideoTexture("/phone.mp4");

  const [isPhoneHovered, setIsPhoneHovered] = useState(isTouch && !isPresenting);
  const { completeTourStep, tourStep } = useScene();

  const onLinkClick = () => {
    if (isPresenting) completeTourStep("phone");
  };

  return (
    <group>
      <primitive
        object={table.scene.clone()}
        position={[2.1, 0, -1.55]}
        rotation={[0, 0, 0]}
        scale={0.85}
        castShadow
      />

      {/* Phone on table - Phone Interaction Point */}
      <group
        position={[2.1, 0.63, -1.55]}
        rotation={[-Math.PI / 2, 0, Math.PI / 6]}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          handleHotspotClick("phone");
          !isPresenting && completeTourStep("phone");
        }}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (!isTouch && !isPresenting) {
            setIsPhoneHovered(true);
            document.body.style.cursor = "pointer";
          }
        }}
        onPointerOut={() => {
          if (!isTouch && !isPresenting) {
            setIsPhoneHovered(false);
            document.body.style.cursor = "auto";
          }
        }}
      >
        <primitive object={phone.scene.clone()} scale={0.2} castShadow />

        {/* Phone Screen Display - Video with realistic lighting */}
        <mesh position={[0.005, -0.01, 0.0115]} rotation={[0, 0, 0]}>
          <planeGeometry args={[0.19, 0.35]} />
          <meshBasicMaterial
            map={videoTexture}
            toneMapped={false}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Highlight Frame - Phone shape (rounded rectangle) - Only show on hover */}
        {isPhoneHovered && (
          <group ref={ref} position={[0.005, -0.01, 0.012]}>
            {/* Top edge */}
            <mesh position={[-0.006, 0.2325, -0.01]}>
              <boxGeometry args={[0.21, 0.012, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Bottom edge */}
            <mesh position={[0.002, -0.21, -0.01]}>
              <boxGeometry args={[0.21, 0.012, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Left edge */}
            <mesh position={[-0.108, 0.01, -0.01]}>
              <boxGeometry args={[0.012, 0.45, 0.012]} />
              <meshBasicMaterial
                color="#9932cc"
                transparent
                opacity={isTouch ? 0.0 : 0.6}
              />
            </mesh>
            {/* Right edge */}
            <mesh position={[0.1, 0.015, -0.01]}>
              <boxGeometry args={[0.012, 0.45, 0.012]} />
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

        {/* Guide Arrow */}
        {tourStep === "phone" && (
          <GuideArrow
            animateZ
            animateNegativeY
            position={[0, -0.3, 0.4]}
            rotation={[-Math.PI / 4, -Math.PI / 2, 0]}
            color="#9932cc"
          />
        )}

        {/* VR UI - Visit Project Button */}
        {isPresenting && <PhoneOnTableHighlight onLinkClick={onLinkClick} />}
      </group>
    </group>
  );
});

export default PhoneOnTable;
