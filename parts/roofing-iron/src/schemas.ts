import { z } from 'zod'

const roofingIronXSchema = z.object({
  type: z.literal('roofing-iron:x'),
  x: z.tuple([z.number(), z.number()]),
  yStart: z.number(),
  yEnd: z.number(),
  zStart: z.number(),
  pitchDeg: z.number(),
  offsetGu: z.number().optional(),
  materialId: z.string().optional(),
})

export const roofingIronSchemas = [roofingIronXSchema]
