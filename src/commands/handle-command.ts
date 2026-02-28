import type { AppAction } from '../state/reducer.js'
import { DEFAULT_MODELS, PROVIDER_MODELS } from '../setup/types.js'
import type { Provider } from '../setup/types.js'
import { parseSlashCommand } from './parse-command.js'

/** Provider 型ガード */
function isProvider(value: string): value is Provider {
  return value === 'claude' || value === 'openai' || value === 'ollama' || value === 'gemini'
}

/** handleCommand に渡す依存関数群 */
export interface CommandHandlerDeps {
  readonly sendInput: (text: string) => Promise<void>
  readonly sendConfigUpdate: (params: { provider?: string; model?: string }) => Promise<void>
  readonly dispatch: (action: AppAction) => void
  readonly currentProvider: string | null
}

/**
 * 入力テキストをスラッシュコマンドか通常入力かを判定し、
 * 適切なハンドラを呼び出す。
 */
export async function handleCommand(
  text: string,
  deps: CommandHandlerDeps,
): Promise<void> {
  const command = parseSlashCommand(text)

  if (command === null) {
    await deps.sendInput(text)
    return
  }

  switch (command.type) {
    case 'model': {
      if (deps.currentProvider === null) {
        deps.dispatch({
          type: 'LOG',
          level: 'error',
          message: 'Cannot set model: provider is not selected',
        })
        return
      }
      if (!isProvider(deps.currentProvider)) {
        deps.dispatch({
          type: 'LOG',
          level: 'error',
          message: `Invalid provider: ${deps.currentProvider}`,
        })
        return
      }
      const validModels = PROVIDER_MODELS[deps.currentProvider].map((m) => m.value)
      if (!validModels.includes(command.value)) {
        const modelList = validModels.join(', ')
        deps.dispatch({
          type: 'LOG',
          level: 'error',
          message: `Invalid model: ${command.value}. Available models for ${deps.currentProvider}: ${modelList}`,
        })
        return
      }
      await deps.sendConfigUpdate({ model: command.value })
      return
    }
    case 'provider': {
      if (!isProvider(command.value)) {
        deps.dispatch({
          type: 'LOG',
          level: 'error',
          message: `Invalid provider: ${command.value}. Available providers: claude, openai, ollama, gemini`,
        })
        return
      }
      await deps.sendConfigUpdate({ provider: command.value, model: DEFAULT_MODELS[command.value] })
      return
    }
    case 'model_select':
      deps.dispatch({ type: 'ENTER_MODEL_SELECT' })
      return
    case 'provider_select':
      deps.dispatch({ type: 'ENTER_PROVIDER_SELECT' })
      return
    case 'error':
      deps.dispatch({ type: 'LOG', level: 'error', message: command.message })
      return
  }
}
