import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Shape } from "three";
import { Text, RoundedBox, Outlines } from "@react-three/drei";

export default function GuideArrow({
    position,
    rotation = [0, 0, 0],
    color = "#00ffff",
    animateX = false,
    animateY = false,
    animateZ = false,
    animateNegativeX = false,
    animateNegativeY = false,
    animateNegativeZ = false,
}: {
    position: [number, number, number];
    rotation?: [number, number, number];
    color?: string;
    animateX?: boolean;
    animateY?: boolean;
    animateZ?: boolean;
    animateNegativeX?: boolean;
    animateNegativeY?: boolean;
    animateNegativeZ?: boolean;
}) {
    const groupRef = useRef<Group>(null);

    useFrame((state) => {
        if (groupRef.current) {
            // Bobbing animation
            const offset = Math.sin(state.clock.elapsedTime * 3) * 0.1;

            if (animateX) groupRef.current.position.x = position[0] + offset;
            if (animateY) groupRef.current.position.y = position[1] + offset;
            if (animateZ) groupRef.current.position.z = position[2] + offset;
            if (animateNegativeX) groupRef.current.position.x = position[0] - offset;
            if (animateNegativeY) groupRef.current.position.y = position[1] - offset;
            if (animateNegativeZ) groupRef.current.position.z = position[2] - offset;
        }
    });

    const arrowShape = useMemo(() => {
        const shape = new Shape();
        const width = 0.25;
        const height = 0.4;
        const r = 0.05; // radius for corners

        // Start at bottom left (rounded)
        shape.moveTo(-width + r, 0);

        // Bottom edge
        shape.lineTo(width - r, 0);

        // Bottom right corner
        shape.quadraticCurveTo(width, 0, width - 0.027, 0.043);

        // Right edge to top
        shape.lineTo(0.027, height - 0.043);

        // Top corner
        shape.quadraticCurveTo(0, height, -0.027, height - 0.043);

        // Left edge to bottom
        shape.lineTo(-width + 0.027, 0.043);

        // Bottom left corner
        shape.quadraticCurveTo(-width, 0, -width + r, 0);

        return shape;
    }, []);

    const extrudeSettings = useMemo(() => ({
        depth: 0.05,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 4
    }), []);

    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            {/* Arrow Head (Extruded Triangle) */}
            <mesh position={[0, -0.05, -0.025]}>
                <extrudeGeometry args={[arrowShape, extrudeSettings]} />
                <meshBasicMaterial color={color} transparent opacity={0.8} />
                <Outlines thickness={0.02} color={color} />
            </mesh>

            {/* Arrow Shaft (RoundedBox) - Doubled Size & New Shape */}
            <RoundedBox
                args={[0.25, 0.6, 0.05]} // Width, Height, Depth
                radius={0.05}
                smoothness={4}
                position={[0, -0.35, 0]} // Adjusted to connect with head
            >
                <meshBasicMaterial color={color} transparent opacity={0.8} />
                <Outlines thickness={0.02} color={color} />
                <Text
                    position={[0, 0, 0.03]}
                    fontSize={0.08}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    rotation={[0, 0, -Math.PI / 2]}
                >
                    Tap here
                </Text>
                <Text
                    position={[0, 0, -0.03]}
                    fontSize={0.08}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    rotation={[0, Math.PI, Math.PI / 2]}
                >
                    Tap here
                </Text>
            </RoundedBox>
        </group>
    );
}
