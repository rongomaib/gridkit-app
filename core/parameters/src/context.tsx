import { useActorRef, useSelector } from '@xstate/react'
import React, { createContext, useCallback, useContext, useEffect } from 'react'
import { ActorRefFrom, SnapshotFrom } from 'xstate'

import { ParametersInput, parametersMachine } from './machine'
import { ParametersValues } from './values'

export const ParametersContext = createContext<ActorRefFrom<typeof parametersMachine> | null>(null)

type ParametersProviderProps = ParametersInput & {
  onParametersValuesUpdate: (parametersValues: ParametersValues) => void
  children: React.ReactNode
}

type Optional<T> = { [K in keyof T]: T[K] | null | undefined }
type OptionalProps<Object extends object, Keys extends keyof Object> = Omit<Object, Keys> &
  Optional<Pick<Object, Keys>>

export function ParametersProvider(
  props: OptionalProps<ParametersProviderProps, 'parameters' | 'presets'>,
) {
  const { children, parameters, presets, ...rest } = props

  if (parameters == null) return children
  if (presets == null) return children

  return (
    <ParametersProviderContext parameters={parameters} presets={presets} {...rest}>
      {children}
    </ParametersProviderContext>
  )
}

function ParametersProviderContext(props: ParametersProviderProps) {
  const { children, parameters, presets, onParametersValuesUpdate, onLocationUpdate } = props

  const actorRef = useActorRef(parametersMachine, {
    input: { parameters, presets, onLocationUpdate },
  })

  // handle updateInput
  useEffect(() => {
    actorRef.send({ type: 'updateInput', parameters, presets, onLocationUpdate })
  }, [actorRef, parameters, presets, onLocationUpdate])

  // handle onParametersValuesUpdate
  const parametersValues = useSelector(actorRef, selectParametersValues)
  useEffect(
    () => onParametersValuesUpdate(parametersValues),
    [onParametersValuesUpdate, parametersValues],
  )

  return <ParametersContext.Provider value={actorRef}>{children}</ParametersContext.Provider>
}

function useParametersActor(): ActorRefFrom<typeof parametersMachine> {
  const actor = useContext(ParametersContext)
  if (actor == null) {
    throw new Error(
      "You used a hook for ParametersContext but it's not inside a ParametersProvider component",
    )
  }
  return actor
}

export const useHasParameters = () => useContext(ParametersContext) != null

type ParametersSnapshot = SnapshotFrom<typeof parametersMachine>
const selectParameters = (snapshot: ParametersSnapshot) => snapshot.context.parameters
export const useParameters = () => useSelector(useParametersActor(), selectParameters)
const selectPresets = (snapshot: ParametersSnapshot) => snapshot.context.presets
export const usePresets = () => useSelector(useParametersActor(), selectPresets)
const selectPresetId = (snapshot: ParametersSnapshot) => snapshot.context.presetId
export const usePresetId = () => useSelector(useParametersActor(), selectPresetId)
const selectParametersValues = (snapshot: ParametersSnapshot) => snapshot.context.parametersValues
export const useParametersValues = () => useSelector(useParametersActor(), selectParametersValues)
const selectShowControls = (snapshot: ParametersSnapshot) => snapshot.context.showControls
export const useShowControls = () => useSelector(useParametersActor(), selectShowControls)

export function useSetShowControls() {
  const actorRef = useParametersActor()
  return useCallback(
    (showControls: boolean) => actorRef.send({ type: 'setShowControls', showControls }),
    [actorRef],
  )
}

export function useUpdatePresetId() {
  const actorRef = useParametersActor()
  return useCallback(
    (presetId: string) => actorRef.send({ type: 'updatePresetId', presetId }),
    [actorRef],
  )
}

export function useUpdateParametersValues() {
  const actorRef = useParametersActor()
  return useCallback(
    (parametersValues: ParametersValues) =>
      actorRef.send({ type: 'updateParametersValues', parametersValues }),
    [actorRef],
  )
}
