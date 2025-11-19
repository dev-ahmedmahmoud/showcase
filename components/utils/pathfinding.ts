import { Vector3 } from "three";

/**
 * Pathfinding utility with obstacle avoidance
 */

export interface PathPoint {
  position: Vector3;
  reached: boolean;
}

// Define wall boundaries as line segments
interface WallSegment {
  start: Vector3;
  end: Vector3;
}

const WALLS: WallSegment[] = [
  // PC Section Walls - Left wall: position [-3.6, 2, -6.7], rotated, depth 4.62
  // This spans from z=-4.39 to z=-9.01 (center -6.7 ± 2.31)
  { start: new Vector3(-3.6, 0, -4.39), end: new Vector3(-3.6, 0, -9.01) },

  // PS5 Section Walls
  // Back wall: position [0.8, 2, -9], width 9, so from x=-3.7 to x=5.3
  { start: new Vector3(-3.7, 0, -9), end: new Vector3(5.3, 0, -9) },

  // Right wall: position [5.2, 2, -4.5], rotated, depth 9, so from z=0 to z=-9
  { start: new Vector3(5.2, 0, 0), end: new Vector3(5.2, 0, -9) },

  // Front wall (PS5 section): position [1.8, 2, 0], width 6.95, from x=-1.675 to x=5.475
  { start: new Vector3(-1.675, 0, 0), end: new Vector3(5.475, 0, 0) },

  // Inner wall (vertical): position [-1.60, 2, -2.25], depth 4.5, from z=0 to z=-4.5
  { start: new Vector3(-1.6, 0, 0), end: new Vector3(-1.6, 0, -4.5) },

  // Inner wall (horizontal): position [-2.5, 2, -4.5], width 2, from x=-3.5 to x=-1.5
  { start: new Vector3(-3.5, 0, -4.5), end: new Vector3(-1.5, 0, -4.5) },
];

// Define obstacles with accurate shapes
type ObstacleShape =
  | {
      type: "box";
      center: Vector3;
      width: number;
      depth: number;
      rotation?: number;
    }
  | { type: "circle"; center: Vector3; radius: number };

const OBSTACLES: ObstacleShape[] = [
  // Inner Wall (Vertical) - Position [-1.60, 2, -2.25], boxGeometry [0.2, 4, 4.5]
  { type: "box", center: new Vector3(-1.6, 0, -2.25), width: 0.2, depth: 4.5 },

  // Inner Wall (Horizontal) - Position [-2.5, 2, -4.5], boxGeometry [2, 4, 0.2]
  { type: "box", center: new Vector3(-2.5, 0, -4.5), width: 2.0, depth: 0.2 },

  // PC Desk - Position [-3.4, 0, -6.425], scale [3.35, 2, 3], rotated 90°
  // After 90° rotation: X-scale (3.35) becomes Z-axis, Z-scale (3) becomes X-axis
  {
    type: "box",
    center: new Vector3(-3.4, 0, -6.425),
    width: 4.5,
    depth: 3.35,
    rotation: Math.PI / 2,
  },

  // Gaming Chair - Position [-0.8, 0, -6.7], box footprint
  {
    type: "box",
    center: new Vector3(-0.8, 0, -6.7),
    width: 1,
    depth: 1,
    rotation: Math.PI / 2,
  },

  // TV Stand - Position [2, 0, -0.3], scale 1.8, rotated 90°
  // Estimated dimensions: ~2.5m wide (rotated), ~0.6m deep
  {
    type: "box",
    center: new Vector3(2, 0, -0.3),
    width: 0.6,
    depth: 2.5,
    rotation: Math.PI / 2,
  },

  // Couch - Position [2, 0, -3], scale 1.5, rotated -90°
  // Estimated base dimensions ~1.5m x ~0.6m, rotated -90° so width↔depth swap
  {
    type: "box",
    center: new Vector3(2, 0, -3),
    width: 1.3,
    depth: 3,
    rotation: -Math.PI / 2,
  },

  // Coffee Table - Position [2.1, 0, -1.55], scale 0.85
  // Estimated dimensions: ~0.7m x ~0.5m
  { type: "box", center: new Vector3(2.1, 0, -1.55), width: 0.7, depth: 0.5 },

  // Bed - Position [4, 0, -6.8], rotated -180°
  // Standard bed ~2m long x ~1.2m wide, after rotation and scale
  {
    type: "box",
    center: new Vector3(4, 0, -6.8),
    width: 3,
    depth: 2.6,
    rotation: -Math.PI,
  },

  // Air Purifier - Position [-1, 0, -4], scale 0.3
  // Small circular footprint
  { type: "circle", center: new Vector3(-1, 0, -4), radius: 0.3 },

  // Left Speaker - Position [0.3, 0.9, -0.3], scale 0.3
  { type: "circle", center: new Vector3(0.3, 0, -0.3), radius: 0.25 },

  // Right Speaker - Position [3.5, 0.9, -0.3], scale 0.3
  { type: "circle", center: new Vector3(3.5, 0, -0.3), radius: 0.25 },

  // Robot Sweeper - Position [1.3, 0.15, -8.2], scale 0.2
  { type: "circle", center: new Vector3(1.3, 0, -8.2), radius: 0.25 },
];

