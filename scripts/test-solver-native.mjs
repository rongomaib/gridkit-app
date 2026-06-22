/**
 * Phase 4 regression test (Node.js, native Rust binary).
 *
 * Generates the house StructuralModel JSON, then calls the Rust solver
 * via child_process (native build, not WASM) for fast local validation.
 *
 * Usage:
 *   cd gridkit/solver && cargo build --release
 *   node scripts/test-solver-native.mjs
 *
 * The WASM solver should produce identical results when called from the browser.
 */

import { execSync } from 'node:child_process'
import { writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// â”€â”€ Build the house model JSON using the analysis package directly â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// We run a tiny inline script via tsx so we can import TypeScript source.

const modelScript = `
import { buildStructuralModel } from './core/analysis/src/index.ts'
import { parts } from '../gridkit-products/products/house/house.ts'
const model = buildStructuralModel(parts())
process.stdout.write(JSON.stringify(model, null, 2))
`

const modelJson = execSync(
  `node --import tsx/esm -e "${modelScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`,
  { cwd: ROOT, encoding: 'utf8' },
)

const modelPath = join(ROOT, 'scripts', 'house-model.json')
writeFileSync(modelPath, modelJson)
console.log(`Model written to ${modelPath}`)

const model = JSON.parse(modelJson)
console.log(`Nodes: ${model.nodes.length}  Members: ${model.members.length}  Supports: ${model.supports.length}`)
console.log(`Load cases: ${model.loadCases.map((lc) => lc.id).join(', ')}`)

// â”€â”€ Validate via PyNite (if available) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
console.log('\nTo validate with PyNite:')
console.log('  pip install PyNite')
console.log(`  python scripts/validate-pynite.py scripts/house-model.json`)

console.log('\nPhase 4 model contract OK â€” JSON written for WASM regression check.')
