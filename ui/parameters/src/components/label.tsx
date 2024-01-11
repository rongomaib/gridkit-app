import { FormLabel, HStack } from '@villagekit/ui'

import { HelperTooltip } from './helper-tooltip'

interface LabelProps {
  label: string
  helperText?: string
  htmlFor?: string
}

export function Label(props: LabelProps) {
  const { label, helperText, htmlFor } = props

  return (
    <>
      <HStack sx={{ marginBottom: 2 }}>
        <FormLabel htmlFor={htmlFor} sx={{ margin: 0 }}>
          {label}
        </FormLabel>

        {helperText != null && <HelperTooltip label={helperText} />}
      </HStack>
    </>
  )
}
