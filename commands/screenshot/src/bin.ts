#!/usr/bin/env -S npx tsx

import { readFile, readdir } from 'node:fs/promises'
import http from 'node:http'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { type ArgscloptsParseArgsOptionsConfig, printHelpText } from 'argsclopts'
import puppeteer from 'puppeteer'
import serve from 'serve-handler'
import Toml from 'smol-toml'

const PORT = 8678

const pkgPath = join(import.meta.dirname, '../package.json')

const argsOptions: ArgscloptsParseArgsOptionsConfig = {
  workspace: {
    type: 'string',
    short: 'w',
    help: 'The Village Kit workspace to generate screenshots for',
  },
  product: {
    type: 'string',
    short: 'p',
    help: 'The Village Kit product(s) to generate screenshots for',
    multiple: true,
  },
  help: {
    type: 'boolean',
    short: 'h',
    help: 'Print command usage',
  },
}

const args = process.argv.slice(2)
const { values } = parseArgs({ args, options: argsOptions })

if (values.help || values.workspace == null) {
  await printHelpText({ options: argsOptions, pkgPath })
} else {
  await run()
}

async function run() {
  const server = http.createServer((request, response) => {
    return serve(request, response, {
      public: join(import.meta.dirname, '../dist'),
      directoryListing: false,
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.listen(PORT)
    server.once('listening', () => {
      console.log(`Server at http://localhost:${PORT}`)
      resolve()
    })
    server.once('error', reject)
  })

  const browser = await puppeteer.launch()

  const workspaceDir = values.workspace as string
  const productsDir = join(workspaceDir, 'products')
  for (const productId of await readdir(productsDir)) {
    if (values.product && !(values.product as Array<string>).includes(productId)) {
      continue
    }

    console.log(`Capturing screenshot of ${productId}`)
    const productDir = join(productsDir, productId)
    const productMetaPath = join(productDir, 'villagekit.toml')
    const productMetaStr = await readFile(productMetaPath, 'utf8')
    const productMeta = Toml.parse(productMetaStr).product

    // @ts-ignore
    const productCodePath = join(productDir, productMeta.exports)
    const productCode = await readFile(productCodePath, 'utf8')

    const qs = `meta=${encodeURIComponent(Buffer.from(JSON.stringify(productMeta), 'utf8').toString('base64'))}`
    const hash = Buffer.from(productCode, 'utf8').toString('base64')
    const page = await browser.newPage()
    await page.setViewport({ width: 1600, height: 1200, deviceScaleFactor: 1 })
    await page.goto(`http://localhost:${PORT}?${qs}#${hash}`)

    // wait 5 seconds
    await new Promise((resolve) => setTimeout(resolve, 5000))

    const screenshotPath = join(productDir, `${productId}.png`)
    console.log(`Writing screenshot to ${screenshotPath}`)
    await page.screenshot({
      path: screenshotPath,
      omitBackground: true,
    })
  }

  await browser.close()
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()))
  })
}
