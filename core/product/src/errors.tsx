import Ansi from '@curvenote/ansi-to-react'
import { Box, Heading, List, Text } from '@villagekit/ui'
import { type PropsWithChildren, useMemo } from 'react'
import { MdChevronRight } from 'react-icons/md'
import useFitText from 'use-fit-text-new'
import type { ZodError } from 'zod'
import { toStructuredError } from 'zod-structured-error'

export type ProductErrorText = { type: 'error:text'; title: string; body: string }

export type StackErrorFrame = {
  name: string
  line: number
  column: number
}
export type ProductErrorStack = {
  type: 'error:stack'
  title: string
  message: string
  stack: Array<StackErrorFrame>
}

export type ValidationError = ZodError
export type ValidationKey = string
export type ValidationErrors = Record<ValidationKey, ValidationError>
export type ProductErrorValidation = {
  type: 'error:validation'
  errors: ValidationErrors
}

export type ProductError = ProductErrorText | ProductErrorStack | ProductErrorValidation

type ProductErrorProps = { error: ProductError }

export function ProductErrorDisplay(props: ProductErrorProps) {
  const { error } = props
  switch (error.type) {
    case 'error:text':
      return <TextErrorDisplay error={error} />
    case 'error:stack':
      return <StackErrorDisplay error={error} />
    case 'error:validation':
      return <ValidationErrorsDisplay error={error} />
  }
}

export type TextErrorProps = {
  error: ProductErrorText
}

function TextErrorDisplay(props: TextErrorProps) {
  const {
    error: { title, body },
  } = props

  return (
    <ErrorBox>
      <Heading as={'h3'}>Error: {title}</Heading>
      <Box as="code">
        <Box as="pre">
          <Ansi>{body}</Ansi>
        </Box>
      </Box>
    </ErrorBox>
  )
}

type StackErrorProps = {
  error: ProductErrorStack
}

function StackErrorDisplay(props: StackErrorProps) {
  const {
    error: { title, message, stack },
  } = props

  return (
    <ErrorBox>
      <Heading as={'h3'}>Error: {title}</Heading>
      <Box>
        <Box css={{ fontWeight: 'bold' }}>{message}</Box>
        <List.Root>
          {stack.map((frame) => (
            <List.Item key={`${frame.line}:${frame.column}`}>
              <List.Indicator asChild>
                <MdChevronRight />
              </List.Indicator>
              at line {frame.line}, column {frame.column}
              {frame.name !== '' && <>, function {frame.name}</>}
            </List.Item>
          ))}
        </List.Root>
      </Box>
    </ErrorBox>
  )
}

type ValidationErrorProps = {
  error: ValidationError
}

function ValidationErrorDisplay(props: ValidationErrorProps) {
  const { error } = props

  const structuredError = useMemo(() => {
    return toStructuredError(error, { grouping: 'array' })
  }, [error])

  return (
    <List.Root>
      {Object.entries(structuredError).map(([key, errors]) => (
        <List.Item key={key} css={{ marginLeft: 2 }}>
          <List.Indicator asChild>
            <MdChevronRight />
          </List.Indicator>
          <Text as="span">{key || '.'}</Text>
          <List.Root>
            {(errors as Array<string>).map((error) => (
              <List.Item key={error} css={{ marginLeft: 2 }}>
                <List.Indicator asChild>
                  <MdChevronRight />
                </List.Indicator>
                {error}
              </List.Item>
            ))}
          </List.Root>
        </List.Item>
      ))}
    </List.Root>
  )
}

type ValidationErrorsProps = {
  error: ProductErrorValidation
}

function ValidationErrorsDisplay(props: ValidationErrorsProps) {
  const {
    error: { errors },
  } = props

  return (
    <ErrorBox>
      <Heading as={'h3'}>Error: Validation</Heading>
      <List.Root>
        {Object.entries(errors).map(([key, error]) => (
          <List.Item key={key}>
            <Text as="span" css={{ fontWeight: 'bold' }}>
              {key}
            </Text>
            <ValidationErrorDisplay error={error} />
          </List.Item>
        ))}
      </List.Root>
    </ErrorBox>
  )
}

type ErrorBoxProps = PropsWithChildren<{}>

function ErrorBox(props: ErrorBoxProps) {
  const { children } = props

  const { fontSize, ref } = useFitText()

  return (
    <Box
      ref={ref}
      css={{
        backgroundColor: 'red.100',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize,
      }}
    >
      {children}
    </Box>
  )
}
