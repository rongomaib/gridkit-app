import { HStack, InfoTooltip, Text, VStack } from '@villagekit/ui'
import { convert, meter, millimeter } from '@villagekit/units'
import type React from 'react'
import { useMemo } from 'react'
import { Vector3 } from 'three'
import { useProductKitContext } from './context'

interface ProductKitInfoProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

export function ProductKitInfo(_props: ProductKitInfoProps) {
  const { boundingBox } = useProductKitContext()

  const dimensionsInMillimeters = useMemo(
    () =>
      boundingBox
        .getSize(new Vector3())
        .toArray()
        .map(
          (value) =>
            ({
              type: 'quantity',
              unit: meter,
              value,
            }) as const,
        )
        .map((dimensionInMeters) => Math.floor(convert(dimensionInMeters, millimeter).value)),
    [boundingBox],
  )

  return (
    <HStack
      as="section"
      aria-label="Design information"
      justifyContent="center"
      gap="8"
      css={{ width: '100%' }}
    >
      <HStack as="section" aria-label="Assembled dimensions" alignItems="flex-start">
        <VStack css={{ textAlign: 'center' }}>
          <Text>Assembled Dimensions</Text>

          <Text css={{ fontStyle: 'italic' }}>
            {dimensionsInMillimeters[0]} x {dimensionsInMillimeters[1]} x{' '}
            {dimensionsInMillimeters[2]}mm
          </Text>
        </VStack>

        <InfoTooltip
          label={
            <VStack alignItems="flex-start">
              <Text css={{ color: 'white', fontStyle: 'italic' }}>Width x Depth x Height</Text>
              <Text css={{ color: 'white' }}>
                Dimensions are automatically caclulated based on the selected preset and
                customisations.
              </Text>
            </VStack>
          }
          pointerTimeout={3000}
        />
      </HStack>
    </HStack>
  )
}
