import { z } from 'zod'

const gablePanelYZSchema = z.object({
  type: z.literal('gable-panel:yz'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
  heightInGrids: z.number(),
  materialId: z.string().optional(),
})

export const gablePanelSchemas = [gablePanelYZSchema]
