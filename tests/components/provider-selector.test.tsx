import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { ProviderSelector } from '../../src/components/ProviderSelector.js'

describe('ProviderSelector', () => {
  it('プロバイダー一覧（Claude, OpenAI, Ollama, Gemini）が表示される', () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const { lastFrame } = render(
      <ProviderSelector onSelect={onSelect} onCancel={onCancel} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Select provider:')
    expect(frame).toContain('Claude (Anthropic)')
    expect(frame).toContain('OpenAI')
    expect(frame).toContain('Ollama (Local)')
    expect(frame).toContain('Gemini (Google)')
  })

  it('onSelect コールバックが選択時に呼ばれる', () => {
    const onSelect = vi.fn()
    const onCancel = vi.fn()
    const { stdin } = render(
      <ProviderSelector onSelect={onSelect} onCancel={onCancel} />,
    )
    // Enter キーを送信して最初のアイテム（claude）を選択
    stdin.write('\r')
    expect(onSelect).toHaveBeenCalledWith('claude')
  })
})
