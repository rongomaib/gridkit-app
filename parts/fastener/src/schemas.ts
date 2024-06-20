import { z } from 'zod'

const fastenerSchema = z.object({
  type: z.literal('fastener'),
  // TODO
  variant: z.any(),
  start: z.tuple([z.number(), z.number(), z.number()]),
  end: z.tuple([z.number(), z.number(), z.number()]),
  direction: z.tuple([z.number(), z.number(), z.number()]),
})

export const fastenerSchemas = [fastenerSchema]
