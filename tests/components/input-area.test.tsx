import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { InputArea } from '../../src/components/InputArea.js'

describe('InputArea', () => {
  it('"❯" プレフィックスを表示する', () => {
    const { lastFrame } = render(
      <InputArea
        value=""
        onChange={() => {}}
        onSubmit={() => {}}
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
        onChange={() => {}}
        onSubmit={() => {}}
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
        onChange={() => {}}
        onSubmit={() => {}}
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
        onChange={() => {}}
        onSubmit={() => {}}
        isDisabled={false}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('│')
  })
})
