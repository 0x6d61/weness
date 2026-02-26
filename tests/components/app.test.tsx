import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { App } from '../../src/components/App.js'
import { INITIAL_STATE } from '../../src/state/types.js'
import type { AppState } from '../../src/state/types.js'

describe('App', () => {
  it('全サブコンポーネントを描画する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: true,
      agentState: 'idle',
      messages: [
        {
          id: 'msg-1',
          role: 'user',
          content: 'Hello agent',
          timestamp: 1000,
        },
        {
          id: 'msg-2',
          role: 'assistant',
          content: 'Hello user',
          timestamp: 2000,
        },
      ],
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    // ChatView content
    expect(frame).toContain('Hello agent')
    expect(frame).toContain('Hello user')
    // StatusBar
    expect(frame).toContain('idle')
    // InputArea "❯" prefix
    expect(frame).toContain('❯')
  })

  it('ステータスバーを表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: true,
      agentState: 'thinking',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('thinking')
    expect(frame).toContain('●')
  })

  it('未接続状態を表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: false,
      agentState: 'idle',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('disconnected')
  })

  it('エラーメッセージを表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: true,
      agentState: 'idle',
      error: 'Something went wrong',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Something went wrong')
  })
})
