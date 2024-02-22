import { Box, VStack } from '@villagekit/ui'
import { map, mapValues } from 'lodash-es'
import { memo, useCallback } from 'react'

import {
  // biome-ignore lint/suspicious/noShadowRestrictedNames:
  Boolean,
  BooleanId,
  BooleanQueryParam,
  BooleanValue,
  booleanOptionsSchema,
  booleanValueSchema,
} from './boolean'
import {
  Choice,
  ChoiceId,
  ChoiceQueryParam,
  ChoiceValue,
  choiceOptionsSchema,
  choiceValueSchema,
} from './choice'
import {
  // biome-ignore lint/suspicious/noShadowRestrictedNames:
  Number,
  NumberId,
  NumberQueryParam,
  NumberValue,
  numberOptionsSchema,
  numberValueSchema,
} from './number'
import { z } from 'zod'

export const parameterOptionsSchema = z.discriminatedUnion('type', [
  booleanOptionsSchema,
  choiceOptionsSchema,
  numberOptionsSchema,
])
export type ParameterOptions = z.infer<typeof parameterOptionsSchema>

export type ParameterValuesByType = {
  [BooleanId]: BooleanValue
  [ChoiceId]: ChoiceValue
  [NumberId]: NumberValue
}

export const parameterValueSchemasByType = {
  [BooleanId]: booleanValueSchema,
  [ChoiceId]: choiceValueSchema,
  [NumberId]: numberValueSchema,
}

export const parameterValueSchema = z.union([
  booleanValueSchema,
  choiceValueSchema,
  numberValueSchema,
])

export const parameterQueryParamsByType = {
  [BooleanId]: BooleanQueryParam,
  [ChoiceId]: ChoiceQueryParam,
  [NumberId]: NumberQueryParam,
}

export type ParametersOptions = {
  [Id: string]: ParameterOptions
}

export const parametersOptionsSchema = z.record(z.string(), parameterOptionsSchema)

export function ParametersOptions<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
): ParamsOptions {
  return parameters
}

export type ExtractValueFromParameterOptions<ParamOptions extends ParameterOptions> =
  ParameterValuesByType[ParamOptions['type']]

export type ExtractValuesFromParametersOptions<ParamsOptions extends ParametersOptions> = {
  [Key in keyof ParamsOptions]: ExtractValueFromParameterOptions<ParamsOptions[Key]>
}

export function extractValueSchemaFromParameterOptions<ParamOptions extends ParameterOptions>(
  parameter: ParamOptions,
) {
  return parameterValueSchemasByType[parameter.type]
}
export function extractValuesSchemaFromParametersOptions<ParamsOptions extends ParametersOptions>(
  parameters: ParamsOptions,
) {
  return z.object(mapValues(parameters, extractValueSchemaFromParameterOptions))
}

export interface ParameterValueControlsProps<Params extends ParametersOptions> {
  parameters: Params
  values: ExtractValuesFromParametersOptions<Params>
  onChange: (values: ExtractValuesFromParametersOptions<Params>) => void
}

export function ParameterValueControls<Params extends ParametersOptions>(
  props: ParameterValueControlsProps<Params>,
) {
  const { parameters, values, onChange } = props

  return (
    <Box role="menu" sx={{ width: '100%' }}>
      <VStack spacing="4">
        {map(parameters, (parameter, id) => (
          <ParameterValueControl<Params, typeof parameter>
            key={id}
            id={id}
            parameter={parameter}
            values={values}
            setValues={onChange}
          />
        ))}
      </VStack>
    </Box>
  )
}

export interface ParameterValueControlProps<
  Params extends ParametersOptions,
  Param extends ParameterOptions,
> {
  id: string
  parameter: Param
  values: ExtractValuesFromParametersOptions<Params>
  setValues: (values: ExtractValuesFromParametersOptions<Params>) => void
}

function ParameterValueControlComponent<
  Params extends ParametersOptions,
  Param extends ParameterOptions,
>(props: ParameterValueControlProps<Params, Param>) {
  const { id, parameter, setValues, values } = props

  type ParameterValue = ExtractValueFromParameterOptions<Param>
  const setValue = useCallback(
    (value: ParameterValue) => {
      const nextValues = Object.assign({}, values, {
        [id]: value,
      })
      setValues(nextValues)
    },
    [id, setValues, values],
  )

  switch (parameter.type) {
    case 'boolean': {
      return (
        <Boolean
          {...parameter}
          id={id}
          value={values[id] as BooleanValue}
          onChange={setValue as (value: BooleanValue) => void}
        />
      )
    }
    case 'choice': {
      return (
        <Choice
          {...parameter}
          id={id}
          value={values[id] as ChoiceValue}
          onChange={setValue as (value: ChoiceValue) => void}
        />
      )
    }
    case 'number': {
      return (
        <Number
          {...parameter}
          id={id}
          value={values[id] as NumberValue}
          onChange={setValue as (value: NumberValue) => void}
        />
      )
    }
  }
}
export const ParameterValueControl = memo(
  ParameterValueControlComponent,
) as typeof ParameterValueControlComponent
