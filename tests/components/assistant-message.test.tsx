import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { AssistantMessage } from '../../src/components/AssistantMessage.js'
import type { ChatMessage } from '../../src/state/types.js'

describe('AssistantMessage', () => {
  const baseMessage: ChatMessage = {
    id: 'msg-1',
    role: 'assistant',
    content: '了解しました。nmapを実行します',
    timestamp: 1000,
  }

  it('アシスタントメッセージの内容を表示する', () => {
    const { lastFrame } = render(<AssistantMessage message={baseMessage} />)
    expect(lastFrame()).toContain('了解しました。nmapを実行します')
  })

  it('">" プレフィックスを含まない', () => {
    const { lastFrame } = render(<AssistantMessage message={baseMessage} />)
    // The output should not start with ">"
    const frame = lastFrame() ?? ''
    expect(frame.trimStart().startsWith('>')).toBe(false)
  })

  it('空のメッセージも描画できる', () => {
    const emptyMessage: ChatMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: '',
      timestamp: 2000,
    }
    const { lastFrame } = render(<AssistantMessage message={emptyMessage} />)
    // Should render without error (empty string or whitespace)
    expect(lastFrame()).toBeDefined()
  })
})
