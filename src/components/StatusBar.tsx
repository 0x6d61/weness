import React from 'react'
import { Box, Text } from 'ink'
import type { AgentState } from '../rpc/types.js'
import { useSpinner } from '../hooks/use-spinner.js'

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

function ThinkingSpinner(): React.ReactElement {
  const frame = useSpinner()
  return <Text color="yellow">{frame}</Text>
}

function StatusIndicator({ agentState }: { readonly agentState: AgentState }): React.ReactElement {
  if (agentState === 'thinking') {
    return <ThinkingSpinner />
  }
  return <Text color={getDotColor(agentState)}>{'●'}</Text>
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
      <StatusIndicator agentState={agentState} />
      <Text>{' '}{agentState}</Text>
      {error !== null ? <Text color="red">{' | '}{error}</Text> : null}
    </Box>
  )
}
