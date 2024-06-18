import { z } from 'zod'

const gridBeamXSchema = z.object({
  type: z.literal('gridbeam:x'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.number(),
})

const gridBeamYSchema = z.object({
  type: z.literal('gridbeam:y'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
})

const gridBeamZSchema = z.object({
  type: z.literal('gridbeam:z'),
  x: z.number(),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
})

export const gridBeamSchemas = [gridBeamXSchema, gridBeamYSchema, gridBeamZSchema]
