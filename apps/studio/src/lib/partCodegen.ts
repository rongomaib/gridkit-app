import type { PartMakerSpec } from './partMakerTypes'

export interface GeneratedFile {
  name: string
  content: string
}

function toPascalCase(name: string): string {
  return name
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('')
}

function toCamelCase(name: string): string {
  const pascal = toPascalCase(name)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function generatePartFiles(spec: PartMakerSpec): GeneratedFile[] {
  const N = toPascalCase(spec.name)
  const n = toCamelCase(spec.name)
  const t = spec.name
  const sanitizedDisplay = spec.displayName.replace(/[^a-zA-Z0-9]/g, '_')
  const variantKey = `${sanitizedDisplay}_${spec.widthMm}x${spec.heightMm}_Default`

  const hasX = spec.axes.includes('x')
  const hasY = spec.axes.includes('y')
  const hasZ = spec.axes.includes('z')

  // --- schema lines ---
  const schemaVars: string[] = []
  const schemaBlocks: string[] = []

  if (hasX) {
    schemaVars.push(`${n}XSchema`)
    schemaBlocks.push(`
const ${n}XSchema = z.object({
  type: z.literal('${t}:x'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.number(),
  materialId: z.string().optional(),
})`)
  }
  if (hasY) {
    schemaVars.push(`${n}YSchema`)
    schemaBlocks.push(`
const ${n}YSchema = z.object({
  type: z.literal('${t}:y'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
  materialId: z.string().optional(),
})`)
  }
  if (hasZ) {
    schemaVars.push(`${n}ZSchema`)
    schemaBlocks.push(`
const ${n}ZSchema = z.object({
  type: z.literal('${t}:z'),
  x: z.number(),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
})`)
  }

  // --- creator static methods ---
  const staticMethods: string[] = []
  const axisInterfaces: string[] = []

  if (hasX) {
    staticMethods.push(`
  static X(options: ${N}XOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options
    const gridUnit = getGridLengthInMeters(variantId)
    const safeX = parseRange(x)
    const safeY = parseNumber(y)
    const safeZ = parseNumber(z)
    let member = ${N}.create({ id, variantId, lengthInGrids: Math.abs(safeX[0] - safeX[1]), materialId })
    if (safeX[0] > safeX[1]) {
      member = member.applyTransform(mirrorXTransform)
    }
    return member.translate([safeX[0] * gridUnit, safeY * gridUnit, safeZ * gridUnit])
  }`)
    axisInterfaces.push(`
interface ${N}XOptions extends BaseCreatorOptions {
  variantId?: keyof typeof ${n}Variants
  x: [number, number]
  y: number
  z: number
  materialId?: string
}`)
  }
  if (hasY) {
    staticMethods.push(`
  static Y(options: ${N}YOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options
    const gridUnit = getGridLengthInMeters(variantId)
    const safeX = parseNumber(x)
    const safeY = parseRange(y)
    const safeZ = parseNumber(z)
    let member = ${N}.create({ id, variantId, lengthInGrids: Math.abs(safeY[0] - safeY[1]), materialId }).applyTransform(xToYTransform)
    if (safeY[0] > safeY[1]) {
      member = member.applyTransform(mirrorYTransform)
    }
    return member.translate([safeX * gridUnit, safeY[0] * gridUnit, safeZ * gridUnit])
  }`)
    axisInterfaces.push(`
interface ${N}YOptions extends BaseCreatorOptions {
  variantId?: keyof typeof ${n}Variants
  x: number
  y: [number, number]
  z: number
  materialId?: string
}`)
  }
  if (hasZ) {
    staticMethods.push(`
  static Z(options: ${N}ZOptions) {
    const { id, x, y, z, variantId = getDefaultVariantId(), materialId } = options
    const gridUnit = getGridLengthInMeters(variantId)
    const safeX = parseNumber(x)
    const safeY = parseNumber(y)
    const safeZ = parseRange(z)
    let member = ${N}.create({ id, variantId, lengthInGrids: Math.abs(safeZ[0] - safeZ[1]), materialId }).applyTransform(xToZTransform)
    if (safeZ[0] > safeZ[1]) {
      member = member.applyTransform(mirrorZTransform)
    }
    return member.translate([safeX * gridUnit, safeY * gridUnit, safeZ[0] * gridUnit])
  }`)
    axisInterfaces.push(`
interface ${N}ZOptions extends BaseCreatorOptions {
  variantId?: keyof typeof ${n}Variants
  x: number
  y: number
  z: [number, number]
  materialId?: string
}`)
  }

  // ---- generated file contents ----

  const packageJson = `{
  "name": "@villagekit/part-${t}",
  "version": "0.1.0",
  "description": "${spec.description.replace(/"/g, '\\"')}",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "source": "./src/index.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["./src", "./dist"],
  "scripts": {
    "build:pkg": "tsup src",
    "lint": "biome check ."
  },
  "dependencies": {
    "@villagekit/math": "workspace:*",
    "@villagekit/part": "workspace:*",
    "@villagekit/units": "workspace:*",
    "zod": "^3.23.8"
  },
  "peerDependencies": {
    "@react-three/fiber": "^9.0.0",
    "react": "^19.1.0",
    "three": "^0.165.0"
  }
}`

  const typesTs = `import type { Length } from '@villagekit/units'
import type { Quaternion, Vector3 } from 'three'

export type ${N}Type = '${t}'

export type ${N}Variant = {
  id: string
  gridLength: Length
  sectionWidth: Length
  sectionDepth: Length
  holeDiameter: number
  holeSpacingMm: number
  holeEdgeOffsetMm: number
  holeRows: number
  material: {
    color: string
  }
}

export type ${N}GlValue = {
  type: ${N}Type
  id: string
  variant: ${N}Variant
  gridLengthInMeters: number
  sectionWidthInMeters: number
  sectionDepthInMeters: number
  lengthInGrids: number
  lengthInMeters: number
  position: Vector3
  quaternion: Quaternion
  scale: Vector3
}
`

  const schemasTs = `import { z } from 'zod'
${schemaBlocks.join('\n')}
export const ${n}Schemas = [${schemaVars.join(', ')}]
`

  const variantsTs = `import { millimeter } from '@villagekit/units'
import type { ${N}Variant } from './types'

export const ${n}Variants: Record<string, ${N}Variant> = {
  '${variantKey}': {
    id: '${variantKey}',
    gridLength: { type: 'quantity', unit: millimeter, value: ${spec.gridUnitMm} },
    sectionWidth: { type: 'quantity', unit: millimeter, value: ${spec.widthMm} },
    sectionDepth: { type: 'quantity', unit: millimeter, value: ${spec.heightMm} },
    holeDiameter: ${spec.holeDiameter},
    holeSpacingMm: ${spec.holeSpacingMm},
    holeEdgeOffsetMm: ${spec.holeEdgeOffsetMm},
    holeRows: ${spec.holeRows},
    material: {
      color: '${spec.color}',
    },
  },
}
`

  // Note: template literals inside the generated file use escaped \` and \${}
  const creatorTs = `import { changeOfBasisTransform, mirrorTransform } from '@villagekit/math'
import { BasePartCreator, BasePartSpec, registerSerializer } from '@villagekit/part/creator'
import { convert, meter } from '@villagekit/units'
import type { ${N}Type } from './types'
import { ${n}Variants } from './variants'

const getDefaultVariantId = (): keyof typeof ${n}Variants => '${variantKey}'

const X_AXIS: [number, number, number] = [1, 0, 0]
const Y_AXIS: [number, number, number] = [0, 1, 0]
const Z_AXIS: [number, number, number] = [0, 0, 1]

const baseBasis = [X_AXIS, Y_AXIS, Z_AXIS] as const
const xToYTransform = changeOfBasisTransform(baseBasis, [Y_AXIS, X_AXIS, Z_AXIS])
const xToZTransform = changeOfBasisTransform(baseBasis, [Z_AXIS, Y_AXIS, X_AXIS])
const mirrorXTransform = mirrorTransform('x')
const mirrorYTransform = mirrorTransform('y')
const mirrorZTransform = mirrorTransform('z')

export class ${N}Spec extends BasePartSpec<${N}Type> {
  variantId: keyof typeof ${n}Variants
  lengthInGrids: number
  materialId: string

  constructor(lengthInGrids: number, variantId?: keyof typeof ${n}Variants, materialId = 'Default') {
    super('${t}')
    this.variantId = variantId ?? getDefaultVariantId()
    this.lengthInGrids = lengthInGrids
    this.materialId = materialId
  }

  id(): string {
    return \`${N}_Length\${this.lengthInGrids}gu_\${this.variantId}_\${this.materialId}\`
  }

  equals(other: this): boolean {
    return (
      this.type === other.type &&
      this.variantId === other.variantId &&
      this.lengthInGrids === other.lengthInGrids &&
      this.materialId === other.materialId
    )
  }

  compare(other: this): number {
    return other.lengthInGrids - this.lengthInGrids
  }
}

export type ${N}SpecSerialized = {
  type: ${N}Type
  variantId: keyof typeof ${n}Variants
  lengthInGrids: number
  materialId: string
}

function serializeSpec(instance: ${N}Spec): ${N}SpecSerialized {
  const { variantId, lengthInGrids, materialId } = instance
  return { type: '${t}', variantId, lengthInGrids, materialId }
}

function deserializeSpec(object: ${N}SpecSerialized): ${N}Spec {
  const { variantId, lengthInGrids, materialId } = object
  return new ${N}Spec(lengthInGrids, variantId, materialId as string | undefined)
}

export class ${N} extends BasePartCreator<${N}Spec> {
  static create(options: ${N}Options) {
    const { variantId, lengthInGrids, id, materialId } = options
    const spec = new ${N}Spec(lengthInGrids, variantId, materialId)
    return new ${N}(spec, id)
  }
${staticMethods.join('\n')}
}

interface ${N}SpecOptions {
  variantId: keyof typeof ${n}Variants
  lengthInGrids: number
  materialId?: string
}

interface BaseCreatorOptions {
  id?: string
}

interface ${N}Options extends BaseCreatorOptions, ${N}SpecOptions {}
${axisInterfaces.join('\n')}

function getGridLengthInMeters(variantId: string): number {
  const variant = ${n}Variants[variantId]
  if (variant == null) throw new Error(\`Unknown ${t} variant: \${variantId}\`)
  return convert(variant.gridLength, meter).value
}

registerSerializer({
  type: '${t}',
  serializeSpec,
  deserializeSpec,
  Creator: ${N},
})

function parseRange(range: [number, number]): [number, number] {
  return [range[0], range[1]]
}

function parseNumber(val: number): number {
  return val
}
`

  const customParamTypedArgs = spec.customParams.length > 0
    ? `,\n  ${spec.customParams.map((p) => `${p.name}: number`).join(', ')}`
    : ''
  const customParamCallArgs = spec.customParams.length > 0
    ? `,\n    ${spec.customParams.map((p) => String(p.value)).join(', ')}`
    : ''

  const customObjectBuilder = `
// Auto-generated — edit to refine the 3-D object.
// Named args: THREE, mm, widthMm, heightMm, thicknessMm, gridUnitMm, previewLengthGrids${spec.customParams.map((p) => `, ${p.name}`).join('')}
function buildCustomObject(
  mm: number,
  widthMm: number, heightMm: number, thicknessMm: number,
  gridUnitMm: number, previewLengthGrids: number${customParamTypedArgs},
): THREE.Group {
  ${spec.customShapeCode}
}
`

  const glTsx = `import '@react-three/fiber'
import type { PartsGlProps } from '@villagekit/part'
import { useMemo } from 'react'
import * as THREE from 'three'
import type { ${N}GlValue } from './types'
${customObjectBuilder}

export function PartsGl(
  props: PartsGlProps<${N}GlValue> & { onPartClick?: (id: string) => void },
) {
  const { parts, onPartClick, ...restProps } = props

  return (
    <group name="${n}s">
      {parts.map((part) => (
        <PartGl key={part.id} part={part} onPartClick={onPartClick} {...restProps} />
      ))}
    </group>
  )
}

type PartGlProps = Omit<PartsGlProps<${N}GlValue>, 'parts'> & {
  part: ${N}GlValue
  onPartClick?: (id: string) => void
}

function PartGl(props: PartGlProps) {
  const {
    part: {
      id,
      sectionWidthInMeters,
      sectionDepthInMeters,
      lengthInGrids,
      position,
      quaternion,
      scale,
    },
    onPartClick,
  } = props

  const customObject = useMemo(() => buildCustomObject(
    1 / 1000,
    sectionWidthInMeters * 1000, sectionDepthInMeters * 1000, ${spec.thicknessMm},
    ${spec.gridUnitMm}, lengthInGrids${customParamCallArgs},
  ), [sectionWidthInMeters, sectionDepthInMeters, lengthInGrids])

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object, not a DOM element
    <group
      name={\`${n}-container-\${id}\`}
      position={position}
      quaternion={quaternion}
      scale={scale}
      userData={{ partId: id, partType: '${t}' }}
      onClick={(e) => {
        e.stopPropagation()
        onPartClick?.(id)
      }}
    >
      <primitive object={customObject} />
    </group>
  )
}
`

  const methodsTs = `import {
  AxisId,
  type Point3,
  axisIdToDirection,
  axisIdToDirectionVector,
  directionToAxisId,
  mapRange,
} from '@villagekit/math'
import type { FasteningPoint, WithRequiredId } from '@villagekit/part'
import { convert, meter } from '@villagekit/units'
import { Box3, Matrix4, Quaternion, Vector3 } from 'three'
import type { ${N} } from './creator'
import type { ${N}GlValue } from './types'
import { ${n}Variants } from './variants'

const X_AXIS = axisIdToDirectionVector(AxisId.X)

const fasteningAxesByAxisId: Record<AxisId, Array<AxisId>> = {
  [AxisId.X]: [AxisId.Y, AxisId['-Y'], AxisId.Z, AxisId['-Z']],
  [AxisId['-X']]: [AxisId.Y, AxisId['-Y'], AxisId.Z, AxisId['-Z']],
  [AxisId.Y]: [AxisId.X, AxisId['-X'], AxisId.Z, AxisId['-Z']],
  [AxisId['-Y']]: [AxisId.X, AxisId['-X'], AxisId.Z, AxisId['-Z']],
  [AxisId.Z]: [AxisId.X, AxisId['-X'], AxisId.Y, AxisId['-Y']],
  [AxisId['-Z']]: [AxisId.X, AxisId['-X'], AxisId.Y, AxisId['-Y']],
}

export function calculateGlValue(creator: WithRequiredId<${N}>): ${N}GlValue {
  const {
    type,
    id,
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = ${n}Variants[variantId]
  if (variant == null) throw new Error(\`Unknown ${t} variant: \${variantId}\`)

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const sectionWidthInMeters = convert(variant.sectionWidth, meter).value
  const sectionDepthInMeters = convert(variant.sectionDepth, meter).value
  const lengthInMeters = lengthInGrids * gridLengthInMeters

  return {
    type,
    id,
    variant,
    gridLengthInMeters,
    sectionWidthInMeters,
    sectionDepthInMeters,
    lengthInGrids,
    lengthInMeters,
    position,
    quaternion,
    scale,
  }
}

export function calculateBoundingBox(creator: ${N}): Box3 {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = ${n}Variants[variantId]
  if (variant == null) throw new Error(\`Unknown ${t} variant: \${variantId}\`)

  const gridUnit = convert(variant.gridLength, meter).value
  const halfWidth = convert(variant.sectionWidth, meter).value / 2
  const halfDepth = convert(variant.sectionDepth, meter).value / 2

  const box = new Box3(
    new Vector3(0, -halfWidth, -halfDepth),
    new Vector3(lengthInGrids * gridUnit, halfWidth, halfDepth),
  )

  box.applyMatrix4(new Matrix4().fromArray(transform))

  return box
}

export function calculateFasteningPoints(creator: WithRequiredId<${N}>): Array<FasteningPoint> {
  const {
    spec: { variantId, lengthInGrids },
    transform,
  } = creator

  const variant = ${n}Variants[variantId]
  if (variant == null) throw new Error(\`Unknown ${t} variant: \${variantId}\`)

  if (variant.holeDiameter <= 0 || variant.holeSpacingMm <= 0) return []

  const gridLengthInMeters = convert(variant.gridLength, meter).value
  const gridUnitMm = gridLengthInMeters * 1000

  const matrix = new Matrix4().fromArray(transform)
  const position = new Vector3()
  const quaternion = new Quaternion()
  const scale = new Vector3()
  matrix.decompose(position, quaternion, scale)

  const locationInGrids = position.clone().divideScalar(gridLengthInMeters).toArray()

  matrix.setPosition(0, 0, 0)
  const direction = X_AXIS.clone().applyMatrix4(matrix).toArray()
  const axis = directionToAxisId(direction)

  if (axis == null) throw new Error(\`${t} direction axis is not standard: [\${direction.join(', ')}]\`)

  const fasteningAxes = fasteningAxesByAxisId[axis]

  const holeEdgeInGrids = variant.holeEdgeOffsetMm / gridUnitMm
  const holeSpacingInGrids = variant.holeSpacingMm / gridUnitMm
  const lengthMm = lengthInGrids * gridUnitMm
  const holeCount = Math.floor((lengthMm - variant.holeEdgeOffsetMm * 2) / variant.holeSpacingMm) + 1

  const fasteningPoints: Array<FasteningPoint> = []

  for (let hi = 0; hi < holeCount; hi++) {
    const posAlongLength = holeEdgeInGrids + hi * holeSpacingInGrids
    const cellPosition: Point3 = [
      locationInGrids[0] + direction[0] * posAlongLength,
      locationInGrids[1] + direction[1] * posAlongLength,
      locationInGrids[2] + direction[2] * posAlongLength,
    ]

    const iHalved = hi >= holeCount / 2 ? Math.abs(hi - holeCount + 1) : hi
    const gradient = holeCount > 1 ? mapRange(iHalved, 0, Math.floor(holeCount / 2), 1, 0) : 1

    for (const fasteningAxis of fasteningAxes) {
      const offset = axisIdToDirection(fasteningAxis)
      const facePosition: Point3 = [
        cellPosition[0] + offset[0] * 0.5,
        cellPosition[1] + offset[1] * 0.5,
        cellPosition[2] + offset[2] * 0.5,
      ]
      fasteningPoints.push({
        axis: fasteningAxis,
        cellPosition,
        facePosition,
        gradient,
        part: creator,
      })
    }
  }

  return fasteningPoints
}

export function calculateNumFastenersToFasten(_creator: WithRequiredId<${N}>): number {
  return 0
}
`

  const indexTs = `import { registerPartModule } from '@villagekit/part'
import './creator'
import type { ${N}, ${N}Spec } from './creator'
import { PartsGl } from './gl'
import {
  calculateBoundingBox,
  calculateFasteningPoints,
  calculateGlValue,
  calculateNumFastenersToFasten,
} from './methods'
import { ${n}Schemas } from './schemas'
import type { ${N}GlValue, ${N}Type } from './types'
import { ${n}Variants } from './variants'

export * from './types'
export { ${n}Variants }

declare global {
  namespace VK {
    interface EveryPartTypeId {
      '${t}': ${N}Type
    }
    interface EveryPartSpec {
      '${t}': ${N}Spec
    }
    interface EveryPartCreator {
      '${t}': ${N}
    }
    interface EveryPartVariants {
      '${t}': typeof ${n}Variants
    }
    interface EveryPartGlValue {
      '${t}': ${N}GlValue
    }
  }
}

registerPartModule({
  labels: {
    single: '${spec.displayName.toLowerCase()}',
    plural: '${spec.displayName.toLowerCase()}s',
  },
  components: {
    PartsGl,
  },
  id: '${t}' as const,
  methods: {
    calculateBoundingBox,
    calculateFasteningPoints,
    calculateGlValue,
    calculateNumFastenersToFasten,
  },
  variants: ${n}Variants,
  schemas: ${n}Schemas,
})
`

  const tsconfigJson = `{
  "extends": "@villagekit/tsconfig/react-library.json",
  "compilerOptions": {
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
`

  const specJson = JSON.stringify(spec, null, 2)

  return [
    { name: 'package.json', content: packageJson },
    { name: 'tsconfig.json', content: tsconfigJson },
    { name: 'spec.json', content: specJson },
    { name: 'src/types.ts', content: typesTs },
    { name: 'src/schemas.ts', content: schemasTs },
    { name: 'src/variants.ts', content: variantsTs },
    { name: 'src/creator.ts', content: creatorTs },
    { name: 'src/gl.tsx', content: glTsx },
    { name: 'src/methods.ts', content: methodsTs },
    { name: 'src/index.ts', content: indexTs },
  ]
}
