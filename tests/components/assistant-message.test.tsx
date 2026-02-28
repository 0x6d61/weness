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

  it('Markdown を含むメッセージが変換されて表示される', () => {
    const markdownMessage: ChatMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: '**重要**: `npm install` を実行してください',
      timestamp: 3000,
    }
    const { lastFrame } = render(<AssistantMessage message={markdownMessage} />)
    const frame = lastFrame() ?? ''
    // テキスト内容が含まれている
    expect(frame).toContain('重要')
    expect(frame).toContain('npm install')
    // Markdown の ** 記法が除去されている
    expect(frame).not.toContain('**')
  })

  it('リストを含むメッセージが表示される', () => {
    const listMessage: ChatMessage = {
      id: 'msg-4',
      role: 'assistant',
      content: '手順:\n- ステップ1\n- ステップ2',
      timestamp: 4000,
    }
    const { lastFrame } = render(<AssistantMessage message={listMessage} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('ステップ1')
    expect(frame).toContain('ステップ2')
  })
})
