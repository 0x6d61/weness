/**
 * RPC client for wn-core communication.
 *
 * wn-core を子プロセスとして起動し、JSON-RPC 2.0 over stdin/stdout で通信する。
 * - TUI → Core: リクエスト（id 付き）を stdin に書き込み、stdout からレスポンスを受け取る
 * - Core → TUI: 通知（id なし）を stdout から読み取り、CoreEvent として返す
 */

import { spawn } from 'node:child_process'
import { accessSync, constants } from 'node:fs'
import { resolve as pathResolve } from 'node:path'
import { createInterface } from 'node:readline'
import type {
  CoreEvent,
  InputResult,
  AbortResult,
  ConfigUpdateResult,
  Result,
} from './types.js'

// =============================================================================
// JSON-RPC メッセージ型（内部用）
// =============================================================================

/** JSON-RPC 2.0 のメッセージ（パース後の共通型） */
interface JsonRpcMessage {
  readonly jsonrpc: string
  readonly id?: number
  readonly method?: string
  readonly params?: Record<string, unknown>
  readonly result?: unknown
  readonly error?: { readonly code: number; readonly message: string }
}

// =============================================================================
// CoreClient インターフェース
// =============================================================================

/** CoreClient 生成時のオプション */
export interface CoreClientOptions {
  readonly corePath: string
  readonly coreArgs?: readonly string[]
  readonly onEvent: (event: CoreEvent) => void
  readonly onExit: (code: number | null) => void
  readonly onStderr?: (line: string) => void
}

/** Core プロセスとの通信クライアント */
export interface CoreClient {
  sendInput(text: string): Promise<InputResult>
  sendAbort(): Promise<AbortResult>
  sendConfigUpdate(params: {
    persona?: string
    provider?: string
    model?: string
  }): Promise<ConfigUpdateResult>
  kill(): void
}

// =============================================================================
// parseLine - 1行の文字列を JSON-RPC メッセージにパースする
// =============================================================================

/**
 * 1 行の文字列を JSON-RPC メッセージとしてパースする。
 * 不正な JSON の場合は Result.Err を返す。
 */
export function parseLine(line: string): Result<JsonRpcMessage> {
  if (line.length === 0) {
    return { ok: false, error: 'Empty line' }
  }

  try {
    const parsed: unknown = JSON.parse(line)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'Parsed value is not an object' }
    }
    return { ok: true, data: parsed as JsonRpcMessage }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown parse error'
    return { ok: false, error: `JSON parse error: ${message}` }
  }
}

// =============================================================================
// parseNotification - JSON-RPC 通知を CoreEvent に変換する
// =============================================================================

/**
 * JSON-RPC 通知メッセージを CoreEvent に変換する。
 * 未知の method や不正な params の場合は Result.Err を返す。
 */
export function parseNotification(msg: JsonRpcMessage): Result<CoreEvent> {
  const { method, params } = msg

  if (typeof method !== 'string') {
    return { ok: false, error: 'Missing or invalid method field' }
  }

  switch (method) {
    case 'response': {
      const content = (params as Record<string, unknown> | undefined)?.content
      if (typeof content !== 'string') {
        return { ok: false, error: 'Invalid response params: missing content' }
      }
      return { ok: true, data: { type: 'response', content } }
    }

    case 'toolExec': {
      const p = params as Record<string, unknown> | undefined
      if (!p) {
        return { ok: false, error: 'Invalid toolExec params: missing params' }
      }
      const event = p.event as string
      const name = p.name as string

      if (typeof event !== 'string' || typeof name !== 'string') {
        return {
          ok: false,
          error: 'Invalid toolExec params: missing event or name',
        }
      }

      if (event === 'start') {
        const args = (p.args as Record<string, unknown>) ?? {}
        return { ok: true, data: { type: 'toolStart', name, args } }
      }

      if (event === 'end') {
        const result = p.result as
          | { ok: boolean; output: string; error?: string }
          | undefined
        if (!result) {
          return {
            ok: false,
            error: 'Invalid toolExec end params: missing result',
          }
        }
        return { ok: true, data: { type: 'toolEnd', name, result } }
      }

      return { ok: false, error: `Unknown toolExec event: ${event}` }
    }

    case 'stateChange': {
      const state = (params as Record<string, unknown> | undefined)?.state
      if (typeof state !== 'string') {
        return {
          ok: false,
          error: 'Invalid stateChange params: missing state',
        }
      }
      return {
        ok: true,
        data: {
          type: 'stateChange',
          state: state as CoreEvent extends { type: 'stateChange'; state: infer S }
            ? S
            : never,
        },
      }
    }

    case 'log': {
      const p = params as Record<string, unknown> | undefined
      if (!p) {
        return { ok: false, error: 'Invalid log params: missing params' }
      }
      const level = p.level as string
      const message = p.message as string
      if (typeof level !== 'string' || typeof message !== 'string') {
        return {
          ok: false,
          error: 'Invalid log params: missing level or message',
        }
      }
      return {
        ok: true,
        data: {
          type: 'log',
          level: level as 'info' | 'warn' | 'error',
          message,
        },
      }
    }

    default:
      return { ok: false, error: `Unknown notification method: ${method}` }
  }
}

// =============================================================================
// validateCorePath - コアパスのバリデーションとサニタイズ
// =============================================================================

/**
 * corePath を検証し、正規化された絶対パスを返す。
 * パストラバーサルやシェルメタ文字を含むパスは拒否する。
 * 実行権限の存在も確認する。
 *
 * @throws {Error} パスが不正な場合
 */
