import { z } from 'zod'

const beam120XSchema = z.object({
  type: z.literal('beam120:x'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.number(),
  materialId: z.string().optional(),
})

const beam120YSchema = z.object({
  type: z.literal('beam120:y'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
  materialId: z.string().optional(),
})

const beam120ZSchema = z.object({
  type: z.literal('beam120:z'),
  x: z.number(),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
})

export const beam120Schemas = [beam120XSchema, beam120YSchema, beam120ZSchema]
