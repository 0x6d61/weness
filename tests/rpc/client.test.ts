import { describe, it, expect, vi } from 'vitest'
import { writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseNotification, validateCorePath } from '../../src/rpc/client.js'
import type { CoreEvent } from '../../src/rpc/types.js'

// =============================================================================
// parseNotification のテスト
// =============================================================================
describe('parseNotification', () => {
  describe('response 通知', () => {
    it('method=response の通知を CoreEvent に変換する', () => {
      const jsonRpc = {
        jsonrpc: '2.0',
        method: 'response',
        params: { content: 'Hello, world!' },
      }

      const result = parseNotification(jsonRpc)

      expect(result).toEqual({
        ok: true,
        data: { type: 'response', content: 'Hello, world!' },
      })
    })
  })

  describe('toolExec 通知', () => {
    it('event=start の toolExec を toolStart CoreEvent に変換する', () => {
      const jsonRpc = {
        jsonrpc: '2.0',
        method: 'toolExec',
        params: {
          event: 'start',
          name: 'nmap',
          args: { target: '192.168.1.1' },
        },
      }

      const result = parseNotification(jsonRpc)

      expect(result).toEqual({
        ok: true,
        data: {
          type: 'toolStart',
          name: 'nmap',
          args: { target: '192.168.1.1' },
        },
      })
    })

    it('event=end の toolExec を toolEnd CoreEvent に変換する', () => {
      const jsonRpc = {
        jsonrpc: '2.0',
        method: 'toolExec',
        params: {
          event: 'end',
          name: 'nmap',
          result: { ok: true, output: 'scan complete', error: undefined },
        },
      }

      const result = parseNotification(jsonRpc)

      expect(result).toEqual({
        ok: true,
        data: {
          type: 'toolEnd',
          name: 'nmap',
          result: { ok: true, output: 'scan complete', error: undefined },
        },
      })
    })

    it('event=end でエラーありの toolExec を正しく変換する', () => {
      const jsonRpc = {
        jsonrpc: '2.0',
        method: 'toolExec',
        params: {
          event: 'end',
          name: 'nmap',
          result: { ok: false, output: '', error: 'connection refused' },
        },
      }

      const result = parseNotification(jsonRpc)

      expect(result).toEqual({
        ok: true,
        data: {
          type: 'toolEnd',
          name: 'nmap',
          result: { ok: false, output: '', error: 'connection refused' },
        },
      })
    })
  })

  describe('stateChange 通知', () => {
    it.each([
      'idle' as const,
      'waiting_input' as const,
      'thinking' as const,
      'tool_running' as const,
    ])('state=%s の stateChange を CoreEvent に変換する', (state) => {
      const jsonRpc = {
        jsonrpc: '2.0',
        method: 'stateChange',
        params: { state },
      }

      const result = parseNotification(jsonRpc)

      expect(result).toEqual({
        ok: true,
        data: { type: 'stateChange', state },
      })
    })
  })

  describe('log 通知', () => {
    it.each(['info' as const, 'warn' as const, 'error' as const])(
      'level=%s の log を CoreEvent に変換する',
      (level) => {
        const jsonRpc = {
          jsonrpc: '2.0',
          method: 'log',
          params: { level, message: `test ${level} message` },
        }

        const result = parseNotification(jsonRpc)

        expect(result).toEqual({
          ok: true,
          data: { type: 'log', level, message: `test ${level} message` },
        })
      },
    )
  })

  describe('不正な通知', () => {
    it('未知の method は ok: false を返す', () => {
      const jsonRpc = {
        jsonrpc: '2.0',
        method: 'unknownMethod',
        params: {},
      }

      const result = parseNotification(jsonRpc)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toContain('unknownMethod')
      }
    })

    it('method フィールドがない場合は ok: false を返す', () => {
      const jsonRpc = {
        jsonrpc: '2.0',
        params: {},
      }

      const result = parseNotification(jsonRpc)

      expect(result.ok).toBe(false)
    })
  })
})

