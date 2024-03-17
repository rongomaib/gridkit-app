import { getPresetsSchema, paramsSchema } from '@villagekit/parameters'
import { partCreatorSchema } from '@villagekit/part'
import { z } from 'zod'
import type { RecursiveArray } from './types'

export const categorySchema = z.enum(['seating', 'tables', 'storage', 'office'])

export const metaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  categories: z.array(categorySchema).optional(),
})

export { paramsSchema, getPresetsSchema }

export const partSchema = z.intersection(
  partCreatorSchema,
  z.object({
    id: z.string().optional(),
  }),
)

export const partsSchema: z.ZodType<
  RecursiveArray<z.infer<typeof partSchema> | false | undefined | null>
> = z.lazy(() => {
  return z.array(z.union([partSchema, partsSchema, z.literal(false), z.undefined(), z.null()]))
})
