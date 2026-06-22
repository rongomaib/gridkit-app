// Solver output types — mirrors the Rust SolverResult struct.
// All forces in N / N·m; displacements in m / rad.

export type NodeDisplacement = {
  nodeId: string
  DX: number
  DY: number
  DZ: number
  RX: number
  RY: number
  RZ: number
}

export type MemberEndForces = {
  // Forces in local member coordinates (x = member axis)
  fx_start: number
  fy_start: number
  fz_start: number
  mx_start: number
  my_start: number
  mz_start: number
  fx_end: number
  fy_end: number
  fz_end: number
  mx_end: number
  my_end: number
  mz_end: number
}

export type MemberResult = {
  memberId: string
  partId: string
  forces: MemberEndForces
}

export type Reaction = {
  nodeId: string
  FX: number
  FY: number
  FZ: number
  MX: number
  MY: number
  MZ: number
}

export type LoadCaseResult = {
  loadCaseId: string
  nodeDisplacements: NodeDisplacement[]
  memberResults: MemberResult[]
  reactions: Reaction[]
}

export type SolverResult = {
  ok: boolean
  error?: string
  loadCaseResults: LoadCaseResult[]
}
