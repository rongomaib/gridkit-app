export type { AccordionProps } from '@chakra-ui/react'
export {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
} from '@chakra-ui/react'

export const accordionTheme = {
  baseStyle: {
    button: {
      display: 'flex',
      justifyContent: 'space-between',
      paddingX: 2,
      paddingY: 4,
    },
    container: {
      '&:last-of-type': {
        borderBottomWidth: 2,
      },

      borderStyle: 'dashed',
      borderTopWidth: 2,
    },
    panel: {
      paddingX: 4,
      paddingY: 4,
    },
  },
}
