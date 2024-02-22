import { JsonParam } from 'serialize-query-params'
import { z } from 'zod'

export const baseOptionsSchema = z.object({
  label: z.string(),
  description: z.string().optional(),
  shortId: z
    .string()
    .regex(/[a-zA-Z0-9-]/)
    .optional(),
})

export type BaseOptions = z.infer<typeof baseOptionsSchema>

export interface BaseProps<Value = any> extends BaseOptions {
  id: string
  value: Value
  onChange: (value: Value) => void
}

export const BaseParam = JsonParam
