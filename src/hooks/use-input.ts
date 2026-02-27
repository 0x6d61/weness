/**
 * useInput フック - 入力エリアの制御
 *
 * テキスト入力の状態管理と、agentState に基づく
 * 無効化制御を提供する。
 */

import { useState, useCallback } from 'react'
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
  readonly onChange: (value: string) => void
  readonly handleSubmit: (value: string) => void
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

  const isDisabled = agentState === 'tool_running'

  const onChange = useCallback((newValue: string): void => {
    setValue(newValue)
  }, [])

  const handleSubmit = useCallback(
    (text: string): void => {
      if (isDisabled || text.length === 0) {
        return
      }
      void onSubmit(text)
      setValue('')
    },
    [isDisabled, onSubmit],
  )

  return { value, onChange, handleSubmit, isDisabled }
}
