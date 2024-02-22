'use client'

import { forwardRef } from 'react'

import { IconButton, IconButtonProps, Link, LinkProps } from '..//index.js'

export interface LinkIconButtonProps
  extends Omit<IconButtonProps, 'isDisabled'>,
    Omit<LinkProps, 'variant' | 'onClick'> {}

export const LinkIconButton = forwardRef<HTMLButtonElement, LinkIconButtonProps>(
  function LinkIconButton(props, ref) {
    return <IconButton as={Link} ref={ref} {...props} />
  },
)
