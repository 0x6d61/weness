#!/usr/bin/env node
/**
 * wn-tui エントリポイント
 *
 * CLI 引数をパースし、wn-core プロセスを起動して
 * Ink ベースの TUI をレンダリングする。
 */

import React from 'react'
import { render } from 'ink'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { useCore } from './hooks/use-core.js'
import { useInput } from './hooks/use-input.js'
import { App } from './components/App.js'

// =============================================================================
// WnApp コンポーネント
// =============================================================================

interface WnAppProps {
  readonly corePath: string
  readonly coreArgs?: readonly string[]
}

function WnApp({ corePath, coreArgs }: WnAppProps): React.ReactElement {
  const { state, sendInput, sendAbort } = useCore({ corePath, coreArgs })
  const { value, onChange, handleSubmit, isDisabled } = useInput({
    agentState: state.agentState,
    onSubmit: sendInput,
  })

  return (
    <App
      state={state}
      inputValue={value}
      onInputChange={onChange}
      onSubmit={handleSubmit}
    />
  )
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
  const coreArgs = process.argv.slice(2)

  render(<WnApp corePath={corePath} coreArgs={coreArgs} />)
}

main()
