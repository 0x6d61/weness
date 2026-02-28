import React from 'react'
import { Box, Text, useInput as useInkInput } from 'ink'
import TextInput from 'ink-text-input'

interface InputAreaProps {
  readonly value: string
  readonly displayValue: string
  readonly isMultiLine: boolean
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
  readonly onClearMultiLine: () => void
  readonly isDisabled: boolean
}

/**
 * 複数行ペースト時のキー入力ハンドラコンポーネント。
 * useInput（ink のフック）は条件付き呼び出しができないため、
 * 常にマウントされる別コンポーネントとして分離する。
 */
function MultiLineKeyHandler({
  value,
  onSubmit,
  onClearMultiLine,
  isActive,
}: {
  readonly value: string
  readonly onSubmit: (value: string) => void
  readonly onClearMultiLine: () => void
  readonly isActive: boolean
}): React.ReactElement | null {
  useInkInput(
    (input, key) => {
      if (key.return) {
        onSubmit(value)
      } else if (key.escape) {
        onClearMultiLine()
      }
    },
    { isActive },
  )
  return null
}

export function InputArea({ value, displayValue, isMultiLine, onChange, onSubmit, onClearMultiLine, isDisabled }: InputAreaProps): React.ReactElement {
  if (isDisabled) {
    return (
      <Box borderStyle="round" borderDimColor paddingLeft={1} paddingRight={1}>
        <Text dimColor>{'❯ '}</Text>
        <Text dimColor>{value}</Text>
      </Box>
    )
  }

  if (isMultiLine) {
    return (
      <Box borderStyle="round" borderDimColor paddingLeft={1} paddingRight={1}>
        <Text>{'❯ '}</Text>
        <Text>{displayValue}</Text>
        <Text dimColor>{' (Enter: send, Esc: clear)'}</Text>
        <MultiLineKeyHandler
          value={value}
          onSubmit={onSubmit}
          onClearMultiLine={onClearMultiLine}
          isActive={true}
        />
      </Box>
    )
  }

  return (
    <Box borderStyle="round" borderDimColor paddingLeft={1} paddingRight={1}>
      <Text>{'❯ '}</Text>
      <TextInput value={value} onChange={onChange} onSubmit={onSubmit} />
    </Box>
  )
}
