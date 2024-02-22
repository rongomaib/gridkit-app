import { Flex, Spinner, Text } from '@villagekit/ui'
import React from 'react'

interface LoadingProps {
  errorMessage?: string
}

export function Loading(props: LoadingProps) {
  const { errorMessage } = props

  return (
    <Flex alignItems="center" justifyContent="center" sx={{ height: '100%', padding: 8 }}>
      {errorMessage != null ? (
        <Text sx={{ color: 'red.600' }}>{errorMessage}</Text>
      ) : (
        <Spinner size="xl" />
      )}
    </Flex>
  )
}
