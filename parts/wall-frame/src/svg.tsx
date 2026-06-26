import type { PartSvgProps } from '@villagekit/part'
import type { WallFrameSpec } from './creator'

export function PartSvg({ part }: PartSvgProps<WallFrameSpec>) {
  const wMm = part.widthInGrids * 40
  const hMm = part.heightInGrids * 40
  return (
    <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
      {wMm}×{hMm}mm wall frame
    </span>
  )
}
