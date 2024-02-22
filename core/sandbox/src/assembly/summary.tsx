import { useDesignContext } from '@villagekit/design'
import {
  calculateSummaryValueForAll,
  PartsSummaryForAll,
  PartState,
  PartSummaryValue,
} from '@villagekit/part'
import { SummaryContextProvider } from '@villagekit/part-base'
import { debounce } from 'lodash-es'
import { useEffect, useMemo, useState } from 'react'

interface AssemblySummaryProps {
  displayUnit: 'gu' | 'mm'
  groupParts: boolean
}

export function AssemblySummary(props: AssemblySummaryProps) {
  const { displayUnit, groupParts } = props

  const { parts } = useDesignContext()

  const [localParts, setLocalParts] = useState(parts)

  const setPartsDebounced = useMemo(
    () =>
      debounce((latestParts: Array<PartState>) => setLocalParts(latestParts), 500, {
        leading: false,
      }),
    [],
  )

  useEffect(() => {
    setPartsDebounced(parts)
  }, [setPartsDebounced, parts])

  const partSummaryValues: Array<PartSummaryValue> = useMemo(() => {
    return calculateSummaryValueForAll(localParts)
  }, [localParts])

  return (
    <SummaryContextProvider displayUnit={displayUnit} groupParts={groupParts}>
      <PartsSummaryForAll partSummaryValues={partSummaryValues} />
    </SummaryContextProvider>
  )
}
