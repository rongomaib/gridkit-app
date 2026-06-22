import { Timber } from '@villagekit/part-timber/creator'
import { PanelBrace } from '@villagekit/part-panel-brace/creator'

// Japanese tiny house with engawa — monopitch roof, low side to engawa.
//
// Layout (grid units, 1 gu = 40 mm):
//   X: 0, 60, 120  — three post lines at 2400 mm centres (house width 4800 mm)
//   Y: 0 = back wall (high eave), 60 = front wall, 90 = engawa outer (low eave)
//
// Monopitch: back posts 87 gu (3480 mm), front posts 72 gu (2880 mm),
//            engawa posts 65 gu (2600 mm). Linear slope across 3600 mm span.

export const parameters = null
export const presets = null

const POST_H_BACK = 87   // high side — back wall y=0
const POST_H_MID  = 72   // front wall y=60, linear interp: 87 - 22*(60/90)
const POST_H_LOW  = 65   // low side  — engawa outer y=90
const FLOOR_Z     = 9    // floor-level beam bottom (~360 mm)
const TOP_BACK    = 84   // back purlin bottom  (= POST_H_BACK - 3)
const TOP_MID     = 69   // mid purlin bottom   (= POST_H_MID  - 3)
const TOP_LOW     = 62   // engawa purlin bottom (= POST_H_LOW  - 3)
const ENGAWA_Y    = 90   // engawa outer post line (1200 mm in front of house)

export const parts = [
  // ── Back wall posts — high eave (3 posts, y = 0) ─────────────────────────
  Timber.Z({ id: 'post-b-w', x: 0,   y: 0, z: [0, POST_H_BACK] }),
  Timber.Z({ id: 'post-b-m', x: 60,  y: 0, z: [0, POST_H_BACK] }),
  Timber.Z({ id: 'post-b-e', x: 120, y: 0, z: [0, POST_H_BACK] }),

  // ── Front wall posts — mid slope (3 posts, y = 60) ───────────────────────
  Timber.Z({ id: 'post-f-w', x: 0,   y: 60, z: [0, POST_H_MID] }),
  Timber.Z({ id: 'post-f-m', x: 60,  y: 60, z: [0, POST_H_MID] }),
  Timber.Z({ id: 'post-f-e', x: 120, y: 60, z: [0, POST_H_MID] }),

  // ── Engawa posts — low eave (3 posts, y = 90) ────────────────────────────
  Timber.Z({ id: 'post-e-w', x: 0,   y: ENGAWA_Y, z: [0, POST_H_LOW] }),
  Timber.Z({ id: 'post-e-m', x: 60,  y: ENGAWA_Y, z: [0, POST_H_LOW] }),
  Timber.Z({ id: 'post-e-e', x: 120, y: ENGAWA_Y, z: [0, POST_H_LOW] }),

  // ── Floor-level beams — X direction ──────────────────────────────────────
  Timber.X({ id: 'beam-fl-x-b', x: [0, 120], y: 0,        z: FLOOR_Z }),
  Timber.X({ id: 'beam-fl-x-f', x: [0, 120], y: 60,       z: FLOOR_Z }),
  Timber.X({ id: 'beam-fl-x-e', x: [0, 120], y: ENGAWA_Y, z: FLOOR_Z }),

  // ── Floor-level beams — Y direction ──────────────────────────────────────
  Timber.Y({ id: 'beam-fl-y-w',  x: 0,   y: [0,  60],       z: FLOOR_Z }),
  Timber.Y({ id: 'beam-fl-y-e',  x: 120, y: [0,  60],       z: FLOOR_Z }),
  Timber.Y({ id: 'beam-fl-y-ew', x: 0,   y: [60, ENGAWA_Y], z: FLOOR_Z }),
  Timber.Y({ id: 'beam-fl-y-ee', x: 120, y: [60, ENGAWA_Y], z: FLOOR_Z }),

  // ── Top purlins — X direction, one per post row at its own height ─────────
  Timber.X({ id: 'purlin-b', x: [0, 120], y: 0,        z: TOP_BACK }),
  Timber.X({ id: 'purlin-f', x: [0, 120], y: 60,       z: TOP_MID  }),
  Timber.X({ id: 'purlin-e', x: [0, 120], y: ENGAWA_Y, z: TOP_LOW  }),

  // ── Back wall panels (y = 0, 2 spans × 2 heights) ────────────────────────
  PanelBrace.X({ id: 'wall-b-w-lo', x: [0,  60],  y: 0, z: 10 }),
  PanelBrace.X({ id: 'wall-b-e-lo', x: [60, 120], y: 0, z: 10 }),
  PanelBrace.X({ id: 'wall-b-w-hi', x: [0,  60],  y: 0, z: 30 }),
  PanelBrace.X({ id: 'wall-b-e-hi', x: [60, 120], y: 0, z: 30 }),

  // ── Side wall panels (x = 0 and x = 120, 1 span × 2 heights) ────────────
  PanelBrace.Y({ id: 'wall-w-lo', x: 0,   y: [0, 60], z: 10 }),
  PanelBrace.Y({ id: 'wall-w-hi', x: 0,   y: [0, 60], z: 30 }),
  PanelBrace.Y({ id: 'wall-e-lo', x: 120, y: [0, 60], z: 10 }),
  PanelBrace.Y({ id: 'wall-e-hi', x: 120, y: [0, 60], z: 30 }),

  // Front wall (y = 60) is open — engawa and shoji face.
  // Sloped rafters (Y-direction, varying Z) are not yet representable
  // with Timber.Y; the monopitch is read from the three purlin heights.
]
