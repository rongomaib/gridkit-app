import { useEffect, useState } from 'react'

const isClient = typeof window !== 'undefined'

// https://github.com/mvasin/react-div-100vh/blob/00c51aff854a1d8d5af9c03b81735d84a7baabb6/lib/index.tsx#L39-L55
export function useWasRenderedOnClientAtLeastOnce() {
  const [wasRenderedOnClientAtLeastOnce, setWasRenderedOnClientAtLeastOnce] = useState(false)

  useEffect(() => {
    if (isClient && !wasRenderedOnClientAtLeastOnce) {
      setWasRenderedOnClientAtLeastOnce(true)
    }
  }, [wasRenderedOnClientAtLeastOnce])

  return wasRenderedOnClientAtLeastOnce
}
