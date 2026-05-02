import { Flex, Spinner, Text } from '@villagekit/ui'

interface LoadingProps {
  errorMessage?: string
}

export function Loading(props: LoadingProps) {
  const { errorMessage } = props

  return (
    <Flex alignItems="center" justifyContent="center" css={{ height: '100%', padding: 8 }}>
      {errorMessage != null ? (
        <Text css={{ color: 'red.600' }}>{errorMessage}</Text>
      ) : (
        <Spinner size="xl" />
      )}
    </Flex>
  )
}
