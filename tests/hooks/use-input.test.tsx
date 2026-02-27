import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { useInput } from '../../src/hooks/use-input.js'
import type { AgentState } from '../../src/rpc/types.js'

/**
 * useInput フックをテストするためのラッパーコンポーネント。
 * フックの結果をテキストとして描画し、ink-testing-library で検証する。
 */
function TestComponent({
  agentState,
  onSubmit,
  initialValue,
}: {
  readonly agentState: AgentState
  readonly onSubmit: (text: string) => Promise<void>
  readonly initialValue?: string
}): React.ReactElement {
  const { value, onChange, handleSubmit, isDisabled } = useInput({
    agentState,
    onSubmit,
  })

  // initialValue を設定するための ref トリック（一度だけ呼ぶ）
  const initialized = React.useRef(false)
  if (!initialized.current && initialValue) {
    onChange(initialValue)
    initialized.current = true
  }

  return (
    <Text>
      {`disabled:${String(isDisabled)}|value:${value}|submit:${handleSubmit.name}`}
    </Text>
  )
}

/**
 * handleSubmit を直接テストするためのコンポーネント。
 * submit ボタンの代わりにマウント時に handleSubmit を呼ぶ。
 */
function SubmitTestComponent({
  agentState,
  onSubmit,
  textToSubmit,
}: {
  readonly agentState: AgentState
  readonly onSubmit: (text: string) => Promise<void>
  readonly textToSubmit: string
}): React.ReactElement {
  const { value, onChange, handleSubmit, isDisabled } = useInput({
    agentState,
    onSubmit,
  })

  // 初回レンダーで値を設定し、次のレンダーで submit
  const phase = React.useRef<'init' | 'set' | 'submit' | 'done'>('init')

  React.useEffect(() => {
    if (phase.current === 'init') {
      phase.current = 'set'
      onChange(textToSubmit)
    }
  }, [onChange, textToSubmit])

  React.useEffect(() => {
    if (phase.current === 'set' && value === textToSubmit) {
      phase.current = 'submit'
      handleSubmit(value)
      phase.current = 'done'
    }
  }, [value, textToSubmit, handleSubmit])

  return <Text>{`disabled:${String(isDisabled)}|value:${value}`}</Text>
}

/**
 * 空文字列で handleSubmit を呼ぶテスト用コンポーネント
 */
function EmptySubmitTestComponent({
  agentState,
  onSubmit,
}: {
  readonly agentState: AgentState
  readonly onSubmit: (text: string) => Promise<void>
}): React.ReactElement {
  const { value, handleSubmit, isDisabled } = useInput({
    agentState,
    onSubmit,
  })

  const called = React.useRef(false)
  React.useEffect(() => {
    if (!called.current) {
      called.current = true
      handleSubmit('')
    }
  }, [handleSubmit])

  return <Text>{`disabled:${String(isDisabled)}|value:${value}`}</Text>
}

describe('useInput', () => {
  it('agentState が idle のとき isDisabled は false', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="idle" onSubmit={onSubmit} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('disabled:false')
  })

  it('agentState が thinking のとき isDisabled は false', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="thinking" onSubmit={onSubmit} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('disabled:false')
  })

  it('agentState が tool_running のとき isDisabled は true', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="tool_running" onSubmit={onSubmit} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('disabled:true')
  })

  it('agentState が waiting_input のとき isDisabled は false', () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="waiting_input" onSubmit={onSubmit} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('disabled:false')
  })

  it('handleSubmit は onSubmit を呼び出し、value をリセットする', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <SubmitTestComponent
        agentState="idle"
        onSubmit={onSubmit}
        textToSubmit="hello"
      />,
    )

    // React の effect が処理されるまで待つ
    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('hello')
    })

    // submit 後に value がリセットされていること
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('value:')
      // value が空文字列にリセットされる
      expect(frame).toMatch(/value:(?:$|\|)/)
    })
  })

  it('handleSubmit は空文字列のとき onSubmit を呼ばない', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <EmptySubmitTestComponent agentState="idle" onSubmit={onSubmit} />,
    )

    // 少し待ってから onSubmit が呼ばれていないことを確認
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
