# Village Kit

Open source software to power [Village Kit](https://villagekit.com/):

> Village Kit is a modular system for building physical things with a focus on peer production and circular economies.

## Get Started

To get started with the CAD-as-code modular design app.

Download the [latest app release](https://github.com/villagekit/villagekit/releases).

For an example workspace of modular products, see [`villagekit/products`](https://github.com/villagekit/products).

## Code Overview

### `apps`

Applications

#### `@villagekit/studio`

A CAD-as-code app for designing products

#### `@villagekit/storybook`

A Storybook app

### `core`

Core modules

#### `@villagekit/ui`

Base component library

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

#### `@villagekit/util-units`

#### `@villagekit/util-math`

### `dev`

Developer tools

#### `@villagekit/tsconfig`

Shared TypeScript configs

## Development

To get started, first we need to install [`nvm`](https://github.com/nvm-sh/nvm) (or similar).

Then clone this git repo:

```shell
git clone https://github.com/villagekit/villagekit
```

Then move inside, install Node, and install the project dependencies.

```shell
cd villagekit
nvm install
npm install
```

Now you can run any of the scripts below:

## Scripts

### Develop

Start live development servers

```shell
npm run dev
```

### Build

Build code

```shell
npm run build
```

### Lint

Lint code using [Biome](https://biomejs.dev/)

```shell
npm run lint
```

### Format

Format code using [Biome](https://biomejs.dev/)

```shell
npm run format
```

## Code Decisions

- Published JavaScript modules are in Node.js-compatible ESM-only format, due to [dual package hazard](https://nodejs.org/api/packages.html#packages_dual_package_hazard)
