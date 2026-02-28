import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { InputArea } from '../../src/components/InputArea.js'

describe('InputArea', () => {
  it('"❯" プレフィックスを表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value=""
        displayValue=""
        isMultiLine={false}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('❯')
  })

  it('無効化された状態でテキストを dimmed で表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value="processing..."
        displayValue="processing..."
        isMultiLine={false}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={true}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('processing...')
  })

  it('有効な状態でも "❯" プレフィックスを表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value="hello"
        displayValue="hello"
        isMultiLine={false}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('❯')
  })

  it('ボーダーで囲まれている', () => {
    const { lastFrame } = render(
      <InputArea
        value=""
        displayValue=""
        isMultiLine={false}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('│')
  })

  // =============================================================================
  // 複数行ペースト機能のテスト
  // =============================================================================

  it('isMultiLine=true のとき displayValue を表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value="line1\nline2\nline3"
        displayValue="line1 [+2 lines]"
        isMultiLine={true}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('line1 [+2 lines]')
  })

  it('isMultiLine=true のときヒントテキストを表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value="line1\nline2\nline3"
        displayValue="line1 [+2 lines]"
        isMultiLine={true}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Enter: send')
    expect(frame).toContain('Esc: clear')
  })

  it('isMultiLine=false のとき通常の TextInput を表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value="normal text"
        displayValue="normal text"
        isMultiLine={false}
        onChange={() => {}}
        onSubmit={() => {}}
        onClearMultiLine={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    // 通常モードでは TextInput が描画される（ヒントテキストは表示されない）
    expect(frame).not.toContain('Enter: send')
    expect(frame).toContain('❯')
  })
})
