import {
  PartCount,
  type PartSummaryEntry,
  type PartSummaryQuota,
  type PartsSummaryProps,
  partsToPartQuotas,
  useSummaryContext,
} from '@villagekit/part/base'
import { HStack, Text, VStack } from '@villagekit/ui'
import { memo, useMemo } from 'react'

import type { FastenerSpec } from './creator'
import { calculateSummaryKey } from './methods'
import { SummaryFastenerSvg } from './summary-fastener-svg'
import { fastenerVariants } from './variants'

export function PartsSummary(props: PartsSummaryProps<FastenerSpec>) {
  const { parts, ...restProps } = props

  const { groupParts } = useSummaryContext()

  const partQuotas = useMemo(() => {
    const partEntries = parts.map(
      (part: FastenerSpec): PartSummaryEntry<FastenerSpec> => [calculateSummaryKey(part), part],
    )
    const partQuotaType = groupParts ? 'grouped' : 'single'
    const partQuotas = partsToPartQuotas(partQuotaType, partEntries)

    return partQuotas.sort(
      ({ part: partA }, { part: partB }) =>
        fastenerVariants[partB.variantId]!.fastenedLength.value -
        fastenerVariants[partA.variantId]!.fastenedLength.value,
    )
  }, [parts, groupParts])

  return (
    <VStack
      as="section"
      aria-labelledby="fastener-parts-summary-header"
      alignItems="flex-start"
      width="full"
    >
      <Text id="fastener-parts-summary-header" sx={{ fontWeight: 'bold' }}>
        Fasteners
      </Text>

      <VStack role="list" width="full">
        {partQuotas.map((quota) => (
          // biome-ignore lint/correctness/useJsxKeyInIterable:
          <PartSummary quota={quota} {...restProps} />
        ))}
      </VStack>
    </VStack>
  )
}

type PartSummaryProps = Omit<PartsSummaryProps<FastenerSpec>, 'parts'> & {
  quota: PartSummaryQuota<FastenerSpec>
}

const PartSummary = memo(function PartSummary(props: PartSummaryProps) {
  const { quota } = props
  const { part } = quota
  const { variantId } = part
  const variant = fastenerVariants[variantId]!
  const {
    boltDiameter,
    boltLabel,
    boltLength,
    endDiameter,
    extrusionLength,
    nutDiameter,
    nutLength,
  } = variant

  // TODO: would be great to have some formatting functions for util-units
  const isPlural = quota.type === 'grouped' && quota.count > 1
  const boltsLabel = boltLabel + (isPlural ? 's' : '')
  const nutsLabel = `nut${isPlural ? 's' : ''}`
  const label = `${boltLength.value}${boltLength.unit.symbol} ${boltsLabel} + ${nutLength.value}${nutLength.unit.symbol} ${nutsLabel}`

  return (
    <HStack role="listitem" alignItems="flex-start" spacing="4" sx={{ width: '100%' }}>
      {quota.type === 'grouped' && <PartCount count={quota.count} />}

      <SummaryFastenerSvg
        boltDiameter={boltDiameter.value}
        boltLength={boltLength.value}
        nutDiameter={nutDiameter.value}
        nutLength={nutLength.value}
        extrusionLength={extrusionLength.value}
        endDiameter={endDiameter.value}
        label={label}
      />
    </HStack>
  )
})
