import { describe, it, expect } from 'vitest'
import { mapEventToAction } from '../../src/hooks/use-core.js'
import type { CoreEvent } from '../../src/rpc/types.js'
import type { AppAction } from '../../src/state/reducer.js'

describe('mapEventToAction', () => {
  it('response イベントを RESPONSE アクションにマッピングする', () => {
    const event: CoreEvent = { type: 'response', content: 'Hello, world!' }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'RESPONSE',
      content: 'Hello, world!',
    } satisfies AppAction)
  })

  it('toolStart イベントを TOOL_START アクションにマッピングする', () => {
    const event: CoreEvent = {
      type: 'toolStart',
      name: 'read',
      args: { path: '/tmp/file.txt' },
    }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'TOOL_START',
      name: 'read',
      args: { path: '/tmp/file.txt' },
    } satisfies AppAction)
  })

  it('toolEnd イベントを TOOL_END アクションにマッピングする', () => {
    const event: CoreEvent = {
      type: 'toolEnd',
      name: 'read',
      result: { ok: true, output: 'file content' },
    }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'TOOL_END',
      name: 'read',
      result: { ok: true, output: 'file content' },
    } satisfies AppAction)
  })

  it('stateChange イベントを STATE_CHANGE アクションにマッピングする', () => {
    const event: CoreEvent = { type: 'stateChange', state: 'thinking' }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'STATE_CHANGE',
      state: 'thinking',
    } satisfies AppAction)
  })

  it('log イベントを LOG アクションにマッピングする', () => {
    const event: CoreEvent = {
      type: 'log',
      level: 'error',
      message: 'Something went wrong',
    }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'LOG',
      level: 'error',
      message: 'Something went wrong',
    } satisfies AppAction)
  })

  it('log イベントの info レベルを正しくマッピングする', () => {
    const event: CoreEvent = {
      type: 'log',
      level: 'info',
      message: 'Info message',
    }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'LOG',
      level: 'info',
      message: 'Info message',
    } satisfies AppAction)
  })

  it('log イベントの warn レベルを正しくマッピングする', () => {
    const event: CoreEvent = {
      type: 'log',
      level: 'warn',
      message: 'Warning message',
    }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'LOG',
      level: 'warn',
      message: 'Warning message',
    } satisfies AppAction)
  })

  it('toolEnd イベントでエラー結果を正しくマッピングする', () => {
    const event: CoreEvent = {
      type: 'toolEnd',
      name: 'shell',
      result: { ok: false, output: '', error: 'command not found' },
    }
    const action = mapEventToAction(event)

    expect(action).toEqual({
      type: 'TOOL_END',
      name: 'shell',
      result: { ok: false, output: '', error: 'command not found' },
    } satisfies AppAction)
  })
})
