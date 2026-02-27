/**
 * stderr メッセージの内容からログレベルを判定する純粋関数。
 *
 * - 起動ログ（"serve started" を含む）→ 'info'
 * - "error" を含む（大文字小文字不問）→ 'error'
 * - それ以外 → 'warn'
 */
export function classifyStderrLevel(
  message: string
): 'info' | 'warn' | 'error' {
  if (message.includes('serve started')) {
    return 'info'
  }
  if (/error/i.test(message)) {
    return 'error'
  }
  return 'warn'
}
