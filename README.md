# Village Kit

Open source software to power [Village Kit](https://villagekit.com/):

> Village Kit is a modular system for building physical things with a focus on peer production and circular economies.

## Code

### `apps`: Applications

#### `@villagekit/storybook`: A Storybook app

#### `@villagekit/designer`: A Storybook app

- [Pre-requisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### `ui`: User interface

#### `@villagekit/ui`: Base Component Library

#### `@villagekit/parameters`: Module Parameters

#### `@villagekit/product`: Modular Product

#### `@villagekit/sandbox`: Product Renderer

### `part`: Modular Parts

#### `@villagekit/part`

#### `@villagekit/part-gridbeam`

#### `@villagekit/part-gridpanel`

### `dev` Developer tools

#### `@villagekit/eslint-config`

Shared ESLint configs.

#### `@villagekit/tsconfig`

Shared TypeScript configs.

## Development

To get started, first we need to install [`nvm`](https://github.com/nvm-sh/nvm) (or similar).

```shell
nvm install --lts
```

Then install [`pnpm`](https://pnpm.io/)

```shell
npm install -g pnpm
```

Then clone this git repo:

```shell
git clone https://github.com/villagekit/villagekit
```

Then move inside and install the dependencies.

```shell
cd villagekit
pnpm install
```

Now you can run any of the scripts below:

## Scripts

### Develop

Start live development servers

```shell
pnpm dev
```

### Build

Build code

```shell
pnpm build
```

### Lint

Lint code using [Biome](https://biomejs.dev/)

```shell
pnpm lint
```

### Format

Format code using [Biome](https://biomejs.dev/)

```shell
pnpm format
```
