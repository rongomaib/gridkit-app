import { debounce, intersection, isEqual } from 'lodash-es'
import QueryString from 'query-string'
import type { DecodedValueMap, EncodedValueMap, QueryParamConfigMap } from 'serialize-query-params'
import * as SerializeQueryParams from 'serialize-query-params'
import { assertEvent, assign, fromCallback, sendTo, setup } from 'xstate'
import type { Presets } from './presets'
import type { ExtractValuesFromParams, Param, Params, ParamsValues } from './values'

const {
  BooleanParam,
  NumberParam,
  StringParam,
  decodeQueryParams,
  encodeQueryParams,
  updateLocation,
} = SerializeQueryParams

export type OnLocationUpdate = (location: Location) => void
export type ParamsMachineInput = {
  onLocationUpdate?: OnLocationUpdate
}

type ClearParamsEvent = {
  type: 'clearParams'
}
type UpdateParamsEvent = {
  type: 'updateParams'
  params: Params
  presets: Presets<any>
}
type UpdatePresetIdEvent = {
  type: 'updatePresetId'
  presetId: string
}
type UpdateParamsValuesEvent = {
  type: 'updateParamsValues'
  paramsValues: ParamsValues
}
type ReloadQueryParamsEvent = {
  type: 'reloadQueryParams'
}
type QueryParamsEvent =
  | ClearParamsEvent
  | UpdateParamsEvent
  | UpdatePresetIdEvent
  | UpdateParamsValuesEvent
  | ReloadQueryParamsEvent
const queryParamsActor = fromCallback<QueryParamsEvent, ParamsMachineInput>(
  ({ input, receive, sendBack }) => {
    const { onLocationUpdate } = input

    type Current = Omit<UpdateParamsEvent, 'type'> | null
    let current: Current = null
    let queryParamDefinitions: QueryParamConfigMap

    const handleUpdateDebounced = debounce(handleUpdateState, 1000, {
      leading: false,
      trailing: true,
    })

    receive((event) => {
      switch (event.type) {
        case 'clearParams': {
          return clearParams()
        }
        case 'updateParams': {
          return setupParams(event)
        }
        case 'updatePresetId':
        case 'updateParamsValues':
          return handleUpdateDebounced(event)
        case 'reloadQueryParams':
          if (current == null) {
            throw new Error(
              '@villagekit/parameters: reloadQueryParams event with no current parameters and presets definitions',
            )
          }
          return loadQueryParams(current)
      }
    })

    return () => {}

    function clearParams() {
      current = null
    }

    function setupParams(event: UpdateParamsEvent) {
      const { params, presets } = event

      assertPresets(params, presets)
      current = { params, presets }

      queryParamDefinitions = calculateQueryParamDefinitions(params)

      loadQueryParams(current)
    }

    function handleUpdateState(event: UpdatePresetIdEvent | UpdateParamsValuesEvent) {
      if (current == null) return

      const { presetId: currentQueryPresetId, paramsValues: currentQueryParamsValues } =
        getQueryParamsValues(current.params, queryParamDefinitions)

      let urlParams: Partial<EncodedValueMap<QueryParamConfigMap>>
      switch (event.type) {
        case 'updatePresetId': {
          const { presetId } = event
          if (presetId === currentQueryPresetId) return
          urlParams = encodeQueryParams(queryParamDefinitions, {
            preset: presetId,
          })
          break
        }
        case 'updateParamsValues': {
          const { paramsValues } = event
          if (isEqual(paramsValues, currentQueryParamsValues)) return
          urlParams = encodeQueryParams(
            queryParamDefinitions,
            mapValuesToQueryValueMap(current.params, paramsValues),
          )
          break
        }
      }

      if (onLocationUpdate != null) {
        const nextLocation = updateLocation(urlParams, location)
        onLocationUpdate(nextLocation)
      }
    }

    function loadQueryParams(current: NonNullable<Current>) {
      const { presetId, paramsValues } = getQueryParamsValues(current.params, queryParamDefinitions)
      if (presetId != null) {
        sendBack({
          type: 'updatePresetId',
          presetId,
        })
      } else if (
        Object.keys(paramsValues).length > 0 &&
        Object.values(paramsValues).every((v) => v != null)
      ) {
        sendBack({
          type: 'updateParamsValues',
          paramsValues,
        })
      } else {
        sendBack({
          type: 'resetToDefaultPreset',
        })
      }
    }
  },
)

type ParamsMachineContext = ParamsMachineInput & {
  params: Params | null
  presets: Presets<any> | null
  presetId: string | null
  paramsValues: ParamsValues | null
  showControls: boolean
}

type ResetToDefaultPresetEvent = {
  type: 'resetToDefaultPreset'
}
type SetShowControlsEvent = {
  type: 'setShowControls'
  showControls: boolean
}

export type ParamsMachineEvent =
  | ClearParamsEvent
  | UpdateParamsEvent
  | UpdatePresetIdEvent
  | UpdateParamsValuesEvent
  | ReloadQueryParamsEvent
  | ResetToDefaultPresetEvent
  | SetShowControlsEvent

