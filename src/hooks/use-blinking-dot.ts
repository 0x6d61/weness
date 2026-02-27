/**
 * useBlinkingDot フック - 点滅ドットの表示制御
 *
 * 一定間隔で visible / hidden を切り替えるシンプルなフック。
 * ステータスインジケータの点滅表現に使用する。
 */

import { useState, useEffect } from 'react'

const BLINK_INTERVAL_MS = 500

/**
 * 指定間隔で boolean を切り替えるカスタムフック。
 *
 * - 初期値: true（visible）
 * - 500ms ごとに true ↔ false を交互に切り替え
 * - アンマウント時に setInterval をクリーンアップ
 *
 * @returns visible - true なら表示、false なら非表示
 */
export function useBlinkingDot(): boolean {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setInterval(() => {
      setVisible((prev) => !prev)
    }, BLINK_INTERVAL_MS)

    return (): void => {
      clearInterval(timer)
    }
  }, [])

  return visible
}
