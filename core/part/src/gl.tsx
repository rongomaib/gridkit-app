import { groupBy, map } from 'lodash-es'
import type React from 'react'
import { useMemo } from 'react'
import { type PartGlValue, type PartTypeId, getPartModule } from './index'

export interface PartsGlForAllProps {
  partGlValues: Array<PartGlValue>
  onPartClick?: (id: string) => void
}

export function PartsGlForAll(props: PartsGlForAllProps): React.ReactElement {
  const { partGlValues, onPartClick } = props

  const partsByType = useMemo(() => {
    return groupBy(partGlValues, 'type')
  }, [partGlValues])

  return (
    <>
      {map(
        partsByType,
        (partGlValuesForType: Array<PartGlValue>, partType: PartGlValue['type']) => {
          return (
            <PartsGlForType key={partType} partType={partType} partGlValues={partGlValuesForType} onPartClick={onPartClick} />
          )
        },
      )}
    </>
  )
}

export interface PartsGlForTypeProps {
  partType: PartTypeId
  partGlValues: Array<PartGlValue>
  onPartClick?: (id: string) => void
}

export function PartsGlForType(props: PartsGlForTypeProps): React.ReactElement {
  const { partType, partGlValues, onPartClick } = props

  const partModule = getPartModule(partType)
  const PartsGl = partModule.components.PartsGl

  // @ts-ignore
  return <PartsGl parts={partGlValues} onPartClick={onPartClick} />
}
