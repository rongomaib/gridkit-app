import { useEffect, useMemo } from 'react'

const SANDBOX_CONTROL_SETTINGS_KEY = 'villagekit:sandbox_control_settings_v2'

type SandboxControlSettings = {
  shouldAutoRotate: boolean
  shouldDisplayGrid: boolean
}

export function useDefaultSandboxControlSettings() {
  return useMemo<SandboxControlSettings>(() => {
    const data = localStorage.getItem(SANDBOX_CONTROL_SETTINGS_KEY)

    if (data != null) {
      return JSON.parse(data)
    }

    return {
      shouldAutoRotate: false,
      shouldDisplayGrid: true,
    }
  }, [])
}

export function useSaveSandboxControlSettings(
  shouldAutoRotate: boolean,
  shouldDisplayGrid: boolean,
) {
  useEffect(() => {
    localStorage.setItem(
      SANDBOX_CONTROL_SETTINGS_KEY,
      JSON.stringify({
        shouldAutoRotate,
        shouldDisplayGrid,
      }),
    )
  }, [shouldAutoRotate, shouldDisplayGrid])
}
