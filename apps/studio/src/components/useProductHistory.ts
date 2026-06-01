import { useEffect, useState, useCallback } from 'react'
import { get, set } from 'idb-keyval'

export interface Revision {
  timestamp: number
  code: string
}

export function useProductHistory(workspacePath: string | undefined, productPath: string | undefined) {
  const storeKey = `history-${workspacePath}-${productPath}`
  const autosaveKey = `autosave-${workspacePath}-${productPath}`

  const [history, setHistory] = useState<Revision[]>([])
  const [autosave, setAutosave] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  // Load initial data
  useEffect(() => {
    if (!workspacePath || !productPath) {
      setIsReady(false)
      return
    }
    
    setIsReady(false)
    Promise.all([
      get<Revision[]>(storeKey),
      get<string>(autosaveKey)
    ]).then(([histRes, autoRes]) => {
      setHistory(histRes || [])
      setAutosave(autoRes || null)
      setIsReady(true)
    })
  }, [storeKey, autosaveKey, workspacePath, productPath])

  const saveToHistory = useCallback(async (code: string) => {
    if (!workspacePath || !productPath) return
    const newRev: Revision = { timestamp: Date.now(), code }
    const updated = [newRev, ...history].slice(0, 10)
    setHistory(updated)
    await set(storeKey, updated)
  }, [history, storeKey, workspacePath, productPath])

  const saveAutosave = useCallback(async (code: string) => {
    if (!workspacePath || !productPath) return
    setAutosave(code)
    await set(autosaveKey, code)
  }, [autosaveKey, workspacePath, productPath])

  const clearAutosave = useCallback(async () => {
    if (!workspacePath || !productPath) return
    setAutosave(null)
    await set(autosaveKey, null)
  }, [autosaveKey, workspacePath, productPath])

  return { history, autosave, isReady, saveToHistory, saveAutosave, clearAutosave }
}
