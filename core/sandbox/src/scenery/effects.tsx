import { useFrame, useThree } from '@react-three/fiber'
import { N8AOPass } from 'n8ao'
import { useEffect, useMemo } from 'react'
import { NoToneMapping } from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import type { AppearanceSettings } from './appearance-context'

interface SceneEffectsProps {
  appearanceSettings: AppearanceSettings
}

// Uses THREE.js's own EffectComposer (not @react-three/postprocessing) because
// the React component wrapper is incompatible with @react-three/fiber v9.
// N8AOPass renders the scene itself and manages its own depth buffers.
function N8AORenderer({ appearanceSettings }: SceneEffectsProps) {
  const { gl, scene, camera, size } = useThree()

  const { composer, n8aoPass } = useMemo(() => {
    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))
    const pass = new N8AOPass(scene, camera, size.width, size.height)
    pass.configuration.intensity = appearanceSettings.n8aoIntensity
    pass.configuration.aoRadius = appearanceSettings.n8aoRadius
    pass.configuration.distanceFalloff = appearanceSettings.n8aoDistanceFalloff
    pass.setQualityMode('Medium')
    c.addPass(pass)
    return { composer: c, n8aoPass: pass }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height])

  useEffect(() => {
    n8aoPass.configuration.intensity = appearanceSettings.n8aoIntensity
    n8aoPass.configuration.aoRadius = appearanceSettings.n8aoRadius
    n8aoPass.configuration.distanceFalloff = appearanceSettings.n8aoDistanceFalloff
  }, [n8aoPass, appearanceSettings.n8aoIntensity, appearanceSettings.n8aoRadius, appearanceSettings.n8aoDistanceFalloff])

  useFrame((_, delta) => {
    const prevToneMapping = gl.toneMapping
    gl.toneMapping = NoToneMapping
    composer.render(delta)
    gl.toneMapping = prevToneMapping
  }, 1)

  return null
}

export function SceneEffects({ appearanceSettings }: SceneEffectsProps) {
  if (!appearanceSettings.n8aoEnabled) return null
  return <N8AORenderer appearanceSettings={appearanceSettings} />
}
