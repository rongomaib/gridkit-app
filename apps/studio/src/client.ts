import type { Router } from '@/api'
import { createTRPCReact } from '@trpc/react-query'

export const client: ReturnType<typeof createTRPCReact<Router>> = createTRPCReact<Router>()
