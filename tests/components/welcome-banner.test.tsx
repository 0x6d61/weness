import { describe, it, expect } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { WelcomeBanner } from '../../src/components/WelcomeBanner.js'

describe('WelcomeBanner', () => {
  it('weness テキストが表示される', () => {
    const { lastFrame } = render(
      <WelcomeBanner provider="claude" model="claude-sonnet-4-20250514" />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('weness')
  })

  it('provider と model が表示される', () => {
    const { lastFrame } = render(
      <WelcomeBanner provider="claude" model="claude-sonnet-4-20250514" />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('claude')
    expect(frame).toContain('claude-sonnet-4-20250514')
  })

  it('ASCII アートの一部が含まれる', () => {
    const { lastFrame } = render(
      <WelcomeBanner provider="openai" model="gpt-4o" />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('oOOOo')
  })
})
