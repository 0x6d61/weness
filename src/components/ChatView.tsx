import React from 'react'
import { Box } from 'ink'
import type { AppState } from '../state/types.js'
import type { ChatMessage, ToolExecution } from '../state/types.js'
import { UserMessage } from './UserMessage.js'
import { AssistantMessage } from './AssistantMessage.js'
import { ToolBlock } from './ToolBlock.js'

interface ChatViewProps {
  readonly messages: AppState['messages']
  readonly toolExecutions: AppState['toolExecutions']
}

type TimelineItem =
  | { readonly kind: 'message'; readonly data: ChatMessage; readonly timestamp: number }
  | { readonly kind: 'tool'; readonly data: ToolExecution; readonly timestamp: number }

function buildTimeline(
  messages: readonly ChatMessage[],
  toolExecutions: readonly ToolExecution[],
): readonly TimelineItem[] {
  const items: TimelineItem[] = []

  for (const msg of messages) {
    items.push({ kind: 'message', data: msg, timestamp: msg.timestamp })
  }

  for (const exec of toolExecutions) {
    items.push({ kind: 'tool', data: exec, timestamp: exec.startedAt })
  }

  items.sort((a, b) => a.timestamp - b.timestamp)
  return items
}

function TimelineEntry({ item }: { readonly item: TimelineItem }): React.ReactElement {
  if (item.kind === 'message') {
    const msg = item.data
    if (msg.role === 'user') {
      return <UserMessage message={msg} />
    }
    return <AssistantMessage message={msg} />
  }
  return <ToolBlock execution={item.data} />
}

export function ChatView({ messages, toolExecutions }: ChatViewProps): React.ReactElement {
  const timeline = buildTimeline(messages, toolExecutions)

  return (
    <Box flexDirection="column" gap={1}>
      {timeline.map((item, index) => (
        <TimelineEntry
          key={item.kind === 'message' ? item.data.id : item.data.id}
          item={item}
        />
      ))}
    </Box>
  )
}
