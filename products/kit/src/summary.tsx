import { type PartCreator, PartsSummaryForAll } from '@villagekit/part'
import { SummaryContextProvider } from '@villagekit/part/base'
import type { ProductSummaryProps } from '@villagekit/product'
import { debounce } from 'lodash-es'
import { useEffect, useMemo, useState } from 'react'
import { useProductKitContext } from './context'

export function ProductKitSummary(props: ProductSummaryProps) {
  const { displayUnit, groupParts } = props

  const { parts } = useProductKitContext()

  const [localPartSpecs, setLocalPartSpecs] = useState(() => parts.map((part) => part.spec))

  const setPartsDebounced = useMemo(
    () =>
      debounce(
        (latestParts: Array<PartCreator>) =>
          setLocalPartSpecs(latestParts.map((part) => part.spec)),
        500,
        {
          leading: false,
        },
      ),
    [],
  )

  useEffect(() => {
    setPartsDebounced(parts)
  }, [setPartsDebounced, parts])

  return (
    <SummaryContextProvider displayUnit={displayUnit} groupParts={groupParts}>
      <PartsSummaryForAll parts={localPartSpecs} />
    </SummaryContextProvider>
  )
}
