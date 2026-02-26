import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { ToolBlock } from '../../src/components/ToolBlock.js'
import type { ToolExecution } from '../../src/state/types.js'

describe('ToolBlock', () => {
  it('ツール名を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'shell',
      args: { command: 'nmap -sV 10.0.0.1' },
      status: 'running',
      startedAt: 1000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} />)
    expect(lastFrame()).toContain('shell')
  })

  it('running 状態で「実行中...」を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'nmap',
      args: { target: '10.0.0.1' },
      status: 'running',
      startedAt: 1000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} />)
    expect(lastFrame()).toContain('実行中...')
  })

  it('completed 状態で経過時間を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'nmap',
      args: { target: '10.0.0.1' },
      status: 'completed',
      result: { ok: true, output: 'scan complete' },
      startedAt: 1000,
      completedAt: 4200,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} />)
    const frame = lastFrame() ?? ''
    // Should show checkmark
    expect(frame).toContain('✓')
    // Should show elapsed time (4200 - 1000 = 3200ms = 3.2s)
    expect(frame).toContain('3.2s')
  })

  it('failed 状態でエラーメッセージを表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'nmap',
      args: { target: '10.0.0.1' },
      status: 'failed',
      result: { ok: false, output: '', error: 'connection refused' },
      startedAt: 1000,
      completedAt: 2000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} />)
    const frame = lastFrame() ?? ''
    // Should show X mark
    expect(frame).toContain('✗')
    // Should show error message
    expect(frame).toContain('connection refused')
  })

  it('shell ツールの場合、args.command を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'shell',
      args: { command: 'nmap -sV 10.0.0.1' },
      status: 'running',
      startedAt: 1000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} />)
    expect(lastFrame()).toContain('nmap -sV 10.0.0.1')
  })
})
