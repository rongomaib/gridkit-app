import { z } from 'zod'

const panelBraceXSchema = z.object({
  type: z.literal('panel-brace:x'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.number(),
  heightInGrids: z.number().optional(),
  depthInGrids: z.number().optional(),
  materialId: z.string().optional(),
})

const panelBraceYSchema = z.object({
  type: z.literal('panel-brace:y'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
  heightInGrids: z.number().optional(),
  depthInGrids: z.number().optional(),
  materialId: z.string().optional(),
})

export const panelBraceSchemas = [panelBraceXSchema, panelBraceYSchema]
