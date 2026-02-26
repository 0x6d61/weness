/**
 * useCore フック - Core プロセスとの接続管理
 *
 * wn-core の子プロセスを起動し、JSON-RPC イベントを
 * AppState の reducer にディスパッチする。
 */

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { createCoreClient } from '../rpc/client.js'
import type { CoreClient } from '../rpc/client.js'
import type { CoreEvent } from '../rpc/types.js'
import { appReducer } from '../state/reducer.js'
import type { AppAction } from '../state/reducer.js'
import type { AppState } from '../state/types.js'
import { INITIAL_STATE } from '../state/types.js'

// =============================================================================
// Types
// =============================================================================

interface UseCoreOptions {
  readonly corePath: string
  readonly coreArgs?: readonly string[]
}

interface UseCoreResult {
  readonly state: AppState
  readonly sendInput: (text: string) => Promise<void>
  readonly sendAbort: () => Promise<void>
}

// =============================================================================
// mapEventToAction - CoreEvent → AppAction 変換
// =============================================================================

/**
 * CoreEvent を AppAction にマッピングする純粋関数。
 * テスト容易性のために export する。
 */
export function mapEventToAction(event: CoreEvent): AppAction {
  switch (event.type) {
    case 'response':
      return { type: 'RESPONSE', content: event.content }

    case 'toolStart':
      return { type: 'TOOL_START', name: event.name, args: event.args }

    case 'toolEnd':
      return { type: 'TOOL_END', name: event.name, result: event.result }

    case 'stateChange':
      return { type: 'STATE_CHANGE', state: event.state }

    case 'log':
      return { type: 'LOG', level: event.level, message: event.message }
  }
}

// =============================================================================
// useCore フック
// =============================================================================

/**
 * Core プロセスとの接続を管理するカスタムフック。
 *
 * - useReducer で AppState を管理
 * - useEffect で CoreClient を作成し、イベントをディスパッチ
 * - アンマウント時に CoreClient を kill してクリーンアップ
 */
export function useCore(options: UseCoreOptions): UseCoreResult {
  const { corePath, coreArgs } = options
  const [state, dispatch] = useReducer(appReducer, INITIAL_STATE)
  const clientRef = useRef<CoreClient | null>(null)

  useEffect(() => {
    const client = createCoreClient({
      corePath,
      coreArgs,
      onEvent: (event: CoreEvent) => {
        const action = mapEventToAction(event)
        dispatch(action)
      },
      onExit: (code: number | null) => {
        dispatch({
          type: 'DISCONNECTED',
          error: `Process exited with code ${String(code)}`,
        })
      },
    })

    clientRef.current = client
    dispatch({ type: 'CONNECTED' })

    return () => {
      client.kill()
      clientRef.current = null
    }
  }, [corePath, coreArgs])

  const sendInput = useCallback(async (text: string): Promise<void> => {
    // UI に即座に反映するためにまず USER_INPUT をディスパッチ
    dispatch({ type: 'USER_INPUT', text })

    const client = clientRef.current
    if (client) {
      await client.sendInput(text)
    }
  }, [])

  const sendAbort = useCallback(async (): Promise<void> => {
    const client = clientRef.current
    if (client) {
      await client.sendAbort()
    }
  }, [])

  return { state, sendInput, sendAbort }
}
