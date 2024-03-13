import { getPresetsSchema, parametersOptionsSchema } from '@villagekit/parameters'
import { partSchema } from '@villagekit/part'

import { z } from 'zod'
import { RecursiveArray } from '.'

export const designCategorySchema = z.enum(['seating', 'tables', 'storage', 'office'])

export const designMetaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  categories: z.array(designCategorySchema).optional(),
})

export const designParametersSchema = parametersOptionsSchema
export const getDesignPresetsSchema = getPresetsSchema

export const designPartSchema = z.intersection(
  partSchema,
  z.object({
    id: z.string().optional(),
  }),
)

export const designPartsSchema: z.ZodType<
  RecursiveArray<z.infer<typeof designPartSchema> | false | undefined | null>
> = z.lazy(() => {
  return z.array(
    z.union([designPartSchema, designPartsSchema, z.literal(false), z.undefined(), z.null()]),
  )
})
