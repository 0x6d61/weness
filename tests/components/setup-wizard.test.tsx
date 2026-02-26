import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from 'ink-testing-library'
import React from 'react'
import { SetupWizard } from '../../src/components/SetupWizard.js'

// createInitialConfig をモックして、ファイルシステムに書き込まない
vi.mock('../../src/setup/create.js', () => ({
  createInitialConfig: vi.fn(() => ({ ok: true, data: '/mock/.wn' })),
}))

describe('SetupWizard', () => {
  let onComplete: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onComplete = vi.fn()
    vi.clearAllMocks()
  })

  it('ウェルカムステップの表示: 初期表示で「weness」を含むメッセージが表示される', () => {
    const { lastFrame } = render(
      <SetupWizard onComplete={onComplete} />,
    )
    const frame = lastFrame() ?? ''
    expect(frame).toContain('weness')
  })

  it('ウェルカムから次へ進む: Enter キーを押すとプロバイダー選択に進む', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムステップであることを確認
    expect(lastFrame() ?? '').toContain('weness')

    // Enter キーで次へ
    stdin.write('\r')

    // プロバイダー選択画面に進んだことを確認
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('Claude')
    })
  })

  it('プロバイダー選択の表示: プロバイダー名が表示される', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムからプロバイダー選択へ
    stdin.write('\r')

    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('Claude')
      expect(frame).toContain('OpenAI')
      expect(frame).toContain('Ollama')
      expect(frame).toContain('Gemini')
    })
  })

  it('Claude 選択時に認証方式選択ステップが表示される', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムからプロバイダー選択へ
    stdin.write('\r')

    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('Claude')
    })

    // Claude が先頭で選択されているので Enter で選択
    stdin.write('\r')

    // 認証方式選択画面に進む
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('Select authentication method')
      expect(frame).toContain('API Key')
      expect(frame).toContain('OAuth Token')
    })
  })

  it('Claude で API Key を選択した場合のフロー: API キー入力画面に進む', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムからプロバイダー選択へ
    stdin.write('\r')

    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('Claude')
    })

    // Claude を選択
    stdin.write('\r')

    // 認証方式選択画面
    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('API Key')
    })

    // API Key が先頭なので Enter で選択
    stdin.write('\r')

    // API キー入力画面に進む
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('API key')
    })
  })

  it('Claude で OAuth Token を選択した場合のフロー: OAuth トークン入力画面に進む', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムからプロバイダー選択へ
    stdin.write('\r')

    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('Claude')
    })

    // Claude を選択
    stdin.write('\r')

    // 認証方式選択画面を確認
    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('Select authentication method')
    })

    // OAuth Token は 2 番目なので数字キー '2' で直接選択
    stdin.write('2')

    // OAuth トークン入力画面に進む
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('OAuth token')
    })
  })

  it('OpenAI 選択後は認証方式をスキップして Credential 入力へ進む', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムからプロバイダー選択へ
    stdin.write('\r')

    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('OpenAI')
    })

    // OpenAI は 2 番目なので数字キー '2' で直接選択
    stdin.write('2')

    // API キー入力画面に進む（認証方式選択をスキップ）
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      expect(frame).toContain('API key')
      expect(frame).toContain('OpenAI')
    })
  })

  it('Ollama 選択時は APIキーをスキップ: 書き込みステップに進む', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカムからプロバイダー選択へ
    stdin.write('\r')

    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('Ollama')
    })

    // Ollama を数字キー 3 でダイレクト選択（1-indexed: 1=Claude, 2=OpenAI, 3=Ollama）
    stdin.write('3')

    // APIキーをスキップして、完了画面に直接進む
    await vi.waitFor(() => {
      const frame = lastFrame() ?? ''
      // APIキー入力画面ではなく、Setup complete が表示される
      expect(frame).toContain('Setup complete')
    })
  })

  it('onComplete コールバック: 最終ステップ完了後に onComplete が呼ばれる', async () => {
    const { lastFrame, stdin } = render(
      <SetupWizard onComplete={onComplete} />,
    )

    // ウェルカム → プロバイダー選択
    stdin.write('\r')

    // プロバイダー選択画面を確認
    await vi.waitFor(() => {
      expect(lastFrame() ?? '').toContain('Ollama')
    })

    // Ollama を数字キー 3 でダイレクト選択（APIキースキップで最速で完了へ）
    stdin.write('3')

    // done ステップに到達するまで待つ
    await vi.waitFor(
      () => {
        const frame = lastFrame() ?? ''
        expect(frame).toContain('Setup complete')
      },
      { timeout: 3000 },
    )

    // onComplete が呼ばれるまで待つ（500ms のタイマー）
    await vi.waitFor(
      () => {
        expect(onComplete).toHaveBeenCalledTimes(1)
      },
      { timeout: 3000 },
    )
  })
})
