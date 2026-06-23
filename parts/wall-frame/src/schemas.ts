import { z } from 'zod'

const wallFrameXZSchema = z.object({
  type: z.literal('wall-frame:xz'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
})

const wallFrameYZSchema = z.object({
  type: z.literal('wall-frame:yz'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
})

export const wallFrameSchemas = [wallFrameXZSchema, wallFrameYZSchema]
