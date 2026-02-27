import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { checkConfigExists, readConfig } from '../../src/setup/check.js'

// テスト用の一時ディレクトリを使う
// checkConfigExists はデフォルトで os.homedir() を使うが、
// テスト用にカスタムホームディレクトリを受け付ける

describe('checkConfigExists', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `wn-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('config.json が存在する場合 true を返す', () => {
    const wnDir = join(testDir, '.wn')
    mkdirSync(wnDir, { recursive: true })
    writeFileSync(join(wnDir, 'config.json'), '{}')

    expect(checkConfigExists(testDir)).toBe(true)
  })

  it('config.json が存在しない場合 false を返す', () => {
    const wnDir = join(testDir, '.wn')
    mkdirSync(wnDir, { recursive: true })
    // config.json は作成しない

    expect(checkConfigExists(testDir)).toBe(false)
  })

  it('.wn ディレクトリ自体が存在しない場合 false を返す', () => {
    // testDir に .wn ディレクトリを作成しない
    expect(checkConfigExists(testDir)).toBe(false)
  })

  it('例外をスローしない', () => {
    // 存在しないディレクトリを指定しても例外をスローしない
    const nonExistent = join(testDir, 'does-not-exist')
    expect(() => checkConfigExists(nonExistent)).not.toThrow()
    expect(checkConfigExists(nonExistent)).toBe(false)
  })
})

describe('readConfig', () => {
  let testDir: string

  beforeEach(() => {
    testDir = join(tmpdir(), `wn-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true })
  })

  it('config.json が存在し正しいJSONの場合、ok: true と data を返す', () => {
    const wnDir = join(testDir, '.wn')
    mkdirSync(wnDir, { recursive: true })

    const config = {
      defaultProvider: 'claude',
      defaultModel: 'claude-sonnet-4-20250514',
      defaultPersona: 'default',
      providers: {
        claude: { apiKey: 'test-key' },
      },
    }
    writeFileSync(join(wnDir, 'config.json'), JSON.stringify(config))

    const result = readConfig(testDir)
    expect(result).toEqual({ ok: true, data: config })
  })

  it('config.json が存在しない場合、ok: false と error を返す', () => {
    // .wn ディレクトリも config.json も作らない
    const result = readConfig(testDir)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it('config.json の内容が不正なJSONの場合、ok: false と error を返す', () => {
    const wnDir = join(testDir, '.wn')
    mkdirSync(wnDir, { recursive: true })
    writeFileSync(join(wnDir, 'config.json'), '{invalid json content!!!')

    const result = readConfig(testDir)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    }
  })
})
