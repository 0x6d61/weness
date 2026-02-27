import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { Text } from 'ink'
import { render } from 'ink-testing-library'
import { useBlinkingDot } from '../../src/hooks/use-blinking-dot.js'

/**
 * useBlinkingDot フックをテストするためのラッパーコンポーネント。
 * フックの戻り値（boolean）をテキストとして描画する。
 */
function TestComponent(): React.ReactElement {
  const visible = useBlinkingDot()
  return <Text>{visible ? 'VISIBLE' : 'HIDDEN'}</Text>
}

describe('useBlinkingDot', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('初期状態で visible は true', () => {
    const { lastFrame } = render(<TestComponent />)
    const frame = lastFrame() ?? ''
    expect(frame).toContain('VISIBLE')
  })

  it('500ms 後に visible が false に切り替わる', () => {
    const { lastFrame } = render(<TestComponent />)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    const frame = lastFrame() ?? ''
    expect(frame).toContain('HIDDEN')
  })

  it('1000ms 後に visible が true に戻る', () => {
    const { lastFrame } = render(<TestComponent />)

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // 500ms 時点で HIDDEN
    expect(lastFrame() ?? '').toContain('HIDDEN')

    act(() => {
      vi.advanceTimersByTime(500)
    })

    // 1000ms 時点で VISIBLE に戻る
    const frame = lastFrame() ?? ''
    expect(frame).toContain('VISIBLE')
  })

  it('アンマウント後にタイマーがクリーンアップされる', () => {
    const { unmount } = render(<TestComponent />)

    unmount()

    // アンマウント後にタイマーを進めてもエラーが出ないことを確認
    act(() => {
      vi.advanceTimersByTime(1000)
    })
  })
})
