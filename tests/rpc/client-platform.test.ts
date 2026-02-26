/**
 * validateCorePath のプラットフォーム別アクセスチェックテスト。
 *
 * ESM では vi.spyOn がモジュール namespace に使えないため、
 * vi.mock でファイルシステムモジュール全体をモックし、
 * accessSync の呼び出しモードを検証する。
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { constants } from 'node:fs'

// vi.hoisted: vi.mock のファクトリより先に評価される
const mockAccessSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  return {
    ...actual,
    accessSync: mockAccessSync,
  }
})

// vi.mock の後にインポート（モック済みの accessSync が使われる）
import { validateCorePath } from '../../src/rpc/client.js'

describe('validateCorePath - プラットフォーム別アクセスチェック', () => {
  const originalPlatform = process.platform

  beforeEach(() => {
    mockAccessSync.mockReset()
    // デフォルト: accessSync は成功する（エラーを投げない）
    mockAccessSync.mockImplementation(() => undefined)
  })

  afterEach(() => {
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  it('Windows では R_OK でアクセスチェックする（X_OK は使わない）', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })

    validateCorePath(process.execPath)

    expect(mockAccessSync).toHaveBeenCalledWith(expect.any(String), constants.R_OK)
    expect(mockAccessSync).not.toHaveBeenCalledWith(
      expect.any(String),
      constants.X_OK,
    )
  })

  it('Linux では X_OK でアクセスチェックする（R_OK は使わない）', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })

    validateCorePath(process.execPath)

    expect(mockAccessSync).toHaveBeenCalledWith(expect.any(String), constants.X_OK)
    expect(mockAccessSync).not.toHaveBeenCalledWith(
      expect.any(String),
      constants.R_OK,
    )
  })

  it('macOS では X_OK でアクセスチェックする（R_OK は使わない）', () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' })

    validateCorePath(process.execPath)

    expect(mockAccessSync).toHaveBeenCalledWith(expect.any(String), constants.X_OK)
    expect(mockAccessSync).not.toHaveBeenCalledWith(
      expect.any(String),
      constants.R_OK,
    )
  })

  it('Linux で X_OK 失敗時に R_OK にフォールバックせずエラーを投げる', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })
    mockAccessSync.mockImplementation((_path: unknown, mode?: number) => {
      if (mode === constants.X_OK) {
        throw new Error('EACCES: permission denied')
      }
      // R_OK は成功するが、修正後は呼ばれるべきではない
    })

    expect(() => validateCorePath(process.execPath)).toThrow('not accessible')
  })
})
