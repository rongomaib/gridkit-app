import {
  PartCount,
  type PartSummaryEntry,
  type PartSummaryQuota,
  type PartsSummaryProps,
  partsToPartQuotas,
  useSummaryContext,
} from '@villagekit/part/base'
import { HStack, Text, VStack } from '@villagekit/ui'
import { useMemo } from 'react'
import type { GridBeam } from './creator'
import { calculateSummaryKey } from './methods'
import { SummaryGridBeamSvg } from './svg/summary-grid-beam-svg'

export function PartsSummary(props: PartsSummaryProps<GridBeam>) {
  const { parts, ...restProps } = props

  const { groupParts } = useSummaryContext()

  const partQuotas = useMemo(() => {
    const partEntries = parts.map(
      (part: GridBeam): PartSummaryEntry<GridBeam> => [calculateSummaryKey(part), part],
    )
    const partQuotaType = groupParts ? 'grouped' : 'single'
    const partQuotas = partsToPartQuotas(partQuotaType, partEntries)

    return partQuotas.sort(
      ({ part: partA }, { part: partB }) => partB.lengthInGrids - partA.lengthInGrids,
    )
  }, [parts, groupParts])

  return (
    <VStack
      as="section"
      aria-labelledby="gridbeam-parts-summary-header"
      alignItems="flex-start"
      width="full"
    >
      <Text id="gridbeam-parts-summary-header" sx={{ fontWeight: 'bold' }}>
        Beams
      </Text>

      <VStack role="list" width="full">
        {partQuotas.map((quota) => (
          <PartSummary key={quota.key} quota={quota} {...restProps} />
        ))}
      </VStack>
    </VStack>
  )
}

type PartSummaryProps = Omit<PartsSummaryProps<GridBeam>, 'parts'> & {
  quota: PartSummaryQuota<GridBeam>
}

function PartSummary(props: PartSummaryProps) {
  const { quota } = props
  const {
    part: { lengthInGrids },
  } = quota

  const { displayUnit } = useSummaryContext()

  return (
    <HStack role="listitem" alignItems="flex-start" spacing="4" sx={{ width: '100%' }}>
      {quota.type === 'grouped' && <PartCount count={quota.count} />}

      <SummaryGridBeamSvg sizeInGrids={lengthInGrids} displayUnit={displayUnit} />
    </HStack>
  )
}
