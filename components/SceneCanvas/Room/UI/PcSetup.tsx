import { useState, forwardRef } from "react";
import { useGLTF, useTexture } from "@react-three/drei";
import { HotspotId } from "@/components/utils/SceneContext";

const PcSetup = forwardRef(function PcSetup(
  {
    isTouch,
    handleHotspotClick,
  }: {
    isTouch: boolean;
    handleHotspotClick: (hotspot?: HotspotId) => void;
  },
  ref
) {
  const monitor = useGLTF("/models/monitor.glb");
  const desk = useGLTF("/models/desk.glb");
  const pc = useGLTF("/models/pc.glb");
  const meta = useGLTF("/models/meta.glb");
  const pcChair = useGLTF("/models/pc_chair.glb");
  const pcDisplayTexture = useTexture("/pc_display.png");

  const [isMonitorHovered, setIsMonitorHovered] = useState(isTouch);

  return (
    <group ref={ref}>
      {/* PC SETUP AREA (Left section of L)          */}
      {/* ============================================ */}

      {/* PC Desk */}
      <primitive
        object={desk.scene.clone()}
        position={[0.2, -0.3, -12.425]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[0.79, 0.5, 0.5]} // [width (X), height (Y), depth (Z)]
        castShadow
      />

      {/* PC Tower */}
      <primitive
        object={pc.scene.clone()}
        position={[-2.3, 1.76, -8.45]}
        rotation={[0, 0, 0]}
        scale={2}
        castShadow
      />

      {/* Meta quest on desk */}
      <primitive
        object={meta.scene.clone()}
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
    </group>
  );
});
export default PcSetup;
