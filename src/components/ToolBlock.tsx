import React from 'react'
import { Box, Text } from 'ink'
import type { ToolExecution } from '../state/types.js'
import { useBlinkingDot } from '../hooks/use-blinking-dot.js'

interface ToolBlockProps {
  readonly execution: ToolExecution
  readonly expanded: boolean
}

// ツール名の表示マッピング
const TOOL_DISPLAY_NAMES: Record<string, string> = {
  shell: 'Shell',
  read: 'Read',
  write: 'Write',
  glob: 'Glob',
  grep: 'Grep',
  edit: 'Edit',
}

const MAX_ARG_LENGTH = 60

function getDisplayName(name: string): string {
  return TOOL_DISPLAY_NAMES[name] ?? name.charAt(0).toUpperCase() + name.slice(1)
}

function getPrimaryArg(name: string, args: Record<string, unknown>): string {
  if (name === 'shell' && typeof args['command'] === 'string') {
    return args['command']
  }
  if (typeof args['path'] === 'string') {
    return args['path']
  }
  if (typeof args['pattern'] === 'string') {
    return args['pattern']
  }
  for (const val of Object.values(args)) {
    if (typeof val === 'string') return val
  }
  return ''
}

function formatToolCall(name: string, args: Record<string, unknown>): string {
  const displayName = getDisplayName(name)
  const primaryArg = getPrimaryArg(name, args)
  if (primaryArg.length === 0) {
    return `${displayName}()`
  }
  const truncated =
    primaryArg.length > MAX_ARG_LENGTH
      ? primaryArg.slice(0, MAX_ARG_LENGTH) + '\u2026'
      : primaryArg
  return `${displayName}(${truncated})`
}

function formatElapsedTime(startedAt: number, completedAt: number): string {
  const elapsed = (completedAt - startedAt) / 1000
  return `${elapsed.toFixed(1)}s`
}

function RunningDot(): React.ReactElement {
  const visible = useBlinkingDot()
  return <Text color="yellow">{visible ? '\u25CF' : ' '}</Text>
}

function StatusIndicator({
  status,
}: {
  readonly status: ToolExecution['status']
}): React.ReactElement {
  switch (status) {
    case 'running':
      return <RunningDot />
    case 'completed':
      return <Text color="green">{'\u25CF'}</Text>
    case 'failed':
      return <Text color="red">{'\u25CF'}</Text>
  }
}

function StatusSuffix({
  execution,
}: {
  readonly execution: ToolExecution
}): React.ReactElement | null {
  switch (execution.status) {
    case 'running':
      return null
    case 'completed':
      return (
        <Text dimColor>
          {' ('}
          {formatElapsedTime(
            execution.startedAt,
            execution.completedAt ?? execution.startedAt,
          )}
          {')'}
        </Text>
      )
    case 'failed':
      return (
        <Text color="red">
          {' '}
          {execution.result?.error ?? 'unknown error'}
        </Text>
      )
  }
}

export function ToolBlock({
  execution,
  expanded,
}: ToolBlockProps): React.ReactElement {
  const toolCallText = formatToolCall(execution.name, execution.args)
  const hasOutput =
    expanded &&
    execution.result !== undefined &&
    typeof execution.result.output === 'string' &&
    execution.result.output.length > 0

  return (
    <Box flexDirection="column">
      <Box>
        <StatusIndicator status={execution.status} />
        <Text bold>{' '}{toolCallText}</Text>
        <StatusSuffix execution={execution} />
      </Box>
      {hasOutput ? (
        <Box marginLeft={2}>
          <Text dimColor>{execution.result?.output}</Text>
        </Box>
      ) : null}
    </Box>
  )
}
