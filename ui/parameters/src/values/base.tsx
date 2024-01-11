import { JsonParam } from 'serialize-query-params'

export interface BaseOptions {
  queryParamId?: string
  label: string
  helperText?: string
}

export interface BaseProps<Value = any> extends BaseOptions {
  id: string
  value: Value
  onChange: (value: Value) => void
}

export const BaseParam = JsonParam
