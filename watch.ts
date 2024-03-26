import { join } from 'node:path'
import { type KickstartContext, type PackageInfo, type Trigger, watchTree } from 'turbotree'

const triggers = (p: PackageInfo): Trigger[] => [
  {
    expression: [
      'allof',
      [
        'not',
        [
          'anyof',
          ['dirname', 'dist'],
          ['dirname', 'dist-type-bundles'],
          ['dirname', 'node_modules'],
        ],
      ],
      [
        'anyof',
        [
          'allof',
          ['dirname', join(p.root, 'src')],
          [
            'anyof',
            ['match', '*.ts', 'basename'],
            ['match', '*.tsx', 'basename'],
            ['match', '*.css', 'basename'],
          ],
        ],
        [
          'allof',
          ['dirname', join(p.root, 'stories')],
          [
            'anyof',
            ['match', '*.ts', 'basename'],
            ['match', '*.tsx', 'basename'],
            ['match', '*.mdx', 'basename'],
          ],
        ],
      ],
    ],
    name: `${p.name}:build:pkg`,
    initialRun: false,
    onChange: async ({ spawn, files }) => {
      console.log(`${p.root}: changes detected: ${files.map((f) => f.name)}`)
      await spawn`npx turbo build:pkg --output-logs=new-only ${p.turboFilterFlags}`
    },
  },
]

const kickstartCommand = async (k: KickstartContext) =>
  k.$`npx turbo build:pkg --output-logs=new-only ${k.turboFilterFlags}`

watchTree(__dirname, triggers, kickstartCommand)
