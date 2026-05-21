import type { AnchorHTMLAttributes, ForwardedRef } from 'react'
import { forwardRef } from 'react'

const NextLink = forwardRef(function NextLink(
  props: AnchorHTMLAttributes<HTMLAnchorElement>,
  ref: ForwardedRef<HTMLAnchorElement>,
) {
  return <a ref={ref} {...props} />
})

export default NextLink
