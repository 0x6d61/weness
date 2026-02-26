# wn-tui アーキテクチャ設計

## 1. 概要

**wn-tui** は weness AI Agent Core (`@0x6d61/wn-core`) のターミナル UI。
Ink（React for CLI）でClaude Code ライクなストリーム型チャット UI を提供する。

- wn-core を子プロセスとして起動し、JSON-RPC 2.0 over stdin/stdout で通信
- 型定義は `@0x6d61/wn-core` から re-export（プロトコル準拠 + 型安全）
- `wn` コマンドとして公開

---

## 2. アーキテクチャ

```
┌──────────────────────────────────────┐
│  wn-tui                              │
│                                      │
│  ┌─────────┐ ┌─────────┐ ┌────────┐ │
│  │ RPC     │→│ State   │→│ UI     │ │
│  │ Client  │ │(Reducer)│ │ (Ink)  │ │
│  └────┬────┘ └─────────┘ └────────┘ │
│       │ spawn + stdin/stdout         │
└───────┼──────────────────────────────┘
        │ JSON-RPC 2.0
┌───────┴──────────────────────────────┐
│  @0x6d61/wn-core (子プロセス)         │
│  AgentLoop + LLM + Tools + MCP       │
└──────────────────────────────────────┘
```

---

## 3. ディレクトリ構成

```
wn-tui/
├── src/
│   ├── index.tsx                # エントリポイント: CLI → Core起動 → render
│   ├── rpc/
│   │   ├── types.ts             # RPC型（wn-core から re-export + TUI固有型）
│   │   └── client.ts            # RPCクライアント: Core spawn + JSON-RPC送受信
│   ├── state/
│   │   ├── types.ts             # AppState, ChatMessage, ToolExecution
│   │   └── reducer.ts           # RPC イベント → State 変換
│   ├── hooks/
│   │   ├── use-core.ts          # Core接続・イベントディスパッチ
│   │   └── use-input.ts         # 入力エリア制御
│   └── components/
│       ├── App.tsx              # ルートコンポーネント
│       ├── ChatView.tsx         # タイムライン（メッセージ + ツール）
│       ├── UserMessage.tsx      # ユーザーメッセージ
│       ├── AssistantMessage.tsx  # LLM応答
│       ├── ToolBlock.tsx        # ツール実行表示
│       ├── StatusBar.tsx        # 状態バー
│       └── InputArea.tsx        # テキスト入力
├── tests/                       # src/ とミラー構造
├── docs/
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

---

## 4. 各層の設計

### 4.1 RPC Client 層

wn-core を `child_process.spawn()` で起動し、stdin/stdout で JSON-RPC 2.0 通信を行う。

**TUI → Core（Request）:**

| メソッド | params | result |
|---|---|---|
| `input` | `{ text: string }` | `{ accepted: boolean }` |
| `abort` | `{}` | `{ aborted: boolean }` |
| `configUpdate` | `{ persona?, provider?, model? }` | `{ applied: boolean }` |

**Core → TUI（Notification）:**

| メソッド | params |
|---|---|
| `response` | `{ content: string }` |
| `toolExec` | `{ event: 'start'\|'end', name, args\|result }` |
| `stateChange` | `{ state: AgentState }` |
| `log` | `{ level, message }` |

通知は `CoreEvent` 判別共用体に変換され、`onEvent` コールバック経由で State 層に渡る。

### 4.2 State 層

`useReducer` パターンで UI 状態を管理。

```
CoreEvent → mapEventToAction() → AppAction → appReducer() → AppState
```

**AppState:**
- `messages` — チャット履歴（user / assistant）
- `toolExecutions` — ツール実行状態（running / completed / failed）
- `agentState` — idle / waiting_input / thinking / tool_running
- `connected` — Core プロセス接続状態
- `error` — エラーメッセージ

### 4.3 Hooks 層

| フック | 責務 |
|---|---|
| `useCore` | Core プロセス起動・終了、RPC イベント → dispatch |
| `useInput` | 入力値管理、thinking/tool_running 中の無効化 |

### 4.4 UI Components 層

Claude Code ライクなストリーム型レイアウト:

```
┌─────────────────────────────────────┐
│ > nmap で 10.0.0.1 をスキャンして    │ UserMessage
│                                     │
│ 了解しました。nmapを実行します       │ AssistantMessage
│  ┌─ shell ────────────────────────┐ │ ToolBlock
│  │ nmap -sV 10.0.0.1             │ │
│  │ ✓ 完了 (3.2s)                 │ │
│  └────────────────────────────────┘ │
│ スキャン結果を分析すると...          │ AssistantMessage
├─────────────────────────────────────┤
│ ● thinking | claude-sonnet          │ StatusBar
├─────────────────────────────────────┤
│ > _                                 │ InputArea
└─────────────────────────────────────┘
```

`ChatView` はメッセージとツール実行をタイムスタンプで統合し、時系列順に表示する。

---

## 5. データフロー

```
[ユーザー入力]
  → InputArea.onSubmit()
  → useInput.handleSubmit()
  → useCore.sendInput(text)
  → dispatch(USER_INPUT)         ← UI に即座反映
  → CoreClient.sendInput()       ← JSON-RPC Request
  → wn-core が処理開始

[Core からの通知]
  → CoreClient が stdout から受信
  → parseLine() → parseNotification() → CoreEvent
  → mapEventToAction() → AppAction
  → dispatch() → appReducer() → 新しい AppState
  → React re-render
```

---

## 6. 技術スタック

| 項目 | 選定 |
|---|---|
| 言語 | TypeScript 5.x (strict) |
| ランタイム | Node.js >= 20 LTS |
| UI | Ink 6.x + React 19.x |
| テスト | Vitest + ink-testing-library |
| バンドラ | tsup |
| Core 依存 | `@0x6d61/wn-core` (npm) |

---

## 7. wn-core との関係

- **依存:** `@0x6d61/wn-core` を npm 依存として持つ
- **型共有:** `AgentLoopState`, `ToolResult`, `RPC_METHODS` 等を re-export
- **実行:** 子プロセスとして `dist/cli.js` を spawn（プロセス分離）
- **障害隔離:** Core が落ちても TUI はエラー表示して継続可能
