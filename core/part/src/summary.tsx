import { Button, HStack, Text, VStack } from '@villagekit/ui'
import { camelCase, groupBy, map, upperFirst } from 'lodash-es'
import { nanoid } from 'nanoid'
import { type FunctionComponent, useCallback, useMemo } from 'react'
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
  summaryId: string
}

export function PartsSummaryForAll(props: PartsSummaryForAllProps): React.ReactElement {
  const { parts, summaryId } = props

  const partsByType = useMemo(() => {
    return groupBy(parts, 'type')
  }, [parts])

  return (
    <>
      {map(partsByType, (partsForType: Array<PartSpec>, partType: PartTypeId) => {
        return (
          <PartsSummaryForType
            key={partType}
            partType={partType}
            parts={partsForType}
            summaryId={summaryId}
          />
        )
      })}
    </>
  )
}

export interface PartsSummaryForTypeProps {
  partType: PartTypeId
  parts: Array<PartSpec>
  summaryId: string
}

export function PartsSummaryForType(props: PartsSummaryForTypeProps): React.ReactElement {
  const { partType, parts, summaryId } = props

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
          <PartSummary
            key={quota.key}
            partType={partType}
            quota={quota}
            Svg={PartSvg}
            summaryId={summaryId}
          />
        ))}
      </VStack>
    </VStack>
  )
}

type PartSummaryProps = Omit<PartsSummaryProps<PartSpec>, 'parts'> & {
  partType: PartTypeId
  Svg: FunctionComponent<PartSvgProps<PartSpec>>
  quota: PartSummaryQuota<PartSpec>
  summaryId: string
}

function PartSummary(props: PartSummaryProps) {
  const { partType, Svg, quota, summaryId } = props
  const { part } = quota

  const { displayUnit } = useSummaryContext()

  const partModule = getPartModule(partType)
  const hasExportDxf = Boolean(partModule.methods.exportDxf)
  const exportDxfToFile = useCallback(() => {
    ;(async () => {
      if (partModule.methods.exportDxf == null) {
        throw new Error(`Unable to export dxf for part type ${partType}`)
      }
      const dxf = await partModule.methods.exportDxf(part)
      const content = dxf.stringify()
      // @ts-ignore
      const filename = `${pascalCase(summaryId)}_${part.id()}.dxf`
      const mimeType = 'application/dxf'
      downloadFile(content, filename, mimeType)
    })()
  }, [partType, partModule, part, summaryId])

  return (
    <HStack role="listitem" alignItems="center" spacing="4" sx={{ width: '100%' }}>
      {quota.type === 'grouped' && <PartCount count={quota.count} />}

      <Svg displayUnit={displayUnit} part={part} />
      {hasExportDxf && (
        <Button variant="secondary" onClick={exportDxfToFile} aria-label="Export .dxf" size="xs">
          .dxf
        </Button>
      )}
    </HStack>
  )
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const link = document.createElement('a')
  link.setAttribute('href', URL.createObjectURL(blob))
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

function partsToPartQuotas<Spec extends BasePartSpec<any>>(
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

const pascalCase = (str: string) => upperFirst(camelCase(str))
