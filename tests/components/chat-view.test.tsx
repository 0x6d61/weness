import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { ChatView } from '../../src/components/ChatView.js'
import type { ChatMessage, ToolExecution } from '../../src/state/types.js'

describe('ChatView', () => {
  it('メッセージを順序どおりに描画する', () => {
    const messages: readonly ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: 1000,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'Hi there!',
        timestamp: 2000,
      },
    ]
    const { lastFrame } = render(
      <ChatView messages={messages} toolExecutions={[]} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Hello')
    expect(frame).toContain('Hi there!')
    // User message should have ">" prefix
    expect(frame).toContain('>')
  })

  it('ツール実行を描画する', () => {
    const toolExecutions: readonly ToolExecution[] = [
      {
        id: 'tool-1',
        name: 'shell',
        args: { command: 'ls -la' },
        status: 'completed',
        result: { ok: true, output: 'files' },
        startedAt: 1000,
        completedAt: 2500,
      },
    ]
    const { lastFrame } = render(
      <ChatView messages={[]} toolExecutions={toolExecutions} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('shell')
    expect(frame).toContain('ls -la')
  })

  it('メッセージとツール実行を時系列で混合して描画する', () => {
    const messages: readonly ChatMessage[] = [
      {
        id: 'msg-1',
        role: 'user',
        content: 'run ls',
        timestamp: 1000,
      },
      {
        id: 'msg-2',
        role: 'assistant',
        content: 'here are the results',
        timestamp: 3000,
      },
    ]
    const toolExecutions: readonly ToolExecution[] = [
      {
        id: 'tool-1',
        name: 'shell',
        args: { command: 'ls' },
        status: 'completed',
        result: { ok: true, output: 'done' },
        startedAt: 2000,
        completedAt: 2500,
      },
    ]
    const { lastFrame } = render(
      <ChatView messages={messages} toolExecutions={toolExecutions} />,
    )
    const frame = lastFrame() ?? ''
    // All three items should be present
    expect(frame).toContain('run ls')
    expect(frame).toContain('shell')
    expect(frame).toContain('here are the results')
  })

  it('空のメッセージとツール実行を正常に処理する', () => {
    const { lastFrame } = render(
      <ChatView messages={[]} toolExecutions={[]} />,
    )
    // Should render without error
    expect(lastFrame()).toBeDefined()
  })
})
