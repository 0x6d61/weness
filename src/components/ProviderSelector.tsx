import React from 'react'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import { PROVIDER_LABELS } from '../setup/types.js'

interface ProviderSelectorProps {
  readonly onSelect: (provider: string) => void
  readonly onCancel: () => void
}

const providerItems: ReadonlyArray<{ label: string; value: string }> = [
  { label: PROVIDER_LABELS.claude, value: 'claude' },
  { label: PROVIDER_LABELS.openai, value: 'openai' },
  { label: PROVIDER_LABELS.ollama, value: 'ollama' },
  { label: PROVIDER_LABELS.gemini, value: 'gemini' },
]

export function ProviderSelector({ onSelect, onCancel }: ProviderSelectorProps): React.ReactElement {
  useInput((_input, key) => {
    if (key.escape) {
      onCancel()
    }
  })

  return (
    <Box flexDirection="column">
      <Text bold>{'Select provider:'}</Text>
      <SelectInput
        items={[...providerItems]}
        onSelect={(item) => onSelect(item.value)}
      />
    </Box>
  )
}
