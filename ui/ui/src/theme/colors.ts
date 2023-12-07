import { theme } from '@chakra-ui/theme'

import { transparentize } from '../utility.js'

const { colors } = theme

export const primary = colors.pink

export const accentA = colors.cyan

export const accentB = colors.yellow

export const outlineColor = transparentize(accentA[600], 0.5)

export const wood = {
  dark: '#785e28',
  light: '#f5e1b3',
}
