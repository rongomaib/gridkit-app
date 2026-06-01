import type { Quaternion, Vector3 } from 'three'

export type HingeType = 'hinge'

export interface HingeVariant {
  id: string
  materials: Record<string, never>
}

export type HingeGlValue = {
  type: HingeType
  id: string
  variant: HingeVariant
  /** Opening angle in degrees: 0 = fully closed, 90 = right-angle, 180 = flat open */
  angle: number
  // transform
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
