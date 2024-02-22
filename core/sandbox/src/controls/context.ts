import constate from 'constate'

interface ControlsContextProps {
  controlMargin: number
  controlScale: number
}

interface ControlsContextType extends ControlsContextProps {}

function useControls(props: ControlsContextProps): ControlsContextType {
  return props
}

export const [ControlsContextProvider, useControlsContext] =
  constate(useControls)
