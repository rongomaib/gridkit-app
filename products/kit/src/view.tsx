import { useThree } from '@react-three/fiber'
import { PartsGlForAll } from '@villagekit/part'
import { type ProductViewProps, useProductMeta } from '@villagekit/product'
import { Sandbox } from '@villagekit/sandbox'
import { Box, Flex, Spinner } from '@villagekit/ui'
import { Suspense, useEffect, useRef, useState } from 'react'
import { AnalysisOverlay, type VisualizationMode } from './analysis-overlay'
import { useProductKitContext } from './context'
import { ProductKitInfo } from './info'

export function ProductKitView(props: ProductViewProps) {
  const { ...sandboxProps } = props

  const meta = useProductMeta()

  const {
    boundingBox,
    partValues: partGlValues,
    selectedPartId,
    setSelectedPartId,
    selectedPartIds,
    setSelectedPartIds,
    isAnalysing,
  } = useProductKitContext()

  const [activeModes, setActiveModes] = useState<Set<VisualizationMode>>(new Set(['heat']))
  const [deflectionScale, setDeflectionScale] = useState(100)

  // Track Shift key for multi-select without causing re-renders
  const shiftHeld = useRef(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = true
    }
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') shiftHeld.current = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  function toggleMode(mode: VisualizationMode) {
    const next = new Set(activeModes)
    if (next.has(mode)) next.delete(mode)
    else next.add(mode)
    setActiveModes(next)
  }

  function handlePartClick(id: string) {
    if (shiftHeld.current) {
      const next = new Set(selectedPartIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      setSelectedPartIds(next)
    } else {
      setSelectedPartId(id)
    }
  }

  return (
    <Suspense fallback={<Loading />}>
      <Box css={{ position: 'relative', width: '100%', height: '100%' }}>
        <Sandbox
          {...sandboxProps}
          label={meta.label}
          boundingBox={boundingBox}
          InfoComponent={ProductKitInfo}
        >
          <SelectionHighlighter />
          <AnalysisOverlay activeModes={activeModes} deflectionScale={deflectionScale} />
          {/* Clear selection when clicking the background */}
          <group onPointerMissed={() => setSelectedPartIds(new Set())}>
            <PartsGlForAll
              partGlValues={partGlValues}
              onPartClick={(id) => {
                handlePartClick(id)
                const part = partGlValues.find((p) => 'id' in p && p.id === id)
                window.dispatchEvent(
                  new CustomEvent('inspect-part-in-code', {
                    detail: { id, type: part?.type },
                  }),
                )
              }}
            />
          </group>
        </Sandbox>

        {/* Engineering disclaimer banner (Phase 7 - required per CLAUDE.md) */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 10,
            background: 'rgba(255,237,213,0.95)',
            border: '1px solid #f97316',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '10px',
            color: '#92400e',
            fontWeight: 600,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          DESIGN-ITERATION AID ONLY - not a consented structural design. Final sign-off requires a
          chartered structural engineer and PS1 (NZ Building Act).
        </div>

        {/* Analysis controls bar */}
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            padding: '6px 12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
            border: '1px solid rgba(226,232,240,0.7)',
          }}
        >
          {isAnalysing && (
            <span style={{ fontSize: '11px', color: '#888', marginRight: '4px' }}>analysing…</span>
          )}
          {(['heat', 'joints', 'ground'] as VisualizationMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => toggleMode(mode)}
              style={{
                padding: '3px 10px',
                borderRadius: '16px',
                border: '1px solid',
                borderColor: activeModes.has(mode) ? '#2d3748' : '#cbd5e0',
                cursor: 'pointer',
                backgroundColor: activeModes.has(mode) ? '#2d3748' : 'transparent',
                color: activeModes.has(mode) ? 'white' : '#4a5568',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              {mode}
            </button>
          ))}
          <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>δ×</span>
          <input
            type="range"
            min={1}
            max={500}
            value={deflectionScale}
            onChange={(e) => setDeflectionScale(Number(e.target.value))}
            style={{ width: '72px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '11px', color: '#666', minWidth: '24px' }}>
            {deflectionScale}
          </span>
          <span
            title="Design-iteration aid only — not a consented structural design. Engage a chartered engineer for PS1 sign-off."
            style={{ fontSize: '13px', cursor: 'help', marginLeft: '4px', color: '#e07000' }}
          >
            ⚠
          </span>
        </div>

        {/* Floating Part Inspector Overlay */}
        {selectedPartId && (
          <Box
            className="part-inspector-overlay"
            css={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              width: '320px',
              backgroundColor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid',
              borderColor: 'rgba(226, 232, 240, 0.8)',
              borderRadius: '16px',
              boxShadow:
                '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
              padding: '16px',
              zIndex: 10,
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes slideUp': {
                '0%': { transform: 'translateY(10px)', opacity: 0 },
                '100%': { transform: 'translateY(0)', opacity: 1 },
              },
            }}
          >
            <ProductKitInfo />
          </Box>
        )}
      </Box>
    </Suspense>
  )
}

