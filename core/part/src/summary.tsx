import { HStack, Text, VStack } from '@villagekit/ui'
import { groupBy, map } from 'lodash-es'
import { nanoid } from 'nanoid'
import { type FunctionComponent, useMemo } from 'react'
import { PartCount, type PartsSummaryProps, useSummaryContext } from './base'
import type { BasePartSpec } from './creator'
import { getPartModule } from './modules'
import type { PartSpec, PartSvgProps, PartTypeId } from './types'

export type PartSummaryQuotaSingle<T> = {
  type: 'single'
  key: string
  part: T
}

export type PartSummaryQuotaGrouped<T> = {
  type: 'grouped'
  key: string
  part: T
  count: number
}

export type PartSummaryQuota<T> = PartSummaryQuotaSingle<T> | PartSummaryQuotaGrouped<T>

export interface PartsSummaryForAllProps {
  parts: Array<PartSpec>
}

export function PartsSummaryForAll(props: PartsSummaryForAllProps): React.ReactElement {
  const { parts } = props

  const partsByType = useMemo(() => {
    return groupBy(parts, 'type')
  }, [parts])

  return (
    <>
      {map(partsByType, (partsForType: Array<PartSpec>, partType: PartTypeId) => {
        return <PartsSummaryForType key={partType} partType={partType} parts={partsForType} />
      })}
    </>
  )
}

export interface PartsSummaryForTypeProps {
  partType: PartTypeId
  parts: Array<PartSpec>
}

export function PartsSummaryForType(props: PartsSummaryForTypeProps): React.ReactElement {
  const { partType, parts } = props

  const partModule = getPartModule(partType)
  const plural = partModule.labels.plural
  const PartSvg = partModule.components.PartSvg

  const { groupParts } = useSummaryContext()

  const partQuotas = useMemo(() => {
    const partQuotaType = groupParts ? 'grouped' : 'single'
    // @ts-ignore
    const normalizedParts = parts.map((part) => part.normalize())
    // @ts-ignore
    const partQuotas = partsToPartQuotas(partQuotaType, normalizedParts)
    return partQuotas.sort(({ part: partA }, { part: partB }) => partA.compare(partB))
  }, [parts, groupParts])

  return (
    <VStack
      as="section"
      aria-labelledby={`${partType}-parts-summary-header`}
      alignItems="flex-start"
      width="full"
    >
      <Text
        id={`${partType}-parts-summary-header`}
        sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
      >
        {plural}
      </Text>

      <VStack role="list" width="full">
        {partQuotas.map((quota) => (
          <PartSummary key={quota.key} quota={quota} Svg={PartSvg} />
        ))}
      </VStack>
    </VStack>
  )
}

type PartSummaryProps = Omit<PartsSummaryProps<PartSpec>, 'parts'> & {
  Svg: FunctionComponent<PartSvgProps<PartSpec>>
  quota: PartSummaryQuota<PartSpec>
}

function PartSummary(props: PartSummaryProps) {
  const { Svg, quota } = props
  const { part } = quota

  const { displayUnit } = useSummaryContext()

  return (
    <HStack role="listitem" alignItems="center" spacing="4" sx={{ width: '100%' }}>
      {quota.type === 'grouped' && <PartCount count={quota.count} />}

      <Svg displayUnit={displayUnit} part={part} />
    </HStack>
  )
}

export function partsToPartQuotas<Spec extends BasePartSpec<any>>(
  type: 'single' | 'grouped',
  parts: Array<Spec>,
): Array<PartSummaryQuota<Spec>> {
  switch (type) {
    case 'single':
      return parts.map((part) => ({
        key: nanoid(),
        part,
        type: 'single',
      }))
    case 'grouped': {
      const quotas: Array<PartSummaryQuotaGrouped<Spec>> = []
      for (const part of parts) {
        const quota = quotas.find((quota) => {
          return part.equals(quota.part)
        })
        if (quota == null) {
          quotas.push({
            key: nanoid(),
            part,
            type: 'grouped',
            count: 1,
          })
        } else {
          quota.count += 1
        }
      }
      return quotas
    }
  }
}
