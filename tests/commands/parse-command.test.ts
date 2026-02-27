import { describe, it, expect } from 'vitest'
import { parseSlashCommand } from '../../src/commands/parse-command.js'

describe('parseSlashCommand', () => {
  describe('通常入力', () => {
    it('スラッシュで始まらないテキストは null を返す', () => {
      expect(parseSlashCommand('hello world')).toBeNull()
    })

    it('空文字列は null を返す', () => {
      expect(parseSlashCommand('')).toBeNull()
    })
  })

  describe('/model コマンド', () => {
    it('/model <name> を正しくパースする', () => {
      expect(parseSlashCommand('/model gpt-4o')).toEqual({
        type: 'model',
        value: 'gpt-4o',
      })
    })

    it('/model の引数がない場合は model_select を返す', () => {
      expect(parseSlashCommand('/model')).toEqual({
        type: 'model_select',
      })
    })

    it('/model の引数がスペースだけの場合は model_select を返す', () => {
      expect(parseSlashCommand('/model   ')).toEqual({
        type: 'model_select',
      })
    })
  })

  describe('/provider コマンド', () => {
    it('/provider <name> を正しくパースする', () => {
      expect(parseSlashCommand('/provider openai')).toEqual({
        type: 'provider',
        value: 'openai',
      })
    })

    it('/provider の引数がない場合は provider_select を返す', () => {
      expect(parseSlashCommand('/provider')).toEqual({
        type: 'provider_select',
      })
    })

    it('/provider の引数がスペースだけの場合は provider_select を返す', () => {
      expect(parseSlashCommand('/provider   ')).toEqual({
        type: 'provider_select',
      })
    })
  })

  describe('不明なコマンド', () => {
    it('未知のスラッシュコマンドはエラーを返す', () => {
      expect(parseSlashCommand('/unknown something')).toEqual({
        type: 'error',
        message: 'Unknown command: /unknown',
      })
    })
  })
})
