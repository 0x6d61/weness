import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { StatusBar } from '../../src/components/StatusBar.js'

describe('StatusBar', () => {
  it('idle 状態を表示する', () => {
    const { lastFrame } = render(
      <StatusBar agentState="idle" connected={true} error={null} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
    expect(frame).toContain('idle')
  })

  it('thinking 状態を表示する', () => {
    const { lastFrame } = render(
      <StatusBar agentState="thinking" connected={true} error={null} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
    expect(frame).toContain('thinking')
  })

  it('waiting_input 状態を表示する', () => {
    const { lastFrame } = render(
      <StatusBar agentState="waiting_input" connected={true} error={null} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
    expect(frame).toContain('waiting_input')
  })

  it('tool_running 状態を表示する', () => {
    const { lastFrame } = render(
      <StatusBar agentState="tool_running" connected={true} error={null} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
    expect(frame).toContain('tool_running')
  })

  it('未接続時に "disconnected" を表示する', () => {
    const { lastFrame } = render(
      <StatusBar agentState="idle" connected={false} error={null} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('disconnected')
  })

  it('エラーメッセージを表示する', () => {
    const { lastFrame } = render(
      <StatusBar
        agentState="idle"
        connected={true}
        error="connection lost"
      />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('connection lost')
  })
})
