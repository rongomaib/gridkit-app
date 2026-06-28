import Anthropic from '@anthropic-ai/sdk'
import type { PartMakerSpec } from '@/lib/partMakerTypes'
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
      "Hi! I'm here to help you define a new part type. Describe the part you want to make — its name, cross-section size, material, and which axes it should support. For example: \"A 120×120mm structural timber post, natural wood color, supports X Y Z axes.\"",
  },
]

const SYSTEM_PROMPT = `You are a part designer assistant for gridkit — a modular structural building system based on a 40mm grid. You help users define new part types (beams, posts, gusset plates, L-sections, etc.) that will be compiled into TypeScript packages.

The part specification has these fields:

IDENTITY
- name: kebab-case package slug (e.g. "ridge-beam", "gusset-corner")
- displayName: human label (e.g. "Ridge Beam")
- description: optional description
- color: hex color for 3D preview
- axes: which orientations are supported — ["x"], ["y"], ["z"], or any combination
- gridUnitMm: grid unit size in mm (almost always 40)
- previewLengthGrids: how many grid units long to show in the 3D preview

CROSS-SECTION (for box/beam shapes)
- widthMm: cross-section width in mm
- heightMm: cross-section height in mm

SHAPE & PROFILE
- partShape: one of —
    'box'               → standard rectangular beam or post
    'plate'             → flat rectangular plate (use thicknessMm for the thin dimension)
    'gusset-right'      → right-angle triangular gusset plate (legs: gussetLeg1Mm × gussetLeg2Mm, thickness: thicknessMm)
    'gusset-isosceles'  → symmetric triangular gusset (equal legs, thickness: thicknessMm)
    'L-section'         → structural angle section (lSectionFlangeWidthMm, lSectionFlangeHeightMm, lSectionWebThicknessMm)
    'custom'            → any arbitrary cross-section you define via customShapeCode (see below)
- cornerRadius: rounds all profile corners in mm (0 = sharp, e.g. 4 for a small fillet)

CUSTOM SHAPES — full 3-D freedom
When the user needs anything beyond the built-in shapes, set partShape to 'custom' and provide
customShapeCode — a JavaScript function body that builds and returns a THREE.Group.

The function body receives these named arguments (no need to declare them):
  THREE          — the complete Three.js namespace (THREE.Mesh, THREE.Group, THREE.TorusGeometry,
                   THREE.SphereGeometry, THREE.CylinderGeometry, THREE.LatheGeometry,
                   THREE.ExtrudeGeometry, THREE.Shape, THREE.MeshLambertMaterial,
                   THREE.MeshStandardMaterial, THREE.Vector3, THREE.Euler, THREE.Color, etc.)
  mm             — unit multiplier: 1/1000 (so 120mm → 120*mm = 0.12 in Three.js units)
  widthMm, heightMm, thicknessMm, cornerRadius
  gussetLeg1Mm, gussetLeg2Mm
  lSectionFlangeWidthMm, lSectionFlangeHeightMm, lSectionWebThicknessMm

The function MUST end with: return group  (a THREE.Group instance)
You can put anything inside the group: multiple meshes, nested groups, any geometry.
Use the Z-up coordinate system: X = length, Y = width, Z = height (up).

EXAMPLES

Castor wheel (widthMm = wheel diameter, thicknessMm = tyre width):
  const group = new THREE.Group()
  const r = (widthMm / 2) * mm
  const t = thicknessMm * mm
  const wheelGeo = new THREE.TorusGeometry(r * 0.75, r * 0.25, 16, 40)
  const tyreMat = new THREE.MeshLambertMaterial({ color: '#111111' })
  const rimMat  = new THREE.MeshLambertMaterial({ color: '#cccccc' })
  const tyre = new THREE.Mesh(wheelGeo, tyreMat)
  tyre.rotation.x = Math.PI / 2
  group.add(tyre)
  const hubGeo = new THREE.CylinderGeometry(r * 0.15, r * 0.15, t * 1.2, 16)
  group.add(new THREE.Mesh(hubGeo, rimMat))
  return group

T-section beam (widthMm = flange, heightMm = web height, thicknessMm = wall thickness):
  const group = new THREE.Group()
  const fw = widthMm * mm, wh = heightMm * mm, t = thicknessMm * mm
  const len = 5 * 40 * mm   // 5 grid units — or use a passed length
  const profile = new THREE.Shape()
  profile.moveTo(-fw/2, 0); profile.lineTo(fw/2, 0); profile.lineTo(fw/2, t)
  profile.lineTo(t/2, t);   profile.lineTo(t/2, wh);  profile.lineTo(-t/2, wh)
  profile.lineTo(-t/2, t);  profile.lineTo(-fw/2, t); profile.closePath()
  const geo = new THREE.ExtrudeGeometry(profile, { depth: len, bevelEnabled: false })
  geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2)
  group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#888888' })))
  return group

Pizza oven wall module (a box with a circular arch cutout — use Shape.holes):
  const group = new THREE.Group()
  const w = widthMm * mm, h = heightMm * mm, d = thicknessMm * mm
  const wall = new THREE.Shape()
  wall.moveTo(0,0); wall.lineTo(w,0); wall.lineTo(w,h); wall.lineTo(0,h); wall.closePath()
  const archR = (w * 0.35)
  const hole = new THREE.Path()
  hole.absarc(w/2, h * 0.45, archR, 0, Math.PI, false)
  hole.lineTo(w/2 - archR, 0)
  wall.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(wall, { depth: d, bevelEnabled: false })
  geo.rotateX(Math.PI / 2); geo.rotateZ(Math.PI / 2)
  group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: '#c8b08a' })))
  return group

RULES
- Always set partShape:'custom' together with customShapeCode in a single update_spec call.
- Use the existing spec dimension fields to parameterise dimensions so the user can tweak numbers.
- Show the generated code to the user as a markdown code block.
- If the code has a runtime error the preview falls back silently — tell the user to check the console.

HOLES
- holeDiameter: hole diameter in mm (0 = no holes)
- holeSpacingMm: centre-to-centre spacing of holes along the length
- holeEdgeOffsetMm: distance from end face to the first hole centre
- holeRows: 1 = single row of holes, 2 = double row

PLATE / GUSSET DIMENSIONS
- thicknessMm: thickness of the plate or gusset (the thin dimension), e.g. 8 for 8mm steel plate
- gussetLeg1Mm: first leg length of a triangular gusset
- gussetLeg2Mm: second leg length of a triangular gusset

L-SECTION DIMENSIONS
- lSectionFlangeWidthMm: width of the horizontal flange
- lSectionFlangeHeightMm: height of the vertical flange
- lSectionWebThicknessMm: thickness of both flanges/webs

When the user describes what they want, call the update_spec tool with the relevant fields. Always call it — even for partial updates. After calling the tool, confirm briefly what you set and ask if they want to change anything else. Be concise.`

