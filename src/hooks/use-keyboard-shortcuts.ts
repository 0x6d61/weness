/**
 * useKeyboardShortcuts フック - グローバルキーボードショートカットの制御
 *
 * TUI 全体のキーボードショートカットを管理する。
 * 現在のショートカット:
 *   - Ctrl+O: ツール出力の表示/非表示を切り替え
 */

import { useInput } from 'ink'

// =============================================================================
// Types
// =============================================================================

interface UseKeyboardShortcutsOptions {
  readonly onToggleToolOutput: () => void
}

// =============================================================================
// useKeyboardShortcuts フック
// =============================================================================

/**
 * グローバルキーボードショートカットを登録するカスタムフック。
 *
 * - Ctrl+O: onToggleToolOutput コールバックを呼び出す
 */
export function useKeyboardShortcuts(
  options: UseKeyboardShortcutsOptions,
): void {
  const { onToggleToolOutput } = options

  useInput((input, key) => {
    if (key.ctrl && input === 'o') {
      onToggleToolOutput()
    }
  })
}
