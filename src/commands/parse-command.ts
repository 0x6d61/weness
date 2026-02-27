/** スラッシュコマンドのパース結果 */
export type SlashCommand =
  | { readonly type: 'model'; readonly value: string }
  | { readonly type: 'model_select' }
  | { readonly type: 'provider'; readonly value: string }
  | { readonly type: 'provider_select' }
  | { readonly type: 'error'; readonly message: string }

/**
 * 入力テキストをスラッシュコマンドとしてパースする。
 * スラッシュコマンドでない場合は null を返す。
 */
export function parseSlashCommand(input: string): SlashCommand | null {
  const trimmed = input.trim()
  if (!trimmed.startsWith('/')) {
    return null
  }

  const spaceIndex = trimmed.indexOf(' ')
  const command = spaceIndex === -1 ? trimmed : trimmed.substring(0, spaceIndex)
  const arg =
    spaceIndex === -1 ? '' : trimmed.substring(spaceIndex + 1).trim()

  switch (command) {
    case '/model': {
      if (arg.length === 0) {
        return { type: 'model_select' }
      }
      return { type: 'model', value: arg }
    }
    case '/provider': {
      if (arg.length === 0) {
        return { type: 'provider_select' }
      }
      return { type: 'provider', value: arg }
    }
    default:
      return { type: 'error', message: `Unknown command: ${command}` }
  }
}
