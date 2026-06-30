import { type ReactNode, createContext, useContext, useState } from 'react'

export type EnvironmentPreset =
  | 'apartment'
  | 'city'
  | 'dawn'
  | 'forest'
  | 'lobby'
  | 'night'
  | 'park'
  | 'studio'
  | 'sunset'
  | 'warehouse'

export interface AppearanceSettings {
  // Image-based lighting
  environmentPreset: EnvironmentPreset
  environmentIntensity: number
  // Key / sun directional light
  keyLightIntensity: number
  keyLightColor: string
  keyLightAzimuth: number   // 0–360°
  keyLightElevation: number // 5–85°
  // Ambient fill
  ambientIntensity: number
  // Soft shadows (PCSS)
  shadowSize: number
  shadowSamples: number
  // Ambient occlusion (N8AO)
  n8aoEnabled: boolean
  n8aoIntensity: number
  n8aoRadius: number
  n8aoDistanceFalloff: number
}

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  environmentPreset: 'studio',
  environmentIntensity: 0.8,
  keyLightIntensity: 2,
  keyLightColor: '#ffffff',
  keyLightAzimuth: 30,
  keyLightElevation: 40,
  ambientIntensity: 0.0,
  shadowSize: 30,
  shadowSamples: 16,
  n8aoEnabled: true,
  n8aoIntensity: 5,
  n8aoRadius: 0.5,
  n8aoDistanceFalloff: 1.0,
}

interface AppearanceSettingsContextValue {
  settings: AppearanceSettings
  update: (patch: Partial<AppearanceSettings>) => void
  reset: () => void
}

export const AppearanceSettingsContext = createContext<AppearanceSettingsContextValue>({
  settings: DEFAULT_APPEARANCE,
  update: () => {},
  reset: () => {},
})

export function AppearanceSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppearanceSettings>(DEFAULT_APPEARANCE)

  function update(patch: Partial<AppearanceSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }))
  }

  function reset() {
    setSettings(DEFAULT_APPEARANCE)
  }

  return (
    <AppearanceSettingsContext.Provider value={{ settings, update, reset }}>
      {children}
    </AppearanceSettingsContext.Provider>
  )
}

export function useAppearanceSettings() {
  return useContext(AppearanceSettingsContext)
}
