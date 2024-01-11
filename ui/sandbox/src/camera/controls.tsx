import { useFrame, useThree } from '@react-three/fiber'
import { useInterpret } from '@xstate/react'
import type CameraControlsType from 'camera-controls'
import CameraControlsImpl from 'camera-controls'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import {
  Box3,
  MathUtils,
  Matrix4,
  MOUSE,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
} from 'three'
import { InterpreterFrom } from 'xstate'

import type { SandboxMode } from '../'
import { machine } from './machine'

const ROT = 2 * Math.PI

const { ACTION } = CameraControlsImpl

// https://github.com/react-spring/drei/blob/master/src/controls/OrbitControls.tsx

const subsetOfTHREE = {
  Box3: Box3,
  MOUSE: MOUSE,
  MathUtils: {
    DEG2RAD: MathUtils.DEG2RAD,
    clamp: MathUtils.clamp,
  },
  Matrix4: Matrix4,
  Quaternion: Quaternion,
  Raycaster: Raycaster,
  Sphere: Sphere,
  Spherical: Spherical,
  Vector2: Vector2,
  Vector3: Vector3,
  Vector4: Vector4,
}

CameraControlsImpl.install({ THREE: subsetOfTHREE })

export interface CameraControlsRef {
  reset: () => void
  zoomIn: () => void
  zoomOut: () => void
}

interface CameraControlsProps {
  boundingBox: Box3
  mode: SandboxMode
  shouldAutoRotate: boolean
}

export const CameraControls = forwardRef<CameraControlsRef, CameraControlsProps>(
  function CameraControls(props, ref) {
    const { boundingBox, mode, shouldAutoRotate } = props

    const service = useInterpret(() => machine(mode === 'screenshot' ? 'off' : 'auto'))

    const isControlEnabled = true

    const invalidate = useThree(({ invalidate }) => invalidate)
    const camera = useThree(({ camera }) => camera)
    const gl = useThree(({ gl }) => gl)
    // const performance = useThree(({ performance }) => performance)

    const controls = useMemo(() => {
      return new CameraControlsImpl(camera, gl.domElement)
    }, [camera, gl])

    const resetControlsBox = useCallback(() => {
      const fitBox = boundingBox.clone()

      if (fitBox.isEmpty()) {
        fitBox.expandByPoint(new Vector3(1, 1, 1))
        fitBox.expandByPoint(new Vector3(-1, -1, -1))
      }

      const enableFitTransition = mode === 'default'

      if (mode === 'screenshot') {
        void controls.fitToBox(fitBox, enableFitTransition, {
          paddingBottom: 0.4,
          paddingLeft: 0.4,
          paddingRight: 0.4,
          paddingTop: 0.4,
        })

        void controls.rotateTo((3 / 8) * ROT, (3 / 16) * ROT, false)
      } else {
        const fitSphere = fitBox.getBoundingSphere(new Sphere())
        void controls.fitToSphere(fitSphere, enableFitTransition)
      }
    }, [boundingBox, controls, mode])

    const resetControlsRotation = useCallback(
      (enableTransition: boolean) => {
        const { azimuthAngle, polarAngle } = controls

        const nextAzimuthAngle = azimuthAngle - (azimuthAngle % ROT) + (3 / 8) * ROT
        const nextPolarAngle = polarAngle - (polarAngle % ROT) + (3 / 16) * ROT

        void controls.rotateTo(nextAzimuthAngle, nextPolarAngle, enableTransition)
      },
      [controls],
    )

    useImperativeHandle(
      ref,
      () => ({
        reset: () => {
          resetControlsBox()
          resetControlsRotation(true)
        },
        zoomIn: () => {
          void controls.dolly(controls.distance * 0.25, true)
        },
        zoomOut: () => {
          void controls.dolly(-controls.distance * 0.25, true)
        },
      }),
      [controls, resetControlsBox, resetControlsRotation],
    )

    useFrame((_, delta) => controls.update(delta))

    useEffect(() => {
      controls.addEventListener('update', onUpdate)
      return () => controls.removeEventListener('update', onUpdate)

      function onUpdate() {
        invalidate()
        // performance.regress()
      }
    }, [controls, invalidate])

    useAutoRotate({ controls, mode, service, shouldAutoRotate })

    useEffect(() => {
      resetControlsBox()
    }, [resetControlsBox])

    useEffect(() => {
      resetControlsRotation(false)
    }, [resetControlsRotation])

    // TODO: pull request upstream?
    const middleMouseAction = useMemo(() => {
      return (camera as THREE.PerspectiveCamera).isPerspectiveCamera
        ? ACTION.DOLLY
        : (camera as THREE.OrthographicCamera).isOrthographicCamera
        ? ACTION.ZOOM
        : ACTION.NONE
    }, [camera])

    return (
      <primitive
        object={controls}
        dispose={undefined}
        enabled={isControlEnabled}
        dampingFactor={0.1}
        azimuthRotateSpeed={0.5}
        polarRotateSpeed={0.5}
        mouseButtons-middle={middleMouseAction}
        minDistance={0.15}
        maxDistance={10}
        {...props}
      />
    )
  },
)

interface AutoRotateOptions {
  service: InterpreterFrom<ReturnType<typeof machine>>
  shouldAutoRotate: boolean
  controls: CameraControlsType
  mode: SandboxMode
}

function useAutoRotate(options: AutoRotateOptions) {
  const { controls, shouldAutoRotate, service, mode } = options

  // use ref and custom subscribe for performance
  const controlModeRef = useRef(service.initialState.value)
  const rotationSpeedRef = useRef(service.initialState.context.autoRotationSpeed)

  useFrame((_, delta) => {
    if (controls == null) return

    if (controlModeRef.current === 'auto') {
      service.send({ delta, type: 'CONTROL.AUTO.TICK' })

      // clamp to handle game loop sleeping
      const clampedDelta = Math.min(delta, 0.5)
      const azimuthAngle = clampedDelta * rotationSpeedRef.current
      void controls.rotate(azimuthAngle, 0, true)
    }
  })

  useEffect(() => {
    if (mode === 'screenshot') {
      return
    }

    if (shouldAutoRotate) {
      service.send({ type: 'CONTROL.AUTO.START' })
    } else {
      service.send({ type: 'CONTROL.AUTO.OFF' })
    }
  }, [mode, shouldAutoRotate, service])

  useEffect(() => {
    const subscription = service.subscribe((state) => {
      controlModeRef.current = state.value
      rotationSpeedRef.current = state.context.autoRotationSpeed
    })

    return subscription.unsubscribe
  }, [service])

  useEffect(() => {
    controls.addEventListener('controlstart', onControlStart)
    controls.addEventListener('controlend', onControlEnd)
    return () => {
      controls.removeEventListener('controlstart', onControlStart)
      controls.removeEventListener('controlend', onControlEnd)
    }

    function onControlStart() {
      service.send('CONTROL.USER.START')
    }
    function onControlEnd() {
      service.send('CONTROL.USER.END')
    }
  }, [controls, service])
}
