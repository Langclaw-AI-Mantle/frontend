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
- Strategy Lab backtesting and paper-trading proof for Mantle pairs as a score booster for the core AI Alpha & Data workflow
- source evidence inspection
- Alpha Watchlist for Supabase-backed saved follow-up signals
- on-chain agent decision proof display
- Proof Center for registry decision history

## Local Setup

```bash
cp .env.example .env.local
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

The frontend talks to the backend through `NEXT_PUBLIC_LANGCLAW_API_URL`. By default, use:

```bash
NEXT_PUBLIC_LANGCLAW_API_URL=http://localhost:3001
```

## Connection Flow

Langclaw requires two user connections before chat or Research starts:

1. Connect wallet.
2. Link Telegram.

The wallet step opens the wallet modal. The Telegram step opens an in-app popup with a **Connect Telegram** button, a Telegram deep link, and a fallback command. The app polls the backend until the Telegram chat is linked.

## Demo Flow

First connect a wallet. If Telegram is not linked yet, click **Connect Telegram** in the popup, open the bot, and confirm the wallet link.

Use Research mode with:

```text
Find smart-money accumulation on Mantle
```

Then:

```text
Find smart-money accumulation on Arbitrum
```

The response should show source-backed signals, structured report sections, evidence tables when row-level rows exist, and the `Agent decision proof` panel when backend proof anchoring is enabled.

When the backend marks `alphaSignal.alertEligible=true`, the linked Telegram chat receives a concise alpha alert with signal, target, confidence, warning summary, proof decision, transaction link, action, and run ID.

Click **Add to watchlist** on a Research result, then open `/watchlist` to review saved alpha signals. Open `/strategy` to run the Dune-backed Mantle Liquidity Momentum Strategy, review equity curve/trades, and open a paper trade proof. Open `/proofs` to inspect the latest on-chain registry decisions and Strategy Proofs for the ERC-8004 agent.

For hackathon packaging, the main product story stays `AI Alpha & Data`. Strategy Lab is shown as an additive demo module that strengthens the alpha narrative, visual evidence, and proof completeness.

Research requests also reserve and settle the user's internal MNT usage balance through the backend billing ledger.

## Research Response Rules

The frontend renders backend report objects directly when available.

- `Read`, `Limits`, and `Conclusion` should render as paragraphs.
- Evidence and candidate sections should show tables when the backend returns rows.
- Empty provider rows should not render fake `Not available` tables.
- Chain-level prompts keep chain scope. Mantle chain research should not be displayed as Ethereum MNT research.
- Token activity on another chain can appear only as external low-confidence context.
- Raw provider errors, Surf balance errors, HTTP errors, CLI flags, and internal fallback details should stay out of user-visible answer text.
- The visible answer language follows the user's prompt language when the backend detects it.

Useful smoke prompts:

```text
Find smart-money accumulation on Mantle
Find smart-money accumulation on Arbitrum
Find smart-money accumulation on Ethereum
Cari smart-money accumulation di Mantle
```

## Mantle Proof

Live proof registry:

```text
0xe69755e4249c4978c39fbe847ca9674ce7af3505
```

ERC-8004 agent ID:

```text
94
```

Strategy Lab journal proofs use `LangclawTradingJournal`. The page still runs backtests when the journal address is missing, but Proof Center will show the journal as not configured until `LANGCLAW_TRADING_JOURNAL_ADDRESS` is set on the backend.

## Verification

```bash
pnpm typecheck
pnpm build
```

For focused checks after chat or Telegram UI changes:

```bash
pnpm exec eslint components/TelegramConnectDialog.tsx components/ChatInput.tsx components/Chat.tsx lib/langclaw-api.ts lib/langclaw-chat-transport.ts
```
