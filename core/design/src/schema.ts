import { getPresetsSchema, parametersOptionsSchema } from '@villagekit/parameters'
import { partSchema } from '@villagekit/part'

import { ZodSchema, z } from 'zod'
import { RecursiveArray } from '.'

export const designCategorySchema = z.enum(['seating', 'tables', 'storage', 'office'])

export const designMetaSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string().min(1),
  categories: z.array(designCategorySchema).optional(),
})

export const designPartSchema = z.intersection(
  partSchema,
  z.object({
    id: z.string().optional(),
  }),
)

const designPartsSchema: z.ZodType<RecursiveArray<z.infer<typeof designPartSchema>>> = z.lazy(
  () => {
    return z.array(z.union([designPartSchema, designPartsSchema]))
  },
)

export const designAssemblyStaticSchema = z.object({
  type: z.literal('static'),
  parts: designPartsSchema,
})

export const designAssemblyParameterizedSchema = (presetsSchema: ZodSchema) =>
  z.object({
    type: z.literal('parameterized'),
    parameters: parametersOptionsSchema,
    presets: presetsSchema,
    createParts: z.function(),
  })

// TODO: fix
// @ts-ignore
export function designAssemblySafeParse(assembly: { type: 'parameterized' | 'static' }) {
  if (assembly.type === 'static') {
    return designAssemblyStaticSchema.safeParse(assembly)
  } else if (assembly.type === 'parameterized') {
    const assemblyResult = designAssemblyParameterizedSchema(z.array(z.unknown())).safeParse(
      assembly,
    )
    if (assemblyResult.success) {
      const { parameters } = assemblyResult.data
      // TODO: fix
      // @ts-ignore
      return designAssemblyParameterizedSchema(getPresetsSchema(parameters)).safeParse(assembly)
    } else {
      return assemblyResult
    }
  }
}
