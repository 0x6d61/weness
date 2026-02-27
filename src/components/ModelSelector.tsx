import React from 'react'
import { Box, Text, useInput } from 'ink'
import SelectInput from 'ink-select-input'
import { PROVIDER_MODELS } from '../setup/types.js'
import type { Provider } from '../setup/types.js'

interface ModelSelectorProps {
  readonly provider: string | null
  readonly onSelect: (model: string) => void
  readonly onCancel: () => void
}

/** Provider型かどうかを判定する型ガード */
function isProvider(value: string): value is Provider {
  return value === 'claude' || value === 'openai' || value === 'ollama' || value === 'gemini'
}

export function ModelSelector({ provider, onSelect, onCancel }: ModelSelectorProps): React.ReactElement {
  useInput((_input, key) => {
    if (key.escape) {
      onCancel()
    }
  })

  const items = provider !== null && isProvider(provider)
    ? [...PROVIDER_MODELS[provider]]
    : []

  if (items.length === 0) {
    return (
      <Box flexDirection="column">
        <Text color="red">{'No models available for current provider.'}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column">
      <Text bold>{'Select model:'}</Text>
      <SelectInput
        items={items}
        onSelect={(item) => onSelect(item.value)}
      />
    </Box>
  )
}