export class SimplePath {
  private points: PathPoint[] = [];
  private currentIndex = 0;

  constructor(start: Vector3, end: Vector3, waypoints?: Vector3[]) {
    if (waypoints && waypoints.length > 0) {
      this.points = this.generateWaypointPath(start, end, waypoints);
    } else {
      this.points = this.generateStraightPath(start, end);
    }
  }

  private generateStraightPath(start: Vector3, end: Vector3): PathPoint[] {
    return [
      { position: start.clone(), reached: false },
      { position: end.clone(), reached: false },
    ];
  }

  private generateWaypointPath(
    start: Vector3,
    end: Vector3,
    waypoints: Vector3[]
  ): PathPoint[] {
    const path: PathPoint[] = [{ position: start.clone(), reached: false }];

    // Add all waypoints
    waypoints.forEach((wp) => {
      path.push({ position: wp.clone(), reached: false });
    });

    // Add final destination
    path.push({ position: end.clone(), reached: false });

    return path;
  }

  getCurrentTarget(): Vector3 | null {
    if (this.currentIndex >= this.points.length) {
      return null;
    }
    return this.points[this.currentIndex].position;
  }

  markCurrentReached() {
    if (this.currentIndex < this.points.length) {
      this.points[this.currentIndex].reached = true;
      this.currentIndex++;
    }
  }

  isComplete(): boolean {
    return this.currentIndex >= this.points.length;
  }

  getAllPoints(): PathPoint[] {
    return this.points;
  }

  getProgress(): number {
    return this.currentIndex / this.points.length;
  }
}

/**
 * Check if two line segments intersect
 */
function lineSegmentsIntersect(
  a1: Vector3,
  a2: Vector3,
  b1: Vector3,
  b2: Vector3,
  margin: number = 0.3
): boolean {
  // Convert to 2D (using x and z coordinates)
  const ax1 = a1.x,
    az1 = a1.z,
    ax2 = a2.x,
    az2 = a2.z;
  const bx1 = b1.x,
    bz1 = b1.z,
    bx2 = b2.x,
    bz2 = b2.z;

  // Calculate distance from point to line segment
  const distanceToSegment = (
    px: number,
    pz: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number
  ): number => {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const lengthSq = dx * dx + dz * dz;

    if (lengthSq === 0)
      return Math.sqrt((px - x1) * (px - x1) + (pz - z1) * (pz - z1));

    let t = ((px - x1) * dx + (pz - z1) * dz) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const closestX = x1 + t * dx;
    const closestZ = z1 + t * dz;

    return Math.sqrt(
      (px - closestX) * (px - closestX) + (pz - closestZ) * (pz - closestZ)
    );
  };

  // Check if path endpoints are too close to wall
  const dist1 = distanceToSegment(ax1, az1, bx1, bz1, bx2, bz2);
  const dist2 = distanceToSegment(ax2, az2, bx1, bz1, bx2, bz2);

  if (dist1 < margin || dist2 < margin) return true;

  // Check if wall endpoints are close to path
  const dist3 = distanceToSegment(bx1, bz1, ax1, az1, ax2, az2);
  const dist4 = distanceToSegment(bx2, bz2, ax1, az1, ax2, az2);

  if (dist3 < margin || dist4 < margin) return true;

  return false;
}

