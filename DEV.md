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

> **Note:** the engine consumes [`@villagekit/ui`](https://github.com/villagekit/ui) (the standalone Village Kit component library) as a regular npm dependency. To work on `@villagekit/ui` alongside the engine, install from inside the parent [`gridbeam.xyz`](https://github.com/villagekit/gridbeam.xyz) repo — its top-level pnpm workspace links the local `./ui` checkout into the engine's packages.

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

## Releasing

Releases are tag-driven. From a green `main`:

```shell
pnpm run version:bump
```

This bumps every package's version (synced via `lerna.json`), commits, creates a
`vX.Y.Z` tag, and pushes both the commit and the tag. The
[`release-npm`](./.github/workflows/release-npm.yml) workflow then builds and
publishes all public `@villagekit/*` packages with provenance via npm OIDC
trusted publishing.

To preview what would publish without pushing, run `pnpm run release:dry`.

### One-time setup per published package

For each published `@villagekit/*` package, configure a Trusted Publisher on
npmjs.com (package page → Settings → Trusted Publishers → Add):

- Owner: `villagekit`
- Repository: `gridkit`
- Workflow filename: `release-npm.yml`

Published packages:

- `@villagekit/design`
- `@villagekit/math`
- `@villagekit/parameters`
- `@villagekit/part`
- `@villagekit/part-fastener`
- `@villagekit/part-gridbeam`
- `@villagekit/part-gridpanel`
- `@villagekit/plugin-smart-fasteners`
- `@villagekit/product`
- `@villagekit/product-kit`
- `@villagekit/sandbox`
- `@villagekit/screenshot`
- `@villagekit/units`

Until a Trusted Publisher is configured, that package's publish step fails with
an authentication error. Lerna publishes serially in dependency order, so an
unconfigured package leaves the release in a partial state — fix the config and
re-run the workflow (Actions tab → `release-npm` → Re-run jobs).

## Code Decisions

- Published JavaScript modules are in Node.js-compatible ESM-only format, due to [dual package hazard](https://nodejs.org/api/packages.html#packages_dual_package_hazard)
  - See [Pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c)
