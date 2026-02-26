import React from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'

interface InputAreaProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onSubmit: (value: string) => void
  readonly isDisabled: boolean
}

export function InputArea({ value, onChange, onSubmit, isDisabled }: InputAreaProps): React.ReactElement {
  if (isDisabled) {
    return (
      <Box borderStyle="round" borderDimColor paddingLeft={1} paddingRight={1}>
        <Text dimColor>{'❯ '}</Text>
        <Text dimColor>{value}</Text>
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
