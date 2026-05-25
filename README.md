# Langclaw Frontend

Next.js interface for **Langclaw Mantle Alpha Sentinel**.

The app gives users a Mantle-first AI Alpha & Data workspace for:

- wallet-backed account access with a Telegram link gate before chat or Research runs
- Telegram popup onboarding for alpha alerts
- smart-money and holder-flow monitoring
- liquidity anomaly analysis
- Mantle protocol / yield momentum checks
- Surf-first Research responses with Dune and Nansen smart-money fallback
- structured Evidence, Candidates, Limits, and Conclusion report sections
- DEX accumulation, CEX withdrawal, and candidate wallet tables when row-level evidence exists
- Strategy Lab backtesting and paper-trading proof for Mantle pairs
- Alpha Watchlist for Supabase-backed saved follow-up signals
- on-chain agent decision proof display
- Proof Center for registry decision history

## App routes

| Route | Purpose |
| --- | --- |
| `/` | Marketing home |
| `/chat`, `/chat/[slug]` | Chat and Research sessions |
| `/watchlist` | Saved alpha signals |
| `/strategy` | Strategy Lab (Dune backtest, scan, paper trade) |
| `/proofs` | Proof Center (registry + journal) |
| `/usage` | MNT usage ledger and deposits |
| `/task` | Automation monitors |
| `/key` | API Console |
| `/memory` | Agent memory |
| `/settings` | Account, notifications, Telegram link |

Wallet connection is **Mantle mainnet only** (chain ID `5000`).

## Local setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

The frontend talks to the backend through `NEXT_PUBLIC_LANGCLAW_API_URL`. By default:

```bash
NEXT_PUBLIC_LANGCLAW_API_URL=http://localhost:3001
```

## Connection flow

Langclaw requires two user connections before chat or Research starts:

1. Connect wallet on Mantle.
2. Link Telegram.

The wallet step opens the wallet modal. The Telegram step opens an in-app popup with **Connect Telegram**, a deep link, and a fallback command. The app polls the backend until the Telegram chat is linked.

## Chat modes

| UI label | `toolMode` | Behavior |
| --- | --- | --- |
| **Chat** | `chat` | Direct OpenAI Responses stream |
| **Research** | `research` | Full Langclaw workflow with on-chain enrichment and proof |

- Legacy `toolMode: onchain` is normalized to `research` in the API client.
- Smart-money prompts in Chat mode can be auto-upgraded to Research by the chat transport.
- The client hard-locks the model to **GPT-5.4 nano** (`lib/chat-model.ts`). There is no user-facing model picker.

## Demo flow

Connect a wallet, link Telegram, then use **Research** with:

```text
Find smart-money accumulation on Mantle
```

Then:

```text
Find smart-money accumulation on Arbitrum
```

The response should show source-backed signals, structured report sections, evidence tables when row-level rows exist, and the **Agent decision proof** panel when backend proof anchoring is enabled.

When the backend sets `alphaSignal.alertEligible=true`, the linked Telegram chat receives a concise alpha alert.

Click **Add to watchlist** on a Research result, then open `/watchlist`. Open `/strategy` for the Dune-backed Mantle Liquidity Momentum Strategy. Open `/proofs` for registry decisions and strategy proofs.

For hackathon packaging, the main story is **AI Alpha & Data**. Strategy Lab is an additive module for proof completeness.

Research requests reserve and settle the user's internal MNT usage balance through the backend billing ledger.

## Research response rules

The frontend renders backend `report` objects directly when available.

- `Read`, `Limits`, and `Conclusion` render as paragraphs.
- Evidence and candidate sections show tables only when the backend returns rows.
- Empty provider rows must not render fake tables.
- Chain-level prompts keep chain scope. Mantle chain research must not display as Ethereum MNT research.
- Raw provider errors, billing state, HTTP details, and internal fallback internals stay out of user-visible answer text.
- The visible answer language follows the user's prompt language when the backend detects it.

Useful smoke prompts:

```text
Find smart-money accumulation on Mantle
Find smart-money accumulation on Arbitrum
Find smart-money accumulation on Ethereum
Cari smart-money accumulation di Mantle
```

## Mantle proof (documented deployment)

| Item | Value |
| --- | --- |
| `LangclawRegistry` | `0xe69755e4249c4978c39fbe847ca9674ce7af3505` |
| `LangclawTradingJournal` | `0xe96e9b76af8c8f32bfa2235d647186826d92fb7d` |
| ERC-8004 agent ID | `94` |

Strategy Lab journal proofs use `LangclawTradingJournal`. Backtests still run when the journal is not configured on the backend, but Proof Center shows the journal as not configured until `MANTLE_LANGCLAW_TRADING_JOURNAL_ADDRESS` and `MANTLE_TRADING_JOURNAL_ENABLED=true` are set.

## Scripts

```bash
pnpm dev          # next dev
pnpm build        # production build
pnpm start        # next start
pnpm typecheck    # tsc --noEmit
pnpm lint         # eslint
```

## Verification

```bash
pnpm typecheck
pnpm build
```

Focused lint after chat or Telegram UI changes:

```bash
pnpm exec eslint components/TelegramConnectDialog.tsx components/ChatInput.tsx components/Chat.tsx lib/langclaw-api.ts lib/langclaw-chat-transport.ts
```

## Related docs

- [Backend README](../backend/README.md)
- [API reference](../backend/docs/API_REFERENCE.md)
- [Root README](../README.md)
