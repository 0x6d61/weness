import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { ToolBlock } from '../../src/components/ToolBlock.js'
import type { ToolExecution } from '../../src/state/types.js'

describe('ToolBlock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ツール名を Command(args) 形式で表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'shell',
      args: { command: 'nmap -sV 10.0.0.1' },
      status: 'running',
      startedAt: 1000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Bash(nmap -sV 10.0.0.1)')
  })

  it('running 状態で ● を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'nmap',
      args: { target: '10.0.0.1' },
      status: 'running',
      startedAt: 1000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
  })

  it('completed 状態で緑の ● と経過時間を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'nmap',
      args: { target: '10.0.0.1' },
      status: 'completed',
      result: { ok: true, output: 'scan complete' },
      startedAt: 1000,
      completedAt: 4200,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
    expect(frame).toContain('3.2s')
  })

  it('failed 状態で赤の ● とエラーメッセージを表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'nmap',
      args: { target: '10.0.0.1' },
      status: 'failed',
      result: { ok: false, output: '', error: 'connection refused' },
      startedAt: 1000,
      completedAt: 2000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('●')
    expect(frame).toContain('connection refused')
  })

  it('expanded=false のとき result.output を表示しない', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'shell',
      args: { command: 'ls' },
      status: 'completed',
      result: { ok: true, output: 'file1.txt\nfile2.txt' },
      startedAt: 1000,
      completedAt: 2000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).not.toContain('file1.txt')
  })

  it('expanded=true のとき result.output を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'shell',
      args: { command: 'ls' },
      status: 'completed',
      result: { ok: true, output: 'file1.txt\nfile2.txt' },
      startedAt: 1000,
      completedAt: 2000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={true} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('file1.txt')
  })

  it('引数なしのツールで ToolName() を表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'status',
      args: {},
      status: 'completed',
      result: { ok: true, output: 'ok' },
      startedAt: 1000,
      completedAt: 2000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Status()')
  })

  it('path 引数を持つツールでパスを表示する', () => {
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'read',
      args: { path: 'src/index.tsx' },
      status: 'completed',
      result: { ok: true, output: 'content' },
      startedAt: 1000,
      completedAt: 2000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Read(src/index.tsx)')
  })

  it('長い引数を 60 文字で切り詰める', () => {
    const longCommand = 'a'.repeat(80)
    const execution: ToolExecution = {
      id: 'tool-1',
      name: 'shell',
      args: { command: longCommand },
      status: 'running',
      startedAt: 1000,
    }
    const { lastFrame } = render(<ToolBlock execution={execution} expanded={false} />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('Bash(' + 'a'.repeat(60) + '…)')
    expect(frame).not.toContain('a'.repeat(80))
  })
})
