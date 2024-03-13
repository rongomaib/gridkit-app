import { DesignAssemblyPlugins, DesignMeta, DesignParts } from '@villagekit/design'
import {
  ExtractValuesFromParametersOptions,
  ParametersOptions,
  Presets,
} from '@villagekit/parameters'
import { PartVariantsByType } from '@villagekit/part'
import { ZodError } from 'zod'

export type DesignFileAssembly = {
  type: 'assembly'
  code: string
  language: 'javascript' | 'typescript'
}
export type DesignFile = DesignFileAssembly

export type DesignRenderAssembly<ParamsOptions extends ParametersOptions = never> = {
  type: 'assembly'
  meta: DesignMeta
  parameters: ParamsOptions extends never ? null : ParamsOptions
  presets: ParamsOptions extends never ? null : Presets<ParamsOptions>
  assembly: ParamsOptions extends never
    ? () => Promise<DesignParts>
    : (
        parameters: ExtractValuesFromParametersOptions<ParamsOptions>,
        partVariants: PartVariantsByType,
      ) => Promise<DesignParts>
  plugins?: DesignAssemblyPlugins
}
export type DesignRender<ParamsOptions extends ParametersOptions> =
  null | DesignRenderAssembly<ParamsOptions>

export type DesignRenderErrorStackFrame = {
  name: string
  line: number
  column: number
}
export type DesignRenderError =
  | null
  | {
      type: 'typescript.transform'
      error: string
    }
  | {
      type: 'javascript.evaluate'
      error: {
        message: string
        stack: Array<DesignRenderErrorStackFrame>
      }
    }

export type DesignValidationError = ZodError | null
export type DesignValidationKey = keyof NonNullable<DesignRender<any>>
export type DesignValidationErrors = Partial<Record<DesignValidationKey, DesignValidationError>>
export type ExtendDesignValidationErrors = (errors: DesignValidationErrors) => void

export type DesignInstance<ParamsOptions extends ParametersOptions = never> = {
  file: DesignFile
  render: DesignRender<ParamsOptions>
  renderError: DesignRenderError
  validationErrors: DesignValidationErrors
  parameterValues: ParamsOptions extends never
    ? null
    : ExtractValuesFromParametersOptions<ParamsOptions>
}
