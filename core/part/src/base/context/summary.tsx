import { createContext, useContext } from 'react'

interface SummaryContextProps {
  displayUnit: 'gu' | 'mm'
  groupParts: boolean
}

interface SummaryContextType extends SummaryContextProps {}

const SummaryContext = createContext<SummaryContextType | null>(null)

export function SummaryContextProvider(props: React.PropsWithChildren<SummaryContextProps>) {
  const { children, ...value } = props
  return <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>
}

export function useSummaryContext(): SummaryContextType {
  const context = useContext(SummaryContext)
  if (context == null) {
    throw new Error('useSummaryContext() must be wrapped with SummaryContextProvider')
  }
  return context
}