/**
 * Check if path intersects with any walls
 */
function checkWallCollision(start: Vector3, end: Vector3): boolean {
  for (const wall of WALLS) {
    if (lineSegmentsIntersect(start, end, wall.start, wall.end, 0.5)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a point is inside a box (axis-aligned or rotated)
 */
function isPointInBox(
  point: Vector3,
  center: Vector3,
  width: number,
  depth: number,
  rotation: number = 0,
  margin: number = 0
): boolean {
  // Translate point to box's local space
  const localX = point.x - center.x;
  const localZ = point.z - center.z;

  // Rotate point if box is rotated
  let rotatedX = localX;
  let rotatedZ = localZ;

  if (rotation !== 0) {
    const cos = Math.cos(-rotation);
    const sin = Math.sin(-rotation);
    rotatedX = localX * cos - localZ * sin;
    rotatedZ = localX * sin + localZ * cos;
  }

  // Check if point is inside the rotated box bounds
  const halfWidth = (width + margin * 2) / 2;
  const halfDepth = (depth + margin * 2) / 2;

  return Math.abs(rotatedX) <= halfWidth && Math.abs(rotatedZ) <= halfDepth;
}

// Safety margin for collision detection (in meters)
export const SAFETY_MARGIN = 0.1;

/**
 * Check if a point is inside or too close to an obstacle
 */
function isPointInObstacle(
  point: Vector3,
  safetyMargin: number = SAFETY_MARGIN
): boolean {
  for (const obstacle of OBSTACLES) {
    if (obstacle.type === "circle") {
      const distance = point.distanceTo(obstacle.center);
      if (distance < obstacle.radius + safetyMargin) {
        return true;
      }
    } else if (obstacle.type === "box") {
      if (
        isPointInBox(
          point,
          obstacle.center,
          obstacle.width,
          obstacle.depth,
          obstacle.rotation || 0,
          safetyMargin
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if a line segment intersects with a box obstacle
 */
function checkLineBoxCollision(
  start: Vector3,
  end: Vector3,
  center: Vector3,
  width: number,
  depth: number,
  rotation: number = 0,
  margin: number = SAFETY_MARGIN
): boolean {
  // Sample points along the line based on distance (more samples for longer lines)
  const lineLength = start.distanceTo(end);
  const steps = Math.max(10, Math.ceil(lineLength * 5)); // At least 10, more for longer lines

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const point = new Vector3().lerpVectors(start, end, t);
    if (isPointInBox(point, center, width, depth, rotation, margin)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a line segment intersects with any obstacles
 */
function checkLineObstacleCollision(
  start: Vector3,
  end: Vector3
): { hasCollision: boolean; obstacleIndex: number } {
  // First check walls
  if (checkWallCollision(start, end)) {
    return { hasCollision: true, obstacleIndex: -2 }; // -2 indicates wall collision
  }

  const direction = new Vector3().subVectors(end, start);
  const distance = direction.length();
  direction.normalize();

  for (let i = 0; i < OBSTACLES.length; i++) {
    const obstacle = OBSTACLES[i];

    if (obstacle.type === "circle") {
      const toObstacle = new Vector3().subVectors(obstacle.center, start);

      // Project obstacle center onto the line
      const projection = toObstacle.dot(direction);

      // Check if projection is within line segment
      if (projection < 0 || projection > distance) {
        continue;
      }

      // Calculate closest point on line to obstacle center
      const closestPoint = start
        .clone()
        .add(direction.clone().multiplyScalar(projection));
      const distanceToObstacle = closestPoint.distanceTo(obstacle.center);

      // Check collision with safety margin
      if (distanceToObstacle < obstacle.radius + SAFETY_MARGIN) {
        return { hasCollision: true, obstacleIndex: i };
      }
    } else if (obstacle.type === "box") {
      if (
        checkLineBoxCollision(
          start,
          end,
          obstacle.center,
          obstacle.width,
          obstacle.depth,
          obstacle.rotation || 0,
          SAFETY_MARGIN
        )
      ) {
        return { hasCollision: true, obstacleIndex: i };
      }
    }
  }

  return { hasCollision: false, obstacleIndex: -1 };
}

/**
 * Find the closest walkable point inside the room boundaries
 */
function findClosestWalkablePoint(target: Vector3): Vector3 {
  const point = target.clone();

  // Clamp to room boundaries with margin
  const margin = 0.5;

  // PC Section bounds: x: [-8, -2], z: [-6, 0]
  // PS5 Section bounds: x: [-2, 6], z: [-6, 0]

  // Determine which section the point should be in
  if (point.x < -2) {
    // PC Section
    point.x = Math.max(-8 + margin, Math.min(-2 - margin, point.x));
    point.z = Math.max(-6 + margin, Math.min(0 - margin, point.z));
  } else {
    // PS5 Section
    point.x = Math.max(-2 + margin, Math.min(6 - margin, point.x));
    point.z = Math.max(-6 + margin, Math.min(0 - margin, point.z));
  }

  point.y = 0;
  return point;
}

/**
 * Generate multiple waypoint candidates to go around an obstacle
 */
function generateAvoidanceWaypoints(
  start: Vector3,
  end: Vector3,
  obstacleIndex: number
): Vector3[] {
  const candidates: Vector3[] = [];

  // Wall collision - try to find a path around the corner
  if (obstacleIndex === -2) {
    // Strategic waypoints for navigating the L-shaped room (updated for new dimensions)
    const cornerWaypoints = [
      new Vector3(-2.0, 0, -4.5), // Near inner corner
      new Vector3(-2.0, 0, -1.5), // Inner corner front
      new Vector3(-2.5, 0, -6), // PC section mid
      new Vector3(0.5, 0, -4.5), // Center approach
      new Vector3(-2.5, 0, -5), // PC section center
      new Vector3(1.5, 0, -4), // PS5 section center
    ];

    // Test each candidate and add valid ones
    for (const wp of cornerWaypoints) {
      const toStart = checkLineObstacleCollision(start, wp);
      const toEnd = checkLineObstacleCollision(wp, end);

      if (!toStart.hasCollision && !toEnd.hasCollision) {
        candidates.push(wp);
      }
    }

    return candidates;
  }

  // Regular obstacle collision - try both sides
  const obstacle = OBSTACLES[obstacleIndex];

  // For certain obstacles, add strategic pre-defined waypoints that work well
  // These waypoints are carefully placed in open areas of the room
  const strategicWaypoints: Vector3[] = [];

  if (obstacleIndex === 2) {
    // PC Desk (obstacle 2) - navigate around desk area (updated for new position/size)
    strategicWaypoints.push(
      new Vector3(-1.5, 0, -6.5), // Right side of desk (clear viewing position)
      new Vector3(-3.0, 0, -5.0), // Front of desk (doorway between sections)
      new Vector3(-1.5, 0, -8.0) // Back side of PC area
    );
  } else if (obstacleIndex === 3) {
    // Gaming Chair (obstacle 3) - navigate around chair (updated for box shape)
    strategicWaypoints.push(
      new Vector3(-0.3, 0, -6.5), // Right of chair
      new Vector3(-0.8, 0, -5.5), // Front of chair
      new Vector3(-0.8, 0, -7.5) // Behind chair area
    );
  } else if (obstacleIndex === 4) {
    // TV Stand (obstacle 4) - navigate around TV area
    strategicWaypoints.push(
      new Vector3(1.9, 0, -1.5), // In front of TV (viewing position)
      new Vector3(0.5, 0, -0.5), // Left side of TV stand
      new Vector3(3.5, 0, -0.5), // Right side of TV stand
      new Vector3(1.5, 0, -2.5) // Behind TV stand
    );
  } else if (obstacleIndex === 5) {
    // Couch (obstacle 5) - navigate around couch area (updated dimensions)
    strategicWaypoints.push(
      new Vector3(0.5, 0, -3.0), // Left side of couch
      new Vector3(3.5, 0, -3.0), // Right side of couch
      new Vector3(2.0, 0, -4.5), // Behind couch (adjusted for larger depth)
      new Vector3(1.5, 0, -2.0) // In front of couch
    );
  } else if (obstacleIndex === 6) {
    // Coffee Table (obstacle 6) - navigate around table
    strategicWaypoints.push(
      new Vector3(2.6, 0, -1.2), // Viewing position for phone
      new Vector3(1.5, 0, -1.5), // Left side
      new Vector3(2.7, 0, -1.5), // Right side
      new Vector3(2.1, 0, -2.2) // Behind table
    );
  } else if (obstacleIndex === 7) {
    // Bed (obstacle 7) - navigate around bed (updated position and rotation)
    strategicWaypoints.push(
      new Vector3(2.5, 0, -6.8), // Left side of bed
      new Vector3(5.0, 0, -6.8), // Right side of bed (adjusted for new position)
      new Vector3(4.0, 0, -5.0), // In front of bed
      new Vector3(4.0, 0, -8.2) // Behind bed
    );
  } else if (obstacleIndex === 9 || obstacleIndex === 10) {
    // Speakers (obstacles 9, 10) - navigate around TV area
    strategicWaypoints.push(
      new Vector3(1.9, 0, -1.5), // In front of TV (between speakers)
      new Vector3(0.5, 0, -1.0), // Left side clear
      new Vector3(4.0, 0, -1.0) // Right side clear
    );
  } else if (obstacleIndex === 11) {
    // Robot Sweeper (obstacle 11) - small, easy to navigate around
    strategicWaypoints.push(
      new Vector3(1.4, 0, -7.5), // Portrait viewing position
      new Vector3(0.8, 0, -8.2), // Left side
      new Vector3(1.8, 0, -8.2) // Right side
    );
  }

  for (const wp of strategicWaypoints) {
    if (!isPointInObstacle(wp, SAFETY_MARGIN)) {
      const toWp = checkLineObstacleCollision(start, wp);
      const fromWp = checkLineObstacleCollision(wp, end);
      if (!toWp.hasCollision && !fromWp.hasCollision) {
        candidates.push(wp);
      }
    }
  }

  // Calculate perpendicular direction
  const toEnd = new Vector3().subVectors(end, start);
  const perpendicular = new Vector3(-toEnd.z, 0, toEnd.x).normalize();

  // Calculate avoidance radius based on obstacle type
  let avoidanceRadius: number;
  if (obstacle.type === "circle") {
    avoidanceRadius = obstacle.radius + 2.0; // Increased from 1.5 to 2.0
  } else {
    const maxDimension = Math.max(obstacle.width, obstacle.depth);
    avoidanceRadius = maxDimension / 2 + 2.0; // Increased from 1.5 to 2.0
  }

  // Try BOTH sides of the obstacle (not just one)
  for (const side of [1, -1]) {
    const waypoint = obstacle.center
      .clone()
      .add(perpendicular.clone().multiplyScalar(side * avoidanceRadius));
    waypoint.y = 0;

    const validWaypoint = findClosestWalkablePoint(waypoint);

    // Verify waypoint itself is not in a collision zone
    if (isPointInObstacle(validWaypoint, SAFETY_MARGIN)) {
      continue; // Skip this waypoint if it's too close to any obstacle
    }

    // Verify this waypoint doesn't create new collisions
    const toWaypoint = checkLineObstacleCollision(start, validWaypoint);
    const fromWaypoint = checkLineObstacleCollision(validWaypoint, end);

    if (!toWaypoint.hasCollision && !fromWaypoint.hasCollision) {
      candidates.push(validWaypoint);
    }
  }

  // Also try diagonal corners around box obstacles
  if (obstacle.type === "box") {
    const hw = obstacle.width / 2 + 2.0; // Increased to 2.0 for wider clearance
    const hd = obstacle.depth / 2 + 2.0; // Increased to 2.0 for wider clearance
    const rot = obstacle.rotation || 0;

    const corners = [
      { x: hw, z: hd },
      { x: hw, z: -hd },
      { x: -hw, z: hd },
      { x: -hw, z: -hd },
    ];

    for (const corner of corners) {
      // Rotate corner point
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const rx = corner.x * cos - corner.z * sin;
      const rz = corner.x * sin + corner.z * cos;

      const waypoint = new Vector3(
        obstacle.center.x + rx,
        0,
        obstacle.center.z + rz
      );

      const validWaypoint = findClosestWalkablePoint(waypoint);

      // Verify waypoint itself is not in a collision zone
      if (isPointInObstacle(validWaypoint, SAFETY_MARGIN)) {
        continue; // Skip this waypoint if it's too close to any obstacle
      }

      const toWaypoint = checkLineObstacleCollision(start, validWaypoint);
      const fromWaypoint = checkLineObstacleCollision(validWaypoint, end);

      if (!toWaypoint.hasCollision && !fromWaypoint.hasCollision) {
        candidates.push(validWaypoint);
      }
    }
  }

  return candidates;
}

/**
 * Validate if a target position is walkable (not on furniture or walls)
 */
export function isValidWalkablePosition(position: Vector3): boolean {
  // Check if position is on furniture (using same margin as collision detection)
  if (isPointInObstacle(position, SAFETY_MARGIN)) {
    return false;
  }

  // Check if position is inside walls (with margin)
  const margin = 0.4;
  const x = position.x;
  const z = position.z;

  // PC Section floor: position [-2.5, 0, -4.5], size [2, 9]
  // So bounds: x from -3.5 to -1.5, z from -9 to 0
  if (x >= -3.5 && x <= -1.5) {
    // In PC section X range
    if (
      x < -3.5 + margin ||
      x > -1.5 - margin ||
      z < -9 + margin ||
      z > 0 - margin
    ) {
      return false;
    }
  }
  // PS5 Section floor: position [1.9, 0, -4.5], size [6.8, 9]
  // So bounds: x from -1.5 to 5.3, z from -9 to 0
  else if (x >= -1.5 && x <= 5.3) {
    // In PS5 section X range
    if (
      x < -1.5 + margin ||
      x > 5.3 - margin ||
      z < -9 + margin ||
      z > 0 - margin
    ) {
      return false;
    }
  } else {
    // Outside both sections
    return false;
  }

  return true;
}

/**
 * Calculate the total path distance through waypoints
 */
function calculatePathDistance(
  from: Vector3,
  to: Vector3,
  waypoints: Vector3[]
): number {
  let distance = 0;
  let current = from;

  for (const wp of waypoints) {
    distance += current.distanceTo(wp);
    current = wp;
  }

  distance += current.distanceTo(to);
  return distance;
}

/**
 * Validate that a complete path has no collisions
 */
function isPathCollisionFree(
  from: Vector3,
  to: Vector3,
  waypoints: Vector3[]
): boolean {
  let current = from;
  // Check each segment
  for (const wp of waypoints) {
    const collision = checkLineObstacleCollision(current, wp);
    if (collision.hasCollision) {
      return false;
    }
    current = wp;
  }

  // Check final segment to destination
  const finalCollision = checkLineObstacleCollision(current, to);
  if (finalCollision.hasCollision) {
    return false;
  }

  return true;
}

/**
 * Get fallback waypoints in known open areas
 */
function getFallbackWaypoints(from: Vector3, to: Vector3): Vector3[] {
  // These are waypoints in large open areas of the room (updated for new furniture positions)
  const openAreaWaypoints = [
    new Vector3(-3.0, 0, -5.0), // PC section - doorway between sections (clear of desk and chair)
    new Vector3(-1.5, 0, -6.5), // PC section - in front of monitor area
    new Vector3(1.5, 0, -6.0), // Center of PS5 section (clear of bed - adjusted for new bed position)
    new Vector3(2.5, 0, -5.0), // Middle of PS5 section (open floor)
    new Vector3(1.9, 0, -1.5), // In front of TV (between couch and TV stand)
    new Vector3(0.5, 0, -2.5), // Left side near couch
    new Vector3(1.4, 0, -7.5), // In front of portrait wall
  ];

  const candidates: Vector3[] = [];

  for (const wp of openAreaWaypoints) {
    // Skip if waypoint is in a collision zone
    if (isPointInObstacle(wp, SAFETY_MARGIN)) {
      continue;
    }

    // Check if this waypoint could help
    const toWp = checkLineObstacleCollision(from, wp);
    const fromWp = checkLineObstacleCollision(wp, to);

    // Even if one segment has collision, keep it - recursion might find a path through it
    if (!toWp.hasCollision || !fromWp.hasCollision) {
      candidates.push(wp);
    }
  }

  return candidates;
}

/**
 * Recursively find ALL possible paths with waypoints
 */
function findAllPaths(
  from: Vector3,
  to: Vector3,
  depth: number = 0,
  maxDepth: number = 5
): Vector3[][] {
  // Base case: check if direct path is clear
  const collision = checkLineObstacleCollision(from, to);

  if (!collision.hasCollision) {
    return [[]]; // Direct path works - return empty waypoint list
  }

  if (depth >= maxDepth) {
    return []; // Max depth reached, no valid paths from this branch
  }

  // Generate waypoint candidates for this obstacle
  let candidates = generateAvoidanceWaypoints(
    from,
    to,
    collision.obstacleIndex
  );

  // If no candidates found, try fallback waypoints in open areas
  if (candidates.length === 0 && depth < 2) {
    candidates = getFallbackWaypoints(from, to);
  }

  if (candidates.length === 0) {
    return []; // No valid waypoints found
  }

  const allPaths: Vector3[][] = [];

  // Try each candidate and collect all possible paths
  for (const waypoint of candidates) {
    // Recursively find all paths from waypoint to destination
    const remainingPaths = findAllPaths(waypoint, to, depth + 1, maxDepth);

    // Add this waypoint to the beginning of each remaining path
    for (const remainingPath of remainingPaths) {
      const fullPath = [waypoint, ...remainingPath];
      allPaths.push(fullPath);
    }
  }

  return allPaths;
}

export function calculateSmoothPath(from: Vector3, to: Vector3): SimplePath {
  // First check if direct path is possible
  const directCollision = checkLineObstacleCollision(from, to);

  if (!directCollision.hasCollision) {
    // Direct path is clear
    return new SimplePath(from, to, []);
  }

  // Find ALL possible paths with waypoints
  const allPaths = findAllPaths(from, to);

  if (allPaths.length === 0) {
    // No paths found, fallback to direct (will be blocked but prevents crash)
    return new SimplePath(from, to, []);
  }

  // Filter paths to only collision-free ones and sort by distance
  interface PathOption {
    waypoints: Vector3[];
    distance: number;
    collisionFree: boolean;
  }

  const pathOptions: PathOption[] = [];

  for (const waypoints of allPaths) {
    // Check if this path is collision-free
    const collisionFree = isPathCollisionFree(from, to, waypoints);
    const distance = calculatePathDistance(from, to, waypoints);
    pathOptions.push({ waypoints, distance, collisionFree });
  }

  // Sort by collision-free first, then by distance
  pathOptions.sort((a, b) => {
    // Prioritize collision-free paths
    if (a.collisionFree && !b.collisionFree) return -1;
    if (!a.collisionFree && b.collisionFree) return 1;
    // If both same collision status, sort by distance
    return a.distance - b.distance;
  });

  const validPaths = pathOptions.filter((p) => p.collisionFree);

  if (validPaths.length === 0) {
    // All paths have collisions, fallback to shortest path anyway
    return new SimplePath(from, to, pathOptions[0].waypoints);
  }

  // Return the shortest collision-free path
  return new SimplePath(from, to, validPaths[0].waypoints);
}
