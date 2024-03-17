import { InfoTooltip } from '@villagekit/ui'
import { useParamControlsInternalContext } from '../internal-context'

interface HelperTooltipProps {
  label: string
}

export function HelperTooltip(props: HelperTooltipProps) {
  const { label } = props

  const { containerRef } = useParamControlsInternalContext()

  return <InfoTooltip label={label} portalProps={{ containerRef: containerRef }} />
}
