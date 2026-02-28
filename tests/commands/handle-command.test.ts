import { describe, it, expect, vi } from 'vitest'
import { handleCommand } from '../../src/commands/handle-command.js'

describe('handleCommand', () => {
  it('通常入力は sendInput を呼ぶ', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('hello world', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(sendInput).toHaveBeenCalledWith('hello world')
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/model コマンドは sendConfigUpdate を呼ぶ', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/model claude-sonnet-4-20250514', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(sendConfigUpdate).toHaveBeenCalledWith({ model: 'claude-sonnet-4-20250514' })
    expect(sendInput).not.toHaveBeenCalled()
  })

  it('/provider コマンドはデフォルトモデルも送信する', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/provider openai', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(sendConfigUpdate).toHaveBeenCalledWith({ provider: 'openai', model: 'gpt-4.1' })
    expect(sendInput).not.toHaveBeenCalled()
  })

  it('不正なスラッシュコマンドは LOG error を dispatch する', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/unknown foo', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'LOG',
      level: 'error',
      message: 'Unknown command: /unknown',
    })
    expect(sendInput).not.toHaveBeenCalled()
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/provider 引数なしは ENTER_PROVIDER_SELECT を dispatch する', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/provider', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(dispatch).toHaveBeenCalledWith({ type: 'ENTER_PROVIDER_SELECT' })
    expect(sendInput).not.toHaveBeenCalled()
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/model 引数なしは ENTER_MODEL_SELECT を dispatch する', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/model', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(dispatch).toHaveBeenCalledWith({ type: 'ENTER_MODEL_SELECT' })
    expect(sendInput).not.toHaveBeenCalled()
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/provider で無効なプロバイダー名はエラーを返す', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/provider invalid', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'LOG',
      level: 'error',
      message: expect.stringContaining('Invalid provider'),
    })
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/model で無効なモデル名はエラーを返す', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/model foobar', { sendInput, sendConfigUpdate, dispatch, currentProvider: 'claude' })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'LOG',
      level: 'error',
      message: expect.stringContaining('Invalid model'),
    })
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/model で currentProvider が null の場合エラーを返す', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/model gpt-4.1', { sendInput, sendConfigUpdate, dispatch, currentProvider: null })

    expect(dispatch).toHaveBeenCalledWith({
      type: 'LOG',
      level: 'error',
      message: expect.stringContaining('provider'),
    })
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })
})
