'use client'

import {
  IconButton as BaseIconButton,
  IconButtonProps as BaseIconButtonProps,
} from '@chakra-ui/react'
import { forwardRef } from 'react'

export interface IconButtonProps
  extends Pick<BaseIconButtonProps, 'icon' | 'onClick' | 'isDisabled' | 'title' | 'as' | 'sx'> {
  size?: 'lg' | 'md' | 'sm' | 'xs'
  variant?: 'primary' | 'secondary' | 'tertiary' | 'toolbar'
  icon: BaseIconButtonProps['icon']
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  props,
  ref,
) {
  const { title } = props
  // @ts-ignore
  return <BaseIconButton ref={ref} isRound aria-label={title} {...props} />
})
