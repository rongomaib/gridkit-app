import { z } from 'zod'

const gridPanelFitSchema = z.enum(['top', 'bottom'])
const gridPanelHolesSchema = z.union([z.boolean(), z.array(z.tuple([z.number(), z.number()]))])

const gridPanelXYSchema = z.object({
  fit: gridPanelFitSchema.optional(),
  holes: gridPanelHolesSchema.optional(),
  type: z.literal('gridpanel:xy'),
  x: z.tuple([z.number(), z.number()]),
  y: z.tuple([z.number(), z.number()]),
  z: z.number(),
})

const gridPanelYZSchema = z.object({
  fit: gridPanelFitSchema.optional(),
  holes: gridPanelHolesSchema.optional(),
  type: z.literal('gridpanel:yz'),
  x: z.number(),
  y: z.tuple([z.number(), z.number()]),
  z: z.tuple([z.number(), z.number()]),
})

const gridPanelXZSchema = z.object({
  fit: gridPanelFitSchema.optional(),
  holes: gridPanelHolesSchema.optional(),
  type: z.literal('gridpanel:xz'),
  x: z.tuple([z.number(), z.number()]),
  y: z.number(),
  z: z.tuple([z.number(), z.number()]),
})

export const gridPanelSchemas = [gridPanelXYSchema, gridPanelYZSchema, gridPanelXZSchema]
