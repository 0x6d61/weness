import type { AppAction } from '../state/reducer.js'
import { parseSlashCommand } from './parse-command.js'

/** handleCommand に渡す依存関数群 */
export interface CommandHandlerDeps {
  readonly sendInput: (text: string) => Promise<void>
  readonly sendConfigUpdate: (params: { provider?: string; model?: string }) => Promise<void>
  readonly dispatch: (action: AppAction) => void
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
    case 'model':
      await deps.sendConfigUpdate({ model: command.value })
      return
    case 'provider':
      await deps.sendConfigUpdate({ provider: command.value })
      return
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
