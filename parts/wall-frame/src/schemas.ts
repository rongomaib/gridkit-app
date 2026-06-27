import { z } from 'zod'

const wallFrameXZSchema = z.object({
  type: z.literal('wall-frame:xz'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
  moduleType: z.enum(['solid', 'window', 'door', 'open']).optional(),
})

const wallFrameYZSchema = z.object({
  type: z.literal('wall-frame:yz'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
  moduleType: z.enum(['solid', 'window', 'door', 'open']).optional(),
})

export const wallFrameSchemas = [wallFrameXZSchema, wallFrameYZSchema]
