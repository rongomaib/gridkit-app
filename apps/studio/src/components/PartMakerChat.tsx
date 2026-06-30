import Anthropic from '@anthropic-ai/sdk'
import type { CustomParam, PartMakerSpec } from '@/lib/partMakerTypes'
import { useColorMode } from '@/context/colorMode'
import { useAiChat } from '@/lib/useAiChat'
import { useMemo, useState } from 'react'
import { AiChatPanel } from './AiChatPanel'

interface PartMakerChatProps {
  spec: PartMakerSpec
  onSpecChange: (patch: Partial<PartMakerSpec>) => void
}

const INITIAL_MESSAGES = [
  {
    id: '0',
    role: 'assistant' as const,
    content:
      "Hi! Describe the part you want to make — material, cross-section size, and what it does. For example: \"A 120×120mm structural timber post\" or \"An 8mm steel gusset plate for a corner connection.\"",
  },
]

const SYSTEM_PROMPT = `You are a part designer assistant for gridkit — a modular structural building system on a 40mm grid. You help users define new part types (timber beams, plywood panels, steel gussets, brackets, etc.) that compile into TypeScript packages.

GRIDKIT DESIGN RULES — MANDATORY
These rules are non-negotiable. Never generate parts that violate them.

GRID
- Universal grid unit: 40mm. Z is always vertical (up). X and Y are horizontal.

MATERIALS & DIMENSIONS

Timber
- Cross-section: both width and height must be multiples of 40mm, max 120mm each
  Valid cross-sections: 40×40, 80×40, 80×80, 120×40, 120×80, 120×120
- Ends: always square-cut. No mitres, notches, or rebates.
- Color: #a0855b
- Name pattern: timber-{W}x{H} e.g. "timber-120x120"

Plywood
- Thickness: 12mm, 18mm, or 20mm only
- Color: #d4b483
- Name pattern: ply-{T}mm e.g. "ply-18mm"
- Holes: through (8mm all the way) OR pocket (8mm diameter, 10mm deep into the face)

Steel (flat laser-cut or folded/bent)
- Thickness: 3mm, 5mm, 6mm, or 8mm only
- Flat/laser-cut: color #6b7280
- Folded/bent: color #4b5563
- Name pattern: steel-{descriptor}-{T}mm e.g. "steel-gusset-6mm"

HOLES (timber and plywood)
- Diameter: always 8mm (or 0 for no holes)
- Pattern: holes sit on the 3D 40mm grid
  - First hole: 20mm from each edge and from each end face
  - Spacing: every 40mm along the length
  - Rows across the face: 1 row per 40mm of face width
    (40mm face → 1 row, 80mm face → 2 rows, 120mm face → 3 rows)

AXES
- All parts support all three axes: ["x", "y", "z"]

SHAPE — ALWAYS CUSTOM THREE.JS CODE
Every part is defined by customShapeCode: a JavaScript function body that builds and returns a THREE.Group.

The function receives these named arguments (available without declaration):
  THREE       — full Three.js namespace (Mesh, Group, BoxGeometry, ExtrudeGeometry, Shape, MeshLambertMaterial, Vector3, etc.)
  mm          — unit multiplier: 1/1000 (so 120mm → 120*mm in Three.js world units)
  widthMm     — cross-section width in mm (from spec)
  heightMm    — cross-section height in mm (from spec)
  thicknessMm — plate/panel thickness in mm (from spec)
  ...any names listed in customParams — e.g. if customParams has { name: "flangeLengthMm" }, use flangeLengthMm directly

Coordinate convention: X = length axis, Y = width, Z = height (up).
The function MUST end with: return group

CUSTOM PARAMETERS
Use customParams to expose slider-driven numeric values that the user can scrub live in the preview.
Each entry: { name, label, min, max, step, value }
  name  — valid JS identifier (camelCase), referenced directly in customShapeCode
  label — human display label shown above the slider
  value — initial/default value (within [min, max])
Always define customParams when the shape has a dimension the user might want to explore (flange length, angle, radius, etc.).
Example: { name: "flangeLengthMm", label: "Flange length (mm)", min: 40, max: 400, step: 10, value: 120 }

EXAMPLE — 120×120 timber post:
  const group = new THREE.Group()
  const len = 5 * 40 * mm
  const w = widthMm * mm
  const h = heightMm * mm
  const geo = new THREE.BoxGeometry(len, w, h)
  geo.translate(len / 2, 0, 0)
  group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#a0855b' })))
  return group

EXAMPLE — 6mm steel right-angle gusset (200mm legs):
  const group = new THREE.Group()
  const t = thicknessMm * mm
  const leg = widthMm * mm
  const profile = new THREE.Shape()
  profile.moveTo(0, 0); profile.lineTo(leg, 0); profile.lineTo(leg, t)
  profile.lineTo(t, t); profile.lineTo(t, leg); profile.lineTo(0, leg); profile.closePath()
  const geo = new THREE.ExtrudeGeometry(profile, { depth: t, bevelEnabled: false })
  geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2)
  group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#4b5563' })))
  return group

WORKFLOW
When the user describes a part:
1. Identify material (timber / plywood / steel-flat / steel-folded)
2. Pick valid dimensions from the rules above
3. Set name, displayName, color per material rules
4. Write customShapeCode that builds the geometry
5. Call update_spec once with all fields
6. Show the customShapeCode to the user as a markdown code block
7. Ask if they want to adjust anything

Be concise. Only ask if the material or a key dimension is genuinely ambiguous.`

