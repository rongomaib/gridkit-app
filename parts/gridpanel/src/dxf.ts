import { Colors, type DxfDocument, DxfWriter, Units, point3d } from '@tarikjabiri/dxf'

import { convert, millimeter } from '@villagekit/units'
import { range } from 'lodash-es'
import type { GridPanelSpec } from './creator'
import { gridPanelVariants } from './variants'

export function exportDxf(spec: GridPanelSpec): DxfDocument {
  const { sizeInGrids, variantId } = spec
  const variant = gridPanelVariants[variantId]!

  const gridLengthInMm = convert(variant.gridLength, millimeter).value
  const holeDiameterInMm = convert(variant.holeDiameter, millimeter).value
  const thicknessInMm = convert(variant.thickness, millimeter).value
  const profileCutterDiameterInMm = convert(variant.profileCutterDiameter, millimeter).value
  const cornerRadiusInMm = convert(variant.cornerRadius, millimeter).value

  const dxf = new DxfWriter()

  dxf.setUnits(Units.Millimeters)
  const profileLayer = dxf.addLayer(
    `ProfileOut_${profileCutterDiameterInMm}mmCompression_${thicknessInMm}mmDepth`,
    Colors.Blue,
    'Continuous',
  )
  const drillLayer = dxf.addLayer(
    `Drill_${holeDiameterInMm}mm_${thicknessInMm + 1}mmDepth`,
    Colors.Green,
    'Continuous',
  )

  dxf.setCurrentLayerName(profileLayer.name)
  createRoundedSquare({
    start: [0, 0],
    size: [sizeInGrids[0] * gridLengthInMm, sizeInGrids[1] * gridLengthInMm],
    radius: cornerRadiusInMm,
    dxf,
  })

  dxf.setCurrentLayerName(drillLayer.name)
  for (const x of range(sizeInGrids[0])) {
    for (const y of range(sizeInGrids[1])) {
      dxf.addCircle(
        point3d((1 / 2 + x) * gridLengthInMm, (1 / 2 + y) * gridLengthInMm),
        (1 / 2) * holeDiameterInMm,
      )
    }
  }

  return dxf.document
}

interface RoundedSquareOptions {
  start?: [number, number]
  size: [number, number]
  radius: number
  dxf: DxfWriter
}

function createRoundedSquare(options: RoundedSquareOptions) {
  const { start = [0, 0], size, radius, dxf } = options

  const bottomLeftCorner = point3d(start[0], start[1])
  const bottomRightCorner = point3d(start[0] + size[0], start[1])
  const topRightCorner = point3d(start[0] + size[0], start[1] + size[1])
  const topLeftCorner = point3d(start[0], start[1] + size[1])

  // bottom line
  dxf.addLine(
    point3d(bottomLeftCorner.x + radius, bottomLeftCorner.y),
    point3d(bottomRightCorner.x - radius, bottomRightCorner.y),
  )

  // bottom right arc
  dxf.addArc(point3d(bottomRightCorner.x - radius, bottomRightCorner.y + radius), radius, 270, 360)

  // right line
  dxf.addLine(
    point3d(bottomRightCorner.x, bottomRightCorner.y + radius),
    point3d(topRightCorner.x, topRightCorner.y - radius),
  )

  // top right arc
  dxf.addArc(point3d(topRightCorner.x - radius, topRightCorner.y - radius), radius, 0, 90)

  // bottom line
  dxf.addLine(
    point3d(topRightCorner.x - radius, topRightCorner.y),
    point3d(topLeftCorner.x + radius, topLeftCorner.y),
  )

  // top left arc
  dxf.addArc(point3d(topLeftCorner.x + radius, topLeftCorner.y - radius), radius, 90, 180)

  // left line
  dxf.addLine(
    point3d(topLeftCorner.x, topLeftCorner.y - radius),
    point3d(bottomLeftCorner.x, bottomLeftCorner.y + radius),
  )

  // bottom left arc
  dxf.addArc(point3d(bottomLeftCorner.x + radius, bottomLeftCorner.y + radius), radius, 180, 270)
}
