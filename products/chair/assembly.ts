import { DesignAssemblyParameterized } from '@villagekit/design'

export const assembly = DesignAssemblyParameterized({
  parameters: {
    seatWidth: {
      label: 'Seat width',
      shortId: 'sw',
      type: 'number',
      max: 10,
      min: 5,
      step: 5,
    },
    seatDepth: {
      label: 'Seat depth',
      shortId: 'sd',
      type: 'number',
      max: 15,
      min: 5,
    },
    seatHeight: {
      label: 'Seat height',
      description: 'The height from the ground to the top of the seat',
      shortId: 'sh',
      type: 'number',
      max: 15,
      min: 5,
    },
    shouldIncludeBack: {
      label: 'Include back',
      type: 'boolean',
      shortId: 'b',
    },
    backHeight: {
      label: 'Back height',
      description: 'The height from the seat to the top of the backrest',
      shortId: 'bh',
      type: 'number',
      max: 10,
      min: 5,
    },
  },
  presets: [
    {
      id: 'regular-with-back',
      label: 'Regular With Back',
      values: {
        backHeight: 10,
        seatDepth: 10,
        seatHeight: 10,
        seatWidth: 10,
        shouldIncludeBack: true,
      },
    },
    {
      id: 'regular',
      label: 'Regular (Without Back)',
      values: {
        backHeight: 10,
        seatDepth: 10,
        seatHeight: 10,
        seatWidth: 10,
        shouldIncludeBack: false,
      },
    },
  ],
  createParts: function (parameters) {
    const { seatWidth, seatDepth, seatHeight, backHeight, shouldIncludeBack } = parameters

    const backZBeamEndZ = shouldIncludeBack ? seatHeight + backHeight : seatHeight
    const seatPanelStartY = shouldIncludeBack ? 1 : 0
    const seatPanelEndY = shouldIncludeBack ? seatDepth + 1 : seatDepth

    return [
      {
        type: 'gridpanel:xy',
        x: [0, seatWidth],
        y: [seatPanelStartY, seatPanelEndY],
        z: seatHeight,
      },

      shouldIncludeBack && {
        type: 'gridpanel:xz',
        x: [0, seatWidth],
        y: 1,
        z: [seatHeight + 1, seatHeight + 1 + backHeight],
      },

      {
        type: 'gridbeam:z',
        x: 0,
        y: 0,
        z: [0, backZBeamEndZ],
      },
      {
        type: 'gridbeam:z',
        x: seatWidth - 1,
        y: 0,
        z: [0, backZBeamEndZ],
      },
      {
        type: 'gridbeam:z',
        x: 0,
        y: seatDepth - 1,
        z: [0, seatHeight],
      },
      {
        type: 'gridbeam:z',
        x: seatWidth - 1,
        y: seatDepth - 1,
        z: [0, seatHeight],
      },

      {
        type: 'gridbeam:x',
        x: [0, seatWidth],
        y: 1,
        z: seatHeight - 2,
      },
      {
        type: 'gridbeam:x',
        x: [0, seatWidth],
        y: seatDepth - 2,
        z: seatHeight - 2,
      },

      {
        type: 'gridbeam:y',
        x: 1,
        y: [0, seatDepth],
        z: seatHeight - 1,
      },
      {
        type: 'gridbeam:y',
        x: seatWidth - 2,
        y: [0, seatDepth],
        z: seatHeight - 1,
      },
    ]
  },
  // plugins: [FastenerGenerationPlugin],
})
