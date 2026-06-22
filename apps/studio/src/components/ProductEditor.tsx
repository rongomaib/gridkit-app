import { useUpdateProductFileMutation } from '@/client'
import { useEditorContext } from '@/context/editor'
import { useWorkspaceContext } from '@/context/workspace'
import { useWorkspacesContext } from '@/context/workspaces'
import { getTypeScriptExtensions } from '@/editor/typescript'
import { useProductMeta } from '@villagekit/product'
import { Box, Text } from '@villagekit/ui'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useProductHistory } from './useProductHistory'

interface ProductEditorProps {}

export function ProductEditor(_props: ProductEditorProps) {
  const { exports } = useProductMeta()
  const { setParentEl, setLanguageExtensions, code, scrollToLine, setCodeToLoad } =
    useEditorContext()

  const { activeWorkspace } = useWorkspacesContext()
  const { activeProductIndex } = useWorkspaceContext()
  const workspacePath = activeWorkspace?.path
  const productPath = activeProductIndex?.path
  const fileName = exports

  const { history, autosave, isReady, saveToHistory, saveAutosave, clearAutosave } =
    useProductHistory(workspacePath, productPath)

  const [showHistory, setShowHistory] = useState(false)
  const [showRecover, setShowRecover] = useState(false)

  // Initialization & auto-save prompts
  const [initialCodeLoaded, setInitialCodeLoaded] = useState(false)

  useEffect(() => {
    if (code && !initialCodeLoaded) {
      setInitialCodeLoaded(true)
    }
  }, [code, initialCodeLoaded])

  const hasCheckedRecover = useRef(false)
  useEffect(() => {
    if (isReady && initialCodeLoaded && !hasCheckedRecover.current) {
      hasCheckedRecover.current = true
      if (autosave && autosave !== code) {
        setShowRecover(true)
      }
    }
  }, [isReady, initialCodeLoaded, autosave, code])

  useEffect(() => {
    if (exports.endsWith('.ts')) {
      getTypeScriptExtensions().then((languageExtensions) => {
        setLanguageExtensions(languageExtensions)
      })
    } else {
      throw new Error(`Unexpected product exports file extension: ${exports}`)
    }
  }, [exports, setLanguageExtensions])

  const parentRef = useRef(null)
  useEffect(() => {
    if (parentRef.current == null) return
    setParentEl(parentRef.current)
  }, [setParentEl])

  const codeRef = useRef(code)
  codeRef.current = code
  const lastSearchRef = useRef({ id: '', index: 0 })

  // Auto-save debounce
  useEffect(() => {
    if (!isReady || !initialCodeLoaded) return
    const timeout = setTimeout(() => {
      saveAutosave(code)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [code, isReady, initialCodeLoaded, saveAutosave])

  const updateFile = useUpdateProductFileMutation({
    onSuccess() {
      clearAutosave()
    },
  })

  const handleSave = useCallback(() => {
    if (!workspacePath || !productPath || !fileName) return
    const currentCode = codeRef.current
    saveToHistory(currentCode)
    updateFile.mutate({ workspacePath, productPath, fileName, content: currentCode })
  }, [workspacePath, productPath, fileName, saveToHistory, updateFile])

  useEffect(() => {
    const handleInspect = (e: any) => {
      const { id, type } = e.detail
      const currentCode = codeRef.current

      let targetLine = -1

      // Strip the numeric index prefix the engine prepends (e.g. "0__front-post-0" → "front-post-0").
      // The engine builds IDs as `${parentIndices.join('__')}__${userId}` in helpers.ts,
      // so we skip leading all-numeric segments to recover the user-provided id.
      let searchId = id
      if (searchId.includes('__')) {
        const segments = searchId.split('__')
        const firstNonNumericIdx = segments.findIndex((s: string) => !/^\d+$/.test(s))
        searchId = firstNonNumericIdx === -1 ? '' : segments.slice(firstNonNumericIdx).join('__')
      }

      const lines = currentCode.split('\n')

      let exactIndex = lines.findIndex(
        (l) =>
          l.includes(`id: '${searchId}'`) ||
          l.includes(`id: "${searchId}"`) ||
          l.includes(`id: \`${searchId}\``),
      )

      // 1b. If exact match fails, use a robust word-overlap scoring system
      if (exactIndex === -1) {
        // Extract meaningful words from the ID (ignoring numbers, hyphens, and engine suffixes)
        const searchWords = searchId.split(/[^a-zA-Z]+/).filter((w: string) => w.length > 2)

        let bestScore = 0
        let bestIndex = -1

        for (let i = 0; i < lines.length; i++) {
          const l = lines[i]
          if (l.includes('id:')) {
            let score = 0
            for (const w of searchWords) {
              if (l.includes(w)) score++
            }
            if (score > bestScore) {
              bestScore = score
              bestIndex = i
            }
          }
        }

        if (bestScore > 0) {
          exactIndex = bestIndex
        }
      }

      if (exactIndex >= 0) {
        targetLine = exactIndex + 1
      } else {
        // 2. Best-effort search based on part type, cycle through matches
        let typeStr = ''
        if (type === 'gridbeam') typeStr = 'GridBeam.'
        if (type === 'gridpanel') typeStr = 'GridPanel.'
        if (type === 'fastener') typeStr = 'Fastener.'

        if (typeStr) {
          const matchIndices: number[] = []
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(typeStr)) {
              matchIndices.push(i)
            }
          }

          if (matchIndices.length > 0) {
            if (lastSearchRef.current.id === id) {
              lastSearchRef.current.index = (lastSearchRef.current.index + 1) % matchIndices.length
            } else {
              lastSearchRef.current.id = id
              lastSearchRef.current.index = 0
            }
            targetLine = matchIndices[lastSearchRef.current.index] + 1
          }
        }
      }

      if (targetLine > 0) {
        scrollToLine(targetLine)
      }
    }

    window.addEventListener('inspect-part-in-code', handleInspect)
    return () => window.removeEventListener('inspect-part-in-code', handleInspect)
  }, [scrollToLine])

  useEffect(() => {
    const handleUpdateProperty = (e: any) => {
      const { id, property, value, mode = 'shift' } = e.detail
      const currentCode = codeRef.current

      let searchIdStripped = id
      if (id.includes('__')) {
        const segments = id.split('__')
        const firstNonNumericIdx = segments.findIndex((s: string) => !/^\d+$/.test(s))
        searchIdStripped =
          firstNonNumericIdx === -1 ? '' : segments.slice(firstNonNumericIdx).join('__')
      }

      const lines = currentCode.split('\n')

      const idRegex = new RegExp(`\\bid\\s*:\\s*(['"\`])${id}\\1`)
      const strippedIdRegex = new RegExp(`\\bid\\s*:\\s*(['"\`])${searchIdStripped}\\1`)

      let startIndex = lines.findIndex((l: string) => idRegex.test(l))

      if (startIndex === -1 && searchIdStripped !== id) {
        startIndex = lines.findIndex((l: string) => strippedIdRegex.test(l))
      }

      if (startIndex === -1) {
        // Fallback: robust word-overlap scoring system for dynamically generated IDs
        const searchWords = searchIdStripped.split(/[^a-zA-Z]+/).filter((w: string) => w.length > 2)
        let bestScore = 0
        let bestIndex = -1

        for (let i = 0; i < lines.length; i++) {
          const l = lines[i]
          if (l.includes('id:')) {
            let score = 0
            for (const w of searchWords) {
              if (l.includes(w)) score++
            }
            if (score > bestScore) {
              bestScore = score
              bestIndex = i
            }
          }
        }

        if (bestScore > 0) {
          startIndex = bestIndex
          console.log(
            'handleUpdateProperty: Found fallback match for ID using word overlap:',
            lines[startIndex],
          )
        }
      }

      if (startIndex === -1) {
        console.warn(
          'handleUpdateProperty: Could not find part block for',
          id,
          'or',
          searchIdStripped,
        )
        return
      }

      let openBraces = 0
      let blockStartIndex = -1
      for (let i = startIndex; i >= 0; i--) {
        const strippedLine = lines[i].replace(/\$\{[^}]+\}/g, 'x')
        if (strippedLine.includes('{')) {
          blockStartIndex = i
          break
        }
      }

      if (blockStartIndex === -1) {
        console.warn('handleUpdateProperty: Could not find { before line', startIndex)
        return
      }

      for (let i = blockStartIndex; i < lines.length; i++) {
        const strippedLine = lines[i].replace(/\$\{[^}]+\}/g, 'x')
        openBraces += (strippedLine.match(/\{/g) || []).length
        openBraces -= (strippedLine.match(/\}/g) || []).length

        if (openBraces === 0 && i !== blockStartIndex) break

        const arrayPropRegex = new RegExp(
          `\\b${property}\\s*:\\s*\\[\\s*(.+?)\\s*,\\s*(.+?)\\s*\\]`,
        )
        const numPropRegex = new RegExp(`\\b${property}\\s*:\\s*([^,}\\n]+)`)

        const arrayMatch = lines[i].match(arrayPropRegex)
        const numMatch = lines[i].match(numPropRegex)

        const shiftExpr = (expr: string, val: number) => {
          const trimmed = expr.trim()
          if (val === 0) return trimmed
          const num = Number(trimmed)
          if (!Number.isNaN(num)) return String(num + val)

          const match = trimmed.match(/^(.*?)(?:\s*([+-])\s*)(\d+)$/)
          if (match) {
            const base = match[1].trim()
            const operator = match[2] === '+' ? 1 : -1
            const existingNum = Number.parseInt(match[3])

            const newTotal = operator * existingNum + val

            if (base === '') {
              return String(newTotal)
            }
            if (newTotal === 0) {
              return base
            }
            if (newTotal > 0) {
              return `${base} + ${newTotal}`
            }
            return `${base} - ${Math.abs(newTotal)}`
          }

          return val > 0 ? `${trimmed} + ${val}` : `${trimmed} - ${Math.abs(val)}`
        }

        if (arrayMatch) {
          let startStr = arrayMatch[1].trim()
          let endStr = arrayMatch[2].trim()
          if (mode === 'start' || mode === 'shift') startStr = shiftExpr(startStr, value)
          if (mode === 'end' || mode === 'shift') endStr = shiftExpr(endStr, value)
          lines[i] = lines[i].replace(arrayPropRegex, `${property}: [${startStr}, ${endStr}]`)
          const newCode = lines.join('\n')
          setCodeToLoad(newCode)
          console.log(
            'handleUpdateProperty: Successfully updated array property',
            property,
            'to',
            `[${startStr}, ${endStr}]`,
          )
          if (workspacePath && productPath && fileName) {
            updateFile.mutate({ workspacePath, productPath, fileName, content: newCode })
          }
          return
        }
        if (numMatch) {
          const numStr = shiftExpr(numMatch[1].trim(), value)
          lines[i] = lines[i].replace(numPropRegex, `${property}: ${numStr}`)
          const newCode = lines.join('\n')
          setCodeToLoad(newCode)
          console.log(
            'handleUpdateProperty: Successfully updated numeric property',
            property,
            'to',
            numStr,
          )
          if (workspacePath && productPath && fileName) {
            updateFile.mutate({ workspacePath, productPath, fileName, content: newCode })
          }
          return
        }
      }

      console.warn('handleUpdateProperty: Could not find property', property, 'in block for', id)
    }

    window.addEventListener('update-part-property', handleUpdateProperty)
    return () => window.removeEventListener('update-part-property', handleUpdateProperty)
  }, [setCodeToLoad, workspacePath, productPath, fileName, updateFile])

  // Handles the single combined gizmo drag-end event (all three axis deltas at once).
  useEffect(() => {
    const handleUpdatePosition = (e: any) => {
      const { id, dx, dy, dz } = e.detail
      if (dx === 0 && dy === 0 && dz === 0) return

      const currentCode = codeRef.current

      let searchId = id
      if (id.includes('__')) {
        const segments = id.split('__')
        const firstNonNumericIdx = segments.findIndex((s: string) => !/^\d+$/.test(s))
        searchId = firstNonNumericIdx === -1 ? '' : segments.slice(firstNonNumericIdx).join('__')
      }

      const lines = currentCode.split('\n')

      const idRegex = new RegExp(`\\bid\\s*:\\s*(['"\`])${id}\\1`)
      const strippedIdRegex = new RegExp(`\\bid\\s*:\\s*(['"\`])${searchId}\\1`)

      let startIndex = lines.findIndex((l: string) => idRegex.test(l))
      if (startIndex === -1 && searchId !== id) {
        startIndex = lines.findIndex((l: string) => strippedIdRegex.test(l))
      }

      if (startIndex === -1) {
        console.warn('handleUpdatePosition: Could not find part block for', id)
        return
      }

      let blockStartIndex = -1
      for (let i = startIndex; i >= 0; i--) {
        if (lines[i].replace(/\$\{[^}]+\}/g, 'x').includes('{')) {
          blockStartIndex = i
          break
        }
      }
      if (blockStartIndex === -1) return

      const shiftExpr = (expr: string, val: number): string => {
        const trimmed = expr.trim()
        if (val === 0) return trimmed
        const num = Number(trimmed)
        if (!Number.isNaN(num)) return String(num + val)
        const match = trimmed.match(/^(.*?)(?:\s*([+-])\s*)(\d+)$/)
        if (match) {
          const base = match[1].trim()
          const operator = match[2] === '+' ? 1 : -1
          const existingNum = Number.parseInt(match[3])
          const newTotal = operator * existingNum + val
          if (base === '') return String(newTotal)
          if (newTotal === 0) return base
          if (newTotal > 0) return `${base} + ${newTotal}`
          return `${base} - ${Math.abs(newTotal)}`
        }
        return val > 0 ? `${trimmed} + ${val}` : `${trimmed} - ${Math.abs(val)}`
      }

      const applyDelta = (prop: string, delta: number) => {
        if (delta === 0) return
        let openBraces = 0
        for (let i = blockStartIndex; i < lines.length; i++) {
          const strippedLine = lines[i].replace(/\$\{[^}]+\}/g, 'x')
          openBraces += (strippedLine.match(/\{/g) || []).length
          openBraces -= (strippedLine.match(/\}/g) || []).length
          if (openBraces === 0 && i !== blockStartIndex) break

          const arrayPropRegex = new RegExp(`\\b${prop}\\s*:\\s*\\[\\s*(.+?)\\s*,\\s*(.+?)\\s*\\]`)
          const numPropRegex = new RegExp(`\\b${prop}\\s*:\\s*([^,}\\n]+)`)
          const arrayMatch = lines[i].match(arrayPropRegex)
          const numMatch = lines[i].match(numPropRegex)

          if (arrayMatch) {
            const startStr = shiftExpr(arrayMatch[1], delta)
            const endStr = shiftExpr(arrayMatch[2], delta)
            lines[i] = lines[i].replace(arrayPropRegex, `${prop}: [${startStr}, ${endStr}]`)
            return
          }
          if (numMatch) {
            const numStr = shiftExpr(numMatch[1], delta)
            lines[i] = lines[i].replace(numPropRegex, `${prop}: ${numStr}`)
            return
          }
        }
      }

      applyDelta('x', dx)
      applyDelta('y', dy)
      applyDelta('z', dz)

      const newCode = lines.join('\n')
      setCodeToLoad(newCode)
      if (workspacePath && productPath && fileName) {
        updateFile.mutate({ workspacePath, productPath, fileName, content: newCode })
      }
    }

    window.addEventListener('update-part-position', handleUpdatePosition)
    return () => window.removeEventListener('update-part-position', handleUpdatePosition)
  }, [setCodeToLoad, workspacePath, productPath, fileName, updateFile])

  useEffect(() => {
    const handleSetProperty = (e: any) => {
      const { id, property, value } = e.detail
      const currentCode = codeRef.current

      let searchIdStripped = id
      if (id.includes('__')) {
        const segments = id.split('__')
        const firstNonNumericIdx = segments.findIndex((s: string) => !/^\d+$/.test(s))
        searchIdStripped =
          firstNonNumericIdx === -1 ? '' : segments.slice(firstNonNumericIdx).join('__')
      }

      const lines = currentCode.split('\n')

      const idRegex = new RegExp(`\\bid\\s*:\\s*(['"\`])${id}\\1`)
      const strippedIdRegex = new RegExp(`\\bid\\s*:\\s*(['"\`])${searchIdStripped}\\1`)

      let startIndex = lines.findIndex((l: string) => idRegex.test(l))

      if (startIndex === -1 && searchIdStripped !== id) {
        startIndex = lines.findIndex((l: string) => strippedIdRegex.test(l))
      }

      if (startIndex === -1) {
        const searchWords = searchIdStripped.split(/[^a-zA-Z]+/).filter((w: string) => w.length > 2)
        let bestScore = 0
        let bestIndex = -1

        for (let i = 0; i < lines.length; i++) {
          const l = lines[i]
          if (l.includes('id:')) {
            let score = 0
            for (const w of searchWords) {
              if (l.includes(w)) score++
            }
            if (score > bestScore) {
              bestScore = score
              bestIndex = i
            }
          }
        }

        if (bestScore > 0) startIndex = bestIndex
      }

      if (startIndex === -1) {
        console.warn('handleSetProperty: Could not find part block for', id)
        return
      }

      let blockStartIndex = -1
      for (let i = startIndex; i >= 0; i--) {
        const strippedLine = lines[i].replace(/\$\{[^}]+\}/g, 'x')
        if (strippedLine.includes('{')) {
          blockStartIndex = i
          break
        }
      }

      if (blockStartIndex === -1) {
        console.warn('handleSetProperty: Could not find { before line', startIndex)
        return
      }

      let openBraces = 0
      let closingLineIndex = -1
      let propertyFound = false

      for (let i = blockStartIndex; i < lines.length; i++) {
        const stripped = lines[i].replace(/\$\{[^}]+\}/g, 'x')
        openBraces += (stripped.match(/\{/g) || []).length
        openBraces -= (stripped.match(/\}/g) || []).length

        if (openBraces === 0 && i !== blockStartIndex) {
          closingLineIndex = i
          break
        }

        const strPropRegex = new RegExp('\\b' + property + "\\s*:\\s*(['\"`])[^'\"\\`]*\\1")
        if (strPropRegex.test(lines[i]!)) {
          lines[i] = lines[i]!.replace(strPropRegex, property + ": '" + value + "'")
          propertyFound = true
          break
        }
      }

      if (!propertyFound && closingLineIndex >= 0) {
        const indent = (lines[blockStartIndex]?.match(/^(\s*)/)?.[1] ?? '') + '  '
        lines.splice(closingLineIndex, 0, `${indent}${property}: '${value}',`)
      } else if (!propertyFound) {
        console.warn('handleSetProperty: Could not find closing brace for block at', blockStartIndex)
        return
      }

      const newCode = lines.join('\n')
      setCodeToLoad(newCode)
      if (workspacePath && productPath && fileName) {
        updateFile.mutate({ workspacePath, productPath, fileName, content: newCode })
      }
    }

    window.addEventListener('set-part-property', handleSetProperty)
    return () => window.removeEventListener('set-part-property', handleSetProperty)
  }, [setCodeToLoad, workspacePath, productPath, fileName, updateFile])

  const buttonStyle = {
    padding: '6px 12px',
    backgroundColor: '#000',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
  }

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#444',
  }

  return (
    <Box
      css={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        css={{
          display: 'flex',
          padding: '8px',
          borderBottom: '1px solid #ccc',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f9f9f9',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Box css={{ display: 'flex', gap: '8px' }}>
          <button type="button" style={buttonStyle} onClick={handleSave}>
            {updateFile.isLoading ? 'Saving...' : 'Save Design'}
          </button>
          <button
            type="button"
            style={secondaryButtonStyle}
            onClick={() => setShowHistory(!showHistory)}
          >
            History ({history.length})
          </button>
        </Box>
        <Text css={{ color: '#666', fontSize: '12px' }}>
          {updateFile.isSuccess ? 'Saved successfully!' : ''}
          {updateFile.error ? 'Error saving file.' : ''}
        </Text>
      </Box>

      {showRecover && (
        <Box
          css={{
            display: 'flex',
            padding: '8px',
            backgroundColor: '#fef08a',
            color: '#854d0e',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Text>Unsaved changes detected from your last session.</Text>
          <Box css={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              style={buttonStyle}
              onClick={() => {
                setCodeToLoad(autosave!)
                setShowRecover(false)
              }}
            >
              Recover
            </button>
            <button
              type="button"
              style={{
                ...buttonStyle,
                backgroundColor: 'transparent',
                color: '#854d0e',
                border: '1px solid #854d0e',
              }}
              onClick={() => {
                clearAutosave()
                setShowRecover(false)
              }}
            >
              Discard
            </button>
          </Box>
        </Box>
      )}

      {showHistory && (
        <Box
          css={{
            display: 'flex',
            flexDirection: 'column',
            padding: '8px',
            backgroundColor: '#eee',
            borderBottom: '1px solid #ccc',
            maxHeight: '200px',
            overflowY: 'auto',
            flexShrink: 0,
            zIndex: 10,
          }}
        >
          <Text css={{ fontWeight: 'bold', marginBottom: '4px' }}>Revision History</Text>
          {history.length === 0 ? (
            <Text css={{ color: '#666' }}>No history yet. Save to create a revision.</Text>
          ) : (
            history.map((rev) => (
              <Box
                key={rev.timestamp}
                css={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 0',
                  borderBottom: '1px solid #ddd',
                }}
              >
                <Text>{new Date(rev.timestamp).toLocaleString()}</Text>
                <button
                  type="button"
                  style={{ ...secondaryButtonStyle, padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => {
                    setCodeToLoad(rev.code)
                    setShowHistory(false)
                  }}
                >
                  Restore
                </button>
              </Box>
            ))
          )}
        </Box>
      )}

      <Box
        ref={parentRef}
        css={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',

          '& > .cm-editor': {
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
          },

          '& .cm-scroller': {
            flex: 1,
            minHeight: 0,
            overflowY: 'auto !important',
          },
        }}
      />
    </Box>
  )
}
