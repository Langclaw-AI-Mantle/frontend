"use client";

import { useMemo, useState } from "react";
import {
  AlertCircleIcon,
  ArrowUpRightIcon,
  FlaskConicalIcon,
  PlayIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  openStrategyPaperTrade,
  readFriendlyError,
  runStrategyBacktest,
  type StrategyBacktestPayload,
  type StrategyPaperTradePayload,
  type StrategyTrade,
  type TradingJournalProof,
} from "@/lib/langclaw-api";

const samplePairs = [
  {
    label: "Mantle momentum sample",
    value: "0x365722f12ceb2063286a268b03c654df81b7c00f",
  },
  {
    label: "Use query default",
    value: "default",
  },
];

const chartConfig = {
  equityUsd: {
    color: "var(--chart-1)",
    label: "Equity",
  },
} satisfies ChartConfig;

export default function StrategyPage() {
  const [selectedPair, setSelectedPair] = useState(samplePairs[0].value);
  const [customPair, setCustomPair] = useState("");
  const [queryId, setQueryId] = useState("");
  const [backtest, setBacktest] = useState<StrategyBacktestPayload | null>(null);
  const [paperTrade, setPaperTrade] = useState<StrategyPaperTradePayload | null>(
    null,
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<"backtest" | "paper" | "">("");

  const pairAddress = useMemo(() => {
    const custom = customPair.trim();

    if (custom) {
      return custom;
    }

    return selectedPair === "default" ? undefined : selectedPair;
  }, [customPair, selectedPair]);

  const chartData = useMemo(
    () =>
      (backtest?.equityCurve ?? []).map((point) => ({
        equityUsd: point.equityUsd,
        label: formatShortDate(point.timestamp),
      })),
    [backtest],
  );
  const latestPaperDecisionCopy = getPaperDecisionCopy(
    backtest?.latestSignal.action ?? "hold",
  );
  const recordedPaperDecisionCopy = getPaperDecisionCopy(
    paperTrade?.action ?? "hold",
  );

  const handleRunBacktest = async () => {
    setLoading("backtest");
    setError("");
    setPaperTrade(null);

    try {
      const nextBacktest = await runStrategyBacktest({
        pairAddress,
        queryId: queryId.trim() || undefined,
      });
      setBacktest(nextBacktest);
      toast.success("Backtest completed", {
        description: nextBacktest.title,
      });
    } catch (err) {
      const message = readFriendlyError(err, "Unable to run strategy backtest.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  };

  const handleOpenPaperTrade = async () => {
    if (!backtest) {
      return;
    }

    setLoading("paper");
    setError("");

    try {
      const nextPaperTrade = await openStrategyPaperTrade({
        backtest,
        notionalUsd: 1_000,
      });
      const decisionCopy = getPaperDecisionCopy(nextPaperTrade.action);
      setPaperTrade(nextPaperTrade);
      toast.success(decisionCopy.toastTitle, {
        description: decisionCopy.toastDescription(nextPaperTrade.market),
      });
    } catch (err) {
      const message = readFriendlyError(err, "Unable to record paper decision.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="font-semibold text-2xl">Strategy Lab</h1>
          <p className="max-w-2xl text-muted-foreground text-sm">
            Backtest the Mantle Liquidity Momentum Strategy with Dune-sourced
            historical data, then record paper-trading proof on Mantle.
          </p>
        </div>
        <Badge variant="secondary">Paper trading only</Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>Strategy Lab unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConicalIcon />
              Backtest setup
            </CardTitle>
            <CardDescription>
              Dune rows must include timestamp, pair address, price, liquidity,
              and volume.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Mantle pair</span>
                <Select onValueChange={setSelectedPair} value={selectedPair}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a pair" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {samplePairs.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Custom pair address</span>
                <Input
                  onChange={(event) => setCustomPair(event.currentTarget.value)}
                  placeholder="0x..."
                  value={customPair}
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-medium">Dune query ID</span>
                <Input
                  onChange={(event) => setQueryId(event.currentTarget.value)}
                  placeholder="Env query ID optional"
                  value={queryId}
                />
              </label>
              <Button
                disabled={loading === "backtest"}
                onClick={() => void handleRunBacktest()}
                type="button"
              >
                {loading === "backtest" ? (
                  <RefreshCcwIcon data-icon="inline-start" />
                ) : (
                  <PlayIcon data-icon="inline-start" />
                )}
                Run Backtest
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-lg" size="sm">
          <CardHeader>
            <CardTitle>Strategy rules</CardTitle>
            <CardDescription>
              Entry requires positive momentum, stronger volume, minimum
              liquidity, and non-negative smart-money flow when available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <Rule label="Initial capital" value="$10,000" />
              <Rule label="Stop loss" value="5%" />
              <Rule label="Take profit" value="10%" />
              <Rule label="Max hold" value="24h" />
              <Rule label="Minimum liquidity" value="$50,000" />
              <Rule label="Minimum momentum" value="50 bps" />
            </div>
          </CardContent>
        </Card>
      </section>

      {backtest ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <MetricCard
              label="Total PnL"
              value={formatSignedUsd(backtest.metrics.totalPnlUsd)}
            />
            <MetricCard
              label="PnL bps"
              value={formatSignedBps(backtest.metrics.totalPnlBps)}
            />
            <MetricCard
              label="Win rate"
              value={`${backtest.metrics.winRate}%`}
            />
            <MetricCard
              label="Max drawdown"
              value={`${backtest.metrics.maxDrawdownBps} bps`}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-lg" size="sm">
              <CardHeader>
                <CardTitle>Equity curve</CardTitle>
                <CardDescription>{backtest.market}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer className="h-72 w-full" config={chartConfig}>
                  <LineChart data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis
                      tickFormatter={(value) => `$${Number(value).toLocaleString()}`}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      dataKey="equityUsd"
                      dot={false}
                      stroke="var(--color-equityUsd)"
                      strokeWidth={2}
                      type="monotone"
                    />
                  </LineChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="rounded-lg" size="sm">
              <CardHeader>
                <CardTitle>Latest signal</CardTitle>
                <CardDescription>{backtest.latestSignal.rationale}</CardDescription>
                <CardAction>
                  <Badge variant="outline">
                    {backtest.latestSignal.action.toUpperCase()}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  <Rule
                    label="Confidence"
                    value={`${backtest.latestSignal.confidence}%`}
                  />
                  <Rule
                    label="Price"
                    value={formatUsd(backtest.latestSignal.priceUsd)}
                  />
                  <Rule
                    label="Liquidity"
                    value={formatUsd(backtest.latestSignal.liquidityUsd)}
                  />
                  <Rule
                    label="Volume"
                    value={formatUsd(backtest.latestSignal.volumeUsd)}
                  />
                  <Alert>
                    <ShieldCheckIcon />
                    <AlertTitle>{latestPaperDecisionCopy.title}</AlertTitle>
                    <AlertDescription>
                      {latestPaperDecisionCopy.description}
                    </AlertDescription>
                  </Alert>
                  <Button
                    disabled={loading === "paper"}
                    onClick={() => void handleOpenPaperTrade()}
                    type="button"
                    variant="secondary"
                  >
                    <ArrowUpRightIcon data-icon="inline-start" />
                    {latestPaperDecisionCopy.buttonLabel}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          <StrategyProofPanel proof={backtest.proof} title="Backtest proof" />
          {paperTrade && (
            <StrategyProofPanel
              description={recordedPaperDecisionCopy.proofDescription}
              proof={paperTrade.proof}
              title={recordedPaperDecisionCopy.proofTitle}
            />
          )}

          <Card className="rounded-lg" size="sm">
            <CardHeader>
              <CardTitle>Trade log</CardTitle>
              <CardDescription>
                {backtest.trades.length
                  ? `${backtest.trades.length} simulated trade(s)`
                  : "No entries triggered by this historical window."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {backtest.trades.length ? (
                <Table className="min-w-[760px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entry</TableHead>
                      <TableHead>Exit</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead className="text-right">PnL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backtest.trades.map((trade) => (
                      <TradeRow
                        key={`${trade.entryAt}-${trade.exitAt}`}
                        trade={trade}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Try a more active Mantle pair or a Dune query with a wider
                  historical window.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Alert>
          <AlertCircleIcon />
          <AlertTitle>No backtest yet</AlertTitle>
          <AlertDescription>
            Run the strategy with a Mantle Dune query to generate backtest
            metrics and a paper-trade signal.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  );
}

function StrategyProofPanel({
  description,
  proof,
  title,
}: {
  description?: string;
  proof?: TradingJournalProof;
  title: string;
}) {
  if (!proof) {
    return null;
  }

  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheckIcon />
          {title}
        </CardTitle>
        <CardDescription>
          {description && <span className="block">{description}</span>}
          <span className="block">
            Journal status: {proof.status}
            {proof.error ? ` - ${proof.error}` : ""}
          </span>
        </CardDescription>
        <CardAction>
          <Badge variant={proof.status === "anchored" ? "secondary" : "outline"}>
            {proof.strategyStatus}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <Rule label="Agent" value={proof.agentId} />
          <Rule label="Action" value={proof.action.toUpperCase()} />
          <Rule label="Record" value={proof.recordId ?? "Not anchored"} />
          <Rule label="PnL bps" value={String(proof.pnlBps)} />
          <Rule label="Decision hash" value={shortHash(proof.decisionHash)} />
          <Rule label="Result hash" value={shortHash(proof.resultHash)} />
        </div>
        {proof.explorerUrl && (
          <Button asChild className="mt-4" size="sm" variant="outline">
            <a href={proof.explorerUrl} rel="noreferrer" target="_blank">
              <ArrowUpRightIcon data-icon="inline-start" />
              Open Mantle proof
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function TradeRow({ trade }: { trade: StrategyTrade }) {
  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatShortDate(trade.entryAt)}</span>
          <span className="text-muted-foreground text-xs">
            {formatUsd(trade.entryPriceUsd)}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col">
          <span>{formatShortDate(trade.exitAt)}</span>
          <span className="text-muted-foreground text-xs">
            {formatUsd(trade.exitPriceUsd)}
          </span>
        </div>
      </TableCell>
      <TableCell>{trade.reason}</TableCell>
      <TableCell className="text-right">
        <div className="flex flex-col">
          <span>{formatSignedUsd(trade.pnlUsd)}</span>
          <span className="text-muted-foreground text-xs">
            {formatSignedBps(trade.pnlBps)}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function getPaperDecisionCopy(action: string) {
  const normalizedAction = action.toLowerCase();
  const actionLabel = normalizedAction.toUpperCase();

  if (normalizedAction === "buy" || normalizedAction === "sell") {
    return {
      buttonLabel: "Open Paper Position",
      description: `${actionLabel} will create a simulated position and anchor the paper decision on Mantle. No live funds move.`,
      proofDescription: `${actionLabel} was recorded as a simulated paper position.`,
      proofTitle: "Paper position proof",
      title: "Paper position ready",
      toastDescription: (market: string) =>
        `${actionLabel} simulated position recorded for ${market}.`,
      toastTitle: "Paper position recorded",
    };
  }

  if (normalizedAction === "exit") {
    return {
      buttonLabel: "Record EXIT Decision",
      description:
        "EXIT records a simulated close decision for the strategy journal. No live funds move.",
      proofDescription: "EXIT was recorded as a simulated close decision.",
      proofTitle: "Paper exit proof",
      title: "Exit decision ready",
      toastDescription: (market: string) =>
        `EXIT paper decision recorded for ${market}.`,
      toastTitle: "EXIT decision recorded",
    };
  }

  return {
    buttonLabel: "Record HOLD Decision",
    description:
      "HOLD means the strategy is not opening a simulated position now. It records the no-position decision on Mantle.",
    proofDescription: "HOLD was recorded as a no-position paper decision.",
    proofTitle: "Paper decision proof",
    title: "No paper position to open",
    toastDescription: (market: string) =>
      `HOLD no-position decision recorded for ${market}.`,
    toastTitle: "HOLD decision recorded",
  };
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    maximumFractionDigits: value < 10 ? 4 : 2,
    style: "currency",
  }).format(value);
}

function formatSignedUsd(value: number) {
  return `${value >= 0 ? "+" : ""}${formatUsd(value)}`;
}

function formatSignedBps(value: number) {
  return `${value >= 0 ? "+" : ""}${value} bps`;
}

function formatShortDate(value: string) {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
      });
}

function shortHash(value: string) {
  return value.length > 16
    ? `${value.slice(0, 10)}...${value.slice(-6)}`
    : value;
}
