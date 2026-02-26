import React from 'react'
import { Box, Text } from 'ink'
import Spinner from 'ink-spinner'
import type { ToolExecution } from '../state/types.js'

interface ToolBlockProps {
  readonly execution: ToolExecution
}

function formatElapsedTime(startedAt: number, completedAt: number): string {
  const elapsed = (completedAt - startedAt) / 1000
  return `${elapsed.toFixed(1)}s`
}

function StatusLine({ execution }: ToolBlockProps): React.ReactElement {
  switch (execution.status) {
    case 'running':
      return (
        <Text>
          <Text color="yellow">
            <Spinner type="dots" />
          </Text>
          <Text>{' 実行中...'}</Text>
        </Text>
      )
    case 'completed':
      return (
        <Text>
          <Text color="green">{'✓'}</Text>
          <Text>
            {' 完了 ('}
            {formatElapsedTime(execution.startedAt, execution.completedAt ?? execution.startedAt)}
            {')'}
          </Text>
        </Text>
      )
    case 'failed':
      return (
        <Text>
          <Text color="red">{'✗'}</Text>
          <Text color="red">{' '}{execution.result?.error ?? 'unknown error'}</Text>
        </Text>
      )
  }
}

export function ToolBlock({ execution }: ToolBlockProps): React.ReactElement {
  const commandText =
    execution.name === 'shell' && typeof execution.args['command'] === 'string'
      ? execution.args['command']
      : null

  return (
    <Box flexDirection="column" borderStyle="single" paddingLeft={1} paddingRight={1}>
      <Text bold>{'─ '}{execution.name}{' ─'}</Text>
      {commandText !== null ? <Text>{commandText}</Text> : null}
      <StatusLine execution={execution} />
    </Box>
  )
}
