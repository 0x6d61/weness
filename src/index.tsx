#!/usr/bin/env node
/**
 * wn-tui エントリポイント
 *
 * CLI 引数をパースし、wn-core プロセスを起動して
 * Ink ベースの TUI をレンダリングする。
 *
 * ~/.wn/config.json が存在しない場合はセットアップウィザードを表示する。
 */

import React, { useState, useEffect, useCallback } from 'react'
import { render } from 'ink'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { useCore } from './hooks/use-core.js'
import { useInput } from './hooks/use-input.js'
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts.js'
import { App } from './components/App.js'
import { SetupWizard } from './components/SetupWizard.js'
import { checkConfigExists, readConfig } from './setup/check.js'
import { handleCommand } from './commands/handle-command.js'

// =============================================================================
// WnApp コンポーネント
// =============================================================================

interface WnAppProps {
  readonly corePath: string
  readonly coreArgs?: readonly string[]
  readonly provider: string
  readonly model: string
}

function WnApp({ corePath, coreArgs, provider, model }: WnAppProps): React.ReactElement {
  const { state, dispatch, sendInput, sendAbort, sendConfigUpdate } = useCore({ corePath, coreArgs })

  // 起動時に config から読んだ provider/model を state にセット
  useEffect(() => {
    dispatch({ type: 'SET_CONFIG', provider, model })
  }, [dispatch, provider, model])

  const { value, onChange, handleSubmit, isDisabled } = useInput({
    agentState: state.agentState,
    onSubmit: (text: string) => handleCommand(text, { sendInput, sendConfigUpdate, dispatch }),
  })

  useKeyboardShortcuts({
    onToggleToolOutput: () => dispatch({ type: 'TOGGLE_TOOL_OUTPUT' }),
  })

  const handleProviderSelect = useCallback((provider: string) => {
    void sendConfigUpdate({ provider })
    dispatch({ type: 'EXIT_PROVIDER_SELECT' })
  }, [sendConfigUpdate, dispatch])

  const handleProviderSelectCancel = useCallback(() => {
    dispatch({ type: 'EXIT_PROVIDER_SELECT' })
  }, [dispatch])

  const handleModelSelect = useCallback((model: string) => {
    void sendConfigUpdate({ model })
    dispatch({ type: 'EXIT_MODEL_SELECT' })
  }, [sendConfigUpdate, dispatch])

  const handleModelSelectCancel = useCallback(() => {
    dispatch({ type: 'EXIT_MODEL_SELECT' })
  }, [dispatch])

  return (
    <App
      state={state}
      inputValue={value}
      onInputChange={onChange}
      onSubmit={handleSubmit}
      onProviderSelect={handleProviderSelect}
      onProviderSelectCancel={handleProviderSelectCancel}
      onModelSelect={handleModelSelect}
      onModelSelectCancel={handleModelSelectCancel}
    />
  )
}

// =============================================================================
// Root コンポーネント（セットアップ or 通常起動の分岐）
// =============================================================================

interface RootProps {
  readonly corePath: string
  readonly coreArgs: readonly string[]
  readonly provider: string
  readonly model: string
}

function Root({ corePath, coreArgs, provider, model }: RootProps): React.ReactElement | null {
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null)

  useEffect(() => {
    setNeedsSetup(!checkConfigExists())
  }, [])

  if (needsSetup === null) return null // 初期チェック中
  if (needsSetup) return <SetupWizard onComplete={() => setNeedsSetup(false)} />
  return <WnApp corePath={corePath} coreArgs={coreArgs} provider={provider} model={model} />
}

// =============================================================================
// CLI エントリポイント
// =============================================================================

/**
 * wn-core の CLI パスを解決する。
 *
 * npm パッケージ @0x6d61/wn-core の dist/cli.js を探す。
 * createRequire を使用して node_modules 内のパスを解決する。
 */
function resolveCoreCliPath(): string {
  try {
    // ESM 環境で require.resolve を使うために createRequire を利用
    const require = createRequire(import.meta.url)
    // wn-core のメインモジュールのパスを解決し、そこから cli.js を導出
    const coreMainPath = require.resolve('@0x6d61/wn-core')
    const coreDir = dirname(coreMainPath)
    return join(coreDir, 'cli.js')
  } catch {
    // フォールバック: 直接パスを指定（開発時など）
    throw new Error(
      'Could not resolve @0x6d61/wn-core CLI path. ' +
        'Make sure @0x6d61/wn-core is installed.',
    )
  }
}

function main(): void {
  const corePath = resolveCoreCliPath()
  // wn-core は 'serve' サブコマンドで JSON-RPC サーバーとして起動する
  // ユーザーの CLI 引数はその後に渡す
  const userArgs = process.argv.slice(2)
  const coreArgs = ['serve', ...userArgs]

  // 設定ファイルから provider/model を読み込み、失敗時は 'unknown' をフォールバック
  const configResult = readConfig()
  const provider = configResult.ok ? configResult.data.defaultProvider : 'unknown'
  const model = configResult.ok ? configResult.data.defaultModel : 'unknown'

  render(<Root corePath={corePath} coreArgs={coreArgs} provider={provider} model={model} />)
}

main()
