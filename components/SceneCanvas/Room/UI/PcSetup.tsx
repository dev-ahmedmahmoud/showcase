import { useState, forwardRef } from "react";
import { useGLTF, useTexture, Text } from "@react-three/drei";
import { HotspotId, useScene } from "@/components/utils/SceneContext";
import { useXR } from "@react-three/xr";
import { links } from "@/components/utils/data";
import GuideArrow from "./GuideArrow";
import Model from "@/components/utils/Model";

function PcSetupHighlight({ onLinkClick }: { onLinkClick: () => void }) {
  const session = useXR((state) => state.session);

  const handleLinkClick = () => {
    if (session) {
      if (onLinkClick) {
        onLinkClick();
      }
      session.end();
    }
    if (!Array.isArray(links.pc)) {
      window.open(links.pc.project, "_blank");
    }
  };

  return (
    <mesh
      position={[0, 3.7, 0]}
      rotation={[0, Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        handleLinkClick();
      }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "auto")}
    >
      <planeGeometry args={[2, 0.4]} />
      <meshBasicMaterial color="#ff0080" transparent opacity={0.5} />
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        CURIOUS ABOUT ME?
      </Text>
    </mesh>
  );
}

const PcSetup = forwardRef(function PcSetup(
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
  const monitor = useGLTF("/models/monitor.glb");
  const desk = useGLTF("/models/desk.glb");
  const pc = useGLTF("/models/pc.glb");
  const meta = useGLTF("/models/meta.glb");
  const pcDisplayTexture = useTexture("/pc_display.png");

  const { tourStep, completeTourStep } = useScene();

  const [isMonitorHovered, setIsMonitorHovered] = useState(isTouch && !isPresenting);

  const onLinkClick = () => {
    if (isPresenting) {
      completeTourStep("pc");
    }
  };

  return (
    <group ref={ref}>
      {/* PC SETUP AREA (Left section of L)          */}
      {/* ============================================ */}

      {/* PC Desk */}
      <Model
        object={desk.scene}
        position={[0.2, -0.3, -12.425]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.79, 0.5, 0.5]} // [width (X), height (Y), depth (Z)]
        castShadow
      />

      {/* PC Tower */}
      <Model
        object={pc.scene}
        position={[-2.3, 1.76, -8.45]}
        rotation={[0, 0, 0]}
        scale={2}
        castShadow
      />

      {/* Meta quest on desk */}
      <Model
        object={meta.scene}
        position={[-2.2, 1.6, -5.4]}
        rotation={[0, Math.PI / 1.5, 0]}
        scale={1.3}
        castShadow
      />

      {/* Monitor - PC Interaction Point */}
      {monitor && monitor.scene && (
        <group
          position={[-2.6, -0.77, -6.6]}
          rotation={[0, Math.PI / 0.5, 0]}
          onClick={(e) => {
            e.stopPropagation();
            handleHotspotClick("pc");
            if (!isPresenting) completeTourStep("pc");
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!isTouch && !isPresenting) {
              setIsMonitorHovered(true);
              document.body.style.cursor = "pointer";
            }
          }}
          onPointerOut={() => {
            if (!isTouch && !isPresenting) {
              setIsMonitorHovered(false);
              document.body.style.cursor = "auto";
            }
          }}
        >
          {/* Monitor GLB Model */}
          <Model object={monitor.scene} scale={1} castShadow />

          {/* Curved Monitor Display with texture */}
          <mesh
            position={[1.185, 2.985, 1.25]}
            rotation={[0, Math.PI * 5.58, 0]}
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
            <group ref={ref}>
              <mesh
                position={[1.18, 2.985, 1.25]}
                rotation={[0, Math.PI * 5.58, 0]}
                scale={[-2.6, 1.1, 1]}
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
                  color="#ff0080"
                  transparent
                  opacity={isTouch ? 0.0 : 0.6}
                  side={2}
                />
              </mesh>
            </group>
          )}

          {/* Light coming out of PC */}
          <rectAreaLight
            position={[0, 3, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            width={3}
            height={1.135}
            intensity={30}
            color="#ffffff"
          />

          {/* Guide Arrow */}
          {tourStep === "pc" && (
            <GuideArrow
              animateY
              animateX
              animateZ={isPresenting}
              position={[0.5, isPresenting ? 4 : 3.5, 1.2]}
              rotation={[0, -Math.PI / 3, Math.PI / 1.5]}
              color={"#ff0080"}
            />
          )}

          {/* VR UI - Visit Project Button */}
          {isPresenting && <PcSetupHighlight onLinkClick={onLinkClick} />}
        </group>
      )}

      {/* Gaming Chair */}

    </group>
  );
});
export default PcSetup;

// Start downloads at module load instead of waiting for the Suspense waterfall
useGLTF.preload("/models/monitor.glb");
useGLTF.preload("/models/desk.glb");
useGLTF.preload("/models/pc.glb");
useGLTF.preload("/models/meta.glb");
useTexture.preload("/pc_display.png");
