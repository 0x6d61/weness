import type { AgentState, ToolResult } from '../rpc/types.js'
import type { AppState, ChatMessage, ToolExecution } from './types.js'

// =============================================================================
// Action Types
// =============================================================================

export type AppAction =
  | { readonly type: 'USER_INPUT'; readonly text: string }
  | { readonly type: 'RESPONSE'; readonly content: string }
  | {
      readonly type: 'TOOL_START'
      readonly name: string
      readonly args: Record<string, unknown>
    }
  | { readonly type: 'TOOL_END'; readonly name: string; readonly result: ToolResult }
  | { readonly type: 'STATE_CHANGE'; readonly state: AgentState }
  | {
      readonly type: 'LOG'
      readonly level: 'info' | 'warn' | 'error'
      readonly message: string
    }
  | { readonly type: 'CONNECTED' }
  | { readonly type: 'DISCONNECTED'; readonly error?: string }
  | { readonly type: 'TOGGLE_TOOL_OUTPUT' }
  | { readonly type: 'SET_CONFIG'; readonly provider: string; readonly model: string }
  | { readonly type: 'CONFIG_UPDATE'; readonly provider?: string; readonly model?: string }
  | { readonly type: 'ENTER_PROVIDER_SELECT' }
  | { readonly type: 'EXIT_PROVIDER_SELECT' }
  | { readonly type: 'ENTER_MODEL_SELECT' }
  | { readonly type: 'EXIT_MODEL_SELECT' }

// =============================================================================
// Reducer
// =============================================================================

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'USER_INPUT': {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: action.text,
        timestamp: Date.now(),
      }
      return { ...state, messages: [...state.messages, message], error: null }
    }

    case 'RESPONSE': {
      const message: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: action.content,
        timestamp: Date.now(),
      }
      return { ...state, messages: [...state.messages, message] }
    }

    case 'TOOL_START': {
      const execution: ToolExecution = {
        id: `${action.name}-${crypto.randomUUID()}`,
        name: action.name,
        args: action.args,
        status: 'running',
        startedAt: Date.now(),
      }
      return { ...state, toolExecutions: [...state.toolExecutions, execution] }
    }

    case 'TOOL_END': {
      // 最後の running 状態のツール実行を名前で検索（後ろから探す）
      let targetIndex = -1
      for (let i = state.toolExecutions.length - 1; i >= 0; i--) {
        const exec = state.toolExecutions[i]
        if (exec !== undefined && exec.name === action.name && exec.status === 'running') {
          targetIndex = i
          break
        }
      }

      if (targetIndex === -1) {
        // 一致するツール実行が見つからない場合は state をそのまま返す
        return state
      }

      const updatedExecutions = state.toolExecutions.map((exec, index) => {
        if (index !== targetIndex) {
          return exec
        }
        return {
          ...exec,
          status: action.result.ok ? ('completed' as const) : ('failed' as const),
          result: action.result,
          completedAt: Date.now(),
        }
      })

      return { ...state, toolExecutions: updatedExecutions }
    }

    case 'STATE_CHANGE': {
      return { ...state, agentState: action.state }
    }

    case 'LOG': {
      if (action.level === 'error') {
        return { ...state, error: action.message }
      }
      // info/warn レベルは現時点では state を変更しない
      return state
    }

    case 'CONNECTED': {
      return { ...state, connected: true, error: null }
    }

    case 'DISCONNECTED': {
      return {
        ...state,
        connected: false,
        error: action.error ?? null,
      }
    }

    case 'TOGGLE_TOOL_OUTPUT': {
      return { ...state, toolOutputExpanded: !state.toolOutputExpanded }
    }

    case 'SET_CONFIG': {
      return { ...state, provider: action.provider, model: action.model }
    }

    case 'CONFIG_UPDATE': {
      return {
        ...state,
        provider: action.provider ?? state.provider,
        model: action.model ?? state.model,
        error: null,
      }
    }

    case 'ENTER_PROVIDER_SELECT': {
      return { ...state, selectMode: 'provider' }
    }

    case 'EXIT_PROVIDER_SELECT': {
      return { ...state, selectMode: null }
    }

    case 'ENTER_MODEL_SELECT': {
      return { ...state, selectMode: 'model' }
    }

    case 'EXIT_MODEL_SELECT': {
      return { ...state, selectMode: null }
    }
  }
}
