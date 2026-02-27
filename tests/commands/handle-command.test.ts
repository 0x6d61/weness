import { describe, it, expect, vi } from 'vitest'
import { handleCommand } from '../../src/commands/handle-command.js'

describe('handleCommand', () => {
  it('通常入力は sendInput を呼ぶ', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('hello world', { sendInput, sendConfigUpdate, dispatch })

    expect(sendInput).toHaveBeenCalledWith('hello world')
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/model コマンドは sendConfigUpdate を呼ぶ', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/model gpt-4o', { sendInput, sendConfigUpdate, dispatch })

    expect(sendConfigUpdate).toHaveBeenCalledWith({ model: 'gpt-4o' })
    expect(sendInput).not.toHaveBeenCalled()
  })

  it('/provider コマンドは sendConfigUpdate を呼ぶ', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/provider openai', { sendInput, sendConfigUpdate, dispatch })

    expect(sendConfigUpdate).toHaveBeenCalledWith({ provider: 'openai' })
    expect(sendInput).not.toHaveBeenCalled()
  })

  it('不正なスラッシュコマンドは LOG error を dispatch する', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/unknown foo', { sendInput, sendConfigUpdate, dispatch })

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

    await handleCommand('/provider', { sendInput, sendConfigUpdate, dispatch })

    expect(dispatch).toHaveBeenCalledWith({ type: 'ENTER_PROVIDER_SELECT' })
    expect(sendInput).not.toHaveBeenCalled()
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })

  it('/model 引数なしは ENTER_MODEL_SELECT を dispatch する', async () => {
    const sendInput = vi.fn()
    const sendConfigUpdate = vi.fn()
    const dispatch = vi.fn()

    await handleCommand('/model', { sendInput, sendConfigUpdate, dispatch })

    expect(dispatch).toHaveBeenCalledWith({ type: 'ENTER_MODEL_SELECT' })
    expect(sendInput).not.toHaveBeenCalled()
    expect(sendConfigUpdate).not.toHaveBeenCalled()
  })
})
