import { createContext, useContext } from 'react'

interface GridSvgContextProps {
  displayUnit: 'gu' | 'mm'
}

interface GridSvgContextType extends GridSvgContextProps {}

const GridSvgContext = createContext<GridSvgContextType | null>(null)

export function GridSvgContextProvider(props: React.PropsWithChildren<GridSvgContextProps>) {
  const { children, ...value } = props
  return <GridSvgContext.Provider value={value}>{children}</GridSvgContext.Provider>
}

export function useGridSvgContext(): GridSvgContextType {
  const context = useContext(GridSvgContext)
  if (context == null) {
    throw new Error('useGridSvgContext() must be wrapped with GridSvgContextProvider')
  }
  return context
}

// TODO remove aliases
export const SvgContextProvider = GridSvgContextProvider
export const useSvgContext = useGridSvgContext
