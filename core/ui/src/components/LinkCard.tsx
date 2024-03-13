'use client'

import {
  Heading,
  HoverCard,
  type HoverCardProps,
  Icon,
  LinkBox,
  LinkOverlay,
  type LinkOverlayProps,
  Stack,
  Text,
} from '../'

export interface LinkCardProps {
  as?: HoverCardProps['as']
  title: string
  icon: React.ComponentType
  description: string
  href: LinkOverlayProps['href']
  isExternal?: LinkOverlayProps['isExternal']
  linkComponent?: any
}

export function LinkCard(props: LinkCardProps) {
  const {
    as,
    title,
    icon: IconComponent,
    description,
    href,
    isExternal,
    linkComponent: LinkComponent,
  } = props

  return (
    <LinkBox>
      <HoverCard
        as={as}
        aria-label={title}
        sx={{ height: '64', paddingX: 4, paddingY: 8, width: '3xs' }}
      >
        <Stack
          direction="column"
          alignItems="center"
          justifyContent="space-around"
          spacing="4"
          height="100%"
        >
          <Icon as={IconComponent} w="8" h="8" />

          <Heading size="md" sx={{ textAlign: 'center' }}>
            {title}
          </Heading>

          <Text sx={{ textAlign: 'center' }}>{description}</Text>

          <LinkOverlay as={LinkComponent} href={href} isExternal={isExternal} />
        </Stack>
      </HoverCard>
    </LinkBox>
  )
}
