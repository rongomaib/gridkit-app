const { Buffer } = require('buffer')
const { readFileSync, writeFileSync } = require('fs')
const { join } = require('path')
const comlinkSrcPath = require.resolve('comlink/dist/esm/comlink.mjs')
const comlinkData = Buffer.from(readFileSync(comlinkSrcPath, 'utf8'))
const comlinkDataBase64 = comlinkData.toString('base64')
const comlinkDataUrl = `data:application/javascript;base64,${comlinkDataBase64}`
const comlinkDataUrlFile = `export const comlinkDataUrl = "${comlinkDataUrl}"`
const comlinkDstPath = join(__dirname, '../src/comlink.ts')
writeFileSync(comlinkDstPath, comlinkDataUrlFile, 'utf8')