// =============================================================================
// validateCorePath のテスト
// =============================================================================
describe('validateCorePath', () => {
  it('有効な実行ファイルパスを正規化して返す', () => {
    // process.execPath は Node.js の実行ファイルパスで、必ず存在する
    const result = validateCorePath(process.execPath)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('空文字列を拒否する', () => {
    expect(() => validateCorePath('')).toThrow('corePath must not be empty')
  })

  it('シェルメタ文字を含むパスを拒否する', () => {
    expect(() => validateCorePath('/bin/sh; rm -rf /')).toThrow(
      'dangerous characters',
    )
    expect(() => validateCorePath('cmd | evil')).toThrow('dangerous characters')
    expect(() => validateCorePath('$(whoami)')).toThrow('dangerous characters')
    expect(() => validateCorePath('`whoami`')).toThrow('dangerous characters')
  })

  it('存在しないファイルパスを拒否する', () => {
    expect(() =>
      validateCorePath('/nonexistent/path/to/binary'),
    ).toThrow('not accessible')
  })
})

// =============================================================================
// parseLine のテスト
// =============================================================================
describe('parseLine', () => {
  // parseLine は 1 行の文字列をパースして JsonRpcMessage を返す
  // import は実装後に有効化
  it('有効な JSON 行をパースして JsonRpcMessage を返す', async () => {
    const { parseLine } = await import('../../src/rpc/client.js')
    const line = JSON.stringify({
      jsonrpc: '2.0',
      method: 'response',
      params: { content: 'hello' },
    })

    const result = parseLine(line)

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data).toEqual({
        jsonrpc: '2.0',
        method: 'response',
        params: { content: 'hello' },
      })
    }
  })

  it('無効な JSON の場合は ok: false を返す', async () => {
    const { parseLine } = await import('../../src/rpc/client.js')
    const result = parseLine('this is not json')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBeDefined()
    }
  })

  it('空文字列の場合は ok: false を返す', async () => {
    const { parseLine } = await import('../../src/rpc/client.js')
    const result = parseLine('')

    expect(result.ok).toBe(false)
  })
})

