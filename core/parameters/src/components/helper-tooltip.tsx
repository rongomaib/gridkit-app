import { InfoTooltip } from '@villagekit/ui'

interface HelperTooltipProps {
  label: string
}

export function HelperTooltip(props: HelperTooltipProps) {
  const { label } = props

  return <InfoTooltip label={label} />
}
