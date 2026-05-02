# Development

## Code Overview

### `apps`

Applications

#### `@villagekit/studio`

A CAD-as-code app for designing products

#### `@villagekit/storybook`

A Storybook app

### `core`

Core modules

#### `@villagekit/parameters`

Module parameters

#### `@villagekit/part`

Modular part type dispatcher

#### `@villagekit/product`

Modular product type dispatcher

#### `@villagekit/sandbox`

WebGL product renderer

#### `@villagekit/design`

User-facing code-as-CAD modeling interface

### `part`

Modular part types

#### `@villagekit/part-gridbeam`

#### `@villagekit/part-gridpanel`

### `product`

Modular product types

#### `@villagekit/product-kit`

### `util`

Utility libraries

#### `@villagekit/units`

#### `@villagekit/math`

### `dev`

Developer tools

#### `@villagekit/tsconfig`

Shared TypeScript configs

## How To Get Started

To get started, first we need to install [`nvm`](https://github.com/nvm-sh/nvm) (or similar).

Then clone this git repo:

```shell
git clone https://github.com/villagekit/gridkit
```

Then move inside, install Node, and install the project dependencies.

```shell
cd gridkit
nvm install
pnpm install
```

> **Note:** the engine consumes `@villagekit/ui` (the standalone Village Kit component library) as a regular npm dependency. Until that package's Chakra v3 line is published to npm, install the engine from inside the parent [`gridbeam.xyz`](https://github.com/villagekit/gridbeam.xyz) repo — its top-level pnpm workspace links the local `./ui` checkout into the engine's packages. Running `pnpm install` directly inside `./gridkit` works once `@villagekit/ui@^1.0.0-beta` is published.

Now you can run any of the scripts below:

## Scripts

### Develop

Start live development servers

```shell
pnpm run dev
```

### Build

Build code

```shell
pnpm run build
```

### Lint

Lint code using [Biome](https://biomejs.dev/)

```shell
pnpm run lint
```

### Format

Format code using [Biome](https://biomejs.dev/)

```shell
pnpm run format
```

## Code Decisions

- Published JavaScript modules are in Node.js-compatible ESM-only format, due to [dual package hazard](https://nodejs.org/api/packages.html#packages_dual_package_hazard)
  - See [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
