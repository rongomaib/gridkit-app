import { type ZodDiscriminatedUnionOption, z } from 'zod'
import { getPartModules } from './modules'
import type { PartCreator } from './types'

export const partCreatorSchema = z.lazy(() => {
  const partCreatorSchemas: Array<ZodDiscriminatedUnionOption<'type'>> = Object.values(
    getPartModules(),
  ).reduce((sofar, partModule) => {
    // @ts-ignore
    return sofar.concat(partModule.schemas)
  }, [])
  // @ts-ignore
  return z.discriminatedUnion('type', partCreatorSchemas)
}) as unknown as z.ZodType<PartCreator>
