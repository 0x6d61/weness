import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { UserMessage } from '../../src/components/UserMessage.js'
import type { ChatMessage } from '../../src/state/types.js'

describe('UserMessage', () => {
  const baseMessage: ChatMessage = {
    id: 'msg-1',
    role: 'user',
    content: 'nmap で 10.0.0.1 をスキャンして',
    timestamp: 1000,
  }

  it('メッセージ内容を表示する', () => {
    const { lastFrame } = render(<UserMessage message={baseMessage} />)
    expect(lastFrame()).toContain('nmap で 10.0.0.1 をスキャンして')
  })

  it('"❯" プレフィックスを表示する', () => {
    const { lastFrame } = render(<UserMessage message={baseMessage} />)
    expect(lastFrame()).toContain('❯')
  })

  it('空のメッセージでも "❯" プレフィックスを表示する', () => {
    const emptyMessage: ChatMessage = {
      id: 'msg-2',
      role: 'user',
      content: '',
      timestamp: 2000,
    }
    const { lastFrame } = render(<UserMessage message={emptyMessage} />)
    expect(lastFrame()).toContain('❯')
  })
})
