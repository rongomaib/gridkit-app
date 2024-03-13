import { extendTheme } from '@chakra-ui/react'
import { accordionTheme as Accordion } from './components/Accordion'
import { badgeTheme as Badge } from './components/Badge'
import { buttonTheme as Button } from './components/Button'
import { checkboxTheme as Checkbox } from './components/Checkbox'
import { formLabelTheme as FormLabel } from './components/FormLabel'
import { headingTheme as Heading } from './components/Heading'
import { linkTheme as Link } from './components/Link'
import { navLinkTheme as NavLink } from './components/NavLink'
import { sliderTheme as Slider } from './components/Slider'
import { switchTheme as Switch } from './components/Switch'
import { tableTheme as Table } from './components/Table'
import { tabsTheme as Tabs } from './components/Tabs'
import { textTheme as Text } from './components/Text'
import { accentA, accentB, outlineColor, primary, wood } from './theme/colors'

export const theme = extendTheme({
  colors: {
    accentA,
    accentB,
    outlineColor,
    primary,
    wood,
  },
  components: {
    Accordion,
    Badge,
    Button,
    Checkbox,
    FormLabel,
    Heading,
    Link,
    NavLink,
    Slider,
    Switch,
    Table,
    Tabs,
    Text,
  },
  fonts: {
    body: 'Bitter',
    heading: 'Fredoka One',
  },
  shadows: {
    outline: `0 0 0 2px ${outlineColor}`,
    outlineLarge: `0 0 0 4px ${outlineColor}`,
  },
})

export type Theme = typeof theme

export default theme
