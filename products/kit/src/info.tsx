import type { MemberResult } from '@villagekit/analysis'
import { getMaterialsByCategory, getPartMaterialEntry } from '@villagekit/materials'
import { usePricingContext } from '@villagekit/part'
import { HStack, InfoTooltip, Text, VStack } from '@villagekit/ui'
import { convert, meter, millimeter } from '@villagekit/units'
import type React from 'react'
import { Fragment, useMemo } from 'react'
import { Vector3 } from 'three'
import { useProductKitContext } from './context'

interface ProductKitInfoProps {
  containerRef?: React.RefObject<HTMLElement | null>
}

const PART_LABELS: Record<string, string> = {
  fastener: 'Bolts',
  gridbeam: 'Beam Units',
  gridpanel: 'Panel Units',
}

function formatPartId(id: string) {
  const parts = id.split('__')
  if (parts.length === 2) {
    const name = parts[1]!
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
    return `${name} (${parts[0]})`
  }
  return id
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function ProductKitInfo(_props: ProductKitInfoProps) {
  const { boundingBox, parts } = useProductKitContext()
  const { prices } = usePricingContext()

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

  // Count parts by type
  const partCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const part of parts) {
      const type = part.spec.type as string
      counts[type] = (counts[type] ?? 0) + 1
    }
    return counts
  }, [parts])

  // Calculate line items and total
  const priceBreakdown = useMemo(() => {
    return Object.entries(partCounts)
      .map(([type, count]) => {
        const unitPrice = prices[type] ?? 0
        return { type, count, unitPrice, subtotal: count * unitPrice }
      })
      .filter(({ unitPrice }) => unitPrice > 0)
  }, [partCounts, prices])

  const totalCost = useMemo(
    () => priceBreakdown.reduce((sum, { subtotal }) => sum + subtotal, 0),
    [priceBreakdown],
  )

  const hasPrices = Object.values(prices).some((p) => (p ?? 0) > 0)

  const defaultInfo = (
    <VStack
      as="section"
      aria-label="Design information"
      gap="6"
      css={{ width: '100%', padding: 4 }}
    >
      {/* Assembled Dimensions */}
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

      {/* Price Quote */}
      <VStack as="section" aria-label="Price quote" alignItems="flex-start" css={{ width: '100%' }}>
        <HStack alignItems="center" gap="2">
          <Text css={{ fontWeight: 'bold' }}>Price Quote</Text>
          <InfoTooltip
            label={
              <Text css={{ color: 'white' }}>
                Prices are set in the Pricing Admin panel in the sidebar.
              </Text>
            }
            pointerTimeout={3000}
          />
        </HStack>

        {!hasPrices ? (
          <Text css={{ fontStyle: 'italic', color: 'gray.500' }}>
            No prices configured. Set prices in the Pricing Admin panel.
          </Text>
        ) : (
          <VStack css={{ width: '100%' }} gap="1">
            {/* Part counts */}
            {Object.entries(partCounts).map(([type, count]) => {
              const unitPrice = prices[type] ?? 0
              const label = PART_LABELS[type] ?? type
              return (
                <HStack key={type} css={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text css={{ color: 'gray.600' }}>
                    {label} × {count}
                  </Text>
                  {unitPrice > 0 ? (
                    <Text>${(count * unitPrice).toFixed(2)}</Text>
                  ) : (
                    <Text css={{ fontStyle: 'italic', color: 'gray.400' }}>no price set</Text>
                  )}
                </HStack>
              )
            })}

            {/* Divider */}
            <HStack
              css={{
                borderTop: '1px solid',
                borderColor: 'gray.200',
                paddingTop: 2,
                marginTop: 1,
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <Text css={{ fontWeight: 'bold' }}>Total</Text>
              <Text css={{ fontWeight: 'bold' }}>${totalCost.toFixed(2)}</Text>
            </HStack>
          </VStack>
        )}
      </VStack>
    </VStack>
  )

  const { selectedPartId, partValues, setSelectedPartId, solverResult } = useProductKitContext()
  const selectedPart = selectedPartId != null ? parts.find((p) => p.id === selectedPartId) : null
  const selectedPartGlValue =
    selectedPartId != null ? partValues.find((p: any) => p.id === selectedPartId) : null

  // Find member result for selected structural part
  const selectedMemberResult = useMemo<MemberResult | null>(() => {
    if (selectedPartId == null || !solverResult?.ok) return null
    const lcr = solverResult.loadCaseResults[0]
    if (lcr == null) return null
    return lcr.memberResults.find((r) => r.partId === selectedPartId) ?? null
  }, [selectedPartId, solverResult])

  if (selectedPart != null && selectedPartGlValue != null) {
    const partType = (selectedPart as any).spec.type as string
    const partId = selectedPart.id

    const GRID_MM = 40

    const dispatchUpdate = (
      property: string,
      value: number,
      mode: 'start' | 'end' | 'shift' = 'shift',
    ) => {
      window.dispatchEvent(
        new CustomEvent('update-part-property', {
          detail: { id: partId, type: partType, property, value, mode },
        }),
      )
    }

    const dispatchSetProperty = (property: string, value: string) => {
      window.dispatchEvent(
        new CustomEvent('set-part-property', {
          detail: { id: partId, type: partType, property, value },
        }),
      )
    }

    return (
      <VStack as="section" aria-label="Part Inspector" gap="4" css={{ width: '100%', padding: 4 }}>
        <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
          <Text css={{ fontWeight: 'bold', fontSize: 'lg' }}>Inspector</Text>
          <button
            type="button"
            onClick={() => setSelectedPartId(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
          >
            ×
          </button>
        </HStack>

        <VStack gap="2" css={{ width: '100%' }}>
          <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
            <Text css={{ color: 'gray.600' }}>ID</Text>
            <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>{formatPartId(partId)}</Text>
          </HStack>
          <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
            <Text css={{ color: 'gray.600' }}>Type</Text>
            <Text>{PART_LABELS[partType] ?? partType}</Text>
          </HStack>

          {partType === 'gridbeam' &&
            (() => {
              const grids = (selectedPartGlValue as any).lengthInGrids as number
              return (
                <>
                  <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text css={{ color: 'gray.600' }}>Length</Text>
                    <Text>{grids} grids</Text>
                  </HStack>
                  <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text css={{ color: 'gray.600' }}>Dimensions</Text>
                    <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                      40 × 40 × {grids * GRID_MM} mm
                    </Text>
                  </HStack>
                </>
              )
            })()}

          {partType === 'gridpanel' &&
            (() => {
              const [wg, hg] = (selectedPartGlValue as any).sizeInGrids as [number, number]
              return (
                <>
                  <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text css={{ color: 'gray.600' }}>Size</Text>
                    <Text>
                      {wg} × {hg} grids
                    </Text>
                  </HStack>
                  <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text css={{ color: 'gray.600' }}>Dimensions</Text>
                    <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                      {wg * GRID_MM} × {hg * GRID_MM} mm
                    </Text>
                  </HStack>
                </>
              )
            })()}

          {partType === 'timber' &&
            (() => {
              const lenMm = ((selectedPart as any).spec.lengthInGrids as number) * GRID_MM
              return (
                <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text css={{ color: 'gray.600' }}>Dimensions</Text>
                  <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>120 × 120 × {lenMm} mm</Text>
                </HStack>
              )
            })()}

          {partType === 'beam120' &&
            (() => {
              const lenMm = ((selectedPart as any).spec.lengthInGrids as number) * GRID_MM
              return (
                <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text css={{ color: 'gray.600' }}>Dimensions</Text>
                  <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>120 × 120 × {lenMm} mm</Text>
                </HStack>
              )
            })()}

          {partType === 'wall-frame' &&
            (() => {
              const wMm = ((selectedPart as any).spec.widthInGrids as number) * GRID_MM
              const hMm = ((selectedPart as any).spec.heightInGrids as number) * GRID_MM
              return (
                <>
                  <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text css={{ color: 'gray.600' }}>Width</Text>
                    <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>{wMm} mm</Text>
                  </HStack>
                  <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                    <Text css={{ color: 'gray.600' }}>Height</Text>
                    <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>{hMm} mm</Text>
                  </HStack>
                </>
              )
            })()}

          {partType === 'timber' && selectedMemberResult != null && (
            <>
              <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                <Text css={{ color: 'gray.600' }}>Axial (peak)</Text>
                <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                  {Math.round(
                    Math.max(
                      Math.abs(selectedMemberResult.forces.fx_start),
                      Math.abs(selectedMemberResult.forces.fx_end),
                    ) / 9.81,
                  )}{' '}
                  kg
                </Text>
              </HStack>
              <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                <Text css={{ color: 'gray.600' }}>Shear (peak)</Text>
                <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                  {Math.round(
                    Math.max(
                      Math.abs(selectedMemberResult.forces.fy_start),
                      Math.abs(selectedMemberResult.forces.fy_end),
                      Math.abs(selectedMemberResult.forces.fz_start),
                      Math.abs(selectedMemberResult.forces.fz_end),
                    ) / 9.81,
                  )}{' '}
                  kg
                </Text>
              </HStack>
            </>
          )}

          {partType === 'panel-brace' &&
            (() => {
              const spanMm = ((selectedPart as any).spec.lengthInGrids as number) * GRID_MM
              const hMm = ((selectedPart as any).spec.heightInGrids as number) * GRID_MM
              const dMm = ((selectedPart as any).spec.depthInGrids as number) * GRID_MM
              return (
                <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text css={{ color: 'gray.600' }}>Dimensions</Text>
                  <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                    {spanMm} × {hMm} × {dMm} mm
                  </Text>
                </HStack>
              )
            })()}

          {partType === 'panel-brace' && selectedMemberResult != null && (
            <>
              <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                <Text css={{ color: 'gray.600' }}>Bending (peak)</Text>
                <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                  {Math.round(
                    Math.max(
                      Math.abs(selectedMemberResult.forces.mz_start),
                      Math.abs(selectedMemberResult.forces.mz_end),
                    ) / 9.81,
                  )}{' '}
                  kg·m
                </Text>
              </HStack>
              <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                <Text css={{ color: 'gray.600' }}>Shear (peak)</Text>
                <Text css={{ fontFamily: 'mono', fontSize: 'sm' }}>
                  {Math.round(
                    Math.max(
                      Math.abs(selectedMemberResult.forces.fy_start),
                      Math.abs(selectedMemberResult.forces.fy_end),
                    ) / 9.81,
                  )}{' '}
                  kg
                </Text>
              </HStack>
            </>
          )}

          {(() => {
            const entry = getPartMaterialEntry(partType)
            if (entry == null) return null
            const options = getMaterialsByCategory(entry.category)
            const currentId = (selectedPart as any).spec.materialId ?? entry.defaultId
            return (
              <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                <Text css={{ color: 'gray.600' }}>Grade</Text>
                <select
                  value={currentId}
                  onChange={(e) => dispatchSetProperty('materialId', e.target.value)}
                  style={{ fontSize: '13px', padding: '2px 4px' }}
                >
                  {options.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </HStack>
            )
          })()}

          {partType === 'wall-frame' && (
            <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
              <Text css={{ color: 'gray.600' }}>Wall module</Text>
              <select
                value={(selectedPart as any).spec.moduleType ?? 'solid'}
                onChange={(e) => dispatchSetProperty('moduleType', e.target.value)}
                style={{ fontSize: '13px', padding: '2px 4px' }}
              >
                <option value="solid">Solid panel</option>
                <option value="window">Window</option>
                <option value="door">Door</option>
                <option value="open">Open / void</option>
              </select>
            </HStack>
          )}

          {(partType === 'timber' || partType === 'panel-brace') &&
            selectedMemberResult == null && (
              <HStack css={{ justifyContent: 'space-between', width: '100%' }}>
                <Text css={{ color: 'gray.500', fontStyle: 'italic', fontSize: 'sm' }}>
                  {solverResult == null ? 'Analysing…' : 'No force data'}
                </Text>
              </HStack>
            )}
        </VStack>

        <VStack gap="2" css={{ width: '100%', marginTop: '8px' }}>
          <Text css={{ fontWeight: 'bold' }}>Translate (Grid Units)</Text>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '20px 1fr 1fr 1fr',
              columnGap: '24px',
              rowGap: '8px',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <div />
            <Text css={{ fontSize: 'xs', color: 'gray.500', textAlign: 'center' }}>Start</Text>
            <Text css={{ fontSize: 'xs', color: 'gray.500', textAlign: 'center' }}>End</Text>
            <Text css={{ fontSize: 'xs', color: 'gray.500', textAlign: 'center' }}>Shift</Text>

            {['x', 'y', 'z'].map((axis) => {
              const specVal = (selectedPart as any).spec[axis]
              let startVal: React.ReactNode = ''
              let endVal: React.ReactNode = ''
              let shiftVal: React.ReactNode = ''

              if (Array.isArray(specVal)) {
                startVal = specVal[0]
                endVal = specVal[1]
              } else if (typeof specVal === 'number') {
                shiftVal = specVal
              }

              const renderControl = (val: React.ReactNode, mode: 'start' | 'end' | 'shift') => (
                <HStack gap="1" css={{ justifyContent: 'center' }}>
                  <button
                    type="button"
                    style={btnStyleSmall}
                    onClick={() => dispatchUpdate(axis, -1, mode)}
                  >
                    -
                  </button>
                  {val !== '' && (
                    <Text css={{ fontSize: 'sm', width: '24px', textAlign: 'center' }}>{val}</Text>
                  )}
                  <button
                    type="button"
                    style={btnStyleSmall}
                    onClick={() => dispatchUpdate(axis, 1, mode)}
                  >
                    +
                  </button>
                </HStack>
              )

              return (
                <Fragment key={axis}>
                  <Text css={{ color: 'gray.600', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {axis}
                  </Text>
                  {renderControl(startVal, 'start')}
                  {renderControl(endVal, 'end')}
                  {renderControl(shiftVal, 'shift')}
                </Fragment>
              )
            })}
          </div>
        </VStack>
      </VStack>
    )
  }

  return defaultInfo
}

const btnStyleSmall = {
  padding: '2px 6px',
  backgroundColor: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  fontSize: '12px',
}
