import { groupBy, map } from 'lodash-es'
import type React from 'react'
import { useMemo } from 'react'
import { type PartCreator, type PartGlValue, type PartTypeId, getPartModule } from './index'

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
      {map(
        partsByType,
        (partGlValuesForType: Array<PartGlValue>, partType: PartGlValue['type']) => {
          return (
            <PartsGlForType key={partType} partType={partType} partGlValues={partGlValuesForType} />
          )
        },
      )}
    </>
  )
}

export interface PartsGlForTypeProps {
  partType: PartTypeId
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
  parts: Array<PartCreator>
}

export function PartsSummaryForAll(props: PartsSummaryForAllProps): React.ReactElement {
  const { parts } = props

  const partsByType = useMemo(() => {
    return groupBy(parts, 'type')
  }, [parts])

  return (
    <>
      {map(partsByType, (partsForType: Array<PartCreator>, partType: PartCreator['type']) => {
        return <PartsSummaryForType key={partType} partType={partType} parts={partsForType} />
      })}
    </>
  )
}

export interface PartsSummaryForTypeProps {
  partType: PartTypeId
  parts: Array<PartCreator>
}

export function PartsSummaryForType(props: PartsSummaryForTypeProps): React.ReactElement {
  const { partType, parts } = props

  const partModule = getPartModule(partType)
  const PartsSummary = partModule.components.PartsSummary

  // @ts-ignore
  return <PartsSummary parts={parts} />
}
