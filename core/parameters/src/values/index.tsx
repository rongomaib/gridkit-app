import { Box, VStack } from '@villagekit/ui'
import { map, mapValues } from 'lodash-es'
import { useCallback } from 'react'
import { z } from 'zod'
import { useParams, useParamsValues, useShowControls, useUpdateParamsValues } from '../index'
import {
  // biome-ignore lint/suspicious/noShadowRestrictedNames:
  Boolean,
  BooleanId,
  BooleanQueryParam,
  type BooleanValue,
  booleanParamSchema,
  booleanValueSchema,
} from './boolean'
import {
  Choice,
  ChoiceId,
  ChoiceQueryParam,
  type ChoiceValue,
  choiceParamSchema,
  choiceValueSchema,
} from './choice'
import {
  // biome-ignore lint/suspicious/noShadowRestrictedNames:
  Number,
  NumberId,
  NumberQueryParam,
  type NumberValue,
  numberParamSchema,
  numberValueSchema,
} from './number'

export const paramSchema = z.discriminatedUnion('type', [
  booleanParamSchema,
  choiceParamSchema,
  numberParamSchema,
])
export type Param = z.infer<typeof paramSchema>

export type ParamValuesByType = {
  [BooleanId]: BooleanValue
  [ChoiceId]: ChoiceValue
  [NumberId]: NumberValue
}

export const paramValueSchemasByType = {
  [BooleanId]: booleanValueSchema,
  [ChoiceId]: choiceValueSchema,
  [NumberId]: numberValueSchema,
}

export const paramValueSchema = z.union([booleanValueSchema, choiceValueSchema, numberValueSchema])

export type ParamValue = BooleanValue | ChoiceValue | NumberValue
export type ParamsValues = Record<string, ParamValue>

export const paramQueryParamsByType = {
  [BooleanId]: BooleanQueryParam,
  [ChoiceId]: ChoiceQueryParam,
  [NumberId]: NumberQueryParam,
}

export type Params = {
  [Id: string]: Param
}

export const paramsSchema = z.record(z.string(), paramSchema)

export type ExtractValueFromParam<P extends Param> = ParamValuesByType[P['type']]

export type ExtractValuesFromParams<Ps extends Params> = {
  [Key in keyof Ps]: ExtractValueFromParam<Ps[Key]>
}

export function extractValueSchemaFromParam<P extends Param>(param: P) {
  return paramValueSchemasByType[param.type]
}
export function extractValuesSchemaFromParams<Ps extends Params>(params: Ps) {
  return z.object(mapValues(params, extractValueSchemaFromParam))
}

export function ParamValueControls() {
  const params = useParams()
  const values = useParamsValues()
  const updateParamsValues = useUpdateParamsValues()
  const showControls = useShowControls()

  type Values = NonNullable<typeof values>
  const setValue = useCallback(
    <Key extends keyof Values>(key: Key, value: Values[Key]) => {
      const nextValues = Object.assign({}, values, {
        [key]: value,
      })
      updateParamsValues(nextValues)
    },
    [values, updateParamsValues],
  )

  if (!showControls) return null
  if (values == null) return null
  if (params == null) return null

  return (
    <Box role="menu" sx={{ width: '100%' }}>
      <VStack spacing="4">
        {map(params, (param, id) => (
          <ParamValueControl<typeof id, typeof params, typeof param>
            key={id}
            id={id}
            param={param}
            values={values}
            setValue={setValue}
          />
        ))}
      </VStack>
    </Box>
  )
}

export interface ParamValueControlProps<Id extends string, Ps extends Params, P extends Param> {
  id: Id
  param: P
  values: ExtractValuesFromParams<Ps>
  setValue: (id: Id, value: ExtractValueFromParam<P>) => void
}

function ParamValueControl<Id extends string, Ps extends Params, P extends Param>(
  props: ParamValueControlProps<Id, Ps, P>,
) {
  const { id, param, setValue, values } = props

  const handleChange = useCallback(
    (value: ExtractValueFromParam<P>) => {
      setValue(id, value)
    },
    [id, setValue],
  )

  switch (param.type) {
    case 'boolean': {
      return (
        <Boolean
          {...param}
          id={id}
          value={values[id] as BooleanValue}
          onChange={handleChange as (value: BooleanValue) => void}
        />
      )
    }
    case 'choice': {
      return (
        <Choice
          {...param}
          id={id}
          value={values[id] as ChoiceValue}
          onChange={handleChange as (value: ChoiceValue) => void}
        />
      )
    }
    case 'number': {
      return (
        <Number
          {...param}
          id={id}
          value={values[id] as NumberValue}
          onChange={handleChange as (value: NumberValue) => void}
        />
      )
    }
  }
}
