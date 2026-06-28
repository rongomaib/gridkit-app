export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Member {
  id: string;
  position: Vector3;
  direction: Vector3; // Normalized direction vector
  length: number;
  // Additional properties like width, height, and rotation could go here
}

export interface ConnectionTopology {
  angleDegrees: number;
  overlappingHoles: { holeA: Vector3; holeB: Vector3 }[];
}

function dotProduct(v1: Vector3, v2: Vector3): number {
  return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
}

function normalize(v: Vector3): Vector3 {
  const mag = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

function angleBetween(v1: Vector3, v2: Vector3): number {
  const dot = dotProduct(normalize(v1), normalize(v2));
  const clampedDot = Math.max(-1, Math.min(1, dot));
  return Math.acos(clampedDot) * (180 / Math.PI);
}

// Generate holes every 40mm along the member's length
// This is a simplified mock. In a full implementation, you would project holes onto adjacent faces.
function generateGridHoles(member: Member, gridSpacing: number = 40): Vector3[] {
  const holes: Vector3[] = [];
  const numHoles = Math.floor(member.length / gridSpacing);
  
  // Starting at one end and going to the other
  const startX = member.position.x - (member.direction.x * member.length / 2);
  const startY = member.position.y - (member.direction.y * member.length / 2);
  const startZ = member.position.z - (member.direction.z * member.length / 2);

  for (let i = 0; i <= numHoles; i++) {
    const dist = i * gridSpacing;
    holes.push({
      x: startX + member.direction.x * dist,
      y: startY + member.direction.y * dist,
      z: startZ + member.direction.z * dist
    });
  }
  
  return holes;
}

function distance(v1: Vector3, v2: Vector3): number {
  return Math.sqrt(
    Math.pow(v1.x - v2.x, 2) + 
    Math.pow(v1.y - v2.y, 2) + 
    Math.pow(v1.z - v2.z, 2)
  );
}

/**
 * Determines the intersection angle between two connecting structural members
 * and identifies overlapping 40mm grid holes on their adjacent faces.
 */
export function mapConnectionTopology(memberA: Member, memberB: Member): ConnectionTopology {
  // Determine intersection angle
  const angle = angleBetween(memberA.direction, memberB.direction);
  
  // Identify holes on the 40mm grid
  const holesA = generateGridHoles(memberA, 40);
  const holesB = generateGridHoles(memberB, 40);
  
  const overlappingHoles: { holeA: Vector3; holeB: Vector3 }[] = [];
  
  // Find holes that overlap within a certain tolerance
  const tolerance = 5; // mm
  
  for (const holeA of holesA) {
    for (const holeB of holesB) {
      if (distance(holeA, holeB) <= tolerance) {
        overlappingHoles.push({ holeA, holeB });
      }
    }
  }
  
  return {
    angleDegrees: angle,
    overlappingHoles
  };
}
