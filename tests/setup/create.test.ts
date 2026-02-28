import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, readFileSync, rmSync, existsSync, chmodSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir, platform } from 'node:os'
import { createInitialConfig } from '../../src/setup/create.js'
import type { SetupResult, WnConfig } from '../../src/setup/types.js'

describe('createInitialConfig', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `wn-create-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    )
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  // ===========================================================================
  // ディレクトリ構造作成
  // ===========================================================================

  describe('ディレクトリ構造作成', () => {
    it('~/.wn/ ディレクトリが作成される', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-test-key' }
      const result = createInitialConfig(input, testDir)

      expect(result.ok).toBe(true)
      expect(existsSync(join(testDir, '.wn'))).toBe(true)
    })

    it('~/.wn/personas/ ディレクトリが作成される', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-test-key' }
      const result = createInitialConfig(input, testDir)

      expect(result.ok).toBe(true)
      expect(existsSync(join(testDir, '.wn', 'personas'))).toBe(true)
    })
  })

  // ===========================================================================
  // config.json の内容
  // ===========================================================================

  describe('config.json の内容', () => {
    it('Claude を選択した場合の config.json が正しい内容になる', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-claude-key' }
      const result = createInitialConfig(input, testDir)

      expect(result.ok).toBe(true)

      const configPath = join(testDir, '.wn', 'config.json')
      expect(existsSync(configPath)).toBe(true)

      const config: WnConfig = JSON.parse(readFileSync(configPath, 'utf-8'))
      expect(config.defaultProvider).toBe('claude')
      expect(config.defaultModel).toBe('claude-sonnet-4-20250514')
      expect(config.defaultPersona).toBe('default')
      expect(config.providers).toEqual({
        claude: { apiKey: 'sk-claude-key' },
      })
    })
  })

  // ===========================================================================
  // personas/default.md の内容
  // ===========================================================================

  describe('personas/default.md の内容', () => {
    it('デフォルトペルソナファイルが作成される', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-test-key' }
      const result = createInitialConfig(input, testDir)

      expect(result.ok).toBe(true)

      const personaPath = join(testDir, '.wn', 'personas', 'default.md')
      expect(existsSync(personaPath)).toBe(true)

      const content = readFileSync(personaPath, 'utf-8')
      expect(content).toContain('You are a helpful AI assistant')
      expect(content).toContain('Guidelines:')
      expect(content).toContain('Be concise but thorough')
    })
  })

  // ===========================================================================
  // 各プロバイダー別テスト
  // ===========================================================================

  describe('各プロバイダー別テスト', () => {
    it('Claude (API Key): apiKey が設定される、モデルが claude-sonnet-4-20250514', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-ant-key123' }
      createInitialConfig(input, testDir)

      const config: WnConfig = JSON.parse(
        readFileSync(join(testDir, '.wn', 'config.json'), 'utf-8'),
      )
      expect(config.defaultProvider).toBe('claude')
      expect(config.defaultModel).toBe('claude-sonnet-4-20250514')
      expect(config.providers.claude?.apiKey).toBe('sk-ant-key123')
      expect(config.providers.claude?.authToken).toBeUndefined()
    })

    it('Claude (OAuth Token): authToken が設定される', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'oauthToken', credential: 'oauth-token-abc' }
      createInitialConfig(input, testDir)

      const config: WnConfig = JSON.parse(
        readFileSync(join(testDir, '.wn', 'config.json'), 'utf-8'),
      )
      expect(config.defaultProvider).toBe('claude')
      expect(config.defaultModel).toBe('claude-sonnet-4-20250514')
      expect(config.providers.claude?.authToken).toBe('oauth-token-abc')
    })

    it('Claude (OAuth Token): apiKey フィールドがないこと', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'oauthToken', credential: 'oauth-token-xyz' }
      createInitialConfig(input, testDir)

      const config: WnConfig = JSON.parse(
        readFileSync(join(testDir, '.wn', 'config.json'), 'utf-8'),
      )
      expect(config.providers.claude?.apiKey).toBeUndefined()
      expect(config.providers.claude?.authToken).toBe('oauth-token-xyz')
    })

    it('OpenAI: apiKey が設定される、モデルが gpt-4.1', () => {
      const input: SetupResult = { provider: 'openai', authMethod: 'apiKey', credential: 'sk-openai-key456' }
      createInitialConfig(input, testDir)

      const config: WnConfig = JSON.parse(
        readFileSync(join(testDir, '.wn', 'config.json'), 'utf-8'),
      )
      expect(config.defaultProvider).toBe('openai')
      expect(config.defaultModel).toBe('gpt-4.1')
      expect(config.providers.openai?.apiKey).toBe('sk-openai-key456')
    })

    it('Ollama: apiKey なし、baseUrl が設定される、モデルが llama3.3', () => {
      const input: SetupResult = { provider: 'ollama', authMethod: 'apiKey', credential: '' }
      createInitialConfig(input, testDir)

      const config: WnConfig = JSON.parse(
        readFileSync(join(testDir, '.wn', 'config.json'), 'utf-8'),
      )
      expect(config.defaultProvider).toBe('ollama')
      expect(config.defaultModel).toBe('llama3.3')
      expect(config.providers.ollama?.apiKey).toBeUndefined()
      expect(config.providers.ollama?.baseUrl).toBe('http://localhost:11434')
    })

    it('Gemini: apiKey が設定される、モデルが gemini-2.5-flash', () => {
      const input: SetupResult = { provider: 'gemini', authMethod: 'apiKey', credential: 'gemini-key789' }
      createInitialConfig(input, testDir)

      const config: WnConfig = JSON.parse(
        readFileSync(join(testDir, '.wn', 'config.json'), 'utf-8'),
      )
      expect(config.defaultProvider).toBe('gemini')
      expect(config.defaultModel).toBe('gemini-2.5-flash')
      expect(config.providers.gemini?.apiKey).toBe('gemini-key789')
    })
  })

  // ===========================================================================
  // エラー時 Result.Err
  // ===========================================================================

  describe('エラー時 Result.Err', () => {
    it('書き込み不可のパスを指定した場合にエラー Result を返す', () => {
      // 存在しないドライブレター / 不正パスで書き込み不可にする
      const invalidDir =
        platform() === 'win32'
          ? 'Z:\\__nonexistent_drive__\\impossible\\path'
          : '/proc/impossible/path'

      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-test' }
      const result = createInitialConfig(input, invalidDir)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(typeof result.error).toBe('string')
        expect(result.error.length).toBeGreaterThan(0)
      }
    })
  })

  // ===========================================================================
  // 戻り値の確認
  // ===========================================================================

  describe('戻り値', () => {
    it('成功時に作成した .wn ディレクトリのパスを返す', () => {
      const input: SetupResult = { provider: 'claude', authMethod: 'apiKey', credential: 'sk-test' }
      const result = createInitialConfig(input, testDir)

      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.data).toBe(join(testDir, '.wn'))
      }
    })
  })
})
