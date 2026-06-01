import { z } from 'zod'

const hingeDoorSchema = z.object({
  type: z.literal('hinge:door'),
  x: z.number(),
  z: z.number(),
  angle: z.number().optional(),
})

export const hingeSchemas = [hingeDoorSchema]
