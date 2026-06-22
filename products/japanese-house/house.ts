import { Timber } from '@villagekit/part-timber/creator'
import { PanelBrace } from '@villagekit/part-panel-brace/creator'

// Japanese tiny house with engawa — monopitch roof, parametric pitch angle.
//
// Layout (grid units, 1 gu = 40 mm):
//   X: 0, 60, 120  — three post lines at 2400 mm centres (house width 4800 mm)
//   Y: 0 = back wall (high eave), 60 = front wall, ENGAWA_Y = engawa outer (low eave)
//
// Monopitch: engawa eave fixed at 65 gu (2600 mm). Pitch angle drives back and
// mid post heights via tan(pitch) × ENGAWA_Y span.

export const parameters = {
  pitchDeg: {
    type: 'number' as const,
    label: 'Roof pitch (°)',
    description: 'Monopitch angle 0–25°. Low eave always on the engawa side.',
    min: 0,
    max: 25,
    step: 0.5,
  },
  floorHeightGu: {
    type: 'number' as const,
    label: 'Floor height',
    description: 'Height of floor above ground (1 gu = 40 mm)',
    min: 0,
    max: 15,
    step: 1,
  },
  engawaWidthGu: {
    type: 'number' as const,
    label: 'Engawa width',
    description: 'Depth of front veranda beyond the front wall (1 gu = 40 mm)',
    min: 15,
    max: 60,
    step: 5,
  },
}

export const presets = [
  { id: 'default',      label: 'Default (14°)',    values: { pitchDeg: 14, floorHeightGu: 9, engawaWidthGu: 30 } },
  { id: 'flat',         label: 'Flat (0°)',         values: { pitchDeg: 0,  floorHeightGu: 9, engawaWidthGu: 30 } },
  { id: 'steep',        label: 'Steep (25°)',       values: { pitchDeg: 25, floorHeightGu: 9, engawaWidthGu: 30 } },
  { id: 'deep-engawa',  label: 'Deep engawa',       values: { pitchDeg: 14, floorHeightGu: 9, engawaWidthGu: 45 } },
  { id: 'raised-floor', label: 'Raised floor',      values: { pitchDeg: 14, floorHeightGu: 4, engawaWidthGu: 30 } },
]

export const parts = ({
  pitchDeg,
  floorHeightGu,
  engawaWidthGu,
}: {
  pitchDeg: number
  floorHeightGu: number
  engawaWidthGu: number
}) => {
  const FLOOR_Z  = floorHeightGu
  const ENGAWA_Y = 60 + engawaWidthGu
  const POST_H_LOW = 65  // engawa eave — fixed low side

  // Height difference across the full ENGAWA_Y span — preserves pitch angle as engawa width changes
  const heightDiff  = Math.round(Math.tan((pitchDeg * Math.PI) / 180) * ENGAWA_Y)
  const POST_H_BACK = POST_H_LOW + heightDiff
  // Front wall at y=60 interpolates linearly along the roof slope
  const POST_H_MID  = POST_H_LOW + Math.round(heightDiff * (ENGAWA_Y - 60) / ENGAWA_Y)

  // Purlin bottom sits 3 gu (120 mm) below each post top
  const TOP_BACK = POST_H_BACK - 3
  const TOP_MID  = POST_H_MID  - 3
  const TOP_LOW  = POST_H_LOW  - 3  // = 62

  return [
    // ── Back wall posts — high eave (3 posts, y = 0) ───────────────────────
    Timber.Z({ id: 'post-b-w', x: 0,   y: 0, z: [0, POST_H_BACK] }),
    Timber.Z({ id: 'post-b-m', x: 60,  y: 0, z: [0, POST_H_BACK] }),
    Timber.Z({ id: 'post-b-e', x: 120, y: 0, z: [0, POST_H_BACK] }),

    // ── Front wall posts — mid slope (3 posts, y = 60) ─────────────────────
    Timber.Z({ id: 'post-f-w', x: 0,   y: 60, z: [0, POST_H_MID] }),
    Timber.Z({ id: 'post-f-m', x: 60,  y: 60, z: [0, POST_H_MID] }),
    Timber.Z({ id: 'post-f-e', x: 120, y: 60, z: [0, POST_H_MID] }),

    // ── Engawa posts — low eave (3 posts, y = 90) ──────────────────────────
    Timber.Z({ id: 'post-e-w', x: 0,   y: ENGAWA_Y, z: [0, POST_H_LOW] }),
    Timber.Z({ id: 'post-e-m', x: 60,  y: ENGAWA_Y, z: [0, POST_H_LOW] }),
    Timber.Z({ id: 'post-e-e', x: 120, y: ENGAWA_Y, z: [0, POST_H_LOW] }),

    // ── Floor-level beams — X direction ────────────────────────────────────
    Timber.X({ id: 'beam-fl-x-b', x: [0, 120], y: 0,        z: FLOOR_Z }),
    Timber.X({ id: 'beam-fl-x-f', x: [0, 120], y: 60,       z: FLOOR_Z }),
    Timber.X({ id: 'beam-fl-x-e', x: [0, 120], y: ENGAWA_Y, z: FLOOR_Z }),

    // ── Floor-level beams — Y direction ────────────────────────────────────
    Timber.Y({ id: 'beam-fl-y-w',  x: 0,   y: [0,  60],       z: FLOOR_Z }),
    Timber.Y({ id: 'beam-fl-y-e',  x: 120, y: [0,  60],       z: FLOOR_Z }),
    Timber.Y({ id: 'beam-fl-y-ew', x: 0,   y: [60, ENGAWA_Y], z: FLOOR_Z }),
    Timber.Y({ id: 'beam-fl-y-ee', x: 120, y: [60, ENGAWA_Y], z: FLOOR_Z }),

    // ── Top purlins — one per post row at its own height ───────────────────
    Timber.X({ id: 'purlin-b', x: [0, 120], y: 0,        z: TOP_BACK }),
    Timber.X({ id: 'purlin-f', x: [0, 120], y: 60,       z: TOP_MID  }),
    Timber.X({ id: 'purlin-e', x: [0, 120], y: ENGAWA_Y, z: TOP_LOW  }),

    // ── Back wall panels (y = 0, 2 spans × 2 heights) ──────────────────────
    PanelBrace.X({ id: 'wall-b-w-lo', x: [0,  60],  y: 0, z: 10 }),
    PanelBrace.X({ id: 'wall-b-e-lo', x: [60, 120], y: 0, z: 10 }),
    PanelBrace.X({ id: 'wall-b-w-hi', x: [0,  60],  y: 0, z: 30 }),
    PanelBrace.X({ id: 'wall-b-e-hi', x: [60, 120], y: 0, z: 30 }),

    // ── Side wall panels (x = 0 and x = 120, 1 span × 2 heights) ──────────
    PanelBrace.Y({ id: 'wall-w-lo', x: 0,   y: [0, 60], z: 10 }),
    PanelBrace.Y({ id: 'wall-w-hi', x: 0,   y: [0, 60], z: 30 }),
    PanelBrace.Y({ id: 'wall-e-lo', x: 120, y: [0, 60], z: 10 }),
    PanelBrace.Y({ id: 'wall-e-hi', x: 120, y: [0, 60], z: 30 }),

    // Front wall (y = 60) is open — engawa and shoji face.
  ]
}
