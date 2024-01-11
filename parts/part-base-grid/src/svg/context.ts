import constate from 'constate'

interface SvgContextProps {
  displayUnit: 'gu' | 'mm'
}

interface SvgContextType extends SvgContextProps {}

function useSvg(props: SvgContextProps): SvgContextType {
  return props
}

export const [SvgContextProvider, useSvgContext] = constate(useSvg)
