import React from 'react'
import { Box } from 'ink'
import type { AppState } from '../state/types.js'
import { ChatView } from './ChatView.js'
import { StatusBar } from './StatusBar.js'
import { InputArea } from './InputArea.js'
import { WelcomeBanner } from './WelcomeBanner.js'
import { ProviderSelector } from './ProviderSelector.js'
import { ModelSelector } from './ModelSelector.js'

interface AppProps {
  readonly state: AppState
  readonly inputValue: string
  readonly displayValue: string
  readonly isMultiLine: boolean
  readonly onInputChange: (value: string) => void
  readonly onSubmit: (text: string) => void
  readonly onClearMultiLine: () => void
  readonly onProviderSelect?: (provider: string) => void
  readonly onProviderSelectCancel?: () => void
  readonly onModelSelect?: (model: string) => void
  readonly onModelSelectCancel?: () => void
}

export function App({ state, inputValue, displayValue, isMultiLine, onInputChange, onSubmit, onClearMultiLine, onProviderSelect, onProviderSelectCancel, onModelSelect, onModelSelectCancel }: AppProps): React.ReactElement {
  const isDisabled = state.agentState === 'tool_running'
  const isActive = state.agentState === 'thinking' || state.agentState === 'tool_running'

  const statusBar = (
    <StatusBar
      agentState={state.agentState}
      connected={state.connected}
      error={state.error}
    />
  )

  return (
    <Box flexDirection="column" height="100%">
      <WelcomeBanner provider={state.provider ?? 'unknown'} model={state.model ?? 'unknown'} />
      <Box flexGrow={1} flexDirection="column">
        <ChatView messages={state.messages} toolExecutions={state.toolExecutions} toolOutputExpanded={state.toolOutputExpanded} />
      </Box>
      {isActive && <Box marginTop={1} marginBottom={1}>{statusBar}</Box>}
      {state.selectMode === 'provider'
        ? <ProviderSelector
            onSelect={onProviderSelect ?? (() => {})}
            onCancel={onProviderSelectCancel ?? (() => {})}
          />
        : state.selectMode === 'model'
          ? <ModelSelector
              provider={state.provider}
              onSelect={onModelSelect ?? (() => {})}
              onCancel={onModelSelectCancel ?? (() => {})}
            />
          : <InputArea
              value={inputValue}
              displayValue={displayValue}
              isMultiLine={isMultiLine}
              onChange={onInputChange}
              onSubmit={onSubmit}
              onClearMultiLine={onClearMultiLine}
              isDisabled={isDisabled}
            />
      }
      {!isActive && statusBar}
    </Box>
  )
}
