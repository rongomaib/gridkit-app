# Grid Kit

A code-as-CAD engine for modular grid-beam designs. Powers [gridbeam.xyz](https://gridbeam.xyz).

You write a parametric design in TypeScript; the engine renders it in 3D, validates parameters, and produces a bill of materials. The catalog of designs at gridbeam.xyz/designs is built entirely from this engine and the products in [`villagekit/gridkit-products`](https://github.com/villagekit/gridkit-products).

Inspired by [NopSCADlib](https://github.com/nophead/NopSCADlib).

## Status

Active development for [gridbeam.xyz](https://gridbeam.xyz). Public API is stable enough to use; expect occasional breaking changes on minor versions until 1.0.

## Demo

A walkthrough of the design process:

[![Screenshot of the YouTube demo](./demo.png)](https://youtu.be/tMxWzfpn7Kg)

<https://youtu.be/tMxWzfpn7Kg> 📺

The video is from an earlier version, but the workflow is unchanged.

## Get started

**Use the engine via the website.** Visit [gridbeam.xyz/designs](https://gridbeam.xyz/designs) to browse the catalog and configure designs in the browser. No install needed.

**Run the studio app locally.** The studio is a desktop CAD-as-code editor for authoring new designs.

```sh
git clone https://github.com/villagekit/gridkit
cd gridkit
pnpm install
pnpm dev:app:studio
```

![Screenshot of the Grid Kit Studio app](./apps/studio/screenshot.png)

**Use the libraries directly.** The core packages are published to npm under the `@villagekit/*` scope:

```sh
pnpm add @villagekit/design @villagekit/sandbox @villagekit/parameters
```

See [`villagekit/gridkit-products`](https://github.com/villagekit/gridkit-products) for example designs, and [DEV.md](./DEV.md) for the full development workflow.

## Packages

### Core

| Package | Purpose |
|---------|---------|
| [`@villagekit/design`](./core/design) | Convenience entry point bundling parts, plugins, and the `kit` product type for design authors |
| [`@villagekit/parameters`](./core/parameters) | React UI for editing product parameters (presets, values, URL state) |
| [`@villagekit/part`](./core/part) | Modular part type dispatcher |
| [`@villagekit/product`](./core/product) | Modular product type dispatcher |
| [`@villagekit/sandbox`](./core/sandbox) | WebGL product renderer (Three.js + react-three-fiber) |

### Parts

| Package | Purpose |
|---------|---------|
| [`@villagekit/part-gridbeam`](./parts/gridbeam) | Grid beam part — a 40 mm extruded modular beam |
| [`@villagekit/part-gridpanel`](./parts/gridpanel) | Grid panel part — a 40 mm-grid flat panel |
| [`@villagekit/part-fastener`](./parts/fastener) | Fastener parts (bolts, nuts, washers) |

### Products

| Package | Purpose |
|---------|---------|
| [`@villagekit/product-kit`](./products/kit) | Reference assembly product type |

### Plugins

| Package | Purpose |
|---------|---------|
| [`@villagekit/plugin-smart-fasteners`](./kit-plugins/smart-fasteners) | Auto-place fasteners between connected beams |

### Utilities

| Package | Purpose |
|---------|---------|
| [`@villagekit/math`](./util/math) | Geometry helpers used by parts and the renderer |
| [`@villagekit/units`](./util/units) | Unit conversions (mm ↔ grid holes ↔ inches) |

### Commands

| Package | Purpose |
|---------|---------|
| [`@villagekit/screenshot`](./commands/screenshot) | Headless CLI for rendering product screenshots from a workspace manifest |

## Studio app

The studio (`apps/studio`) is a Tauri-wrapped desktop CAD-as-code editor for authoring new designs against this engine. It bundles the engine packages, a CodeMirror TypeScript editor, and a react-three-fiber preview into a Mac/Windows/Linux app.

The studio stays a **separate downloadable desktop app** — it isn't embedded into [gridbeam.xyz](https://gridbeam.xyz). Browser users configure existing designs through the website's parameter UI; design authoring happens locally in the studio. This keeps the website fast and lets the studio do file-system things a browser tab can't.

Build it from source via the [Get started](#get-started) instructions, or — once releases ship — download the latest from the [GitHub releases page](https://github.com/villagekit/gridkit/releases).

## Contributing

See [DEV.md](./DEV.md) for environment setup, package layout, and code conventions.

## See also

A separate, more ambitious engine effort lives at [`villagekit/villagekit`](https://github.com/villagekit/villagekit). The two projects share lineage but evolve independently for now — this one powers gridbeam.xyz today.

## License

Licensed under the [European Union Public Licence v. 1.2](./LICENSE) ([summary](https://choosealicense.com/licenses/eupl-1.2/)).

Public packages (`core/*`, `parts/*`, `products/*`, `kit-plugins/*`, `util/*`, `commands/*`) are EUPL-1.2. The `apps/*` and `dev/tsconfig` packages are marked private and not separately licensed.