import { Html, TransformControls as TransformControlsDrei } from '@react-three/drei'

// drei v10 removed onDraggingChanged from its type definition; cast to preserve runtime behaviour
const TransformControls = TransformControlsDrei as any
import { Box3, Group } from 'three'

function SelectionHighlighter() {
  const { selectedPartIds, selectedPartId } = useProductKitContext()
  const { scene } = useThree()
  const [ghostGroup, setGhostGroup] = useState<any>(null)

  useEffect(() => {
    // Reset all emissive highlights
    scene.traverse((child: any) => {
      if (child.isMesh && child.material && child.material.emissive) {
        if (child.userData.originalEmissive == null) {
          child.userData.originalEmissive = child.material.emissive.getHex()
        }
        child.material.emissive.setHex(child.userData.originalEmissive)
      }
    })

    if (selectedPartIds.size === 0) {
      setGhostGroup(null)
      return
    }

    // Highlight ALL selected parts
    const selectedGroups: any[] = []
    scene.traverse((child: any) => {
      if (child.userData?.partId != null && selectedPartIds.has(child.userData.partId)) {
        selectedGroups.push(child)
      }
    })

    for (const group of selectedGroups) {
      group.traverse((child: any) => {
        if (child.isMesh && child.material && child.material.emissive) {
          if (!child.userData.materialCloned) {
            child.material = child.material.clone()
            child.userData.materialCloned = true
          }
          child.material.emissive.setHex(0x5555ff)
        }
      })
    }

    // TransformControls ghost only when exactly one part is selected
    if (selectedPartIds.size === 1 && selectedGroups.length === 1) {
      const selectedGroup = selectedGroups[0]
      const box = new Box3().setFromObject(selectedGroup)
      const min = box.isEmpty() ? selectedGroup.position.clone() : box.min.clone()

      const ghost = new Group()
      ghost.position.copy(min)

      const originalClone = selectedGroup.clone()
      originalClone.position.sub(min)

      originalClone.traverse((child: any) => {
        if (child.isMesh && child.material) {
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = 0.4
          child.material.wireframe = true
        }
      })

      ghost.add(originalClone)
      setGhostGroup(ghost)
    } else {
      setGhostGroup(null)
    }
  }, [selectedPartIds, scene])

  return ghostGroup ? (
    <>
      <primitive object={ghostGroup}>
        <Html
          position={[0.2, 0, 0]}
          center
          style={{
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '0 0 4px white',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          X
        </Html>
        <Html
          position={[0, 0.2, 0]}
          center
          style={{
            color: '#44ff44',
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '0 0 4px white',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Y
        </Html>
        <Html
          position={[0, 0, 0.2]}
          center
          style={{
            color: '#4444ff',
            fontWeight: 'bold',
            fontSize: '14px',
            textShadow: '0 0 4px white',
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          Z
        </Html>
      </primitive>
      <TransformControls
        object={ghostGroup}
        mode="translate"
        translationSnap={0.04}
        onDraggingChanged={(e: any) => {
          window.dispatchEvent(new CustomEvent('transform-dragging', { detail: e.value }))

          if (!e.value) {
            // Drag just ended
            let originalGroup: any = null
            scene.traverse((child: any) => {
              if (child.userData?.partId === selectedPartId) {
                originalGroup = child
              }
            })
            if (!originalGroup) {
              console.warn('DragEnd: Could not find original group for part', selectedPartId)
              return
            }

            const box = new Box3().setFromObject(originalGroup)
            const min = box.isEmpty() ? originalGroup.position.clone() : box.min.clone()

            const dx = ghostGroup.position.x - min.x
            const dy = ghostGroup.position.y - min.y
            const dz = ghostGroup.position.z - min.z

            const gridX = Math.round(dx / 0.04)
            const gridY = Math.round(dy / 0.04)
            const gridZ = Math.round(dz / 0.04)

            console.log('DragEnd Debug:', { dx, dy, dz, gridX, gridY, gridZ })

            const partType = originalGroup.userData.partType

            if (gridX !== 0) {
              window.dispatchEvent(
                new CustomEvent('update-part-property', {
                  detail: { id: selectedPartId, type: partType, property: 'x', value: gridX },
                }),
              )
            }
            if (gridY !== 0) {
              window.dispatchEvent(
                new CustomEvent('update-part-property', {
                  detail: { id: selectedPartId, type: partType, property: 'y', value: gridY },
                }),
              )
            }
            if (gridZ !== 0) {
              window.dispatchEvent(
                new CustomEvent('update-part-property', {
                  detail: { id: selectedPartId, type: partType, property: 'z', value: gridZ },
                }),
              )
            }

            // Snap ghost group back
            ghostGroup.position.copy(min)
          }
        }}
      />
    </>
  ) : null
}

function Loading() {
  return (
    <Flex alignItems="center" justifyContent="center">
      <Spinner size="xl" />
    </Flex>
  )
}
