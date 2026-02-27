import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

  it('thinking 状態でスピナー文字を表示する', () => {
    vi.useFakeTimers()
    const { lastFrame } = render(
      <StatusBar agentState="thinking" connected={true} error={null} />,
    )
    const frame = lastFrame() ?? ''
    // スピナーフレームのいずれかが含まれる（初期は最初のフレーム）
    const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    const hasSpinnerChar = spinnerFrames.some((f) => frame.includes(f))
    expect(hasSpinnerChar).toBe(true)
    expect(frame).toContain('thinking')
    // 静的な ● ではないことを確認
    expect(frame).not.toContain('●')
    vi.useRealTimers()
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
