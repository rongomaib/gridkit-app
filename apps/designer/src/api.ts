import { constants, access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { initTRPC } from '@trpc/server'
import { app, dialog } from 'electron'
import { camelCase, kebabCase } from 'lodash-es'
import { parse as parseToml, stringify as stringifyToml } from 'smol-toml'
import { z } from 'zod'

const t = initTRPC.create({ isServer: true })

const pathSchema = z.string()

const workspacePathSchema = pathSchema

const workspaceConfigSchema = z.object({
  path: workspacePathSchema,
})

type WorkspaceConfig = z.infer<typeof workspaceConfigSchema>

const appConfigSchema = z.object({
  workspaces: z.array(workspaceConfigSchema),
})

type AppConfig = z.infer<typeof appConfigSchema>

const productPathSchema = pathSchema
const productIdSchema = z.string()
const productEntrySchema = pathSchema

const productIndexSchema = z.object({
  path: productPathSchema,
  id: productIdSchema,
})

const productTypeSchema = z.enum(['assembly'])
export type ProductType = z.infer<typeof productTypeSchema>

const productMetaSchema = z.object({
  type: productTypeSchema,
  entry: pathSchema,
})

export type ProductMeta = z.infer<typeof productMetaSchema>

const productMetaFileSchema = z.object({
  product: productMetaSchema,
})

export const router = t.router({
  listWorkspaces: t.procedure.query(async function listWorkspaces(): Promise<
    Array<WorkspaceConfig>
  > {
    const config = await loadAppConfig()
    return config.workspaces
  }),
  openWorkspace: t.procedure.mutation(async function openWorkspace(): Promise<string | null> {
    const openDialogResult = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory', 'promptToCreate'],
    })
    if (openDialogResult.filePaths[0]) {
      const selectedDirectory = openDialogResult.filePaths[0]
      return selectedDirectory
    }
    return null
  }),
  addWorkspace: t.procedure
    .input(z.object({ workspace: workspaceConfigSchema }))
    .mutation(async function addWorkspace(opts) {
      const { workspace } = opts.input
      const config = await loadAppConfig()
      config.workspaces.push(workspace)
      await saveAppConfig(config)
    }),
  removeWorkspace: t.procedure
    .input(z.object({ workspacePath: workspacePathSchema }))
    .mutation(async function removeWorkspace(opts) {
      const { workspacePath } = opts.input
      const config = await loadAppConfig()
      config.workspaces = config.workspaces.filter((workspace) => workspace.path !== workspacePath)
      await saveAppConfig(config)
    }),
  listProducts: t.procedure
    .input(z.object({ workspacePath: workspacePathSchema }))
    .output(z.array(productIndexSchema))
    .query(async function listProduct(opts) {
      const { workspacePath } = opts.input
      const products = []
      const dirEntries = await readdir(workspacePath)
      for (const productPath of dirEntries) {
        const productId = basename(productPath)
        products.push({
          path: join(workspacePath, productPath),
          id: productId,
        })
      }
      return products
    }),
  getProductMeta: t.procedure
    .input(z.object({ productPath: productPathSchema }))
    .query(async function getProductMeta(opts) {
      const { productPath } = opts.input
      const productMetaPath = join(productPath, 'villagekit.toml')
      const productMetaData = await readTomlFile(productMetaPath)
      const productMetaFile = await productMetaFileSchema.parseAsync(productMetaData)
      const { type, entry } = productMetaFile.product
      const productMeta = {
        type,
        entry: join(productPath, entry),
      }
      return productMeta
    }),

  getProductEntry: t.procedure
    .input(z.object({ productEntryPath: productEntrySchema }))
    .query(async function getProductAssemblyMeta(opts) {
      const { productEntryPath } = opts.input
      const productAssemblyData = await readFile(productEntryPath, 'utf8')
      return productAssemblyData
    }),
})

export type Router = typeof router

/* utils */
async function getAppConfigPath(): Promise<string> {
  const appConfigDir = app.getPath('userData')

  await mkdir(appConfigDir, { recursive: true })

  return join(appConfigDir, 'config.toml')
}

async function loadAppConfig(): Promise<AppConfig> {
  const appConfigPath = await getAppConfigPath()

  const appConfigExists = await access(appConfigPath, constants.F_OK).then(
    () => true,
    () => false,
  )

  if (appConfigExists) {
    const appConfigData = await readTomlFile(appConfigPath)
    const appConfig = await appConfigSchema.parseAsync(appConfigData)
    return appConfig
  }
  return { workspaces: [] }
}

async function saveAppConfig(appConfig: AppConfig) {
  const appConfigPath = await getAppConfigPath()
  return await writeTomlFile(appConfigPath, appConfig)
}

async function readTomlFile(filePath: string) {
  const fileString = await readFile(filePath, 'utf8')
  const fileDataKebab = parseToml(fileString)
  const fileDataCamel = mapKeysDeep(fileDataKebab, camelCase)
  return fileDataCamel
}

async function writeTomlFile(
  filePath: string,
  fileDataCamel: Record<string | number | symbol, unknown>,
) {
  const fileDataKebab = mapKeysDeep(fileDataCamel, kebabCase)
  const fileString = stringifyToml(fileDataKebab)
  await writeFile(filePath, fileString, 'utf8')
}

/**
 * https://stackoverflow.com/questions/38304401/javascript-check-if-dictionary/71975382#71975382
 */
export function isDictionary(object: unknown): object is Record<keyof never, unknown> {
  return object instanceof Object && object.constructor === Object
}

/**
 * https://stackoverflow.com/a/75010148/12468111
 */
export function mapKeysDeep(
  object: Record<keyof never, unknown>,
  callback: (key: string, value: unknown) => keyof never,
): Record<string, unknown> {
  const nextObject: Record<keyof never, unknown> = {}
  for (const [key, value] of Object.entries(object)) {
    nextObject[callback(key, value)] = iterate(value)
  }
  return nextObject

  function iterate(value: unknown): unknown {
    if (isDictionary(value)) {
      return mapKeysDeep(value, callback)
    }

    if (Array.isArray(value)) {
      return value.map(iterate)
    }

    return value
  }
}
