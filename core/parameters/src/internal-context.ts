import constate from 'constate'

interface ParameterControlsInternalContextProps {
  containerRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode | Array<React.ReactNode>
}

interface ParameterControlsInternalContextType
  extends ParameterControlsInternalContextProps {}

function useParameters(
  props: ParameterControlsInternalContextProps,
): ParameterControlsInternalContextType {
  return props
}

export const [
  ParameterControlsInternalContextProvider,
  useParameterControlsInternalContext,
] = constate(useParameters)
