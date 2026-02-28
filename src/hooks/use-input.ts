/**
 * useInput フック - 入力エリアの制御
 *
 * テキスト入力の状態管理と、agentState に基づく
 * 無効化制御を提供する。
 */

import { useState, useCallback, useMemo } from 'react'
import type { AgentState } from '../rpc/types.js'

// =============================================================================
// Types
// =============================================================================

interface UseInputOptions {
  readonly agentState: AgentState
  readonly onSubmit: (text: string) => Promise<void>
}

interface UseInputResult {
  readonly value: string
  readonly displayValue: string
  readonly isMultiLine: boolean
  readonly lineCount: number
  readonly onChange: (value: string) => void
  readonly handleSubmit: (value: string) => void
  readonly clearMultiLine: () => void
  readonly isDisabled: boolean
}

// =============================================================================
// useInput フック
// =============================================================================

/**
 * 入力エリアの制御を行うカスタムフック。
 *
 * - agentState が 'tool_running' のとき入力を無効化
 * - handleSubmit で onSubmit を呼び出し、value をリセット
 * - 空文字列の submit は無視
 */
export function useInput(options: UseInputOptions): UseInputResult {
  const { agentState, onSubmit } = options
  const [value, setValue] = useState('')
  const [isMultiLine, setIsMultiLine] = useState(false)
  const [lineCount, setLineCount] = useState(1)

  const isDisabled = agentState === 'tool_running'

  const onChange = useCallback((newValue: string): void => {
    setValue(newValue)
    const lines = newValue.split('\n')
    if (lines.length >= 3) {
      setIsMultiLine(true)
      setLineCount(lines.length)
    } else {
      setIsMultiLine(false)
      setLineCount(lines.length)
    }
  }, [])

  const displayValue = useMemo((): string => {
    if (!isMultiLine) return value
    const lines = value.split('\n')
    const firstLine = lines[0] ?? ''
    const extraLines = lines.length - 1
    const truncated = firstLine.length > 50 ? firstLine.slice(0, 50) + '...' : firstLine
    return `${truncated} [+${extraLines} lines]`
  }, [value, isMultiLine])

  const clearMultiLine = useCallback((): void => {
    setValue('')
    setIsMultiLine(false)
    setLineCount(1)
  }, [])

  const handleSubmit = useCallback(
    (text: string): void => {
      // isMultiLine の場合は value を使って送信（text は displayValue かもしれない）
      const submitText = isMultiLine ? value : text
      if (isDisabled || submitText.length === 0) {
        return
      }
      void onSubmit(submitText)
      setValue('')
      setIsMultiLine(false)
      setLineCount(1)
    },
    [isDisabled, onSubmit, isMultiLine, value],
  )

  return { value, displayValue, isMultiLine, lineCount, onChange, handleSubmit, clearMultiLine, isDisabled }
}
