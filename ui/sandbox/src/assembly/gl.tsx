import { useDesignContext } from '@villagekit/design'
import { PartsGlForAll } from '@villagekit/part'
import { useEffect } from 'react'
import { Box3 } from 'three'

interface AssemblyGlProps {
  setBoundingBox: (box: Box3) => void
}

export function AssemblyGl(props: AssemblyGlProps) {
  const { setBoundingBox } = props

  const { boundingBox, partValues: partGlValues } = useDesignContext()

  useEffect(() => {
    setBoundingBox(boundingBox)
  }, [setBoundingBox, boundingBox])

  return <PartsGlForAll partGlValues={partGlValues} />
}
