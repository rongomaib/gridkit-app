import type { PartSvgProps } from '@villagekit/part'
import type { RoofPanelSpec } from './creator'

export function PartSvg({ part }: PartSvgProps<RoofPanelSpec>) {
  const wMm = part.widthInGrids * 40
  const lMm = Math.round(part.lengthInGrids * 40)
  return (
    <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
      {wMm}×{lMm}mm roof panel ({part.pitchDeg}°)
    </span>
  )
}
