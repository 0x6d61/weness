/**
 * RPC type definitions for the TUI side.
 *
 * wn-core パッケージから共通型を re-export し、
 * TUI 固有の型（CoreEvent 等）をここで定義する。
 */

// wn-core から共通型を re-export
export type { AgentLoopState as AgentState } from '@0x6d61/wn-core'
export type { ToolResult } from '@0x6d61/wn-core'
export type {
  RpcInputParams,
  RpcInputResult as InputResult,
  RpcAbortParams,
  RpcAbortResult as AbortResult,
  RpcConfigUpdateParams,
  RpcConfigUpdateResult as ConfigUpdateResult,
  RpcResponseParams,
  RpcToolExecStartParams,
  RpcToolExecEndParams,
  RpcToolExecParams,
  RpcStateChangeParams,
  RpcLogParams,
} from '@0x6d61/wn-core'
export { RPC_METHODS } from '@0x6d61/wn-core'

// re-export 用の内部参照
import type { AgentLoopState, ToolResult as WnToolResult } from '@0x6d61/wn-core'

// =============================================================================
// Core → TUI Notification Events（TUI 固有）
// =============================================================================

/** Core から TUI へ送信される通知イベント（JSON-RPC notification をパースした結果） */
export type CoreEvent =
  | { readonly type: 'response'; readonly content: string }
  | {
      readonly type: 'toolStart'
      readonly name: string
      readonly args: Record<string, unknown>
    }
  | { readonly type: 'toolEnd'; readonly name: string; readonly result: WnToolResult }
  | { readonly type: 'stateChange'; readonly state: AgentLoopState }
  | {
      readonly type: 'log'
      readonly level: 'info' | 'warn' | 'error'
      readonly message: string
    }

// =============================================================================
// Result パターン（TUI 内部用）
// =============================================================================

/** 成功結果 */
export interface Ok<T> {
  readonly ok: true
  readonly data: T
}

/** 失敗結果 */
export interface Err {
  readonly ok: false
  readonly error: string
}

/** Result 型 */
export type Result<T> = Ok<T> | Err
