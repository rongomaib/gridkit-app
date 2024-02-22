import { assign, createMachine } from 'xstate'

/* eslint-disable sort-keys-fix/sort-keys-fix, @typescript-eslint/ban-types */

const timeBeforeAutoRotation = 5000
const maxAutoRotationSpeed = 0.5
const autoRotationAcceleration = 0.1

export type CameraControlEvent =
  | { type: 'CONTROL.USER.START' }
  | { type: 'CONTROL.USER.END' }
  | { type: 'CONTROL.AUTO.START' }
  | { type: 'CONTROL.AUTO.TICK'; delta: number }
  | { type: 'CONTROL.AUTO.OFF' }

export interface CameraControlContext {
  autoRotationSpeed: number
}

export type CameraControlState =
  | {
      value: 'idle'
      context: CameraControlContext
    }
  | {
      value: 'user'
      context: CameraControlContext
    }
  | {
      value: 'auto'
      context: CameraControlContext
    }
  | {
      value: 'off'
      context: CameraControlContext
    }

export function machine(initialState = 'auto') {
  return createMachine<
    CameraControlContext,
    CameraControlEvent,
    CameraControlState
  >({
    context: {
      autoRotationSpeed: maxAutoRotationSpeed,
    },
    initial: initialState,
    states: {
      idle: {
        after: {
          [timeBeforeAutoRotation]: 'auto',
        },
        on: {
          'CONTROL.USER.START': 'user',
          'CONTROL.AUTO.OFF': 'off',
        },
      },
      auto: {
        on: {
          'CONTROL.USER.START': 'user',
          'CONTROL.AUTO.OFF': 'off',
        },
      },
      user: {
        on: {
          'CONTROL.USER.END': 'idle',
          'CONTROL.AUTO.OFF': 'off',
        },
      },
      off: {
        on: {
          'CONTROL.AUTO.START': 'auto',
        },
      },
    },
    on: {
      'CONTROL.USER.START': {
        actions: assign({
          autoRotationSpeed: 0,
        }),
      },
      'CONTROL.AUTO.TICK': {
        actions: assign({
          autoRotationSpeed: ({ autoRotationSpeed }, { delta }) => {
            return Math.min(
              maxAutoRotationSpeed,
              autoRotationSpeed + autoRotationAcceleration * delta,
            )
          },
        }),
      },
    },
  })
}
