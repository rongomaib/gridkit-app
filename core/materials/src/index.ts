export type MaterialCategory = string

export type MaterialSpec = {
  id: string
  label: string
  category: MaterialCategory
  E: number
  G: number
  density: number
}

export type PartMaterialEntry = {
  category: MaterialCategory
  defaultId: string
}

const materials: Record<string, MaterialSpec> = {}
const partMaterialMap: Record<string, PartMaterialEntry> = {}

export function registerMaterial(spec: MaterialSpec): void {
  materials[spec.id] = spec
}

export function registerPartMaterial(partType: string, entry: PartMaterialEntry): void {
  partMaterialMap[partType] = entry
}

export function getMaterial(id: string | undefined, fallbackId: string): MaterialSpec {
  const m = id != null ? materials[id] : undefined
  if (m != null) return m
  const fallback = materials[fallbackId]
  if (fallback != null) return fallback
  return { id: fallbackId, label: fallbackId, category: 'timber', E: 8e9, G: 5e8, density: 500 }
}

export function getMaterialsByCategory(category: MaterialCategory): MaterialSpec[] {
  return Object.values(materials).filter((m) => m.category === category)
}

export function getPartMaterialEntry(partType: string): PartMaterialEntry | undefined {
  return partMaterialMap[partType]
}

// NZ/AS 1720.1 structural timber grades
for (const spec of [
  { id: 'SG6', label: 'SG6 — 6000 MPa', category: 'timber', E: 6e9, G: 3.75e8, density: 400 },
  { id: 'SG8', label: 'SG8 — 8000 MPa', category: 'timber', E: 8e9, G: 5e8, density: 500 },
  { id: 'SG10', label: 'SG10 — 10000 MPa', category: 'timber', E: 1e10, G: 6.25e8, density: 550 },
  { id: 'SG12', label: 'SG12 — 12500 MPa', category: 'timber', E: 1.25e10, G: 7.8e8, density: 600 },
] as MaterialSpec[])
  registerMaterial(spec)

// NZ structural plywood face-grain grades
for (const spec of [
  { id: 'F11', label: 'F11 — 8500 MPa', category: 'plywood', E: 8.5e9, G: 3.2e9, density: 550 },
  { id: 'F14', label: 'F14 — 9500 MPa', category: 'plywood', E: 9.5e9, G: 3.8e9, density: 600 },
  { id: 'F17', label: 'F17 — 11500 MPa', category: 'plywood', E: 1.15e10, G: 4.6e9, density: 650 },
] as MaterialSpec[])
  registerMaterial(spec)

// Structural steel (mild and stainless)
for (const spec of [
  { id: 'S275', label: 'S275 steel', category: 'steel', E: 2.05e11, G: 7.9e10, density: 7850 },
  { id: 'S355', label: 'S355 steel', category: 'steel', E: 2.05e11, G: 7.9e10, density: 7850 },
  {
    id: 'SS304',
    label: '304 stainless steel',
    category: 'steel',
    E: 1.93e11,
    G: 7.4e10,
    density: 7980,
  },
  {
    id: 'SS316',
    label: '316 stainless steel',
    category: 'steel',
    E: 1.93e11,
    G: 7.4e10,
    density: 7980,
  },
] as MaterialSpec[])
  registerMaterial(spec)

// Default part material registrations for built-in part types
registerPartMaterial('timber', { category: 'timber', defaultId: 'SG8' })
registerPartMaterial('panel-brace', { category: 'plywood', defaultId: 'F14' })
registerPartMaterial('gridbeam', { category: 'steel', defaultId: 'S275' })
