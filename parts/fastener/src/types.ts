import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type FastenerType = 'fastener'

export interface FastenerVariant {
  id: string
  boltDiameter: Length
  boltLabel: 'bolt' | 'threaded rod'
  boltLength: Length
  endDiameter: Length
  extrusionLength: Length
  gridLength: Length
  fastenedLength: Length
  materials: {
    fastener: {
      textureUrl: string
    }
  }
  models: {
    fastener: {
      modelUrl: string
    }
  }
  nutDiameter: Length
  nutLength: Length
}

export type FastenerGlValue = {
  type: FastenerType
  id: string
  variant: FastenerVariant
  extrusionLengthInMeters: number
  fastenedLengthInMeters: number
  position: Vector3
  quaternion: Quaternion
}
