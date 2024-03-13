export function getEveryHolePosition(sizeInGrids: [number, number]): Array<[number, number]> {
  const [mainLength, crossLength] = sizeInGrids

  const positions: Array<[number, number]> = new Array(mainLength * crossLength)

  let holeIndex = 0
  for (let mainIndex = 0; mainIndex < mainLength; mainIndex++) {
    for (let crossIndex = 0; crossIndex < crossLength; crossIndex++) {
      positions[holeIndex++] = [mainIndex, crossIndex]
    }
  }

  return positions
}
