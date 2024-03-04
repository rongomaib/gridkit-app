import { ParametersOptions } from '@villagekit/parameters'

import { DesignFile, DesignRender } from '../types'

import { DesignRendererAssemblyJavaScript } from './javascript'
import { DesignRendererAssemblyTypeScript } from './typescript'

export type RenderOutput<ParamsOptions extends ParametersOptions> =
  DesignRender<ParamsOptions> | null
export type RenderError = string | Error | null

export type RendererProps<ParamsOptions extends ParametersOptions> = {
  setRender: (render: RenderOutput<ParamsOptions>) => void
  setError: (error: RenderError) => void
}

export function DesignRenderer<ParamsOptions extends ParametersOptions>(
  props: RendererProps<ParamsOptions> & { file: DesignFile },
): React.ReactNode {
  const { file, ...rest } = props

  switch (file.type) {
    case 'assembly':
      switch (file.language) {
        case 'typescript':
          return <DesignRendererAssemblyTypeScript code={file.code} {...rest} />
        case 'javascript':
          return <DesignRendererAssemblyJavaScript code={file.code} {...rest} />
      }
  }
}
