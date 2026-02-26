import { describe, it, expect, vi } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { Text } from 'ink'
import { useKeyboardShortcuts } from '../../src/hooks/use-keyboard-shortcuts.js'

/**
 * useKeyboardShortcuts フックをテストするためのラッパーコンポーネント。
 */
function TestComponent({
  onToggleToolOutput,
}: {
  readonly onToggleToolOutput: () => void
}): React.ReactElement {
  useKeyboardShortcuts({ onToggleToolOutput })
  return <Text>test</Text>
}

describe('useKeyboardShortcuts', () => {
  it('Ctrl+O が押されたとき onToggleToolOutput を呼び出す', () => {
    const onToggleToolOutput = vi.fn()
    const { stdin } = render(
      <TestComponent onToggleToolOutput={onToggleToolOutput} />,
    )

    // Ctrl+O = ASCII 15 = \x0F
    stdin.write('\x0F')

    expect(onToggleToolOutput).toHaveBeenCalledOnce()
  })

  it('他のキーでは onToggleToolOutput を呼び出さない', () => {
    const onToggleToolOutput = vi.fn()
    const { stdin } = render(
      <TestComponent onToggleToolOutput={onToggleToolOutput} />,
    )

    stdin.write('a')
    stdin.write('b')
    stdin.write('\x0D') // Enter
    stdin.write('\x1B') // Escape

    expect(onToggleToolOutput).not.toHaveBeenCalled()
  })
})
