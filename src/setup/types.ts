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
  claude: 'claude-sonnet-4-6-20260217',
  openai: 'gpt-4.1',
  ollama: 'llama3.3',
  gemini: 'gemini-2.5-flash',
} as const

/** プロバイダーの表示名 */
export const PROVIDER_LABELS: Readonly<Record<Provider, string>> = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  ollama: 'Ollama (Local)',
  gemini: 'Gemini (Google)',
} as const

/** プロバイダーごとのモデル一覧 */
export const PROVIDER_MODELS: Readonly<Record<Provider, ReadonlyArray<{ label: string; value: string }>>> = {
  claude: [
    { label: 'Claude Sonnet 4.6', value: 'claude-sonnet-4-6-20260217' },
    { label: 'Claude Opus 4.6', value: 'claude-opus-4-6-20260205' },
    { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5-20251001' },
  ],
  openai: [
    { label: 'GPT-4.1', value: 'gpt-4.1' },
    { label: 'GPT-4.1 mini', value: 'gpt-4.1-mini' },
    { label: 'o3', value: 'o3' },
    { label: 'o3-mini', value: 'o3-mini' },
  ],
  ollama: [
    { label: 'Llama 3.3', value: 'llama3.3' },
    { label: 'Qwen 3', value: 'qwen3' },
    { label: 'DeepSeek R1', value: 'deepseek-r1' },
    { label: 'Mistral', value: 'mistral' },
  ],
  gemini: [
    { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
    { label: 'Gemini 3.1 Pro', value: 'gemini-3.1-pro' },
    { label: 'Gemini 2.5 Flash Lite', value: 'gemini-2.5-flash-lite' },
  ],
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
