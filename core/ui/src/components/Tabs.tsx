'use client'

import {
  TabList as BaseTabList,
  Tabs as BaseTabs,
  type TabListProps,
  type TabsProps,
  useMergeRefs,
} from '@chakra-ui/react'
import { forwardRef, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

export type { TabsProps }
export { Tab, TabPanel, TabPanels } from '@chakra-ui/react'

const isClient = typeof window !== 'undefined'

const useSafeLayoutEffect = isClient ? useLayoutEffect : useEffect

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(props, ref) {
  // @ts-ignore
  return <BaseTabs variant="unstyled" ref={ref} {...props} />
})

export const TabList = forwardRef<HTMLDivElement, TabListProps>(function TabList(props, ref) {
  const tabsRef = useRef<HTMLDivElement>(null)

  const [fadeOut, setFadeOut] = useState(false)

  const updateFadeOut = useCallback(() => {
    if (tabsRef.current != null) {
      const { clientWidth, scrollWidth } = tabsRef.current

      setFadeOut(scrollWidth > clientWidth)
    }
  }, [])

  useSafeLayoutEffect(() => {
    updateFadeOut()

    window.addEventListener('resize', updateFadeOut)

    return () => {
      window.removeEventListener('resize', updateFadeOut)
    }
  }, [updateFadeOut])

  return (
    <BaseTabList
      // @ts-ignore
      ref={useMergeRefs(tabsRef, ref)}
      sx={{
        ...(fadeOut
          ? {
              '&::before': {
                content: '""',
                position: 'absolute',
                zIndex: 5,
                top: 0,
                right: 0,
                bottom: 0,
                pointerEvents: 'none',
                backgroundImage: 'linear-gradient(to right, rgba(255, 255, 255, 0), white 85%)',
                width: 16,
              },
            }
          : {}),
      }}
      {...props}
    />
  )
})

export const tabsTheme = {
  baseStyle: {
    root: {
      position: 'relative',
    },
    tablist: {
      marginBottom: 2,
      overflowX: 'auto',

      '&::after': {
        borderBottomWidth: 2,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderStyle: 'dashed',
        content: '""',
        display: 'block',
        flex: 1,
      },
    },
    tab: {
      borderBottomWidth: 2,
      borderStyle: 'dashed',
      fontFamily: 'heading',
      marginRight: 1,
      position: 'relative',
      whiteSpace: 'nowrap',

      _hover: {
        color: 'primary.700',
      },

      _focus: {
        color: 'primary.700',
      },

      _selected: {
        borderColor: 'primary.300',
        boxShadow: 'none',
        zIndex: 10,
      },

      _disabled: {
        color: 'gray.300',
        cursor: 'not-allowed',
      },
    },
    tabpanels: {
      position: 'relative',
      zIndex: 10,
    },
    tabpanel: {
      padding: 4,
    },
  },
}
