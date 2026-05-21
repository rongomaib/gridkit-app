import { readFile, readdir, realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import react from '@vitejs/plugin-react'
import { reverse, sortBy } from 'lodash-es'
import { defineConfig } from 'vite'

const here = dirname(fileURLToPath(import.meta.url))

// @villagekit/ui re-exports nav/layouts from its barrel, and those components
// import from next/link & next/navigation. Next is an optional peer; we don't
// use those nav components here, so stub the modules out so vite can tree-shake.
const nextStubs = {
  'next/link': join(here, 'src/next-stubs/link.tsx'),
  'next/navigation': join(here, 'src/next-stubs/navigation.ts'),
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      ...nextStubs,
      ...(await workspaceAliases()),
    },
  },
  worker: {
    format: 'es',
  },
})

async function workspaceAliases() {
  const aliases: Record<string, string> = {}
  const workspacePkgsDir = join(__dirname, '../../node_modules/@villagekit')
  const workspacePkgs = await readdir(workspacePkgsDir)
  await Promise.all(
    workspacePkgs.map(async (pkgName) => {
      const pkgBase = await realpath(join(workspacePkgsDir, pkgName))
      const pkgJson = JSON.parse(await readFile(join(pkgBase, 'package.json'), 'utf8'))
      type ExportMap = string | { source?: string; import: string }
      if (pkgJson['exports'] == null) return
      let exportEntries = Object.entries<ExportMap>(pkgJson['exports'])
      // NOTE (mw): sort so ./sub comes before ./
      //   important for module like @villagekit/part/base
      exportEntries = reverse(sortBy(exportEntries, ['[0]']))
      for (const [exportKey, exportMap] of exportEntries) {
        const aliasKey = join('@villagekit', pkgName, exportKey)
        const aliasTo =
          typeof exportMap === 'string' ? exportMap : exportMap.source || exportMap.import
        const aliasValue = join(pkgBase, aliasTo)
        aliases[aliasKey] = aliasValue
      }
    }),
  )
  return aliases
}
