import { describe, it, expect } from 'vitest'
import { DEFAULT_MODELS, PROVIDER_MODELS } from '../../src/setup/types.js'
import type { Provider } from '../../src/setup/types.js'

describe('DEFAULT_MODELS', () => {
  it('claude のデフォルトモデルは claude-sonnet-4-6-20260217 である', () => {
    expect(DEFAULT_MODELS.claude).toBe('claude-sonnet-4-6-20260217')
  })

  it('openai のデフォルトモデルは gpt-4.1 である', () => {
    expect(DEFAULT_MODELS.openai).toBe('gpt-4.1')
  })

  it('ollama のデフォルトモデルは llama3.3 である', () => {
    expect(DEFAULT_MODELS.ollama).toBe('llama3.3')
  })

  it('gemini のデフォルトモデルは gemini-2.5-flash である', () => {
    expect(DEFAULT_MODELS.gemini).toBe('gemini-2.5-flash')
  })
})

describe('PROVIDER_MODELS', () => {
  const providers: readonly Provider[] = ['claude', 'openai', 'ollama', 'gemini']

  it('全プロバイダーのモデル一覧が定義されている', () => {
    for (const provider of providers) {
      expect(PROVIDER_MODELS[provider]).toBeDefined()
      expect(PROVIDER_MODELS[provider].length).toBeGreaterThan(0)
    }
  })

  it('各モデルエントリは label と value を持つ', () => {
    for (const provider of providers) {
      for (const model of PROVIDER_MODELS[provider]) {
        expect(model).toHaveProperty('label')
        expect(model).toHaveProperty('value')
        expect(typeof model.label).toBe('string')
        expect(typeof model.value).toBe('string')
        expect(model.label.length).toBeGreaterThan(0)
        expect(model.value.length).toBeGreaterThan(0)
      }
    }
  })

  it('claude のモデル一覧に Claude Sonnet 4.6 が含まれる', () => {
    const values = PROVIDER_MODELS.claude.map((m) => m.value)
    expect(values).toContain('claude-sonnet-4-6-20260217')
  })

  it('claude のモデル一覧に Claude Opus 4.6 が含まれる', () => {
    const values = PROVIDER_MODELS.claude.map((m) => m.value)
    expect(values).toContain('claude-opus-4-6-20260205')
  })

  it('claude のモデル一覧に Claude Haiku 4.5 が含まれる', () => {
    const values = PROVIDER_MODELS.claude.map((m) => m.value)
    expect(values).toContain('claude-haiku-4-5-20251001')
  })

  it('openai のモデル一覧に GPT-4.1 が含まれる', () => {
    const values = PROVIDER_MODELS.openai.map((m) => m.value)
    expect(values).toContain('gpt-4.1')
  })

  it('openai のモデル一覧に o3 が含まれる', () => {
    const values = PROVIDER_MODELS.openai.map((m) => m.value)
    expect(values).toContain('o3')
  })

  it('ollama のモデル一覧に llama3.3 が含まれる', () => {
    const values = PROVIDER_MODELS.ollama.map((m) => m.value)
    expect(values).toContain('llama3.3')
  })

  it('gemini のモデル一覧に gemini-2.5-flash が含まれる', () => {
    const values = PROVIDER_MODELS.gemini.map((m) => m.value)
    expect(values).toContain('gemini-2.5-flash')
  })

  it('各プロバイダーのデフォルトモデルがモデル一覧に含まれる', () => {
    for (const provider of providers) {
      const values = PROVIDER_MODELS[provider].map((m) => m.value)
      expect(values).toContain(DEFAULT_MODELS[provider])
    }
  })
})
