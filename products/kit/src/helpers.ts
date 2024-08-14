import type { PartCreator, WithRequiredId } from '@villagekit/part'
import { deserializeCreator, serializeCreator } from '@villagekit/part/creator'
import type { Parts, RecursiveArray } from './types'

export function serializeRecursiveParts(parts: Parts): Array<any> {
  return parts.map((part) => {
    if (part == null || typeof part === 'boolean') {
      return part
    }
    if (Array.isArray(part)) {
      return serializeRecursiveParts(part)
    }
    return serializeCreator(part)
  })
}

export function deserializeRecursiveParts(parts: Array<any>): Parts {
  return parts.map((part) => {
    if (part == null || typeof part === 'boolean') {
      return part
    }
    if (Array.isArray(part)) {
      return deserializeRecursiveParts(part)
    }
    return deserializeCreator(part)
  })
}

// TODO: Need to re-think where and how this happens.
export function getPartCreatorsFromKitParts(parts: Parts): Array<WithRequiredId<PartCreator>> {
  const results: Array<WithRequiredId<PartCreator>> = []
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

    // @ts-ignore
    const result: PartCreator = value.clone()
    result.id = id
    results.push(result as WithRequiredId<PartCreator>)
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
