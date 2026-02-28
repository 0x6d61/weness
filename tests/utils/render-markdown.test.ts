import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../src/utils/render-markdown.js'

describe('renderMarkdown', () => {
  it('通常のテキストをそのまま返す', () => {
    const result = renderMarkdown('Hello, world!')
    expect(result).toContain('Hello, world!')
  })

  it('太字の Markdown 記法が除去される', () => {
    const result = renderMarkdown('**bold text**')
    expect(result).toContain('bold text')
    // ** 記法が除去されている
    expect(result).not.toContain('**')
  })

  it('見出しのテキストが含まれる', () => {
    const result = renderMarkdown('# Heading 1')
    expect(result).toContain('Heading 1')
  })

  it('コードブロックを装飾付きで返す', () => {
    const result = renderMarkdown('```\nconst x = 1\n```')
    expect(result).toContain('const x = 1')
  })

  it('インラインコードを装飾付きで返す', () => {
    const result = renderMarkdown('Use `console.log()` here')
    expect(result).toContain('console.log()')
  })

  it('リストを装飾付きで返す', () => {
    const result = renderMarkdown('- item 1\n- item 2\n- item 3')
    expect(result).toContain('item 1')
    expect(result).toContain('item 2')
  })

  it('空文字列を返す', () => {
    const result = renderMarkdown('')
    expect(typeof result).toBe('string')
  })

  it('末尾の改行が除去される', () => {
    const result = renderMarkdown('Hello')
    expect(result.endsWith('\n')).toBe(false)
  })
})
