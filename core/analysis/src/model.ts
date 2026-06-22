// Phase 3 analysis model contract.
// All dimensions in SI: metres, Newtons, Pascals.

export type ModelNode = {
  id: string
  x: number
  y: number
  z: number
}

export type Section = {
  A: number // cross-sectional area [m²]
  Iy: number // second moment of area about local y [mâ´]
  Iz: number // second moment of area about local z [mâ´]
  J: number // St-Venant torsion constant [mâ´]
}

export type Material = {
  E: number // Young's modulus [Pa]
  G: number // shear modulus [Pa]
}

// True → the rotational DOF at that member end is released (internal hinge).
// Post-to-panel connections must have all releases false (moment-resisting per CLAUDE.md).
export type EndRelease = {
  Mxx: boolean // torsion about member axis
  Myy: boolean // moment about member local y
  Mzz: boolean // moment about member local z
}

export type MemberEndReleases = {
  start: EndRelease
  end: EndRelease
}

export type ModelMemberType = 'timber' | 'panel-brace'

export type ModelMember = {
  id: string
  partId: string
  type: ModelMemberType
  startNodeId: string
  endNodeId: string
  section: Section
  material: Material
  // Post-to-panel nodes must have no releases (moment-resisting).
  // Timber-to-timber nodes use pin releases (Myy and Mzz = true).
  endReleases: MemberEndReleases
}

// (a) Idealised pin: DX DY DZ restrained, rotations free.
// (b) Pin + uplift/shear: add RZ = true for torsional restraint; set DZ carefully for hold-down.
export type Support = {
  nodeId: string
  DX: boolean
  DY: boolean
  DZ: boolean
  RX: boolean
  RY: boolean
  RZ: boolean
}

export type NodeLoad = {
  nodeId: string
  FX?: number
  FY?: number
  FZ?: number
  MX?: number
  MY?: number
  MZ?: number
}

export type MemberDistLoad = {
  memberId: string
  direction: 'Fx' | 'Fy' | 'Fz'
  w1: number // load intensity at member start [N/m]
  w2: number // load intensity at member end [N/m]
}

export type LoadCase = {
  id: string
  name: string
  nodeLoads: NodeLoad[]
  memberDistLoads: MemberDistLoad[]
}

export type StructuralModel = {
  disclaimer: string
  nodes: ModelNode[]
  members: ModelMember[]
  supports: Support[]
  loadCases: LoadCase[]
}
