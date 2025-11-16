'use client';

import { useEffect, useState } from 'react';
import { Vector3, BufferGeometry, Line, LineBasicMaterial } from 'three';
import { useScene } from '@/components/utils/SceneContext';
import { SAFETY_MARGIN } from '@/components/utils/pathfinding';

type ObstacleShape =
  | { type: 'box'; center: Vector3; width: number; depth: number; rotation?: number }
  | { type: 'circle'; center: Vector3; radius: number };

// Copy obstacle and wall data for visualization (matches pathfinding.ts EXACTLY)
const OBSTACLES: ObstacleShape[] = [
  { type: 'box', center: new Vector3(-1.60, 0, -2.25), width: 0.2, depth: 4.5 }, // Inner Wall (Vertical)
  { type: 'box', center: new Vector3(-2.5, 0, -4.5), width: 2.0, depth: 0.2 }, // Inner Wall (Horizontal)
  { type: 'box', center: new Vector3(-3.4, 0, -6.425), width: 4.5, depth: 3.35, rotation: Math.PI / 2 }, // PC Desk
  { type: 'box', center: new Vector3(-0.8, 0, -6.7), width: 1, depth: 1, rotation: Math.PI / 2 }, // Gaming Chair
  { type: 'box', center: new Vector3(2, 0, -0.3), width: 0.6, depth: 2.5, rotation: Math.PI / 2 }, // TV Stand
  { type: 'box', center: new Vector3(2, 0, -3), width: 1.3, depth: 3, rotation: -Math.PI / 2 }, // Couch
  { type: 'box', center: new Vector3(2.1, 0, -1.55), width: 0.7, depth: 0.5 }, // Coffee Table
  { type: 'box', center: new Vector3(4, 0, -6.8), width: 3, depth: 2.6, rotation: -Math.PI }, // Bed
  { type: 'circle', center: new Vector3(-1, 0, -4), radius: 0.3 }, // Air Purifier
  { type: 'circle', center: new Vector3(0.3, 0, -0.3), radius: 0.25 }, // Left Speaker
  { type: 'circle', center: new Vector3(3.5, 0, -0.3), radius: 0.25 }, // Right Speaker
  { type: 'circle', center: new Vector3(1.3, 0, -8.2), radius: 0.25 }, // Robot Sweeper
];

const WALLS = [
  { start: new Vector3(-3.6, 0, -4.39), end: new Vector3(-3.6, 0, -9.01) },
  { start: new Vector3(-3.7, 0, -9), end: new Vector3(5.3, 0, -9) },
  { start: new Vector3(5.2, 0, 0), end: new Vector3(5.2, 0, -9) },
  { start: new Vector3(-1.675, 0, 0), end: new Vector3(5.475, 0, 0) },
  { start: new Vector3(-1.60, 0, 0), end: new Vector3(-1.60, 0, -4.5) },
  { start: new Vector3(-3.5, 0, -4.5), end: new Vector3(-1.5, 0, -4.5) },
];

export default function PathDebugger() {
  const { targetPosition, currentPath } = useScene();
  const [pathInfo, setPathInfo] = useState<{ startPoint: Vector3; endPoint: Vector3; waypoints: Vector3[] } | null>(null);

  useEffect(() => {
    if (targetPosition && currentPath) {
      const allPoints = currentPath.getAllPoints();
      const waypoints = allPoints.slice(1, -1).map(p => p.position); // Exclude start and end
      
      setPathInfo({
        startPoint: allPoints[0].position,
        endPoint: allPoints[allPoints.length - 1].position,
        waypoints: waypoints,
      });
    } else {
      setPathInfo(null);
    }
  }, [targetPosition, currentPath]);

  return (
    <group>
      {/* Always render obstacles (collision zones) - furniture dimensions + safety margin */}
      {OBSTACLES.map((obstacle, i) => {
        if (obstacle.type === 'circle') {
          return (
            <mesh key={`obstacle-${i}`} position={[obstacle.center.x, 0.5, obstacle.center.z]}>
              <cylinderGeometry args={[obstacle.radius + SAFETY_MARGIN, obstacle.radius + SAFETY_MARGIN, 1, 16]} />
              <meshBasicMaterial color="#ff0000" wireframe transparent opacity={0.3} />
            </mesh>
          );
        } else {
          // Box obstacle
          const rotation = obstacle.rotation || 0;
          const visualWidth = obstacle.width + (SAFETY_MARGIN * 2);
          const visualDepth = obstacle.depth + (SAFETY_MARGIN * 2);
          return (
            <mesh 
              key={`obstacle-${i}`} 
              position={[obstacle.center.x, 0.5, obstacle.center.z]}
              rotation={[0, rotation, 0]}
            >
              <boxGeometry args={[visualWidth, 1, visualDepth]} />
              <meshBasicMaterial color="#ff0000" wireframe transparent opacity={0.3} />
            </mesh>
          );
        }
      })}

      {/* Always render walls as lines */}
      {WALLS.map((wall, i) => {
        const points = [
          wall.start.x, wall.start.y + 0.1, wall.start.z,
          wall.end.x, wall.end.y + 0.1, wall.end.z,
        ];
        return (
          <line key={`wall-${i}`}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[new Float32Array(points), 3]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#0000ff" />
          </line>
        );
      })}

      {/* Draw path info only when available */}
      {pathInfo && (
        <>
          {/* Draw direct path ray */}
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                args={[
                  new Float32Array([
                    pathInfo.startPoint.x, pathInfo.startPoint.y, pathInfo.startPoint.z,
                    pathInfo.endPoint.x, pathInfo.endPoint.y, pathInfo.endPoint.z,
                  ]),
                  3
                ]}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#00ff00" />
          </line>

          {/* Draw start and end points */}
          <mesh position={[pathInfo.startPoint.x, 0.2, pathInfo.startPoint.z]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#00ff00" />
          </mesh>

          <mesh position={[pathInfo.endPoint.x, 0.2, pathInfo.endPoint.z]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>

          {/* Draw waypoints if any */}
          {pathInfo.waypoints.map((waypoint, i) => (
            <group key={`waypoint-${i}`}>
              <mesh position={[waypoint.x, 0.2, waypoint.z]}>
                <sphereGeometry args={[0.15, 16, 16]} />
                <meshBasicMaterial color="#ffff00" />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
}
