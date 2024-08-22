import type { DxfDocument } from '@tarikjabiri/dxf'
import type { AxisId, Point3 } from '@villagekit/math'
import type { ReactElement } from 'react'
import type { Box3 } from 'three'
import type { ZodDiscriminatedUnionOption } from 'zod'

declare global {
  namespace VK {
    export interface EveryPartTypeId {
      noop: 'noop'
    }
    export interface EveryPartSpec {
      noop: { type: 'noop' }
    }
    export interface EveryPartCreator {
      noop: { spec: { type: 'noop' }; id?: string }
    }
    export interface EveryPartVariants {
      noop: { noop: null }
    }
    export interface EveryPartGlValue {
      noop: { type: 'noop' }
    }
  }
}

// https://github.com/piotrwitek/utility-types/blob/master/src/utility-types.ts
type $Values<T extends object> = T[keyof T]

export type PartTypeId = $Values<VK.EveryPartTypeId>
export type PartSpec = $Values<VK.EveryPartSpec>
export type PartCreator = $Values<VK.EveryPartCreator>
export type PartGlValue = $Values<VK.EveryPartGlValue>
export type PartGlValuesByType = {
  [Key in keyof VK.EveryPartGlValue]: Array<VK.EveryPartGlValue[Key]>
}

export type FasteningPoint = {
  cellPosition: Point3
  facePosition: Point3
  axis: AxisId
  part: WithRequiredId<PartCreator>
  gradient: number
}

export type CalculatePartGlValue<Creator extends { id?: string }, GlValue> = (
  creator: WithRequiredId<Creator>,
) => GlValue
export type CalculatePartBoundingBox<Creator> = (creator: Creator) => Box3
export type CalculatePartFasteningPoints<Creator extends { id?: string }> = (
  creator: WithRequiredId<Creator>,
) => Array<FasteningPoint>
export type CalculateNumFastenersToFasten<Creator> = (creator: Creator) => number
export type ExportDxf<Spec> = (spec: Spec) => Promise<DxfDocument>

export type WithRequiredId<T extends { id?: string }> = { id: string } & {
  [Key in keyof T as Exclude<Key, 'id'>]: T[Key]
}

export interface PartsGlProps<PartGlValue> {
  parts: Array<PartGlValue>
}
export type PartsGl<GlValue> = (props: PartsGlProps<GlValue>) => ReactElement | null

export interface PartSvgProps<PartSpec> {
  part: PartSpec
  displayUnit: 'gu' | 'mm'
}
export type PartSvg<Spec> = (props: PartSvgProps<Spec>) => ReactElement | null

export interface PartModule<
  Id extends PartTypeId,
  Spec extends PartSpec,
  Creator extends PartCreator,
  GlValue,
  Variants,
> {
  id: Id
  labels: {
    single: string
    plural: string
  }
  variants: Variants
  components: {
    PartSvg: PartSvg<Spec>
    PartsGl: PartsGl<GlValue>
  }
  methods: {
    calculateGlValue: CalculatePartGlValue<Creator, GlValue>
    calculateBoundingBox: CalculatePartBoundingBox<Creator>
    calculateFasteningPoints: CalculatePartFasteningPoints<Creator>
    calculateNumFastenersToFasten: CalculateNumFastenersToFasten<Creator>
    exportDxf?: ExportDxf<Spec>
  }
  schemas: Array<ZodDiscriminatedUnionOption<'type'>>
}

export type PartModulesByType = {
  [PT in PartTypeId]: PartModule<
    PT,
    VK.EveryPartSpec[PT],
    VK.EveryPartCreator[PT],
    VK.EveryPartGlValue[PT],
    VK.EveryPartVariants[PT]
  >
}

export type PartVariantsByType = {
  [PT in PartTypeId]: VK.EveryPartVariants[PT]
}
