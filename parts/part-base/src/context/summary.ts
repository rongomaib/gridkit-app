import constate from 'constate'

interface SummaryContextProps {
  displayUnit: 'gu' | 'mm'
  groupParts: boolean
}

interface SummaryContextType extends SummaryContextProps {}

function useGridBeamSvg(props: SummaryContextProps): SummaryContextType {
  return props
}

export const [SummaryContextProvider, useSummaryContext] = constate(useGridBeamSvg)
