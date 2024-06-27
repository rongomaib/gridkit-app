import { createContext, useContext } from 'react'

interface ControlsContextProps {
  controlMargin: number
  controlScale: number
}

interface ControlsContextType extends ControlsContextProps {}

const ControlsContext = createContext<ControlsContextType | null>(null)

export function ControlsContextProvider(props: React.PropsWithChildren<ControlsContextProps>) {
  const { children, ...value } = props
  return <ControlsContext.Provider value={value}>{children}</ControlsContext.Provider>
}

export function useControlsContext(): ControlsContextType {
  const context = useContext(ControlsContext)
  if (context == null) {
    throw new Error('useControlsContext() must be wrapped with ControlsContextProvider')
  }
  return context
}
