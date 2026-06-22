import { Timber } from '@villagekit/part-timber/creator'
import { PanelBrace } from '@villagekit/part-panel-brace/creator'

// 4.8 × 2.4 m footprint, 3 m tall structural frame on the 40 mm grid.
// Grid units: 4800 mm = 120 gu wide, 2400 mm = 60 gu deep, 3000 mm = 75 gu tall.
// Panel brace height = 800 mm = 20 gu.

export const parameters = null
export const presets = null

export const parts = [
  // ── 6 vertical posts at corners and mid-span ─────────────────────────────
  Timber.Z({ id: 'post-nw', x: 0,   y: 0,  z: [0, 75] }),
  Timber.Z({ id: 'post-n',  x: 60,  y: 0,  z: [0, 75] }),
  Timber.Z({ id: 'post-ne', x: 120, y: 0,  z: [0, 75] }),
  Timber.Z({ id: 'post-sw', x: 0,   y: 60, z: [0, 75] }),
  Timber.Z({ id: 'post-s',  x: 60,  y: 60, z: [0, 75] }),
  Timber.Z({ id: 'post-se', x: 120, y: 60, z: [0, 75] }),

  // ── North wall (y = 0): 2 spans × 2 panel heights ────────────────────────
  PanelBrace.X({ id: 'panel-n-w-lo', x: [0,  60],  y: 0, z: 0  }),
  PanelBrace.X({ id: 'panel-n-e-lo', x: [60, 120], y: 0, z: 0  }),
  PanelBrace.X({ id: 'panel-n-w-hi', x: [0,  60],  y: 0, z: 20 }),
  PanelBrace.X({ id: 'panel-n-e-hi', x: [60, 120], y: 0, z: 20 }),

  // ── South wall (y = 60): 2 spans × 2 panel heights ───────────────────────
  PanelBrace.X({ id: 'panel-s-w-lo', x: [0,  60],  y: 60, z: 0  }),
  PanelBrace.X({ id: 'panel-s-e-lo', x: [60, 120], y: 60, z: 0  }),
  PanelBrace.X({ id: 'panel-s-w-hi', x: [0,  60],  y: 60, z: 20 }),
  PanelBrace.X({ id: 'panel-s-e-hi', x: [60, 120], y: 60, z: 20 }),

  // ── West wall (x = 0): 1 span × 2 panel heights ──────────────────────────
  PanelBrace.Y({ id: 'panel-w-lo', x: 0,   y: [0, 60], z: 0  }),
  PanelBrace.Y({ id: 'panel-w-hi', x: 0,   y: [0, 60], z: 20 }),

  // ── East wall (x = 120): 1 span × 2 panel heights ────────────────────────
  PanelBrace.Y({ id: 'panel-e-lo', x: 120, y: [0, 60], z: 0  }),
  PanelBrace.Y({ id: 'panel-e-hi', x: 120, y: [0, 60], z: 20 }),
]
