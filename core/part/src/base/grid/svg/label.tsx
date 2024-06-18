import { useTheme } from '@villagekit/ui'
import { useSvgContext } from './context'

const GRID_SPACING = 40
const LABEL_Y_OFFSET_Y = 36
const LABEL_X_OFFSET_X = 24
const LABEL_X_OFFSET_Y = 12

interface LabelBaseProps {
  color: string
}

interface LabelXProps extends LabelBaseProps {
  value: number
  x: number
}

export function LabelX(props: LabelXProps) {
  const { value, ...rest } = props

  const { displayUnit } = useSvgContext()

  const text = displayUnit === 'mm' ? value * GRID_SPACING : value

  return <TextLabelX text={text.toString()} {...rest} />
}

interface LabelYProps extends LabelBaseProps {
  value: number
  y: number
}

export function LabelY(props: LabelYProps) {
  const { value, ...rest } = props

  const { displayUnit } = useSvgContext()

  const text = displayUnit === 'mm' ? value * GRID_SPACING : value

  const xOffset = displayUnit === 'mm' ? 16 : 0

  return (
    <g transform={`translate(${xOffset}, 0)`}>
      <TextLabelY text={text.toString()} {...rest} />
    </g>
  )
}

interface TextLabelXProps extends Omit<LabelXProps, 'value'> {
  text: string
  textAnchor?: string
}

export function TextLabelX(props: TextLabelXProps) {
  const { text, textAnchor = 'middle', color, x } = props

  const { fontSizes } = useTheme()

  return (
    <text
      x={x}
      y={LABEL_Y_OFFSET_Y}
      fill={color}
      fontSize={fontSizes['3xl']}
      textAnchor={textAnchor}
    >
      {text}
    </text>
  )
}

interface TextLabelYProps extends Omit<LabelYProps, 'value'> {
  text: string
  textAnchor?: string
}

export function TextLabelY(props: TextLabelYProps) {
  const { text, textAnchor = 'middle', color, y } = props

  const { fontSizes } = useTheme()

  return (
    <text
      x={LABEL_X_OFFSET_X}
      y={y + LABEL_X_OFFSET_Y}
      fill={color}
      fontSize={fontSizes['3xl']}
      textAnchor={textAnchor}
    >
      {text}
    </text>
  )
}
