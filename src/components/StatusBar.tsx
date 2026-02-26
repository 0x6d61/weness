import React from 'react'
import { Box, Text } from 'ink'
import type { AgentState } from '../rpc/types.js'

interface StatusBarProps {
  readonly agentState: AgentState
  readonly connected: boolean
  readonly error: string | null
}

function getDotColor(agentState: AgentState): string {
  switch (agentState) {
    case 'idle':
    case 'waiting_input':
      return 'green'
    case 'thinking':
      return 'yellow'
    case 'tool_running':
      return 'blue'
  }
}

export function StatusBar({ agentState, connected, error }: StatusBarProps): React.ReactElement {
  if (!connected) {
    return (
      <Box>
        <Text color="red">{'● disconnected'}</Text>
      </Box>
    )
  }

  return (
    <Box>
      <Text color={getDotColor(agentState)}>{'●'}</Text>
      <Text>{' '}{agentState}</Text>
      {error !== null ? <Text color="red">{' | '}{error}</Text> : null}
    </Box>
  )
}
