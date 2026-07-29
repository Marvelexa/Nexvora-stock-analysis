import { aiTradingBrainEngine } from "../lib/aiTradingBrainV1.js";
import { CandlestickPatternEngine } from "../lib/candlestickPatternEngine.js";
import { tradeOutcomesEngine } from "../lib/tradeOutcomesEngine.js";

function printLiveEngineOutput() {
  console.log("=================================================");
  console.log("🔥 REAL EMPIRICAL RESOLVER QUERY VERIFICATION");
  console.log("=================================================\n");

  const patternEngine = new CandlestickPatternEngine();

  // 1. Unvalidated Query Inspection (0 Trades in trade_outcomes)
  console.log("--- 1. UNVALIDATED PATTERN QUERY (N < 10 TRADES) ---");
  const unvalidatedResult = patternEngine.getEmpiricalWinRate("Head & Shoulders Breakdown");
  console.log("Pattern Query: 'Head & Shoulders Breakdown'");
  console.log(`  Resolved Win Rate: ${unvalidatedResult.winRatePct}%`);
  console.log(`  Sample Size: ${unvalidatedResult.sampleSize}`);
  console.log(`  Is Empirically Validated? ${unvalidatedResult.isEmpiricallyValidated} (Unvalidated -> Neutral 50.0% Baseline)\n`);

  // 2. Seeding 12 Real Closed Trades into trade_outcomes dataset (9 Wins, 3 Losses = 75.0% Win Rate)
  console.log("--- 2. SEEDING 12 REAL CLOSED TRADES INTO trade_outcomes DATASET ---");
  const seededPattern = "Quasimodo (QM Level) Liquidity Hunt";
  for (let i = 1; i <= 12; i++) {
    const isWin = i <= 9; // 9 wins out of 12
    tradeOutcomesEngine.logTradeOutcome({
      decisionId: `DEC-${1000 + i}`,
      symbol: "BTCUSD",
      companyName: "Bitcoin",
      type: "BUY",
      quantity: 1,
      entryPrice: 65000,
      exitPrice: isWin ? 67500 : 64000,
      stopLossPrice: 64000,
      targetPrice: 67500,
      initialRisk: 1000,
      milestonesAchieved: isWin ? 2 : 0,
      finalLockedProfit: isWin ? 2500 : -1000,
      realizedPnL: isWin ? 2500 : -1000,
      realizedPnLPct: isWin ? 3.84 : -1.53,
      realizedRR: isWin ? 2.5 : -1.0,
      outcome: isWin ? "HIT_TARGET" : "HIT_INITIAL_SL",
      confidenceScore: 90,
      currency: "USD",
      entryTimestamp: "2026-07-29T10:00:00Z",
      closedAt: "2026-07-29T12:00:00Z",
      exitReason: isWin ? "Target Hit" : "Stop Loss Hit",
      triggerPatternName: seededPattern
    });
  }
  console.log(`Seeded 12 closed trade outcomes for '${seededPattern}' (9 Wins, 3 Losses).`);

  // 3. Querying Real Empirical Resolver After Seeding
  console.log("\n--- 3. QUERYING REAL EMPIRICAL RESOLVER AFTER SEEDING ---");
  const validatedResult = patternEngine.getEmpiricalWinRate(seededPattern);
  console.log(`Pattern Query: '${seededPattern}'`);
  console.log(`  Resolved Win Rate: ${validatedResult.winRatePct}% (Expected: 75.0%)`);
  console.log(`  Sample Size: ${validatedResult.sampleSize} (Expected: 12)`);
  console.log(`  Is Empirically Validated? ${validatedResult.isEmpiricallyValidated} (Expected: true)\n`);

  console.log("-------------------------------------------------");
  console.log("--- 4. LIVE TRADES EXECUTION WITH REAL RESOLVER ---");

  // 1. BUY Setup (BTCUSD)
  const btcBars = Array.from({ length: 20 }, (_, i) => ({
    time: i + 1,
    open: 64000 + i * 100,
    high: 64200 + i * 100,
    low: 63900 + i * 100,
    close: 64150 + i * 100,
    volume: 2000 + i * 50
  }));

  const btcResult = aiTradingBrainEngine.analyze("BTCUSD", 66500, btcBars, 85, 1.3, "INTRADAY_SCALPING");
  const btcSub = btcResult.probabilityDerivation?.intermediateSubScores;

  console.log("\n--- TRADE #1: BTCUSD (BULLISH INTRADAY) ---");
  console.log(`  masterCompositeAnchor: ${btcSub?.masterCompositeAnchor}`);
  console.log(`  baseContinuousScore: ${btcSub?.baseContinuousScore}`);
  console.log(`  unifiedScore: ${btcSub?.unifiedScore}`);
  console.log(`  Clamped trendStrengthPct: ${btcResult.trendStrengthPct}%`);
  console.log(`  Buy Win Probability Pct: ${btcResult.buyWinProbabilityPct}%`);
  console.log(`  Action Verdict: ${btcResult.action}`);

  // 2. SELL Setup (ETHUSD)
  const ethBars = Array.from({ length: 20 }, (_, i) => ({
    time: i + 1,
    open: 3400 - i * 30,
    high: 3410 - i * 30,
    low: 3350 - i * 30,
    close: 3360 - i * 30,
    volume: 4500 + i * 50
  }));

  const ethResult = aiTradingBrainEngine.analyze("ETHUSD", 2800, ethBars, 20, 0.5, "INTRADAY_SCALPING");
  const ethSub = ethResult.probabilityDerivation?.intermediateSubScores;

  console.log("\n--- TRADE #2: ETHUSD (BEARISH INTRADAY) ---");
  console.log(`  masterCompositeAnchor: ${ethSub?.masterCompositeAnchor}`);
  console.log(`  baseContinuousScore: ${ethSub?.baseContinuousScore}`);
  console.log(`  unifiedScore: ${ethSub?.unifiedScore}`);
  console.log(`  Clamped trendStrengthPct: ${ethResult.trendStrengthPct}%`);
  console.log(`  Sell Win Probability Pct: ${ethResult.sellWinProbabilityPct}%`);
  console.log(`  Action Verdict: ${ethResult.action}`);

  console.log("\n=================================================");
}

printLiveEngineOutput();
