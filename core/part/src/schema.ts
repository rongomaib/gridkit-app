import { type ZodDiscriminatedUnionOption, z } from 'zod'
import { partModules } from './modules'
import type { PartCreator } from './types'

export const partSchema = z.lazy(() => {
  const partSchemas: Array<ZodDiscriminatedUnionOption<'type'>> = Object.values(partModules).reduce(
    (sofar, partModule) => {
      // @ts-ignore
      return sofar.concat(partModule.schemas)
    },
    [],
  )
  // @ts-ignore
  return z.discriminatedUnion('type', partSchemas)
}) as unknown as z.ZodType<PartCreator>
