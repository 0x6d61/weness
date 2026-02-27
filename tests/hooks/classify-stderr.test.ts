import { describe, it, expect } from 'vitest'
import { classifyStderrLevel } from '../../src/hooks/classify-stderr.js'

describe('classifyStderrLevel', () => {
  it('起動ログメッセージを info に分類する', () => {
    expect(
      classifyStderrLevel(
        'wn-core serve started (provider=claude, model=claude-sonnet-4-20250514)'
      )
    ).toBe('info')
  })

  it('"error" を含むメッセージを error に分類する', () => {
    expect(classifyStderrLevel('Fatal error: connection refused')).toBe('error')
    expect(classifyStderrLevel('Error: something went wrong')).toBe('error')
    expect(classifyStderrLevel('ERROR: critical failure')).toBe('error')
  })

  it('それ以外の stderr メッセージを warn に分類する', () => {
    expect(classifyStderrLevel('some debug output')).toBe('warn')
    expect(classifyStderrLevel('deprecation warning')).toBe('warn')
  })

  it('空文字列を warn に分類する', () => {
    expect(classifyStderrLevel('')).toBe('warn')
  })
})
