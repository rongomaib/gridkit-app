import type { StructuralModel } from './model'
import type { SolverResult } from './results'

// The WASM module is loaded lazily on first call and cached.
// Vite handles the .wasm asset via ?url import â€” the URL is passed to wasm-bindgen's init().
// We import the JS glue from the gridkit-solver package (which the pnpm workspace links).

let wasmReady: Promise<void> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let solveWasm: ((modelJson: string) => string) | null = null

async function ensureWasm(): Promise<void> {
  if (wasmReady != null) return wasmReady

  wasmReady = (async () => {
    // Dynamic import keeps the WASM glue out of the main bundle until first use.
    const wasmModule = await import('gridkit-solver')
    // The default export is the async init function; call it without an argument
    // so it fetches the .wasm binary from the same URL as the JS glue (standard behaviour).
    await wasmModule.default()
    solveWasm = wasmModule.solve
  })()

  return wasmReady
}

/**
 * Run the in-browser WASM solver against a StructuralModel.
 *
 * Returns a SolverResult.  When ok === false the error field describes the problem.
 * This function never throws â€” solver errors are reported via result.ok / result.error.
 */
export async function runSolver(model: StructuralModel): Promise<SolverResult> {
  try {
    await ensureWasm()
    if (solveWasm == null) {
      return { ok: false, error: 'WASM module failed to initialise', loadCaseResults: [] }
    }
    const json = JSON.stringify(model)
    const raw = solveWasm(json)
    const result = JSON.parse(raw) as SolverResult
    return result
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      loadCaseResults: [],
    }
  }
}
