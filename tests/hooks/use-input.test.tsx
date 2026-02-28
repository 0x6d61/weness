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
  const { value, displayValue, isMultiLine, lineCount, onChange, handleSubmit, isDisabled } = useInput({
    agentState,
    onSubmit,
  })

  // initialValue を useEffect で設定（レンダリング中の setState を避ける）
  const initialized = React.useRef(false)
  React.useEffect(() => {
    if (!initialized.current && initialValue) {
      onChange(initialValue)
      initialized.current = true
    }
  }, [onChange, initialValue])

  return (
    <Text>
      {`disabled:${String(isDisabled)}|value:${value}|multiline:${String(isMultiLine)}|lines:${lineCount}|display:${displayValue}|submit:${handleSubmit.name}`}
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
  const { value, isMultiLine, onChange, handleSubmit, isDisabled } = useInput({
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

  return <Text>{`disabled:${String(isDisabled)}|value:${value}|multiline:${String(isMultiLine)}`}</Text>
}

/**
 * clearMultiLine テスト用コンポーネント
 */
function ClearMultiLineTestComponent({
  agentState,
  onSubmit,
  initialValue,
  shouldClear,
}: {
  readonly agentState: AgentState
  readonly onSubmit: (text: string) => Promise<void>
  readonly initialValue: string
  readonly shouldClear: boolean
}): React.ReactElement {
  const { value, isMultiLine, lineCount, onChange, clearMultiLine, isDisabled } = useInput({
    agentState,
    onSubmit,
  })

  const initialized = React.useRef(false)
  React.useEffect(() => {
    if (!initialized.current) {
      onChange(initialValue)
      initialized.current = true
    }
  }, [onChange, initialValue])

  const cleared = React.useRef(false)
  React.useEffect(() => {
    if (shouldClear && !cleared.current && isMultiLine) {
      cleared.current = true
      clearMultiLine()
    }
  }, [shouldClear, clearMultiLine, isMultiLine])

  return (
    <Text>
      {`disabled:${String(isDisabled)}|value:${value}|multiline:${String(isMultiLine)}|lines:${lineCount}`}
    </Text>
  )
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

  // =============================================================================
  // 複数行ペースト機能のテスト
  // =============================================================================

  it('通常入力で isMultiLine は false', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="idle" onSubmit={onSubmit} initialValue="hello world" />,
    )
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('value:hello world')
      expect(frame).toContain('multiline:false')
      expect(frame).toContain('lines:1')
    })
  })

  it('2行の入力で isMultiLine は false', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="idle" onSubmit={onSubmit} initialValue={"line1\nline2"} />,
    )
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('multiline:false')
      expect(frame).toContain('lines:2')
    })
  })

  it('3行以上の入力で isMultiLine は true', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="idle" onSubmit={onSubmit} initialValue={"line1\nline2\nline3"} />,
    )
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('multiline:true')
      expect(frame).toContain('lines:3')
    })
  })

  it('複数行の displayValue に [+N lines] が含まれる', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="idle" onSubmit={onSubmit} initialValue={"first line\nsecond\nthird"} />,
    )
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('display:first line [+2 lines]')
    })
  })

  it('50文字を超える最初の行は切り詰められる', async () => {
    const longLine = 'a'.repeat(60)
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <TestComponent agentState="idle" onSubmit={onSubmit} initialValue={`${longLine}\nline2\nline3`} />,
    )
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      const truncated = 'a'.repeat(50) + '...'
      // ink がターミナル幅でテキストを折り返すため、個別にチェックする
      expect(frame).toContain('multiline:true')
      expect(frame).toContain('lines:3')
      // displayValue に切り詰められた文字列が含まれる
      expect(frame).toContain(`display:${truncated}`)
      // [+2 lines] が含まれる（ink の折り返しにより改行が入る場合がある）
      expect(frame.replace(/\s+/g, '')).toContain('[+2lines]')
    })
  })

  it('clearMultiLine で通常入力に戻る', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { lastFrame } = render(
      <ClearMultiLineTestComponent
        agentState="idle"
        onSubmit={onSubmit}
        initialValue="line1\nline2\nline3"
        shouldClear={true}
      />,
    )

    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('multiline:false')
      expect(frame).toContain('value:')
      expect(frame).toMatch(/value:(?:$|\|)/)
      expect(frame).toContain('lines:1')
    })
  })

  it('handleSubmit は複数行のとき全文を送信する', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const multiLineText = 'line1\nline2\nline3'
    const { lastFrame } = render(
      <SubmitTestComponent
        agentState="idle"
        onSubmit={onSubmit}
        textToSubmit={multiLineText}
      />,
    )

    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(multiLineText)
    })

    // submit 後に multiline 状態もリセットされること
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('multiline:false')
    })
  })
})
