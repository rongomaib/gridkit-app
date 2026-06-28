export interface ForceVector {
  Fx: number;
  Fy: number;
  Fz: number;
  Mx: number;
  My: number;
  Mz: number;
}

// Typical values for M8 bolt (e.g., Grade 8.8)
// Single shear capacity (kN)
const M8_SHEAR_CAPACITY_KN = 14.5;
// Tension capacity (kN)
const M8_TENSION_CAPACITY_KN = 21.1;

// Characteristic dimension to convert moments to force couples (in meters)
// This should be adjusted based on the actual bracket geometry
const CHARACTERISTIC_LEVER_ARM_M = 0.1;

/**
 * Calculates the required number of 8mm fasteners given a force vector.
 * Assumptions:
 * - Fx, Fy are shear forces
 * - Fz is axial (tension) force
 * - Mx, My induce tension/compression couples
 * - Mz induces torsional shear
 * 
 * @param forces ForceVector containing 6 DOF forces (forces in kN, moments in kN*m)
 * @returns Integer representing the required number of fasteners
 */
export function calculateFasteners(forces: ForceVector): number {
  // 1. Calculate resultant shear from direct forces (Fx, Fy)
  const directShear = Math.sqrt(Math.pow(forces.Fx, 2) + Math.pow(forces.Fy, 2));
  
  // 2. Calculate shear induced by Mz (torsion)
  const torsionShear = Math.abs(forces.Mz) / CHARACTERISTIC_LEVER_ARM_M;
  
  // Total shear force per bolt group
  const totalShear = directShear + torsionShear;
  
  // 3. Calculate direct tension
  const directTension = Math.max(0, forces.Fz); // Assuming positive Fz is tension
  
  // 4. Calculate tension induced by bending moments (Mx, My)
  const bendingTensionX = Math.abs(forces.Mx) / CHARACTERISTIC_LEVER_ARM_M;
  const bendingTensionY = Math.abs(forces.My) / CHARACTERISTIC_LEVER_ARM_M;
  
  const totalTension = directTension + bendingTensionX + bendingTensionY;
  
  // 5. Calculate fastener requirements
  const shearUtilization = totalShear / M8_SHEAR_CAPACITY_KN;
  const tensionUtilization = totalTension / M8_TENSION_CAPACITY_KN;
  
  // Using a simplified linear interaction equation (V/Vr + T/Tr <= 1)
  // to conservatively estimate the required number of bolts
  const requiredFasteners = shearUtilization + tensionUtilization;
  
  // Return the ceiling to ensure we have a whole number of fasteners
  // Minimum of 1 fastener is assumed if forces exist, or 0 if no forces
  return requiredFasteners > 0 ? Math.max(1, Math.ceil(requiredFasteners)) : 0;
}
