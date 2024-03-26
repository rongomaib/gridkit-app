'use client'

import { forwardRef } from 'react'
import { Button, type ButtonProps } from './Button'
import { Link, type LinkProps } from './Link'

export type LinkButtonProps = Omit<ButtonProps, 'isDisabled'> & Omit<LinkProps, 'variant'>

export const LinkButton = forwardRef<HTMLButtonElement, LinkButtonProps>(
  function LinkButton(props, ref) {
    return <Button as={Link} ref={ref} {...props} />
  },
)
