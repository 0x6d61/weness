import React, { useReducer, useEffect, useCallback, useState } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'
import { createInitialConfig } from '../setup/create.js'
import {
  PROVIDER_LABELS,
  API_KEY_NOT_REQUIRED,
  OAUTH_SUPPORTED,
  INITIAL_SETUP_STATE,
} from '../setup/types.js'
import type { SetupState, SetupAction, Provider, AuthMethod } from '../setup/types.js'

// =============================================================================
// Reducer
// =============================================================================

function setupReducer(state: SetupState, action: SetupAction): SetupState {
  switch (action.type) {
    case 'NEXT_FROM_WELCOME':
      return { ...state, step: 'provider' }
    case 'SELECT_PROVIDER': {
      if (API_KEY_NOT_REQUIRED.has(action.provider)) {
        return { ...state, provider: action.provider, step: 'writing' }
      }
      if (OAUTH_SUPPORTED.has(action.provider)) {
        return { ...state, provider: action.provider, step: 'authMethod' }
      }
      return { ...state, provider: action.provider, step: 'credential' }
    }
    case 'SELECT_AUTH_METHOD':
      return { ...state, authMethod: action.authMethod, step: 'credential' }
    case 'SET_CREDENTIAL':
      return { ...state, credential: action.credential, step: 'writing' }
    case 'WRITE_SUCCESS':
      return { ...state, step: 'done', error: null }
    case 'WRITE_ERROR':
      return { ...state, error: action.error }
    default:
      return state
  }
}

// =============================================================================
// Provider items for SelectInput
// =============================================================================

const providerItems: ReadonlyArray<{ label: string; value: string }> = [
  { label: PROVIDER_LABELS.claude, value: 'claude' },
  { label: PROVIDER_LABELS.openai, value: 'openai' },
  { label: PROVIDER_LABELS.ollama, value: 'ollama' },
  { label: PROVIDER_LABELS.gemini, value: 'gemini' },
]

// =============================================================================
// Props
// =============================================================================

interface SetupWizardProps {
  readonly onComplete: () => void
}

// =============================================================================
// Sub-components for each step
// =============================================================================

function WelcomeStep(): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">
        {'Welcome to weness'}
      </Text>
      <Text>{''}</Text>
      <Text>{'Your AI Agent Core assistant.'}</Text>
      <Text>{''}</Text>
      <Text dimColor>{'Press Enter to continue...'}</Text>
    </Box>
  )
}

function ProviderStep({
  onSelect,
}: {
  readonly onSelect: (item: { value: string }) => void
}): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{'Select your LLM provider:'}</Text>
      <Text>{''}</Text>
      <SelectInput items={[...providerItems]} onSelect={onSelect} />
    </Box>
  )
}

function AuthMethodStep({
  onSelect,
}: {
  readonly onSelect: (item: { value: string }) => void
}): React.ReactElement {
  const items = [
    { label: 'API Key', value: 'apiKey' },
    { label: 'OAuth Token', value: 'oauthToken' },
  ]
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{'Select authentication method:'}</Text>
      <Text>{''}</Text>
      <SelectInput items={items} onSelect={onSelect} />
    </Box>
  )
}

function CredentialStep({
  provider,
  authMethod,
  onSubmit,
}: {
  readonly provider: Provider
  readonly authMethod: AuthMethod
  readonly onSubmit: (value: string) => void
}): React.ReactElement {
  const [value, setValue] = useState('')

  const handleSubmit = useCallback(
    (val: string) => {
      if (val.trim().length > 0) {
        onSubmit(val.trim())
      }
    },
    [onSubmit],
  )

  const label = authMethod === 'oauthToken'
    ? `Enter your OAuth token for ${PROVIDER_LABELS[provider]}:`
    : `Enter your API key for ${PROVIDER_LABELS[provider]}:`

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{label}</Text>
      <Text>{''}</Text>
      <Box>
        <Text>{'> '}</Text>
        <TextInput
          value={value}
          onChange={setValue}
          onSubmit={handleSubmit}
          mask="*"
        />
      </Box>
    </Box>
  )
}

function WritingStep(): React.ReactElement {
  return (
    <Box flexDirection="column" padding={1}>
      <Text>{'Writing configuration...'}</Text>
    </Box>
  )
}

function DoneStep({ error }: { readonly error: string | null }): React.ReactElement {
  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">{`Setup failed: ${error}`}</Text>
      </Box>
    )
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text color="green" bold>{'Setup complete!'}</Text>
      <Text>{'Your configuration has been saved.'}</Text>
    </Box>
  )
}

// =============================================================================
// Main component
// =============================================================================

export function SetupWizard({ onComplete }: SetupWizardProps): React.ReactElement {
  const [state, dispatch] = useReducer(setupReducer, INITIAL_SETUP_STATE)

  // Welcome ステップで Enter キーを受け付ける
  useInput((_input, key) => {
    if (state.step === 'welcome' && key.return) {
      dispatch({ type: 'NEXT_FROM_WELCOME' })
    }
  })

  // プロバイダー選択ハンドラ
  const handleProviderSelect = useCallback((item: { value: string }) => {
    dispatch({ type: 'SELECT_PROVIDER', provider: item.value as Provider })
  }, [])

  // 認証方式選択ハンドラ
  const handleAuthMethodSelect = useCallback((item: { value: string }) => {
    dispatch({ type: 'SELECT_AUTH_METHOD', authMethod: item.value as AuthMethod })
  }, [])

  // Credential 送信ハンドラ
  const handleCredentialSubmit = useCallback((credential: string) => {
    dispatch({ type: 'SET_CREDENTIAL', credential })
  }, [])

  // writing ステップで createInitialConfig を実行
  useEffect(() => {
    if (state.step === 'writing' && state.provider) {
      const result = createInitialConfig({
        provider: state.provider,
        authMethod: state.authMethod,
        credential: state.credential,
      })
      if (result.ok) {
        dispatch({ type: 'WRITE_SUCCESS' })
      } else {
        dispatch({ type: 'WRITE_ERROR', error: result.error })
      }
    }
  }, [state.step, state.provider, state.authMethod, state.credential])

  // done ステップに入ったら 500ms 後に onComplete を呼ぶ
  useEffect(() => {
    if (state.step === 'done' && !state.error) {
      const timer = setTimeout(() => {
        onComplete()
      }, 500)
      return () => {
        clearTimeout(timer)
      }
    }
  }, [state.step, state.error, onComplete])

  // ステップに応じた画面を表示
  switch (state.step) {
    case 'welcome':
      return <WelcomeStep />
    case 'provider':
      return <ProviderStep onSelect={handleProviderSelect} />
    case 'authMethod':
      return <AuthMethodStep onSelect={handleAuthMethodSelect} />
    case 'credential': {
      if (!state.provider) return <WritingStep />
      return (
        <CredentialStep
          provider={state.provider}
          authMethod={state.authMethod}
          onSubmit={handleCredentialSubmit}
        />
      )
    }
    case 'writing':
      return <WritingStep />
    case 'done':
      return <DoneStep error={state.error} />
  }
}
