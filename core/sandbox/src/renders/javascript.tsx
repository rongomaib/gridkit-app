import React, { useEffect } from 'react'

import { RendererProps } from './'
import { designAssemblySafeParse } from '@villagekit/design'

export function DesignRendererAssemblyJavaScript(
  props: RendererProps<any> & { code: string | null },
) {
  const { code: jsCode, setRender, setError } = props

  useEffect(() => {
    if (jsCode == null) return
    ;(async () => {
      const jsCodeWithoutImports = jsCode.replace(
        /import (.*) from [\"\']@villagekit\/design[\"\']/,
        'const $1 = villagekit.design',
      )
      const jsModuleCode = `
        "use strict";

        const villagekit = {
          design: {
            DesignAssemblyParameterized: (design) => ({ type: 'parameterized', ...design })
          }
        }

        ${jsCodeWithoutImports}
      `

      let jsModule
      try {
        const jsModuleUrl = URL.createObjectURL(
          new Blob([jsModuleCode], { type: 'text/javascript' }),
        )
        jsModule = await import(/* @vite-ignore */ jsModuleUrl)
        URL.revokeObjectURL(jsModuleUrl)
      } catch (error) {
        if (error instanceof Error || typeof error === 'string') {
          console.error('eval', error)
          setError(error)
          return
        } else {
          throw error
        }
      }

      // validate module
      if (jsModule == null) return
      const assemblyResult = designAssemblySafeParse(jsModule)

      if (assemblyResult == null) return
      if (assemblyResult.success) {
        console.log('render', assemblyResult.data)
        const { meta, assembly } = assemblyResult.data
        if (typeof assembly === 'function') {
          // TODO: fix
          // @ts-ignore
          const { parameters, presets } = assemblyResult.data
          setRender({
            type: 'assembly',
            meta,
            parameters,
            presets,
            // TODO: fix
            // @ts-ignore
            // createParts: assembly,
            createParts: (...args) => Promise.resolve(assembly(...args)),
          })
        } else {
          setRender({
            type: 'assembly',
            meta,
            parameters: null,
            presets: null,
            // TODO: fix
            // @ts-ignore
            createParts: () => Promise.resolve(assembly),
          })
        }
        setError(null)
      } else {
        console.error('validate', assemblyResult.error)
        setError(assemblyResult.error)
      }
    })()
  }, [jsCode, setRender, setError])

  return <React.Fragment />
}
