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
import type { GridPanelSummaryValue } from './'
import { calculateSummaryKey } from './methods'
import { SummaryGridPanelSvg } from './svg/summary-grid-panel-svg'

export function PartsSummary(props: PartsSummaryProps<GridPanelSummaryValue>) {
  const { parts, ...restProps } = props

  const { groupParts } = useSummaryContext()

  const partQuotas = useMemo(() => {
    const partEntries = parts.map(
      (part: GridPanelSummaryValue): PartSummaryEntry<GridPanelSummaryValue> => [
        calculateSummaryKey(part),
        part,
      ],
    )
    const partQuotaType = groupParts ? 'grouped' : 'single'
    const partQuotas = partsToPartQuotas(partQuotaType, partEntries)

    return partQuotas.sort(({ part: partA }, { part: partB }) => {
      const [widthA, heightA] = partA.sizeInGrids
      const [widthB, heightB] = partB.sizeInGrids

      if (widthA === widthB) {
        return heightB - heightA
      }

      return widthB - widthA
    })
  }, [parts, groupParts])

  return (
    <VStack
      as="section"
      aria-labelledby="gridpanel-parts-summary-header"
      alignItems="flex-start"
      width="full"
    >
      <Text id="gridpanel-parts-summary-header" sx={{ fontWeight: 'bold' }}>
        Panels
      </Text>
      <VStack role="list" width="full">
        {partQuotas.map((quota) => (
          <PartSummary key={quota.key} quota={quota} {...restProps} />
        ))}
      </VStack>
    </VStack>
  )
}

type PartSummaryProps = Omit<PartsSummaryProps<GridPanelSummaryValue>, 'parts'> & {
  quota: PartSummaryQuota<GridPanelSummaryValue>
}

function PartSummary(props: PartSummaryProps) {
  const { quota } = props
  const {
    part: { sizeInGrids, holes },
  } = quota

  const { displayUnit } = useSummaryContext()

  return (
    <HStack role="listitem" alignItems="center" spacing="4" sx={{ width: '100%' }}>
      {quota.type === 'grouped' && <PartCount count={quota.count} />}

      <SummaryGridPanelSvg sizeInGrids={sizeInGrids} holes={holes} displayUnit={displayUnit} />
    </HStack>
  )
}
