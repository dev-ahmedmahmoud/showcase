import { Vector3 } from 'three';

/**
 * Simple pathfinding utility for MVP - straight-line movement
 * Can be replaced with three-pathfinding navmesh solution later
 */

export interface PathPoint {
  position: Vector3;
  reached: boolean;
}

export class SimplePath {
  private points: PathPoint[] = [];
  private currentIndex = 0;

  constructor(start: Vector3, end: Vector3, segments: number = 1) {
    // For MVP: create a straight line path
    this.points = this.generateStraightPath(start, end, segments);
  }

  private generateStraightPath(start: Vector3, end: Vector3, segments: number): PathPoint[] {
    const path: PathPoint[] = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const position = new Vector3().lerpVectors(start, end, t);
      path.push({ position, reached: false });
    }
    
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

  getProgress(): number {
    return this.currentIndex / this.points.length;
  }
}

export function calculateSmoothPath(from: Vector3, to: Vector3): SimplePath {
  // For MVP: 1 segment (direct path)
  // Later: can add obstacle detection and waypoints
  return new SimplePath(from, to, 1);
}
