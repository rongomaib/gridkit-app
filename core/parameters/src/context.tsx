import { useActorRef, useSelector } from '@xstate/react'
import { type PropsWithChildren, createContext, useCallback, useContext } from 'react'
import type { ActorRefFrom, SnapshotFrom } from 'xstate'
import { type ParamsMachineInput, paramsMachine } from './machine'
import type { Presets } from './presets'
import type { Params, ParamsValues } from './values'

export const ParamsContext = createContext<ActorRefFrom<typeof paramsMachine> | null>(null)

type ParamsProviderProps = PropsWithChildren<ParamsMachineInput>

export function ParamsProvider(props: ParamsProviderProps) {
  const { children, onLocationUpdate } = props

  const actorRef = useActorRef(paramsMachine, {
    input: { onLocationUpdate },
  })

  return <ParamsContext.Provider value={actorRef}>{children}</ParamsContext.Provider>
}

function useParamsActor(): ActorRefFrom<typeof paramsMachine> {
  const actor = useContext(ParamsContext)
  if (actor == null) {
    throw new Error(
      "You used a hook for ParamsContext but it's not inside a ParamsProvider component",
    )
  }
  return actor
}

export const useHasParams = () => useContext(ParamsContext) != null

type ParamsSnapshot = SnapshotFrom<typeof paramsMachine>
const selectParams = (snapshot: ParamsSnapshot) => snapshot.context.params
export const useParams = () => useSelector(useParamsActor(), selectParams)
const selectPresets = (snapshot: ParamsSnapshot) => snapshot.context.presets
export const usePresets = () => useSelector(useParamsActor(), selectPresets)
const selectPresetId = (snapshot: ParamsSnapshot) => snapshot.context.presetId
export const usePresetId = () => useSelector(useParamsActor(), selectPresetId)
const selectParamsValues = (snapshot: ParamsSnapshot) => snapshot.context.paramsValues
export const useParamsValues = () => useSelector(useParamsActor(), selectParamsValues)
const selectShowControls = (snapshot: ParamsSnapshot) => snapshot.context.showControls
export const useShowControls = () => useSelector(useParamsActor(), selectShowControls)

export function useUpdateParams() {
  const actorRef = useParamsActor()
  return useCallback(
    <Ps extends Params>(params: Ps, presets: Presets<Ps>) =>
      actorRef.send({ type: 'updateParams', params, presets }),
    [actorRef],
  )
}

export function useUpdatePresetId() {
  const actorRef = useParamsActor()
  return useCallback(
    (presetId: string) => actorRef.send({ type: 'updatePresetId', presetId }),
    [actorRef],
  )
}

export function useUpdateParamsValues() {
  const actorRef = useParamsActor()
  return useCallback(
    (paramsValues: ParamsValues) => actorRef.send({ type: 'updateParamsValues', paramsValues }),
    [actorRef],
  )
}

export function useSetShowControls() {
  const actorRef = useParamsActor()
  return useCallback(
    (showControls: boolean) => actorRef.send({ type: 'setShowControls', showControls }),
    [actorRef],
  )
}
