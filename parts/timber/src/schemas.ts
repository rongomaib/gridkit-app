import { z } from 'zod'

const timberXSchema = z.object({
  type: z.literal('timber:x'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.number(),
  materialId: z.string().optional(),
})

const timberYSchema = z.object({
  type: z.literal('timber:y'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
  materialId: z.string().optional(),
})

const timberZSchema = z.object({
  type: z.literal('timber:z'),
  x: z.number(),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
  materialId: z.string().optional(),
})

export const timberSchemas = [timberXSchema, timberYSchema, timberZSchema]
