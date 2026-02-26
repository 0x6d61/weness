import { describe, it, expect } from 'vitest'
import { appReducer } from '../../src/state/reducer.js'
import type { AppAction } from '../../src/state/reducer.js'
import { INITIAL_STATE } from '../../src/state/types.js'
import type { AppState } from '../../src/state/types.js'

describe('appReducer', () => {
  it('USER_INPUT はユーザーメッセージを追加する', () => {
    const action: AppAction = { type: 'USER_INPUT', text: 'Hello' }
    const next = appReducer(INITIAL_STATE, action)

    expect(next.messages).toHaveLength(1)
    const msg = next.messages[0]!
    expect(msg.role).toBe('user')
    expect(msg.content).toBe('Hello')
    expect(msg.id).toEqual(expect.any(String))
    expect(msg.id.length).toBeGreaterThan(0)
    expect(msg.timestamp).toEqual(expect.any(Number))
  })

  it('RESPONSE はアシスタントメッセージを追加する', () => {
    const action: AppAction = { type: 'RESPONSE', content: 'Hi there!' }
    const next = appReducer(INITIAL_STATE, action)

    expect(next.messages).toHaveLength(1)
    const msg = next.messages[0]!
    expect(msg.role).toBe('assistant')
    expect(msg.content).toBe('Hi there!')
    expect(msg.id).toEqual(expect.any(String))
    expect(msg.id.length).toBeGreaterThan(0)
    expect(msg.timestamp).toEqual(expect.any(Number))
  })

  it('TOOL_START は running 状態のツール実行を追加する', () => {
    const action: AppAction = {
      type: 'TOOL_START',
      name: 'nmap',
      args: { target: '192.168.1.1' },
    }
    const next = appReducer(INITIAL_STATE, action)

    expect(next.toolExecutions).toHaveLength(1)
    const tool = next.toolExecutions[0]!
    expect(tool.name).toBe('nmap')
    expect(tool.args).toEqual({ target: '192.168.1.1' })
    expect(tool.status).toBe('running')
    expect(tool.result).toBeUndefined()
    expect(tool.startedAt).toEqual(expect.any(Number))
    expect(tool.completedAt).toBeUndefined()
    expect(tool.id).toEqual(expect.any(String))
    expect(tool.id).toContain('nmap')
  })

  it('TOOL_END は一致するツール実行を completed に更新する', () => {
    const stateWithTool: AppState = {
      ...INITIAL_STATE,
      toolExecutions: [
        {
          id: 'nmap-1',
          name: 'nmap',
          args: { target: '192.168.1.1' },
          status: 'running',
          startedAt: 1000,
        },
      ],
    }

    const action: AppAction = {
      type: 'TOOL_END',
      name: 'nmap',
      result: { ok: true, output: 'scan complete' },
    }
    const next = appReducer(stateWithTool, action)

    expect(next.toolExecutions).toHaveLength(1)
    const tool = next.toolExecutions[0]!
    expect(tool.status).toBe('completed')
    expect(tool.result).toEqual({ ok: true, output: 'scan complete' })
    expect(tool.completedAt).toEqual(expect.any(Number))
  })

  it('TOOL_END で result.ok=false の場合、status を failed にする', () => {
    const stateWithTool: AppState = {
      ...INITIAL_STATE,
      toolExecutions: [
        {
          id: 'nmap-1',
          name: 'nmap',
          args: { target: '192.168.1.1' },
          status: 'running',
          startedAt: 1000,
        },
      ],
    }

    const action: AppAction = {
      type: 'TOOL_END',
      name: 'nmap',
      result: { ok: false, output: '', error: 'connection refused' },
    }
    const next = appReducer(stateWithTool, action)

    expect(next.toolExecutions).toHaveLength(1)
    const tool = next.toolExecutions[0]!
    expect(tool.status).toBe('failed')
    expect(tool.result).toEqual({
      ok: false,
      output: '',
      error: 'connection refused',
    })
    expect(tool.completedAt).toEqual(expect.any(Number))
  })

  it('STATE_CHANGE は agentState を更新する', () => {
    const action: AppAction = { type: 'STATE_CHANGE', state: 'thinking' }
    const next = appReducer(INITIAL_STATE, action)

    expect(next.agentState).toBe('thinking')
  })

  it('LOG で error レベルの場合は error フィールドを設定する', () => {
    const action: AppAction = {
      type: 'LOG',
      level: 'error',
      message: 'Something went wrong',
    }
    const next = appReducer(INITIAL_STATE, action)

    expect(next.error).toBe('Something went wrong')
  })

  it('LOG で info/warn レベルの場合は state を変更しない', () => {
    const infoAction: AppAction = {
      type: 'LOG',
      level: 'info',
      message: 'Just info',
    }
    const nextInfo = appReducer(INITIAL_STATE, infoAction)
    expect(nextInfo).toEqual(INITIAL_STATE)

    const warnAction: AppAction = {
      type: 'LOG',
      level: 'warn',
      message: 'Just a warning',
    }
    const nextWarn = appReducer(INITIAL_STATE, warnAction)
    expect(nextWarn).toEqual(INITIAL_STATE)
  })

  it('CONNECTED は connected を true に、error を null にする', () => {
    const disconnectedState: AppState = {
      ...INITIAL_STATE,
      connected: false,
      error: 'previous error',
    }
    const action: AppAction = { type: 'CONNECTED' }
    const next = appReducer(disconnectedState, action)

    expect(next.connected).toBe(true)
    expect(next.error).toBeNull()
  })

  it('DISCONNECTED は connected を false に設定し、オプションの error を設定する', () => {
    const connectedState: AppState = {
      ...INITIAL_STATE,
      connected: true,
    }

    // error あり
    const actionWithError: AppAction = {
      type: 'DISCONNECTED',
      error: 'connection lost',
    }
    const next1 = appReducer(connectedState, actionWithError)
    expect(next1.connected).toBe(false)
    expect(next1.error).toBe('connection lost')

    // error なし
    const actionWithoutError: AppAction = { type: 'DISCONNECTED' }
    const next2 = appReducer(connectedState, actionWithoutError)
    expect(next2.connected).toBe(false)
    expect(next2.error).toBeNull()
  })

  it('複数のメッセージが順序通りに蓄積される', () => {
    let state = INITIAL_STATE

    state = appReducer(state, { type: 'USER_INPUT', text: 'first' })
    state = appReducer(state, { type: 'RESPONSE', content: 'reply1' })
    state = appReducer(state, { type: 'USER_INPUT', text: 'second' })
    state = appReducer(state, { type: 'RESPONSE', content: 'reply2' })

    expect(state.messages).toHaveLength(4)
    expect(state.messages[0]!.role).toBe('user')
    expect(state.messages[0]!.content).toBe('first')
    expect(state.messages[1]!.role).toBe('assistant')
    expect(state.messages[1]!.content).toBe('reply1')
    expect(state.messages[2]!.role).toBe('user')
    expect(state.messages[2]!.content).toBe('second')
    expect(state.messages[3]!.role).toBe('assistant')
    expect(state.messages[3]!.content).toBe('reply2')
  })

  it('TOOL_END は最後の running ツール実行を更新する（同名複数）', () => {
    const stateWithMultipleTools: AppState = {
      ...INITIAL_STATE,
      toolExecutions: [
        {
          id: 'nmap-1',
          name: 'nmap',
          args: { target: '10.0.0.1' },
          status: 'completed',
          result: { ok: true, output: 'done' },
          startedAt: 1000,
          completedAt: 2000,
        },
        {
          id: 'nmap-2',
          name: 'nmap',
          args: { target: '10.0.0.2' },
          status: 'running',
          startedAt: 3000,
        },
      ],
    }

    const action: AppAction = {
      type: 'TOOL_END',
      name: 'nmap',
      result: { ok: true, output: 'second scan done' },
    }
    const next = appReducer(stateWithMultipleTools, action)

    expect(next.toolExecutions).toHaveLength(2)
    // 最初のツール実行は変更されない
    expect(next.toolExecutions[0]!.status).toBe('completed')
    expect(next.toolExecutions[0]!.result?.output).toBe('done')
    // 2番目（最後の running）が更新される
    expect(next.toolExecutions[1]!.status).toBe('completed')
    expect(next.toolExecutions[1]!.result?.output).toBe('second scan done')
    expect(next.toolExecutions[1]!.completedAt).toEqual(expect.any(Number))
  })
})
