import type { PartSvgProps } from '@villagekit/part'
import type { RoofingIronSpec } from './creator'

export function PartSvg({ part }: PartSvgProps<RoofingIronSpec>) {
  const wMm = part.widthInGrids * 40
  const lMm = Math.round(part.slopedLengthGu * 40)
  return (
    <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
      {wMm}×{lMm}mm roofing iron ({part.pitchDeg}°)
    </span>
  )
}
