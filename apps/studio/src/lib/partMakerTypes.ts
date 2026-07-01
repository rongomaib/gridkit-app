export interface CustomParam {
  name: string    // valid JS identifier, used as argument name in customShapeCode
  label: string   // human-readable display label
  min: number
  max: number
  step: number
  value: number   // current scrub value (also acts as default)
}

export interface PartMakerSpec {
  // Identity
  name: string
  displayName: string
  description: string

  // Grid
  gridUnitMm: number
  previewLengthGrids: number

  // Cross-section
  widthMm: number
  heightMm: number

  // Flat parts (plate / panel / steel)
  thicknessMm: number

  // Holes
  holeDiameter: number        // mm — 0 = no holes; standard is 8
  holeSpacingMm: number       // centre-to-centre along length; standard is 40
  holeEdgeOffsetMm: number    // from end face to first hole centre; standard is 20
  holeRows: number            // columns across the face (1 per 40mm of face width)

  // Custom shape — THREE.js function body
  // Receives: THREE, mm (=1/1000), widthMm, heightMm, thicknessMm, gridUnitMm, previewLengthGrids, ...customParams[].name
  // Must end with: return group  (a THREE.Group)
  customShapeCode: string

  // Custom parameters — passed as named args to customShapeCode
  customParams: CustomParam[]

  // Visual
  color: string               // hex for 3-D preview
  axes: Array<'x' | 'y' | 'z'>
}

export const defaultPartMakerSpec: PartMakerSpec = {
  name: 'new-part',
  displayName: 'New Part',
  description: '',

  gridUnitMm: 40,
  previewLengthGrids: 5,

  widthMm: 40,
  heightMm: 40,

  thicknessMm: 8,

  holeDiameter: 0,
  holeSpacingMm: 40,
  holeEdgeOffsetMm: 20,
  holeRows: 1,

  customShapeCode: '',

  customParams: [],

  color: '#a0855b',
  axes: ['x', 'y', 'z'],
}

export type { ChatMessage } from './chatTypes'
