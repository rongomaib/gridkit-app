import type { PartSvgProps } from '@villagekit/part'
import type { GablePanelSpec } from './creator'

export function PartSvg({ part }: PartSvgProps<GablePanelSpec>) {
  const bMm = part.baseInGrids * 40
  const hMm = part.heightInGrids * 40
  return (
    <span style={{ fontSize: '12px', color: '#555', fontFamily: 'monospace' }}>
      {bMm}×{hMm}mm gable (▷)
    </span>
  )
}
