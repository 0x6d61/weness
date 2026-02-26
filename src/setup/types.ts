/**
 * セットアップウィザードの型定義
 *
 * 初回起動時の設定ウィザードで使用する型を定義する。
 */

// =============================================================================
// プロバイダー定義
// =============================================================================

/** サポートするLLMプロバイダー */
export type Provider = 'claude' | 'openai' | 'ollama' | 'gemini'

/** Claude の認証方式 */
export type AuthMethod = 'apiKey' | 'oauthToken'

/** プロバイダーごとのデフォルトモデル */
export const DEFAULT_MODELS: Readonly<Record<Provider, string>> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  ollama: 'llama3.1',
  gemini: 'gemini-2.0-flash',
} as const

/** プロバイダーの表示名 */
export const PROVIDER_LABELS: Readonly<Record<Provider, string>> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  ollama: 'Ollama (Local)',
  gemini: 'Gemini (Google)',
} as const

/** APIキーが不要なプロバイダー */
export const API_KEY_NOT_REQUIRED: ReadonlySet<Provider> = new Set<Provider>(['ollama'])

/** OAuth Token 認証をサポートするプロバイダー */
export const OAUTH_SUPPORTED: ReadonlySet<Provider> = new Set<Provider>(['claude'])

// =============================================================================
// セットアップウィザード状態
// =============================================================================

/** セットアップウィザードの現在ステップ */
export type SetupStep = 'welcome' | 'provider' | 'authMethod' | 'credential' | 'writing' | 'done'

/** ウィザード内部状態 */
export interface SetupState {
  readonly step: SetupStep
  readonly provider: Provider | null
  readonly authMethod: AuthMethod
  readonly credential: string
  readonly error: string | null
}

/** ウィザードの初期状態 */
export const INITIAL_SETUP_STATE: SetupState = {
  step: 'welcome',
  provider: null,
  authMethod: 'apiKey',
  credential: '',
  error: null,
} as const

// =============================================================================
// セットアップアクション
// =============================================================================

/** ウィザードで発行されるアクション */
export type SetupAction =
  | { readonly type: 'NEXT_FROM_WELCOME' }
  | { readonly type: 'SELECT_PROVIDER'; readonly provider: Provider }
  | { readonly type: 'SELECT_AUTH_METHOD'; readonly authMethod: AuthMethod }
  | { readonly type: 'SET_CREDENTIAL'; readonly credential: string }
  | { readonly type: 'WRITE_SUCCESS' }
  | { readonly type: 'WRITE_ERROR'; readonly error: string }

// =============================================================================
// createInitialConfig の入力
// =============================================================================

/** createInitialConfig の入力パラメータ */
export interface SetupResult {
  readonly provider: Provider
  readonly authMethod: AuthMethod
  readonly credential: string // Ollama の場合は空文字
}

// =============================================================================
// 設定ファイルの型
// =============================================================================

/** プロバイダー設定 */
export interface ProviderConfig {
  readonly apiKey?: string
  readonly authToken?: string
  readonly baseUrl?: string
}

/** config.json の型 */
export interface WnConfig {
  readonly defaultProvider: Provider
  readonly defaultModel: string
  readonly defaultPersona: string
  readonly providers: Readonly<Record<string, ProviderConfig>>
}
