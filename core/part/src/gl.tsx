import { groupBy, map } from 'lodash-es'
import type React from 'react'
import { useMemo } from 'react'
import { type PartGlValue, type PartTypeId, getPartModule } from './index'

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
