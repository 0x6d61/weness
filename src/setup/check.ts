/**
 * 設定ファイルの存在チェックと読み込み
 *
 * ~/.wn/config.json の存在チェック・読み込みを行う。
 */

import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { WnConfig } from './types.js'

/**
 * config.json の存在をチェックする。
 *
 * @param homeDir - ホームディレクトリのパス（テスト用にオーバーライド可能）
 * @returns config.json が存在すれば true
 */
export function checkConfigExists(homeDir?: string): boolean {
  const home = homeDir ?? homedir()
  const configPath = join(home, '.wn', 'config.json')
  return existsSync(configPath)
}

/**
 * config.json を読み込み、パースして返す。
 *
 * ファイルが存在しない場合やパースに失敗した場合は
 * `{ ok: false, error: string }` を返す。
 *
 * @param homeDir - ホームディレクトリのパス（テスト用にオーバーライド可能）
 * @returns パース結果の Result オブジェクト
 */
export function readConfig(homeDir?: string): { ok: true; data: WnConfig } | { ok: false; error: string } {
  const home = homeDir ?? homedir()
  const configPath = join(home, '.wn', 'config.json')

  let raw: string
  try {
    raw = readFileSync(configPath, 'utf-8')
  } catch {
    return { ok: false, error: `Cannot read config file: ${configPath}` }
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    return { ok: true, data: parsed as WnConfig }
  } catch {
    return { ok: false, error: `Failed to parse config JSON: ${configPath}` }
  }
}
