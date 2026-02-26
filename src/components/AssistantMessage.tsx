import React from 'react'
import { Text } from 'ink'
import type { ChatMessage } from '../state/types.js'

interface AssistantMessageProps {
  readonly message: ChatMessage
}

export function AssistantMessage({ message }: AssistantMessageProps): React.ReactElement {
  return <Text>{message.content}</Text>
}