const UPDATE_SPEC_TOOL: Anthropic.Tool = {
  name: 'update_spec',
  description: 'Update one or more fields of the part specification.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'kebab-case slug following the naming pattern, e.g. "timber-120x120"' },
      displayName: { type: 'string', description: 'Human display name, e.g. "120×120 Timber Post"' },
      description: { type: 'string', description: 'Optional description of the part' },
      color: { type: 'string', description: 'Hex color — use material standard: timber #a0855b, ply #d4b483, steel-flat #6b7280, steel-folded #4b5563' },
      axes: {
        type: 'array',
        items: { type: 'string', enum: ['x', 'y', 'z'] },
        description: 'Supported axes — always ["x","y","z"]',
      },
      gridUnitMm: { type: 'number', description: 'Grid unit in mm — always 40' },
      previewLengthGrids: { type: 'number', description: 'Preview length in grid units (e.g. 5)' },
      widthMm: { type: 'number', description: 'Cross-section width in mm (timber: multiple of 40, max 120)' },
      heightMm: { type: 'number', description: 'Cross-section height in mm (timber: multiple of 40, max 120)' },
      thicknessMm: { type: 'number', description: 'Plate/panel thickness in mm (plywood: 12/18/20; steel: 3/5/6/8)' },
      holeDiameter: { type: 'number', description: 'Hole diameter in mm — always 8 or 0 for no holes' },
      holeSpacingMm: { type: 'number', description: 'Centre-to-centre hole spacing — always 40mm' },
      holeEdgeOffsetMm: { type: 'number', description: 'End-face to first hole centre — always 20mm' },
      holeRows: { type: 'number', description: 'Rows across the face: 1 per 40mm of face width (40mm→1, 80mm→2, 120mm→3)' },
      customShapeCode: {
        type: 'string',
        description:
          'JS function body returning a THREE.Group. Receives: THREE, mm (=1/1000), widthMm, heightMm, thicknessMm, plus any names in customParams. Must end with: return group',
      },
      customParams: {
        type: 'array',
        description: 'Slider-driven numeric parameters passed as named args to customShapeCode.',
        items: {
          type: 'object',
          properties: {
            name:  { type: 'string', description: 'Valid JS identifier, e.g. "flangeLengthMm"' },
            label: { type: 'string', description: 'Human-readable label shown above slider' },
            min:   { type: 'number' },
            max:   { type: 'number' },
            step:  { type: 'number' },
            value: { type: 'number', description: 'Current / default value within [min, max]' },
          },
          required: ['name', 'label', 'min', 'max', 'step', 'value'],
        },
      },
    },
  },
}

