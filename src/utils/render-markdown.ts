import { marked } from 'marked'
// @ts-expect-error marked-terminal has no type definitions
import { markedTerminal } from 'marked-terminal'

// marked-terminal 拡張を一度だけ登録
marked.use(markedTerminal())

/**
 * Markdown テキストをターミナル表示用の ANSI 文字列に変換する。
 */
export function renderMarkdown(markdown: string): string {
  const result = marked.parse(markdown)
  // marked.parse は string | Promise<string> を返すが、async: false（デフォルト）なら string
  if (typeof result !== 'string') {
    return markdown // フォールバック: 変換失敗時は元のテキストを返す
  }
  // 末尾の余計な改行を除去
  return result.replace(/\n+$/, '')
}
