import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type PricingConfig = Record<string, number>

export interface PricingContextValue {
  prices: PricingConfig
  setPrice: (partType: string, price: number) => void
}

const defaultPricingContextValue: PricingContextValue = {
  prices: {},
  setPrice: () => {},
}

export const PricingContext = createContext<PricingContextValue>(defaultPricingContextValue)

export function PricingProvider({ children }: { children: ReactNode }) {
  const [prices, setPrices] = useState<PricingConfig>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = window.localStorage.getItem('vk-prices')
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load prices', e)
    }
    return {}
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem('vk-prices', JSON.stringify(prices))
    } catch (e) {
      console.error('Failed to save prices', e)
    }
  }, [prices])

  const setPrice = (partType: string, price: number) => {
    setPrices((prev) => ({
      ...prev,
      [partType]: price,
    }))
  }

  return (
    <PricingContext.Provider value={{ prices, setPrice }}>
      {children}
    </PricingContext.Provider>
  )
}

export function usePricingContext() {
  return useContext(PricingContext)
}
