'use client'

import { forwardRef } from 'react'

import { Button, ButtonProps, Link, LinkProps } from '..//index.js'

export type LinkButtonProps = Omit<ButtonProps, 'isDisabled'> & Omit<LinkProps, 'variant'>

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(function LinkButton(
  props,
  ref,
) {
  return <Button as={Link} ref={ref} {...props} />
})
