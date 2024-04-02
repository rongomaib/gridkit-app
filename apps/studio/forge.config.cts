import { existsSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { FusesPlugin } from '@electron-forge/plugin-fuses'
import type { ForgeConfig, ResolvedForgeConfig } from '@electron-forge/shared-types'
import { FuseV1Options, FuseVersion } from '@electron/fuses'

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Village Kit Studio',
    executableName: 'VillageKit-Studio',
    prune: false,
  },
  rebuildConfig: {},
  hooks: {
    postPackage: async (
      forgeConfig: ResolvedForgeConfig,
      options: { platform: string; arch: string; outputPaths: Array<string> },
    ) => {
      // remove unnecessary node_modules
      const { platform, outputPaths } = options
      for (const outputPath of outputPaths) {
        const nodeModulesPath =
          platform !== 'darwin'
            ? join(outputPath, 'node_modules')
            : join(outputPath, `${forgeConfig.packagerConfig.name}.app`, 'Contents', 'node_modules')
        if (existsSync(nodeModulesPath)) {
          await rm(nodeModulesPath, { recursive: true })
        }
      }
    },
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'VillageKit-Studio',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        bin: 'VillageKit-Studio',
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'villagekit',
          name: 'villagekit',
        },
        prerelease: true,
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-vite',
      config: {
        build: [
          {
            entry: 'src/main.ts',
            config: 'vite.main.config.ts',
          },
          {
            entry: 'src/preload.ts',
            config: 'vite.preload.config.ts',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts',
          },
        ],
      },
    },
    // Fuses are used to enable/disable various Electron functionality
    // at package time, before code signing the application
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
}

export default config
