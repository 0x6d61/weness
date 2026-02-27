import type { AgentState, ToolResult } from '../rpc/types.js'

export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  readonly id: string
  readonly role: MessageRole
  readonly content: string
  readonly timestamp: number
}

export interface ToolExecution {
  readonly id: string
  readonly name: string
  readonly args: Record<string, unknown>
  readonly status: 'running' | 'completed' | 'failed'
  readonly result?: ToolResult
  readonly startedAt: number
  readonly completedAt?: number
}

export interface AppState {
  readonly messages: readonly ChatMessage[]
  readonly toolExecutions: readonly ToolExecution[]
  readonly agentState: AgentState
  readonly connected: boolean
  readonly error: string | null
  readonly toolOutputExpanded: boolean
  readonly provider: string | null
  readonly model: string | null
  readonly selectMode: 'provider' | 'model' | null
}

export const INITIAL_STATE: AppState = {
  messages: [],
  toolExecutions: [],
  agentState: 'idle',
  connected: false,
  error: null,
  toolOutputExpanded: false,
  provider: null,
  model: null,
  selectMode: null,
}
