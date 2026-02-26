/**
 * 初期設定ファイルの作成
 *
 * セットアップウィザードの結果をもとに、
 * ~/.wn/ ディレクトリ構造と設定ファイルを作成する。
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Result } from '../rpc/types.js'
import { DEFAULT_MODELS } from './types.js'
import type { SetupResult, WnConfig, ProviderConfig } from './types.js'

/** デフォルトペルソナの内容 */
const DEFAULT_PERSONA_CONTENT = `You are a helpful AI assistant. Respond thoughtfully and adapt to what the user needs — coding, writing, analysis, brainstorming, or conversation.

Guidelines:
- Be concise but thorough
- Ask for clarification when the request is ambiguous
- Respond in the same language as the user's message
- When working with code, prioritize correctness and readability
`

/**
 * プロバイダー設定を組み立てる
 */
function buildProviderConfig(
  provider: SetupResult['provider'],
  authMethod: SetupResult['authMethod'],
  credential: string,
): ProviderConfig {
  if (provider === 'ollama') {
    return { baseUrl: 'http://localhost:11434' }
  }
  if (authMethod === 'oauthToken') {
    return { authToken: credential }
  }
  return { apiKey: credential }
}

/**
 * 初期設定ファイルを作成する
 *
 * @param setupResult - セットアップウィザードの結果
 * @param homeDir - ホームディレクトリ（テスト用にオーバーライド可能）
 * @returns 作成した .wn ディレクトリのパス、またはエラー
 */
export function createInitialConfig(
  setupResult: SetupResult,
  homeDir?: string,
): Result<string> {
  const home = homeDir ?? homedir()
  const wnDir = join(home, '.wn')
  const personasDir = join(wnDir, 'personas')

  try {
    // 1. ディレクトリ作成
    mkdirSync(wnDir, { recursive: true })
    mkdirSync(personasDir, { recursive: true })

    // 2. config.json を組み立てて書き込み
    const providerConfig = buildProviderConfig(setupResult.provider, setupResult.authMethod, setupResult.credential)
    const config: WnConfig = {
      defaultProvider: setupResult.provider,
      defaultModel: DEFAULT_MODELS[setupResult.provider],
      defaultPersona: 'default',
      providers: {
        [setupResult.provider]: providerConfig,
      },
    }
    writeFileSync(join(wnDir, 'config.json'), JSON.stringify(config, null, 2), 'utf-8')

    // 3. デフォルトペルソナを書き込み
    writeFileSync(join(personasDir, 'default.md'), DEFAULT_PERSONA_CONTENT, 'utf-8')

    return { ok: true, data: wnDir }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
