import { Box, Flex, HStack, StackDivider, VStack } from '@chakra-ui/react'
import type { Meta, StoryObj } from '@storybook/react'

import { Heading, Text, useTheme } from '../src/index.js'

const meta: Meta = {
  title: 'ui/Theme/Colors',
}

export default meta

type Story = StoryObj

interface ColorPaletteProps {
  colors: Array<string>
}

function ColorPalette(props: ColorPaletteProps) {
  const { colors } = props

  return (
    <HStack spacing={0} sx={{ borderRadius: 'lg', boxShadow: 'md', overflow: 'hidden' }}>
      {Object.values(colors).map((color) => (
        <Box key={color} boxSize="12" sx={{ backgroundColor: color }} />
      ))}
    </HStack>
  )
}

interface ColorPaletteContainerProps {
  name: string
  colorValue: Record<string, string> | string
}

function ColorPaletteContainer(props: ColorPaletteContainerProps) {
  const { name, colorValue } = props

  return (
    <Flex alignItems="center" justifyContent="space-between" width="100%" sx={{ padding: 4 }}>
      <Heading size="md" sx={{ marginRight: 4 }}>
        {name}
      </Heading>

      {typeof colorValue === 'object' ? (
        <Box>
          <HStack spacing={0} sx={{ position: 'relative' }}>
            {Object.keys(colorValue).map((colorName) => (
              <Box key={colorName} w="12" h="8">
                <Text sx={{ textAlign: 'center' }}>{colorName}</Text>
              </Box>
            ))}
          </HStack>

          <ColorPalette colors={Object.values(colorValue)} />
        </Box>
      ) : (
        <ColorPalette colors={[colorValue]} />
      )}
    </Flex>
  )
}

export const Colors: Story = {
  render() {
    const { colors } = useTheme()

    return (
      <VStack divider={<StackDivider borderColor="gray.200" />}>
        {['white', 'black', 'gray', 'primary', 'accentA', 'accentB'].map((name) => (
          <ColorPaletteContainer
            key={name}
            name={name}
            colorValue={colors[name as keyof typeof colors]}
          />
        ))}
      </VStack>
    )
  },
}
