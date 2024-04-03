import { z } from 'zod'

// https://stackoverflow.com/questions/1221985/how-to-validate-a-user-name-with-regex
const NAME_RE = /^@[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*\/[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/

const TAG_RE = /^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/

// https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
// const VERSION_RE

// https://stackoverflow.com/questions/537772/what-is-the-most-correct-regular-expression-for-a-unix-file-path
const PATH_RE = /^[^\0]+$/

const nameSchema = z.string().regex(NAME_RE)
const tagSchema = z.string().regex(TAG_RE)
const pathSchema = z.string().regex(PATH_RE)

const productBaseMetaSchema = z.object({
  name: nameSchema,
  label: z.string().min(1),
  description: z.string(),
  exports: pathSchema,
  tags: z.array(tagSchema).optional(),
})

const productKitMetaSchema = productBaseMetaSchema.extend({
  type: z.literal('kit'),
})

export const productMetaSchema = z.discriminatedUnion('type', [productKitMetaSchema])
