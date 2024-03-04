import {
  ParametersOptions,
  extractValuesSchemaFromParametersOptions,
  getPresetsSchema,
  parametersOptionsSchema,
} from '@villagekit/parameters'
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

export const designPartSchema = z.intersection(
  partSchema,
  z.object({
    id: z.string().optional(),
  }),
)

const designPartsSchema: z.ZodType<
  RecursiveArray<z.infer<typeof designPartSchema> | false | undefined | null>
> = z.lazy(() => {
  return z.array(
    z.union([designPartSchema, designPartsSchema, z.literal(false), z.undefined(), z.null()]),
  )
})

export const designAssemblyStaticSchema = z.object({
  meta: designMetaSchema,
  assembly: designPartsSchema,
})

const partVariantsByTypeSchema = z.record(z.string(), z.record(z.any()))

export const designAssemblyParameterizedSchema1 = z.object({
  meta: designMetaSchema,
  parameters: parametersOptionsSchema,
  presets: z.array(z.unknown()),
  assembly: z.function().args(z.unknown(), z.unknown()).returns(z.unknown()),
})

export function designAssemblyParameterizedSchema2<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
) {
  const parameterValuesSchema = extractValuesSchemaFromParametersOptions(parameters)
  return z.object({
    meta: designMetaSchema,
    parameters: parametersOptionsSchema,
    presets: getPresetsSchema(parameters),
    assembly: z
      .function()
      .args(parameterValuesSchema, partVariantsByTypeSchema)
      .returns(designPartsSchema),
  })
}

const designAssemblyObjectSchema = z.object({
  assembly: z.union([z.array(z.unknown()), z.function()]),
})

// TODO: fix
// @ts-ignore
export function designAssemblySafeParse(assembly: unknown) {
  const assemblyObjectParse = designAssemblyObjectSchema.safeParse(assembly)

  if (!assemblyObjectParse.success) {
    return assemblyObjectParse
  }

  if (typeof assemblyObjectParse.data.assembly !== 'function') {
    return designAssemblyStaticSchema.safeParse(assembly)
  }

  const assemblyResult = designAssemblyParameterizedSchema1.safeParse(assembly)
  if (assemblyResult.success) {
    const { parameters } = assemblyResult.data
    // TODO: fix
    // @ts-ignore
    return designAssemblyParameterizedSchema2(parameters).safeParse(assembly)
  } else {
    return assemblyResult
  }
}
