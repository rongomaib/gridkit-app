import type { PartSvgProps } from '@villagekit/part'
import type { Beam120Spec } from './creator'

export function PartSvg({ part }: PartSvgProps<Beam120Spec>) {
  const lengthMm = part.lengthInGrids * 40
  return (
    <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
      120×120 × {lengthMm}mm
    </span>
  )
}
