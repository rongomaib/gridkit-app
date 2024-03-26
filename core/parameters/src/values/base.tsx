import * as SerializeQueryParams from 'serialize-query-params'
import { z } from 'zod'

const { JsonParam } = SerializeQueryParams

export const baseParamSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  shortId: z
    .string()
    .regex(/[a-zA-Z0-9-]/)
    .optional(),
})

export type BaseParam = z.infer<typeof baseParamSchema>

export interface BaseProps<Value = any> extends BaseParam {
  id: string
  value: Value
  onChange: (value: Value) => void
}

export const BaseParam = JsonParam