const UPDATE_SPEC_TOOL: Anthropic.Tool = {
  name: 'update_spec',
  description: 'Update one or more fields of the part specification based on what the user described.',
  input_schema: {
    type: 'object' as const,
    properties: {
      name: { type: 'string', description: 'kebab-case slug, e.g. "ridge-beam"' },
      displayName: { type: 'string', description: 'Human display name, e.g. "Ridge Beam"' },
      description: { type: 'string', description: 'Optional description of the part' },
      color: { type: 'string', description: 'Hex color for 3D preview, e.g. "#a0855b"' },
      axes: {
        type: 'array',
        items: { type: 'string', enum: ['x', 'y', 'z'] },
        description: 'Supported orientation axes',
      },
      gridUnitMm: { type: 'number', description: 'Grid unit in mm (default 40)' },
      previewLengthGrids: { type: 'number', description: 'Preview length in grid units' },
      widthMm: { type: 'number', description: 'Cross-section width in mm' },
      heightMm: { type: 'number', description: 'Cross-section height in mm' },
      partShape: {
        type: 'string',
        enum: ['box', 'plate', 'gusset-right', 'gusset-isosceles', 'L-section', 'custom'],
        description: 'Profile shape — use "custom" with customShapeCode for any shape not listed',
      },
      cornerRadius: { type: 'number', description: 'Corner fillet radius in mm (0 = sharp)' },
      customShapeCode: {
        type: 'string',
        description:
          'JS function body that builds and returns a THREE.Group. Used when partShape is "custom". Receives: THREE (full namespace), mm (=1/1000), widthMm, heightMm, thicknessMm, cornerRadius, gussetLeg1Mm, gussetLeg2Mm, lSectionFlangeWidthMm, lSectionFlangeHeightMm, lSectionWebThicknessMm. Must end with: return group',
      },
      holeDiameter: { type: 'number', description: 'Hole diameter in mm (0 = no holes)' },
      holeSpacingMm: { type: 'number', description: 'Centre-to-centre hole spacing along length in mm' },
      holeEdgeOffsetMm: { type: 'number', description: 'Distance from end to first hole centre in mm' },
      holeRows: { type: 'number', enum: [1, 2], description: '1 = single row, 2 = double row' },
      thicknessMm: { type: 'number', description: 'Plate or gusset thickness in mm' },
      gussetLeg1Mm: { type: 'number', description: 'First leg of triangular gusset in mm' },
      gussetLeg2Mm: { type: 'number', description: 'Second leg of triangular gusset in mm' },
      lSectionFlangeWidthMm: { type: 'number', description: 'L-section horizontal flange width in mm' },
      lSectionFlangeHeightMm: { type: 'number', description: 'L-section vertical flange height in mm' },
      lSectionWebThicknessMm: { type: 'number', description: 'L-section web/flange thickness in mm' },
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
  const [specOpen, setSpecOpen] = useState(true)

  return (
    <div
      style={{
        flexShrink: 0,
        borderTop: '1px solid #e2e8f0',
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
          background: '#f1f5f9',
          border: 'none',
          borderBottom: specOpen ? '1px solid #e2e8f0' : 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: 12,
          fontWeight: 600,
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>{specOpen ? '▾' : '▸'}</span> Spec
      </button>

      {specOpen && (
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SectionHeader>Basic</SectionHeader>
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
          <SpecRow label="Grid unit (mm)">
            <input
              type="number"
              value={spec.gridUnitMm}
              min={1}
              onChange={(e) => onSpecChange({ gridUnitMm: Number(e.target.value) })}
              style={inputStyle}
            />
          </SpecRow>
          <SpecRow label="Preview length (grids)">
            <input
              type="number"
              value={spec.previewLengthGrids}
              min={1}
              onChange={(e) => onSpecChange({ previewLengthGrids: Number(e.target.value) })}
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
                  border: '1px solid #cbd5e1',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              />
              <span style={{ fontSize: 12, color: '#64748b', fontFamily: 'monospace' }}>
                {spec.color}
              </span>
            </div>
          </SpecRow>
          <SpecRow label="Axes">
            <div style={{ display: 'flex', gap: 12 }}>
              {(['x', 'y', 'z'] as const).map((axis) => (
                <label
                  key={axis}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={spec.axes.includes(axis)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...new Set([...spec.axes, axis])]
                        : spec.axes.filter((a) => a !== axis)
                      onSpecChange({ axes: next })
                    }}
                  />
                  {axis.toUpperCase()}
                </label>
              ))}
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

          <SectionHeader>Shape &amp; Profile</SectionHeader>
          <SpecRow label="Shape">
            <select
              value={spec.partShape}
              onChange={(e) => onSpecChange({ partShape: e.target.value as any })}
              style={inputStyle}
            >
              <option value="box">Box (beam / post)</option>
              <option value="plate">Plate (flat rectangular)</option>
              <option value="gusset-right">Gusset — right angle</option>
              <option value="gusset-isosceles">Gusset — isosceles</option>
              <option value="L-section">L-section (angle)</option>
            </select>
          </SpecRow>
          <SpecRow label="Corner radius (mm)">
            <input
              type="number"
              value={spec.cornerRadius}
              min={0}
              onChange={(e) => onSpecChange({ cornerRadius: Number(e.target.value) })}
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
          <SpecRow label="Hole spacing (mm)">
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
              <option value={1}>1 — single row</option>
              <option value={2}>2 — double row</option>
            </select>
          </SpecRow>

          {(spec.partShape === 'plate' ||
            spec.partShape === 'gusset-right' ||
            spec.partShape === 'gusset-isosceles') && (
            <>
              <SectionHeader>Plate / Gusset</SectionHeader>
              <SpecRow label="Thickness (mm)">
                <input
                  type="number"
                  value={spec.thicknessMm}
                  min={1}
                  onChange={(e) => onSpecChange({ thicknessMm: Number(e.target.value) })}
                  style={inputStyle}
                />
              </SpecRow>
              {(spec.partShape === 'gusset-right' || spec.partShape === 'gusset-isosceles') && (
                <>
                  <SpecRow label="Leg 1 (mm)">
                    <input
                      type="number"
                      value={spec.gussetLeg1Mm}
                      min={1}
                      onChange={(e) => onSpecChange({ gussetLeg1Mm: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </SpecRow>
                  <SpecRow label="Leg 2 (mm)">
                    <input
                      type="number"
                      value={spec.gussetLeg2Mm}
                      min={1}
                      onChange={(e) => onSpecChange({ gussetLeg2Mm: Number(e.target.value) })}
                      style={inputStyle}
                    />
                  </SpecRow>
                </>
              )}
            </>
          )}

          {spec.partShape === 'L-section' && (
            <>
              <SectionHeader>L-Section</SectionHeader>
              <SpecRow label="Flange width (mm)">
                <input
                  type="number"
                  value={spec.lSectionFlangeWidthMm}
                  min={1}
                  onChange={(e) => onSpecChange({ lSectionFlangeWidthMm: Number(e.target.value) })}
                  style={inputStyle}
                />
              </SpecRow>
              <SpecRow label="Flange height (mm)">
                <input
                  type="number"
                  value={spec.lSectionFlangeHeightMm}
                  min={1}
                  onChange={(e) =>
                    onSpecChange({ lSectionFlangeHeightMm: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </SpecRow>
              <SpecRow label="Web thickness (mm)">
                <input
                  type="number"
                  value={spec.lSectionWebThicknessMm}
                  min={1}
                  onChange={(e) =>
                    onSpecChange({ lSectionWebThicknessMm: Number(e.target.value) })
                  }
                  style={inputStyle}
                />
              </SpecRow>
            </>
          )}
        </div>
      )}
    </div>
  )
}
