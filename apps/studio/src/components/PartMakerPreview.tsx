import type { PartMakerSpec } from '@/lib/partMakerTypes'
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Suspense, useEffect, useMemo, useState } from 'react'
import { GridHelper } from 'three'
import { useColorMode } from '@/context/colorMode'
import { PartMakerSvg } from './PartMakerSvg'

interface PartMakerPreviewProps {
  spec: PartMakerSpec
  onFeatureClick?: (file: string) => void
}

function CustomGroupGeometry({ spec, onFeatureClick }: { spec: PartMakerSpec; onFeatureClick?: (file: string) => void }) {
  const group = useMemo(() => {
    if (!spec.customShapeCode.trim()) return null
    try {
      const paramNames = spec.customParams.map((p) => p.name)
      const paramValues = spec.customParams.map((p) => p.value)
      const fn = new Function(
        'THREE', 'mm',
        'widthMm', 'heightMm', 'thicknessMm',
        ...paramNames,
        spec.customShapeCode,
      )
      return fn(
        THREE, 1 / 1000,
        spec.widthMm, spec.heightMm, spec.thicknessMm,
        ...paramValues,
      ) as THREE.Group
    } catch (err) {
      console.error('[PartMaker] customShapeCode error:', err)
      return null
    }
  }, [spec])

  if (!group) return null

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Three.js canvas object
    <primitive
      object={group}
      onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); onFeatureClick?.('src/gl.tsx') }}
    />
  )
}


function SceneGrid() {
  const grid = useMemo(() => {
    const g = new GridHelper(2, 20, '#888888', '#444444')
    g.rotateX(Math.PI / 2)
    return g
  }, [])
  return <primitive object={grid} />
}

function CameraUp() {
  const { camera } = useThree()
  useEffect(() => {
    camera.up.set(0, 0, 1)
  }, [camera])
  return null
}

function Scene({ spec, onFeatureClick }: { spec: PartMakerSpec; onFeatureClick?: (file: string) => void }) {
  return (
    <>
      <CameraUp />
      <OrbitControls enableDamping />
      <ambientLight intensity={2.5} />
      <directionalLight position={[5, 5, 10]} intensity={0.4} />
      <CustomGroupGeometry spec={spec} onFeatureClick={onFeatureClick} />
      <SceneGrid />
      <GizmoHelper alignment="bottom-right" margin={[72, 72]}>
        <GizmoViewport
          axisColors={['#e74c3c', '#2ecc71', '#3498db']}
          labelColor="white"
        />
      </GizmoHelper>
    </>
  )
}

export function PartMakerPreview({ spec, onFeatureClick }: PartMakerPreviewProps) {
  const { isDark } = useColorMode()
  const [view, setView] = useState<'3d' | '2d'>('3d')

  const borderColor = isDark ? '#334155' : '#e2e8f0'
  const headerBg = isDark ? '#1e293b' : '#f8fafc'
  const activeTab: React.CSSProperties = {
    padding: '3px 12px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: isDark ? '#3b82f6' : '#2563eb',
    color: '#ffffff',
  }
  const inactiveTab: React.CSSProperties = {
    padding: '3px 12px',
    fontSize: '12px',
    fontWeight: 500,
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: isDark ? '#94a3b8' : '#64748b',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '5px 8px',
          borderBottom: `1px solid ${borderColor}`,
          backgroundColor: headerBg,
          flexShrink: 0,
        }}
      >
        <button type="button" style={view === '3d' ? activeTab : inactiveTab} onClick={() => setView('3d')}>
          3D
        </button>
        <button type="button" style={view === '2d' ? activeTab : inactiveTab} onClick={() => setView('2d')}>
          2D
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {view === '3d' ? (
          <>
            <Canvas
              id="part-maker-canvas"
              camera={{ position: [1.5, -1.5, 1.0], fov: 45 }}
              gl={{ preserveDrawingBuffer: true }}
              style={{ width: '100%', height: '100%' }}
            >
              <Suspense fallback={null}>
                <Scene spec={spec} onFeatureClick={onFeatureClick} />
              </Suspense>
            </Canvas>
            {!spec.customShapeCode.trim() && (
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <div style={{
                  background: 'rgba(0,0,0,0.6)',
                  color: '#94a3b8',
                  fontSize: 13,
                  padding: '10px 18px',
                  borderRadius: 8,
                  textAlign: 'center',
                  lineHeight: 1.6,
                }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>⬜</div>
                  No geometry yet
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                    Describe a shape in the chat to generate a 3D preview
                  </div>
                </div>
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                background: 'rgba(0,0,0,0.55)',
                color: 'white',
                fontSize: 11,
                padding: '5px 9px',
                borderRadius: 5,
                pointerEvents: 'none',
                lineHeight: 1.6,
              }}
            >
              <div style={{ fontWeight: 600 }}>{spec.displayName}</div>
              <div style={{ opacity: 0.7, fontFamily: 'monospace' }}>
                {spec.widthMm}×{spec.heightMm}mm · {spec.previewLengthGrids * spec.gridUnitMm}mm long
              </div>
              {spec.holeDiameter > 0 && (
                <div style={{ opacity: 0.7 }}>⌀{spec.holeDiameter}mm holes @ {spec.holeSpacingMm}mm</div>
              )}
              {spec.customShapeCode.trim() && onFeatureClick && (
                <div style={{ opacity: 0.5, marginTop: 4, fontSize: 10 }}>click part to inspect code</div>
              )}
            </div>
          </>
        ) : (
          <PartMakerSvg spec={spec} />
        )}
      </div>
    </div>
  )
}
