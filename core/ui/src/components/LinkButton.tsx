'use client'

import { forwardRef } from 'react'
import { Button, type ButtonProps, Link, type LinkProps } from '../'

export type LinkButtonProps = Omit<ButtonProps, 'isDisabled'> & Omit<LinkProps, 'variant'>

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  function LinkButton(props, ref) {
    return <Button as={Link} ref={ref} {...props} />
  },
)
