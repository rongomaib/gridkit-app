import type { AriaLabelingProps, IdProps } from '@chakra-ui/react-types'

export interface AriaRoleProps {
  role?: React.AriaRole
}

export interface TabIndexProps {
  tabIndex?: number
}

export interface BaseProps extends IdProps, AriaLabelingProps, AriaRoleProps, TabIndexProps {}
