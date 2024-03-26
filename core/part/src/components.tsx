import { groupBy, map } from 'lodash-es'
import type React from 'react'
import { useMemo } from 'react'
import { type PartGlValue, type PartState, type PartSummaryValue, getPartModule } from './index'

export interface PartsGlForAllProps {
  partGlValues: Array<PartGlValue>
}

export function PartsGlForAll(props: PartsGlForAllProps): React.ReactElement {
  const { partGlValues } = props

  const partsByType = useMemo(() => {
    return groupBy(partGlValues, 'type')
  }, [partGlValues])

  return (
    <>
      {map(partsByType, (partGlValuesForType, partType: PartGlValue['type']) => {
        return (
          <PartsGlForType key={partType} partType={partType} partGlValues={partGlValuesForType} />
        )
      })}
    </>
  )
}

export interface PartsGlForTypeProps {
  partType: PartState['type']
  partGlValues: Array<PartGlValue>
}

export function PartsGlForType(props: PartsGlForTypeProps): React.ReactElement {
  const { partType, partGlValues } = props

  const partModule = getPartModule(partType)
  const PartsGl = partModule.components.PartsGl

  // @ts-ignore
  return <PartsGl parts={partGlValues} />
}

export interface PartsSummaryForAllProps {
  partSummaryValues: Array<PartSummaryValue>
}

export function PartsSummaryForAll(props: PartsSummaryForAllProps): React.ReactElement {
  const { partSummaryValues } = props

  const partsByType = useMemo(() => {
    return groupBy(partSummaryValues, 'type')
  }, [partSummaryValues])

  return (
    <>
      {map(partsByType, (partSummaryValuesForType, partType: PartSummaryValue['type']) => {
        return (
          <PartsSummaryForType
            key={partType}
            partType={partType}
            partSummaryValues={partSummaryValuesForType}
          />
        )
      })}
    </>
  )
}

export interface PartsSummaryForTypeProps {
  partType: PartState['type']
  partSummaryValues: Array<PartSummaryValue>
}

export function PartsSummaryForType(props: PartsSummaryForTypeProps): React.ReactElement {
  const { partType, partSummaryValues } = props

  const partModule = getPartModule(partType)
  const PartsSummary = partModule.components.PartsSummary

  // @ts-ignore
  return <PartsSummary parts={partSummaryValues} />
}
