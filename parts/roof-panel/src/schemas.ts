import { z } from 'zod'

const roofPanelXSchema = z.object({
  type: z.literal('roof-panel:x'),
  x: z.number(),
  yStart: z.number(),
  yEnd: z.number(),
  zStart: z.number(),
  pitchDeg: z.number(),
  materialId: z.string().optional(),
})

export const roofPanelSchemas = [roofPanelXSchema]
