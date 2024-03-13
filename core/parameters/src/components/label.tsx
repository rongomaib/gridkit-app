import { FormLabel, HStack } from '@villagekit/ui'
import { HelperTooltip } from './helper-tooltip'

interface LabelProps {
  label: string
  description?: string
  htmlFor?: string
}

export function Label(props: LabelProps) {
  const { label, description, htmlFor } = props

  return (
    <>
      <HStack sx={{ marginBottom: 2 }}>
        <FormLabel htmlFor={htmlFor} sx={{ margin: 0 }}>
          {label}
        </FormLabel>

        {description != null && <HelperTooltip label={description} />}
      </HStack>
    </>
  )
}
