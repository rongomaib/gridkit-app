import { PartCreator } from '@villagekit/part'

import { DesignParts, RecursiveArray } from './types'

export function getPartCreatorsFromDesignParts(parts: DesignParts): Array<PartCreator> {
  const results: Array<PartCreator> = []
  deepForEach(parts, (value, indices) => {
    if (value === false || value === undefined || value === null) {
      return
    }
    const id =
      value.id === undefined
        ? indices.join('__')
        : indices.length === 1
        ? value.id
        : `${indices.slice(0, -1).join('__')}__${value.id}`
    const result: PartCreator = { ...value, id }
    results.push(result)
  })
  return results
}

function deepForEach<T>(
  array: RecursiveArray<T>,
  fn: (value: T, indices: Array<number>) => void,
  indices: Array<number> = [],
): void {
  let index = 0

  while (index < array.length) {
    const value = array[index]
    if (value === undefined) throw new Error('unexpected: value is undefined')
    if (Array.isArray(value)) {
      deepForEach(value, fn, indices.concat(index))
    } else {
      fn(value, indices.concat(index))
    }
    index++
  }
}
