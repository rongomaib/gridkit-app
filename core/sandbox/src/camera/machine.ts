import { assign, setup } from 'xstate'

const timeBeforeAutoRotation = 5000
const maxAutoRotationSpeed = 0.5
const autoRotationAcceleration = 0.1

export function createMachine(initialState = 'auto') {
  return setup({
    types: {} as {
      context: {
        autoRotationSpeed: number
      }
      events:
        | { type: 'control.user.start' }
        | { type: 'control.user.end' }
        | { type: 'control.auto.start' }
        | { type: 'control.auto.tick'; delta: number }
        | { type: 'control.auto.off' }
    },
  }).createMachine({
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
          'control.user.start': 'user',
          'control.auto.off': 'off',
        },
      },
      auto: {
        on: {
          'control.user.start': 'user',
          'control.auto.off': 'off',
        },
      },
      user: {
        on: {
          'control.user.end': 'idle',
          'control.auto.off': 'off',
        },
      },
      off: {
        on: {
          'control.auto.start': 'auto',
        },
      },
    },
    on: {
      'control.user.start': {
        actions: assign({
          autoRotationSpeed: 0,
        }),
      },
      'control.auto.tick': {
        actions: assign({
          autoRotationSpeed: ({ context: { autoRotationSpeed }, event: { delta } }) => {
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