export function PartMakerChat({ spec, onSpecChange }: PartMakerChatProps) {
  const config = useMemo(
    () => ({
      systemPrompt: SYSTEM_PROMPT,
      tools: [UPDATE_SPEC_TOOL],
      onToolUse: (_name: string, input: unknown) => {
        onSpecChange(input as Partial<PartMakerSpec>)
        return 'Spec updated.'
      },
      initialMessages: INITIAL_MESSAGES,
    }),
    [onSpecChange],
  )

  const chat = useAiChat(config)

  return (
    <AiChatPanel
      chat={chat}
      footer={<SpecForm spec={spec} onSpecChange={onSpecChange} />}
    />
  )
}

// ---- Spec form ---------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginTop: 4,
        marginBottom: 2,
      }}
    >
      {children}
    </div>
  )
}

function SpecRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { isDark } = useColorMode()
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
      <label
        style={{
          fontSize: 12,
          color: isDark ? '#94a3b8' : '#64748b',
          width: 120,
          flexShrink: 0,
          paddingTop: 5,
          lineHeight: 1.3,
        }}
      >
        {label}
      </label>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  )
}

function SpecForm({
  spec,
  onSpecChange,
}: {
  spec: PartMakerSpec
  onSpecChange: (patch: Partial<PartMakerSpec>) => void
}) {
  const { isDark } = useColorMode()
  const [specOpen, setSpecOpen] = useState(true)

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 8px',
    fontSize: 13,
    border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
    borderRadius: 4,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: isDark ? '#0f172a' : '#fff',
    color: isDark ? '#e2e8f0' : '#1e293b',
  }

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
        maxHeight: specOpen ? '42vh' : 'auto',
        overflowY: specOpen ? 'auto' : 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setSpecOpen((o) => !o)}
        style={{
          width: '100%',
          padding: '6px 12px',
          background: isDark ? '#1e293b' : '#f1f5f9',
          border: 'none',
          borderBottom: specOpen ? (isDark ? '1px solid #334155' : '1px solid #e2e8f0') : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 600,
          color: isDark ? '#94a3b8' : '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{specOpen ? '▾' : '▸'}</span> Spec
      </button>

      {specOpen && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionHeader>Identity</SectionHeader>
          <SpecRow label="Name (slug)">
            <input
              type="text"
              value={spec.name}
              onChange={(e) => onSpecChange({ name: e.target.value })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Display name">
            <input
              type="text"
              value={spec.displayName}
              onChange={(e) => onSpecChange({ displayName: e.target.value })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                type="color"
                value={spec.color}
                onChange={(e) => onSpecChange({ color: e.target.value })}
                style={{
                  width: 32,
                  height: 28,
                  padding: 2,
                  border: isDark ? '1px solid #475569' : '1px solid #cbd5e1',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', fontFamily: 'monospace' }}>
                {spec.color}
              </span>
            </div>
          </SpecRow>
          <SpecRow label="Description">
            <textarea
              value={spec.description}
              onChange={(e) => onSpecChange({ description: e.target.value })}
              rows={2}
              style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
            />
          </SpecRow>

          <SectionHeader>Dimensions</SectionHeader>
          <SpecRow label="Width (mm)">
            <input
              type="number"
              value={spec.widthMm}
              min={1}
              onChange={(e) => onSpecChange({ widthMm: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Height (mm)">
            <input
              type="number"
              value={spec.heightMm}
              min={1}
              onChange={(e) => onSpecChange({ heightMm: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Thickness (mm)">
            <input
              type="number"
              value={spec.thicknessMm}
              min={0}
              onChange={(e) => onSpecChange({ thicknessMm: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Preview length">
            <input
              type="number"
              value={spec.previewLengthGrids}
              min={1}
              onChange={(e) => onSpecChange({ previewLengthGrids: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>

          <SectionHeader>Holes</SectionHeader>
          <SpecRow label="Hole diameter (mm)">
            <input
              type="number"
              value={spec.holeDiameter}
              min={0}
              onChange={(e) => onSpecChange({ holeDiameter: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Spacing (mm)">
            <input
              type="number"
              value={spec.holeSpacingMm}
              min={1}
              onChange={(e) => onSpecChange({ holeSpacingMm: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Edge offset (mm)">
            <input
              type="number"
              value={spec.holeEdgeOffsetMm}
              min={0}
              onChange={(e) => onSpecChange({ holeEdgeOffsetMm: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Hole rows">
            <select
              value={spec.holeRows}
              onChange={(e) => onSpecChange({ holeRows: Number(e.target.value) })}
              style={inputStyle}
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
            </select>
          </SpecRow>

          <SectionHeader>Parameters</SectionHeader>
          <CustomParamList
            params={spec.customParams}
            onChange={(customParams) => onSpecChange({ customParams })}
            inputStyle={inputStyle}
            isDark={isDark}
          />
        </div>
      )}
    </div>
  )
}

// ---- Custom parameter list -----------------------------------------------

function CustomParamList({
  params,
  onChange,
  inputStyle,
  isDark,
}: {
  params: CustomParam[]
  onChange: (params: CustomParam[]) => void
  inputStyle: React.CSSProperties
  isDark: boolean
}) {
  function addParam() {
    const n = params.length + 1
    onChange([
      ...params,
      { name: `param${n}`, label: `Parameter ${n}`, min: 0, max: 100, step: 1, value: 50 },
    ])
  }

  function removeParam(i: number) {
    onChange(params.filter((_, idx) => idx !== i))
  }

  function updateParam(i: number, patch: Partial<CustomParam>) {
    onChange(params.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }

  const cardStyle: React.CSSProperties = {
    border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '8px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
  }

  const tinyInput: React.CSSProperties = {
    ...inputStyle,
    padding: '2px 6px',
    fontSize: 12,
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    color: isDark ? '#64748b' : '#94a3b8',
    marginBottom: 1,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {params.map((p, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: order is stable within a session
        <div key={i} style={cardStyle}>
          {/* Row 1: name + label + delete */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto', minWidth: 0 }}>
              <div style={labelStyle}>identifier</div>
              <input
                type="text"
                value={p.name}
                onChange={(e) => updateParam(i, { name: e.target.value })}
                style={{ ...tinyInput, width: 110, fontFamily: 'monospace' }}
                spellCheck={false}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={labelStyle}>label</div>
              <input
                type="text"
                value={p.label}
                onChange={(e) => updateParam(i, { label: e.target.value })}
                style={{ ...tinyInput, width: '100%' }}
              />
            </div>
            <button
              type="button"
              onClick={() => removeParam(i)}
              title="Remove parameter"
              style={{
                marginTop: 16,
                padding: '2px 7px',
                fontSize: 14,
                lineHeight: 1,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                backgroundColor: isDark ? '#7f1d1d' : '#fee2e2',
                color: isDark ? '#fca5a5' : '#991b1b',
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>

          {/* Row 2: min / max / step */}
          <div style={{ display: 'flex', gap: 6 }}>
            {(['min', 'max', 'step'] as const).map((field) => (
              <div key={field} style={{ flex: 1 }}>
                <div style={labelStyle}>{field}</div>
                <input
                  type="number"
                  value={p[field]}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    const patch: Partial<CustomParam> = { [field]: v }
                    if (field === 'min' && p.value < v) patch.value = v
                    if (field === 'max' && p.value > v) patch.value = v
                    updateParam(i, patch)
                  }}
                  style={{ ...tinyInput, width: '100%' }}
                />
              </div>
            ))}
          </div>

          {/* Row 3: value slider */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#e2e8f0' : '#1e293b' }}>
                {p.label}
              </span>
              <span style={{ fontSize: 12, fontFamily: 'monospace', color: isDark ? '#94a3b8' : '#475569' }}>
                {p.value}
              </span>
            </div>
            <input
              type="range"
              min={p.min}
              max={p.max}
              step={p.step}
              value={p.value}
              onChange={(e) => updateParam(i, { value: Number(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: isDark ? '#475569' : '#94a3b8' }}>
              <span>{p.min}</span>
              <span>{p.max}</span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addParam}
        style={{
          padding: '5px 10px',
          fontSize: 12,
          border: isDark ? '1px dashed #475569' : '1px dashed #cbd5e1',
          borderRadius: 6,
          cursor: 'pointer',
          background: 'transparent',
          color: isDark ? '#94a3b8' : '#64748b',
          textAlign: 'left',
        }}
      >
        + Add parameter
      </button>
    </div>
  )
}
