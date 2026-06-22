import { Matrix4, Quaternion, Vector3 } from 'three'
import type { TopologyMember, TopologyModel, TopologyNode } from './types'

// 40mm universal grid constant: 1 grid unit = 0.04 m
const GRID_UNIT_M = 0.04

// Node deduplication tolerance: 1mm
const NODE_TOLERANCE_M = 0.001

type AnyCreator = {
  spec: { type: string; lengthInGrids: number }
  id?: string
  transform: number[]
}

type AnyParts = Array<AnyCreator | false | null | undefined | AnyParts>

type Vec3 = { x: number; y: number; z: number }

function flattenParts(parts: AnyParts): AnyCreator[] {
  const result: AnyCreator[] = []
  for (const part of parts) {
    if (part == null || part === false) continue
    if (Array.isArray(part)) {
      result.push(...flattenParts(part))
    } else {
      result.push(part)
    }
  }
  return result
}

function getEndpoints(creator: AnyCreator): [Vec3, Vec3] {
  const matrix = new Matrix4().fromArray(creator.transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const lengthInMeters = creator.spec.lengthInGrids * GRID_UNIT_M
  const direction = new Vector3(1, 0, 0).applyQuaternion(quaternion)
  // Timber.Z is built from a reflected transform (det = -1); negate so vertical
  // members always point world +Z (base → tip), matching real-world geometry.
  if (Math.abs(Math.abs(direction.z) - 1) < 0.01 && direction.z < 0) direction.negate()

  const start: Vec3 = { x: position.x, y: position.y, z: position.z }
  const end: Vec3 = {
    x: position.x + direction.x * lengthInMeters,
    y: position.y + direction.y * lengthInMeters,
    z: position.z + direction.z * lengthInMeters,
  }
  return [start, end]
}

function positionKey(v: Vec3): string {
  return [
    Math.round(v.x / NODE_TOLERANCE_M),
    Math.round(v.y / NODE_TOLERANCE_M),
    Math.round(v.z / NODE_TOLERANCE_M),
  ].join(',')
}

export function extractTopology(parts: AnyParts): TopologyModel {
  const flat = flattenParts(parts)
  const structural = flat.filter(
    (p): p is AnyCreator => p.spec.type === 'timber' || p.spec.type === 'panel-brace',
  )

  const nodeMap = new Map<string, TopologyNode>()
  let nodeCount = 0

  function getOrCreateNode(pos: Vec3): string {
    const key = positionKey(pos)
    let node = nodeMap.get(key)
    if (node == null) {
      node = { id: `n${nodeCount++}`, x: pos.x, y: pos.y, z: pos.z }
      nodeMap.set(key, node)
    }
    return node.id
  }

  const members: TopologyMember[] = structural.map((creator, i) => {
    const [start, end] = getEndpoints(creator)
    return {
      id: `m${i}`,
      partId: creator.id ?? `${creator.spec.type}-${i}`,
      type: creator.spec.type as TopologyMember['type'],
      startNodeId: getOrCreateNode(start),
      endNodeId: getOrCreateNode(end),
    }
  })

  return {
    nodes: Array.from(nodeMap.values()),
    members,
  }
}
