import { convert, inch, meter, millimeter } from './'

describe('convert', () => {
  test('meters to meters', () => {
    const input = { type: 'quantity', unit: meter, value: 1 } as const
    const expected = { type: 'quantity', unit: meter, value: 1 } as const
    expect(convert(input, meter)).toEqual(expected)
  })

  test('of millimeters', () => {
    const input = { type: 'quantity', unit: millimeter, value: 1 } as const
    const expected = { type: 'quantity', unit: meter, value: 0.001 } as const
    expect(convert(input, meter)).toEqual(expected)
  })

  test('of inches', () => {
    const input = { type: 'quantity', unit: inch, value: 1 } as const
    const expected = { type: 'quantity', unit: meter, value: 0.0254 } as const
    expect(convert(input, meter)).toEqual(expected)
  })
})