export const paramsMachine = setup({
  types: {} as {
    input: ParamsMachineInput
    context: ParamsMachineContext
    events: ParamsMachineEvent
  },
  actors: {
    queryParams: queryParamsActor,
  },
}).createMachine({
  id: 'params',
  invoke: [
    {
      id: 'queryParams',
      src: 'queryParams',
      input: ({ context: { onLocationUpdate } }) => ({
        onLocationUpdate,
      }),
    },
  ],
  context: ({ input }) => {
    const { onLocationUpdate } = input
    return {
      onLocationUpdate,
      showControls: false,
      params: null,
      presets: null,
      presetId: null,
      paramsValues: null,
    }
  },
  on: {
    clearParams: {
      actions: [
        assign(({ context }) => {
          const { onLocationUpdate, showControls } = context
          return {
            onLocationUpdate,
            showControls,
            params: null,
            presets: null,
            presetId: null,
            paramsValues: null,
          }
        }),
      ],
    },
    updateParams: {
      actions: [
        assign(({ context, event }) => {
          const { params, presets } = event
          assertPresets(params, presets)
          return {
            ...context,
            params,
            presets,
          }
        }),

        sendTo('queryParams', ({ event }) => event),
      ],
    },
    updatePresetId: {
      actions: [
        assign(({ context, event }) => {
          const { presets } = context
          if (presets == null) {
            throw new Error('Unexpected context: presets are not set')
          }
          const { presetId } = event
          const preset = presets.find((preset) => preset.id === presetId)
          if (preset == null) {
            throw new Error(`Unknown preset: ${presetId}`)
          }
          return { ...context, presetId, paramsValues: preset.values }
        }),

        sendTo('queryParams', ({ event }) => event),
      ],
    },
    updateParamsValues: {
      actions: [
        assign(({ context, event }) => {
          const { params, presets } = context
          if (params == null || presets == null) {
            throw new Error('Unexpected context: params or presets are not set')
          }
          const { paramsValues } = event
          return { ...context, presetId: null, paramsValues }
        }),

        sendTo('queryParams', ({ event }) => event),
      ],
    },
    resetToDefaultPreset: {
      actions: assign(({ context }) => {
        const { presets } = context
        if (presets == null) {
          throw new Error('Unexpected context: presets are not set')
        }
        const defaultPreset = presets[0]
        return {
          ...context,
          presetId: defaultPreset.id,
          paramsValues: defaultPreset.values,
        }
      }),
    },
    reloadQueryParams: {
      actions: sendTo('queryParams', ({ event }) => event),
    },
    setShowControls: {
      actions: assign({
        showControls: ({ event }) => {
          assertEvent(event, 'setShowControls')
          return event.showControls
        },
      }),
    },
  },
})

function assertPresets<Ps extends Params>(
  params: Ps,
  presets: Presets<any>,
): asserts presets is Presets<Ps> {
  const paramKeys = Object.keys(params)
  const presetKeys = Object.keys(presets[0].values)
  if (
    !(
      paramKeys.length === presetKeys.length &&
      intersection(paramKeys, presetKeys).length === paramKeys.length
    )
  ) {
    throw new Error('presets are not valid for params')
  }
}

function calculateQueryParamDefinitions<Ps extends Params>(params: Ps): QueryParamConfigMap {
  const configMap: QueryParamConfigMap = {
    preset: StringParam,
  }

  for (const paramKey in params) {
    const param = params[paramKey]!
    configMap[param.shortId ?? paramKey] = queryParamConfigForParam(param)
  }

  return configMap

  function queryParamConfigForParam(param: Param) {
    switch (param.type) {
      case 'boolean':
        return BooleanParam
      case 'choice':
        return StringParam
      case 'number':
        return NumberParam
    }
  }
}

function mapValuesToQueryValueMap<Ps extends Params>(
  params: Ps,
  values: ExtractValuesFromParams<Ps>,
): DecodedValueMap<QueryParamConfigMap> {
  const valuesMap: DecodedValueMap<QueryParamConfigMap> = {}
  for (const paramKey in params) {
    const param = params[paramKey]!
    valuesMap[param.shortId || paramKey] = values[paramKey]
  }
  return valuesMap
}

function mapQueryValueMapToValues<Ps extends Params>(
  params: Ps,
  valuesMap: DecodedValueMap<QueryParamConfigMap>,
): ExtractValuesFromParams<Ps> {
  const values: Partial<ExtractValuesFromParams<Ps>> = {}
  for (const paramKey in params) {
    const param = params[paramKey]!
    values[paramKey] = valuesMap[param.shortId || paramKey]
  }
  return values as ExtractValuesFromParams<Ps>
}

function getQueryParamsValues<Ps extends Params>(
  params: Ps,
  queryParamDefinitions: QueryParamConfigMap,
) {
  const urlParams = QueryString.parse(location.search)
  const queryValues = decodeQueryParams(queryParamDefinitions, urlParams)

  const { preset: presetId, ...queryParamValues } = queryValues

  return {
    presetId,
    paramsValues: mapQueryValueMapToValues(params, queryParamValues),
  }
}
