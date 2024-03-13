import { useTheme as useBaseTheme } from '@chakra-ui/react'
import type { Theme } from '../theme'

export const useTheme = (): Theme => useBaseTheme<Theme>()
