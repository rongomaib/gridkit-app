import { PartsGlForAll } from '@villagekit/part'
import { useEffect } from 'react'
import type { Box3 } from 'three'
import { useSandboxAssemblyContext } from './context'

interface AssemblyGlProps {
  setBoundingBox: (box: Box3) => void
}

export function AssemblyGl(props: AssemblyGlProps) {
  const { setBoundingBox } = props

  const { boundingBox, partValues: partGlValues } = useSandboxAssemblyContext()

  useEffect(() => {
    setBoundingBox(boundingBox)
  }, [setBoundingBox, boundingBox])

  return <PartsGlForAll partGlValues={partGlValues} />
}