export function validateCorePath(rawPath: string): string {
  // 空文字チェック
  if (rawPath.length === 0) {
    throw new Error('corePath must not be empty')
  }

  // シェルメタ文字やコマンドチェーンの検出（コマンドインジェクション防止）
  const dangerousPattern = /[;|&`$(){}[\]!#~<>*?]/
  if (dangerousPattern.test(rawPath)) {
    throw new Error(
      `corePath contains dangerous characters: ${rawPath}`,
    )
  }

  // 絶対パスに正規化
  const resolved = pathResolve(rawPath)

  // 実行可能ファイルの存在チェック（プラットフォーム別）
  try {
    if (process.platform === 'win32') {
      // Windows: X_OK は F_OK と同等で意味がないため、読み取り可能性のみ検証
      accessSync(resolved, constants.R_OK)
    } else {
      // Unix (Linux/macOS): 実行権限を検証（フォールバックなし）
      accessSync(resolved, constants.X_OK)
    }
  } catch {
    throw new Error(`corePath is not accessible: ${resolved}`)
  }

  return resolved
}

// =============================================================================
// createCoreClient - ファクトリ関数
// =============================================================================

/**
 * wn-core を子プロセスとして起動し、JSON-RPC 2.0 で通信するクライアントを生成する。
 *
 * Security notes:
 * - corePath は validateCorePath() で検証・正規化済みの絶対パスのみ使用
 * - shell: false で起動し、引数は配列で渡す（シェルインジェクション防止）
 * - シェルメタ文字を含むパスは validateCorePath() が拒否する
 *
 * @throws {Error} corePath が不正または実行不可能な場合
 */
export function createCoreClient(options: CoreClientOptions): CoreClient {
  const { corePath, coreArgs = [], onEvent, onExit, onStderr } = options

  // corePath を検証・サニタイズ（危険な文字の排除、絶対パスへの正規化、存在チェック）
  const sanitizedPath = validateCorePath(corePath)

  // ペンディングリクエスト管理（id → resolve/reject）
  const pending = new Map<
    number,
    {
      resolve: (value: unknown) => void
      reject: (error: Error) => void
    }
  >()
  let nextId = 1

  // .js ファイルの場合は node 経由で起動（Windows では .js を直接 spawn できない）
  const isJsFile = sanitizedPath.endsWith('.js')
  const command = isJsFile ? process.execPath : sanitizedPath
  const args = isJsFile ? [sanitizedPath, ...coreArgs] : [...coreArgs]

  // 検証済みパスで子プロセスを起動（shell: false でシェル経由しない）
  // nosemgrep: javascript.lang.security.detect-child-process.detect-child-process
  const child = spawn(command, args, {
    stdio: ['pipe', 'pipe', 'pipe'],
    shell: false,
  })

  // stdout を行単位で読み取る
  const rl = createInterface({ input: child.stdout! })

  rl.on('line', (line: string) => {
    const parseResult = parseLine(line)
    if (!parseResult.ok) {
      // 不正な JSON は無視する（クラッシュしない）
      return
    }

    const msg = parseResult.data

    // id + result → リクエストへのレスポンス
    if (typeof msg.id === 'number' && msg.result !== undefined) {
      const handler = pending.get(msg.id)
      if (handler) {
        pending.delete(msg.id)
        handler.resolve(msg.result)
      }
      return
    }

    // id + error → リクエストへのエラーレスポンス
    if (typeof msg.id === 'number' && msg.error !== undefined) {
      const handler = pending.get(msg.id)
      if (handler) {
        pending.delete(msg.id)
        handler.reject(new Error(msg.error.message))
      }
      return
    }

    // id がない + method がある → 通知
    if (msg.id === undefined && typeof msg.method === 'string') {
      const eventResult = parseNotification(msg)
      if (eventResult.ok) {
        onEvent(eventResult.data)
      }
      // パースに失敗した通知は無視（クラッシュしない）
      return
    }
  })

  // stderr を行単位で読み取り、onStderr コールバックに渡す
  if (onStderr) {
    const stderrRl = createInterface({ input: child.stderr! })
    stderrRl.on('line', (line: string) => {
      onStderr(line)
    })
  }

  // spawn 自体のエラー（ファイルが見つからない等）
  // close イベントがエラー後に発火するので、ここでは追加の処理は不要
  // ただし、ハンドラがないと unhandled error で crash するため登録する
  child.on('error', () => {
    // spawn error の場合は close イベントが code=null で発火する
    // onExit は close ハンドラが呼ぶので、ここでは何もしない
  })

  // 子プロセスの終了イベント
  child.on('close', (code: number | null) => {
    // ペンディングリクエストをすべて reject
    for (const [, handler] of pending) {
      handler.reject(new Error(`Core process exited with code ${code}`))
    }
    pending.clear()
    onExit(code)
  })

  // JSON-RPC リクエスト送信のヘルパー
  function sendRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = nextId++
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      }

      pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
      })

      const line = JSON.stringify(request) + '\n'
      child.stdin!.write(line)
    })
  }

  return {
    sendInput(text: string): Promise<InputResult> {
      return sendRequest<InputResult>('input', { text })
    },

    sendAbort(): Promise<AbortResult> {
      return sendRequest<AbortResult>('abort', {})
    },

    sendConfigUpdate(params: {
      persona?: string
      provider?: string
      model?: string
    }): Promise<ConfigUpdateResult> {
      return sendRequest<ConfigUpdateResult>('configUpdate', params)
    },

    kill(): void {
      child.kill()
    },
  }
}
