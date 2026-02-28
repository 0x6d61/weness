import React from 'react'
import { Text } from 'ink'
import type { ChatMessage } from '../state/types.js'
import { renderMarkdown } from '../utils/render-markdown.js'

interface AssistantMessageProps {
  readonly message: ChatMessage
}

export function AssistantMessage({ message }: AssistantMessageProps): React.ReactElement {
  const rendered = renderMarkdown(message.content)
  return <Text>{rendered}</Text>
}
