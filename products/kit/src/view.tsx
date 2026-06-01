import { PartsGlForAll } from '@villagekit/part'
import { type ProductViewProps, useProductMeta } from '@villagekit/product'
import { Sandbox } from '@villagekit/sandbox'
import { Box, Flex, Spinner } from '@villagekit/ui'
import { Suspense, useEffect, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useProductKitContext } from './context'
import { ProductKitInfo } from './info'

export function ProductKitView(props: ProductViewProps) {
  const { ...sandboxProps } = props

  const meta = useProductMeta()

  const { boundingBox, partValues: partGlValues, selectedPartId, setSelectedPartId } = useProductKitContext()

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
          {/* Clear selection when clicking the background */}
          <group onPointerMissed={() => setSelectedPartId(null)}>
            <PartsGlForAll 
              partGlValues={partGlValues} 
              onPartClick={(id) => {
                setSelectedPartId(id)
                const part = partGlValues.find((p) => p.id === id)
                window.dispatchEvent(new CustomEvent('inspect-part-in-code', {
                  detail: { id, type: part?.type }
                }))
              }} 
            />
          </group>
        </Sandbox>

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
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.05)',
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

import { TransformControls, Html } from '@react-three/drei'
import { Box3, Group } from 'three'

function SelectionHighlighter() {
  const { selectedPartId } = useProductKitContext()
  const { scene } = useThree()
  const [ghostGroup, setGhostGroup] = useState<any>(null)
  
  useEffect(() => {
    // Reset all emissive
    scene.traverse((child: any) => {
      if (child.isMesh && child.material && child.material.emissive) {
         if (child.userData.originalEmissive == null) {
           child.userData.originalEmissive = child.material.emissive.getHex()
         }
         child.material.emissive.setHex(child.userData.originalEmissive)
      }
    })
    
    if (!selectedPartId) {
      setGhostGroup(null)
      return
    }
    
    // Find selected container
    let selectedGroup: any = null
    scene.traverse((child: any) => {
      if (child.userData?.partId === selectedPartId) {
        selectedGroup = child
      }
    })
    
    if (selectedGroup) {
      // Highlight all meshes inside the selected group
      selectedGroup.traverse((child: any) => {
        if (child.isMesh && child.material && child.material.emissive) {
           if (!child.userData.materialCloned) {
             child.material = child.material.clone()
             child.userData.materialCloned = true
           }
           child.material.emissive.setHex(0x5555ff) // blueish highlight
        }
      })

      // Create ghost for manipulation
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

      // We don't add to scene manually; we use <primitive> below so React manages its lifecycle
      return () => {
        // Cleanup if necessary
      }
    }
  }, [selectedPartId, scene])
  
  return ghostGroup ? (
    <>
      <primitive object={ghostGroup}>
        <Html position={[0.2, 0, 0]} center style={{ color: '#ff4444', fontWeight: 'bold', fontSize: '14px', textShadow: '0 0 4px white', pointerEvents: 'none', userSelect: 'none' }}>X</Html>
        <Html position={[0, 0.2, 0]} center style={{ color: '#44ff44', fontWeight: 'bold', fontSize: '14px', textShadow: '0 0 4px white', pointerEvents: 'none', userSelect: 'none' }}>Y</Html>
        <Html position={[0, 0, 0.2]} center style={{ color: '#4444ff', fontWeight: 'bold', fontSize: '14px', textShadow: '0 0 4px white', pointerEvents: 'none', userSelect: 'none' }}>Z</Html>
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
            window.dispatchEvent(new CustomEvent('update-part-property', {
              detail: { id: selectedPartId, type: partType, property: 'x', value: gridX }
            }))
          }
          if (gridY !== 0) {
            window.dispatchEvent(new CustomEvent('update-part-property', {
              detail: { id: selectedPartId, type: partType, property: 'y', value: gridY }
            }))
          }
          if (gridZ !== 0) {
            window.dispatchEvent(new CustomEvent('update-part-property', {
              detail: { id: selectedPartId, type: partType, property: 'z', value: gridZ }
            }))
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
