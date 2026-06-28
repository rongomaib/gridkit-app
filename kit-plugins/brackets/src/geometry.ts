/**
 * Represents a 2D coordinate.
 */
export interface Point2D {
  x: number;
  y: number;
}

/**
 * Configuration for bracket geometry generation.
 */
export interface BracketConfig {
  minEdgeDistance: number;
  bendZoneWidth: number;
}

/**
 * Generates a 2D bounding polygon for a steel bracket given hole coordinates.
 * Applies minimum edge distances and bend zones.
 *
 * @param holes - Array of 2D hole coordinates
 * @param angle - Bend angle in degrees
 * @param config - Configuration for edge distances and bend zones
 * @returns Array of 2D points representing the bounding polygon
 */
export function generateBracketGeometry(
  holes: Point2D[],
  angle: number,
  config: BracketConfig = { minEdgeDistance: 20, bendZoneWidth: 10 }
): Point2D[] {
  if (holes.length === 0) {
    return [];
  }

  // Calculate the bounding box of the holes
  let minX = holes[0].x;
  let maxX = holes[0].x;
  let minY = holes[0].y;
  let maxY = holes[0].y;

  for (const hole of holes) {
    minX = Math.min(minX, hole.x);
    maxX = Math.max(maxX, hole.x);
    minY = Math.min(minY, hole.y);
    maxY = Math.max(maxY, hole.y);
  }

  // Expand the bounding box by the minimum edge distance
  const paddedMinX = minX - config.minEdgeDistance;
  const paddedMaxX = maxX + config.minEdgeDistance;
  let paddedMinY = minY - config.minEdgeDistance;
  const paddedMaxY = maxY + config.minEdgeDistance;

  // Apply the bend zone
  // For this draft, we assume the bend zone is added to the bottom edge.
  // In a full implementation, the bend angle and axis would dictate how
  // the geometry is expanded or modified to accommodate the bend.
  paddedMinY -= config.bendZoneWidth;

  // Construct the resulting polygon (a rectangle in this simplified draft)
  return [
    { x: paddedMinX, y: paddedMaxY }, // Top Left
    { x: paddedMaxX, y: paddedMaxY }, // Top Right
    { x: paddedMaxX, y: paddedMinY }, // Bottom Right
    { x: paddedMinX, y: paddedMinY }  // Bottom Left
  ];
}
