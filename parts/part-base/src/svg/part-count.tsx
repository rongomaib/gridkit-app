import { Text } from '@villagekit/ui'

interface PartCountProps {
  count: number
}

export function PartCount(props: PartCountProps) {
  const { count } = props

  return (
    <Text aria-label={`${count} of`} fontSize="sm" sx={{ width: '28px' }}>
      {count}x
    </Text>
  )
}
