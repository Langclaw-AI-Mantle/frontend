# Langclaw Frontend

Next.js interface for **Langclaw Mantle Alpha Sentinel**.

The app gives users a Mantle-first AI Alpha & Data workspace for:

- smart-money and holder-flow monitoring
- liquidity anomaly analysis
- Mantle protocol / yield momentum checks
- Strategy Lab backtesting and paper-trading proof for Mantle pairs
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

## Demo Flow

Use Mantle Intelligence mode with:

```text
Analyze holder flow and smart-money signals on Mantle token 0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34
```

Then:

```text
Detect liquidity anomaly on Mantle pair 0xeAfc4D6d4c3391Cd4Fc10c85D2f5f972d58C0dD5
```

The response should show source-backed signals, risk notes, provider evidence, and the `Agent decision proof` panel when backend proof anchoring is enabled.

Click **Add to watchlist** on a Mantle Intelligence result, then open `/watchlist` to review saved alpha signals. Open `/strategy` to run the Dune-backed Mantle Liquidity Momentum Strategy, review equity curve/trades, and open a paper trade proof. Open `/proofs` to inspect the latest on-chain registry decisions and Strategy Proofs for the ERC-8004 agent.

Mantle Intelligence requests also reserve and settle the user's internal MNT usage balance through the backend billing ledger.

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
