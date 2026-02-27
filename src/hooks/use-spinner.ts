/**
 * useSpinner フック - スピナーアニメーション
 *
 * braille パターンを一定間隔で切り替える。
 * Claude Code 風の thinking インジケータに使用する。
 */

import { useState, useEffect } from 'react'

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const SPINNER_INTERVAL_MS = 80

/**
 * スピナーフレームを順番に返すカスタムフック。
 *
 * @returns 現在のスピナーフレーム文字
 */
export function useSpinner(): string {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % SPINNER_FRAMES.length)
    }, SPINNER_INTERVAL_MS)

    return (): void => {
      clearInterval(timer)
    }
  }, [])

  return SPINNER_FRAMES[index] ?? '⠋'
}
