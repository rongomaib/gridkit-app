export type PartShape =
  | 'box'
  | 'plate'
  | 'gusset-right'
  | 'gusset-isosceles'
  | 'L-section'
  | 'custom'

export interface PartMakerSpec {
  // Identity
  name: string
  displayName: string
  description: string

  // Grid
  gridUnitMm: number
  previewLengthGrids: number

  // Prismatic cross-section (box / plate)
  widthMm: number
  heightMm: number

  // Shape & profile
  partShape: PartShape
  cornerRadius: number        // mm — rounds all profile corners (0 = sharp)

  // Holes
  holeDiameter: number        // mm — 0 = no holes
  holeSpacingMm: number       // centre-to-centre along length
  holeEdgeOffsetMm: number    // from end face to first hole centre
  holeRows: number            // 1 = single row, 2 = double row

  // Flat parts (plate / gusset)
  thicknessMm: number         // plate / gusset thickness

  // Gusset legs (gusset-right and gusset-isosceles)
  gussetLeg1Mm: number
  gussetLeg2Mm: number

  // L-section profile
  lSectionFlangeWidthMm: number
  lSectionFlangeHeightMm: number
  lSectionWebThicknessMm: number

  // Custom shape
  // JS function body; receives (Shape, mm, widthMm, heightMm, thicknessMm, cornerRadius,
  // gussetLeg1Mm, gussetLeg2Mm, lSectionFlangeWidthMm, lSectionFlangeHeightMm,
  // lSectionWebThicknessMm) and must return a Three.js Shape instance.
  customShapeCode: string

  // Visual
  color: string               // hex for 3-D preview
  axes: Array<'x' | 'y' | 'z'>
}

export const defaultPartMakerSpec: PartMakerSpec = {
  name: 'my-part',
  displayName: 'My Part',
  description: '',

  gridUnitMm: 40,
  previewLengthGrids: 5,

  widthMm: 120,
  heightMm: 120,

  partShape: 'box',
  cornerRadius: 0,

  holeDiameter: 0,
  holeSpacingMm: 40,
  holeEdgeOffsetMm: 20,
  holeRows: 1,

  thicknessMm: 8,

  gussetLeg1Mm: 200,
  gussetLeg2Mm: 200,

  lSectionFlangeWidthMm: 90,
  lSectionFlangeHeightMm: 90,
  lSectionWebThicknessMm: 10,

  customShapeCode: '',

  color: '#a0855b',
  axes: ['x', 'y', 'z'],
}

export type { ChatMessage } from './chatTypes'
