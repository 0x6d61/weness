import React from 'react'
import { Box } from 'ink'
import type { AppState } from '../state/types.js'
import { ChatView } from './ChatView.js'
import { StatusBar } from './StatusBar.js'
import { InputArea } from './InputArea.js'

interface AppProps {
  readonly state: AppState
  readonly inputValue: string
  readonly onInputChange: (value: string) => void
  readonly onSubmit: (text: string) => void
}

export function App({ state, inputValue, onInputChange, onSubmit }: AppProps): React.ReactElement {
  const isDisabled = state.agentState === 'thinking' || state.agentState === 'tool_running'

  return (
    <Box flexDirection="column" height="100%">
      <Box flexGrow={1} flexDirection="column">
        <ChatView messages={state.messages} toolExecutions={state.toolExecutions} toolOutputExpanded={state.toolOutputExpanded} />
      </Box>
      <StatusBar
        agentState={state.agentState}
        connected={state.connected}
        error={state.error}
      />
      <InputArea
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onSubmit}
        isDisabled={isDisabled}
      />
    </Box>
  )
}
