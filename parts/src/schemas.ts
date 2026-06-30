import { z } from 'zod'

const steelGusset6mmXSchema = z.object({
  type: z.literal('steel-gusset-6mm:x'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.number(),
  materialId: z.string().optional(),
})

const steelGusset6mmYSchema = z.object({
  type: z.literal('steel-gusset-6mm:y'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
  materialId: z.string().optional(),
})

const steelGusset6mmZSchema = z.object({
  type: z.literal('steel-gusset-6mm:z'),
  x: z.number(),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
})
export const steelGusset6mmSchemas = [steelGusset6mmXSchema, steelGusset6mmYSchema, steelGusset6mmZSchema]
