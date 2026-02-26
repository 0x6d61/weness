import React from 'react'
import { Text } from 'ink'
import type { ChatMessage } from '../state/types.js'

interface UserMessageProps {
  readonly message: ChatMessage
}

export function UserMessage({ message }: UserMessageProps): React.ReactElement {
  return (
    <Text>
      <Text dimColor>{'> '}</Text>
      <Text>{message.content}</Text>
    </Text>
  )
}
