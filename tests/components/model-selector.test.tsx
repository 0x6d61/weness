import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { ModelSelector } from '../../src/components/ModelSelector.js'

describe('ModelSelector', () => {
  it('claude プロバイダーのモデル一覧が表示される', () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const { lastFrame } = render(
      <ModelSelector provider="claude" onSelect={onSelect} onCancel={onCancel} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Select model:')
    expect(frame).toContain('Claude Sonnet 4')
    expect(frame).toContain('Claude Sonnet 4.6')
    expect(frame).toContain('Claude Opus 4.6')
    expect(frame).toContain('Claude Haiku 4.5')
  })

  it('openai プロバイダーのモデル一覧が表示される', () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const { lastFrame } = render(
      <ModelSelector provider="openai" onSelect={onSelect} onCancel={onCancel} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('GPT-4.1')
    expect(frame).toContain('o3')
  })

  it('onSelect コールバックが選択時に呼ばれる', () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const { stdin } = render(
      <ModelSelector provider="claude" onSelect={onSelect} onCancel={onCancel} />,
    )
    // Enter で最初の項目（Claude Sonnet 4）を選択
    stdin.write('\r')
    expect(onSelect).toHaveBeenCalledWith('claude-sonnet-4-20250514')
  })

  it('provider が null のときエラーメッセージを表示する', () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const { lastFrame } = render(
      <ModelSelector provider={null} onSelect={onSelect} onCancel={onCancel} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('No models available')
  })
})
