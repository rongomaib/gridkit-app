import { extendTheme } from '@chakra-ui/react'

import { accordionTheme as Accordion } from './components/Accordion.js'
import { badgeTheme as Badge } from './components/Badge.js'
import { buttonTheme as Button } from './components/Button.js'
import { checkboxTheme as Checkbox } from './components/Checkbox.js'
import { formLabelTheme as FormLabel } from './components/FormLabel.js'
import { headingTheme as Heading } from './components/Heading.js'
import { linkTheme as Link } from './components/Link.js'
import { navLinkTheme as NavLink } from './components/NavLink.js'
import { sliderTheme as Slider } from './components/Slider.js'
import { switchTheme as Switch } from './components/Switch.js'
import { tableTheme as Table } from './components/Table.js'
import { tabsTheme as Tabs } from './components/Tabs.js'
import { textTheme as Text } from './components/Text.js'
import { accentA, accentB, outlineColor, primary, wood } from './theme/colors.js'

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
