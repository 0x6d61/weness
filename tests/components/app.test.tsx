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
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
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
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
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
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('thinking')
    // thinking 状態ではスピナー文字が表示される（● ではない）
    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const hasSpinner = spinnerFrames.some((f) => frame.includes(f))
    expect(hasSpinner).toBe(true)
  })

  it('未接続状態を表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: false,
      agentState: 'idle',
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
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
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Something went wrong')
  })

  it('selectMode が provider の時、プロバイダー選択UIを表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: true,
      agentState: 'idle',
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
      selectMode: 'provider',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    // ProviderSelector のテキストが表示されること
    expect(frame).toContain('Select provider:')
    expect(frame).toContain('Claude')
    // InputArea のボーダーボックスは表示されないこと（❯ は SelectInput でも使われるため、InputArea 固有の罫線で判定）
    expect(frame).not.toContain('╭')
    expect(frame).not.toContain('╰')
  })

  it('selectMode が model の時、モデル選択UIを表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: true,
      agentState: 'idle',
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
      selectMode: 'model',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Select model:')
    expect(frame).toContain('Claude Sonnet 4.6')
    // InputArea のボーダーボックスは表示されないこと
    expect(frame).not.toContain('╭')
    expect(frame).not.toContain('╰')
  })

  it('WelcomeBanner を表示する', () => {
    const state: AppState = {
      ...INITIAL_STATE,
      connected: true,
      agentState: 'idle',
      provider: 'claude',
      model: 'claude-sonnet-4-20250514',
    }
    const { lastFrame } = render(
      <App
        state={state}
        inputValue=""
        onInputChange={() => {}}
        onSubmit={() => {}}
        displayValue=""
        isMultiLine={false}
        onClearMultiLine={() => {}}
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('weness')
    expect(frame).toContain('oOOOo')
  })
})
