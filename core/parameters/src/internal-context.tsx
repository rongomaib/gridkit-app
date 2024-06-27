import { createContext, useContext } from 'react'

interface ParamControlsInternalContextProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

interface ParamControlsInternalContextType extends ParamControlsInternalContextProps {}

const ParamControlsInternalContext = createContext<ParamControlsInternalContextType | null>(null)

export function ParamControlsInternalContextProvider(
  props: React.PropsWithChildren<ParamControlsInternalContextProps>,
) {
  const { children, ...value } = props
  return (
    <ParamControlsInternalContext.Provider value={value}>
      {children}
    </ParamControlsInternalContext.Provider>
  )
}

export function useParamControlsInternalContext(): ParamControlsInternalContextType {
  const context = useContext(ParamControlsInternalContext)
  if (context == null) {
    throw new Error(
      'useParamControlsInternalContext() must be wrapped with ParamControlsInternalContextProvider',
    )
  }
  return context
}