// =============================================================================
// createCoreClient の統合テスト（モック子プロセスを使用）
// =============================================================================
describe('createCoreClient', () => {
  // モック子プロセスとして node -e で JSON-RPC サーバーをシミュレートする
  // stdin から JSON-RPC リクエストを読み、対応するレスポンスを stdout に返す
  const MOCK_CORE_SCRIPT = `
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin });
    rl.on('line', (line) => {
      try {
        const req = JSON.parse(line);
        if (req.method === 'input') {
          const res = { jsonrpc: '2.0', id: req.id, result: { accepted: true } };
          process.stdout.write(JSON.stringify(res) + '\\n');
        } else if (req.method === 'abort') {
          const res = { jsonrpc: '2.0', id: req.id, result: { aborted: true } };
          process.stdout.write(JSON.stringify(res) + '\\n');
        } else if (req.method === 'configUpdate') {
          const res = { jsonrpc: '2.0', id: req.id, result: { applied: true } };
          process.stdout.write(JSON.stringify(res) + '\\n');
        }
      } catch (e) {
        // ignore parse errors
      }
    });
  `

  it('sendInput が正しい JSON-RPC リクエストを送信し結果を受け取る', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')
    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', MOCK_CORE_SCRIPT],
      onEvent,
      onExit,
    })

    try {
      const result = await client.sendInput('Hello')
      expect(result).toEqual({ accepted: true })
    } finally {
      client.kill()
    }
  })

  it('sendAbort が正しい JSON-RPC リクエストを送信し結果を受け取る', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')
    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', MOCK_CORE_SCRIPT],
      onEvent,
      onExit,
    })

    try {
      const result = await client.sendAbort()
      expect(result).toEqual({ aborted: true })
    } finally {
      client.kill()
    }
  })

  it('sendConfigUpdate が正しい JSON-RPC リクエストを送信し結果を受け取る', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')
    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', MOCK_CORE_SCRIPT],
      onEvent,
      onExit,
    })

    try {
      const result = await client.sendConfigUpdate({
        provider: 'openai',
        model: 'gpt-4',
      })
      expect(result).toEqual({ applied: true })
    } finally {
      client.kill()
    }
  })

  it('Core からの通知を受け取り onEvent コールバックが呼ばれる', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')

    // 起動直後に通知を送信するモック
    const NOTIFY_SCRIPT = `
      const notification = { jsonrpc: '2.0', method: 'stateChange', params: { state: 'idle' } };
      process.stdout.write(JSON.stringify(notification) + '\\n');
      // Keep process alive briefly to allow reading
      setTimeout(() => {}, 500);
    `

    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', NOTIFY_SCRIPT],
      onEvent,
      onExit,
    })

    // 通知が届くまで少し待つ
    await new Promise((resolve) => setTimeout(resolve, 200))

    try {
      expect(onEvent).toHaveBeenCalledWith({
        type: 'stateChange',
        state: 'idle',
      })
    } finally {
      client.kill()
    }
  })

  it('JSON-RPC エラーレスポンスを受け取った場合 Promise が reject される', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')

    const ERROR_SCRIPT = `
      const readline = require('readline');
      const rl = readline.createInterface({ input: process.stdin });
      rl.on('line', (line) => {
        try {
          const req = JSON.parse(line);
          const res = { jsonrpc: '2.0', id: req.id, error: { code: -32600, message: 'Invalid Request' } };
          process.stdout.write(JSON.stringify(res) + '\\n');
        } catch (e) {}
      });
    `

    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', ERROR_SCRIPT],
      onEvent,
      onExit,
    })

    try {
      await expect(client.sendInput('test')).rejects.toThrow('Invalid Request')
    } finally {
      client.kill()
    }
  })

  it('不正な JSON が stdout に出力されてもクラッシュしない', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')

    const BAD_JSON_SCRIPT = `
      process.stdout.write('this is not json\\n');
      // 直後に有効な通知を送信
      const notification = { jsonrpc: '2.0', method: 'log', params: { level: 'info', message: 'ok' } };
      process.stdout.write(JSON.stringify(notification) + '\\n');
      setTimeout(() => {}, 500);
    `

    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', BAD_JSON_SCRIPT],
      onEvent,
      onExit,
    })

    // 通知が届くまで少し待つ
    await new Promise((resolve) => setTimeout(resolve, 200))

    try {
      // 不正な JSON の後でも、有効な通知はちゃんと処理される
      expect(onEvent).toHaveBeenCalledWith({
        type: 'log',
        level: 'info',
        message: 'ok',
      })
    } finally {
      client.kill()
    }
  })

  it('子プロセスが終了すると onExit コールバックが呼ばれる', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')

    const EXIT_SCRIPT = `process.exit(0);`

    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', EXIT_SCRIPT],
      onEvent,
      onExit,
    })

    // プロセスが終了するまでポーリングで待つ（最大2秒）
    for (let i = 0; i < 20; i++) {
      if (onExit.mock.calls.length > 0) break
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    expect(onExit).toHaveBeenCalledWith(0)

    // kill は既に終了していても安全に呼べる
    client.kill()
  })

  it('kill() が子プロセスを終了させる', async () => {
    const { createCoreClient } = await import('../../src/rpc/client.js')

    const LONG_SCRIPT = `setTimeout(() => {}, 60000);`

    const onEvent = vi.fn()
    const onExit = vi.fn()

    const client = createCoreClient({
      corePath: process.execPath,
      coreArgs: ['-e', LONG_SCRIPT],
      onEvent,
      onExit,
    })

    client.kill()

    // プロセスが終了するまで待つ
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(onExit).toHaveBeenCalled()
  })

  it('.js ファイルを process.execPath 経由で起動し通信できる', async () => {
    const tmpFile = join(tmpdir(), `wn-test-${Date.now()}.js`)
    const script = [
      "const readline = require('readline');",
      "const rl = readline.createInterface({ input: process.stdin });",
      "rl.on('line', (line) => {",
      '  try {',
      '    const req = JSON.parse(line);',
      "    const res = { jsonrpc: '2.0', id: req.id, result: { pong: true } };",
      "    process.stdout.write(JSON.stringify(res) + '\\n');",
      '  } catch (e) {}',
      '});',
    ].join('\n')
    writeFileSync(tmpFile, script)

    try {
      const { createCoreClient } = await import('../../src/rpc/client.js')
      const onEvent = vi.fn()
      const onExit = vi.fn()

      const client = createCoreClient({
        corePath: tmpFile,
        coreArgs: [],
        onEvent,
        onExit,
      })

      const result = await client.sendInput('test')
      expect(result).toEqual({ pong: true })
      client.kill()
    } finally {
      unlinkSync(tmpFile)
    }
  })
})
