import type {
  DesignAssembly,
  DesignMeta,
  DesignParameters,
  DesignParts,
  DesignPresets,
} from '@villagekit/design'

export const meta: DesignMeta = {
  id: 'chair',
  label: 'Chair',
  description:
    'A conventional 4 legged chair. Useful for sitting at a desk, table, or to help you reach that top shelf.',
  categories: ['seating'],
}

export const parameters = {
  seatWidth: {
    label: 'Seat width',
    shortId: 'sw',
    type: 'number',
    min: 5,
    max: 10,
    step: 5,
  },
  seatDepth: {
    label: 'Seat depth',
    shortId: 'sd',
    type: 'number',
    min: 5,
    max: 15,
  },
  seatHeight: {
    label: 'Seat height',
    description: 'The height from the ground to the top of the seat',
    shortId: 'sh',
    type: 'number',
    min: 5,
    max: 15,
  },
  shouldIncludeBack: {
    label: 'Include back',
    shortId: 'b',
    type: 'boolean',
  },
  backHeight: {
    label: 'Back height',
    description: 'The height from the seat to the top of the backrest',
    shortId: 'bh',
    type: 'number',
    max: 10,
    min: 5,
  },
} satisfies DesignParameters

export const presets: DesignPresets<typeof parameters> = [
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
]

export const assembly: DesignAssembly<typeof parameters> = (parameters) => {
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
  ] satisfies DesignParts
}
