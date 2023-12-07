import { useTheme as useBaseTheme } from '@chakra-ui/react'

import { Theme } from '../theme.js'

export const useTheme = (): Theme => useBaseTheme<Theme>()
