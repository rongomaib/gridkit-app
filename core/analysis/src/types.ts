export type TopologyNode = {
  id: string
  x: number
  y: number
  z: number
}

export type TopologyMemberType = 'timber' | 'panel-brace'

export type TopologyMember = {
  id: string
  partId: string
  type: TopologyMemberType
  startNodeId: string
  endNodeId: string
}

export type TopologyModel = {
  nodes: TopologyNode[]
  members: TopologyMember[]
}
