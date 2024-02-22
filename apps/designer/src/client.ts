import { createTRPCReact } from '@trpc/react-query'

import type { Router } from '@/api'

export const client: ReturnType<typeof createTRPCReact<Router>> = createTRPCReact<Router>()
