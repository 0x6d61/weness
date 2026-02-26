/**
 * 設定ファイルの存在チェック
 *
 * ~/.wn/config.json が存在するかどうかを確認する。
 */

import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

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
