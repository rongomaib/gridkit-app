import constate from 'constate'

interface ParamControlsInternalContextProps {
  containerRef?: React.RefObject<HTMLElement | null>
  children: React.ReactNode | Array<React.ReactNode>
}

interface ParamControlsInternalContextType extends ParamControlsInternalContextProps {}

function useParams(props: ParamControlsInternalContextProps): ParamControlsInternalContextType {
  return props
}

export const [ParamControlsInternalContextProvider, useParamControlsInternalContext] =
  constate(useParams)
