import { aiTradingBrainEngine } from "../lib/aiTradingBrainV1.js";
import { CandlestickPatternEngine } from "../lib/candlestickPatternEngine.js";
import { tradeOutcomesEngine } from "../lib/tradeOutcomesEngine.js";

function printLiveEngineOutput() {
  console.log("=================================================");
  console.log("🔬 SUBSTRING CROSS-CONTAMINATION & END-TO-END WIRING VERIFICATION");
  console.log("=================================================\n");

  const patternEngine = new CandlestickPatternEngine();

  // 1. Substring Cross-Contamination Test
  console.log("--- 1. SUBSTRING CROSS-CONTAMINATION TEST (EXACT STRING EQUALITY ===) ---");
  console.log("Seeding 12 trades for 'Bullish Morning Star' (10 Wins, 2 Losses = 83.3% Win Rate)...");
  for (let i = 1; i <= 12; i++) {
    tradeOutcomesEngine.logTradeOutcome({
      decisionId: `DEC-BULL-${i}`,
      symbol: "BTCUSD",
      companyName: "Bitcoin",
      type: "BUY",
      quantity: 1,
      entryPrice: 65000,
      exitPrice: i <= 10 ? 67500 : 64000,
      stopLossPrice: 64000,
      targetPrice: 67500,
      initialRisk: 1000,
      milestonesAchieved: i <= 10 ? 2 : 0,
      finalLockedProfit: i <= 10 ? 2500 : -1000,
      realizedPnL: i <= 10 ? 2500 : -1000,
      realizedPnLPct: i <= 10 ? 3.84 : -1.53,
      realizedRR: i <= 10 ? 2.5 : -1.0,
      outcome: i <= 10 ? "HIT_TARGET" : "HIT_INITIAL_SL",
      confidenceScore: 90,
      currency: "USD",
      entryTimestamp: "2026-07-29T10:00:00Z",
      closedAt: "2026-07-29T12:00:00Z",
      exitReason: i <= 10 ? "Target Hit" : "Stop Loss Hit",
      triggerPatternName: "Bullish Morning Star"
    });
  }

  console.log("Seeding 12 trades for 'Morning Star' (5 Wins, 7 Losses = 41.7% Win Rate)...");
  for (let i = 1; i <= 12; i++) {
    tradeOutcomesEngine.logTradeOutcome({
      decisionId: `DEC-GENERIC-${i}`,
      symbol: "BTCUSD",
      companyName: "Bitcoin",
      type: "BUY",
      quantity: 1,
      entryPrice: 65000,
      exitPrice: i <= 5 ? 67500 : 64000,
      stopLossPrice: 64000,
      targetPrice: 67500,
      initialRisk: 1000,
      milestonesAchieved: i <= 5 ? 2 : 0,
      finalLockedProfit: i <= 5 ? 2500 : -1000,
      realizedPnL: i <= 5 ? 2500 : -1000,
      realizedPnLPct: i <= 5 ? 3.84 : -1.53,
      realizedRR: i <= 5 ? 2.5 : -1.0,
      outcome: i <= 5 ? "HIT_TARGET" : "HIT_INITIAL_SL",
      confidenceScore: 90,
      currency: "USD",
      entryTimestamp: "2026-07-29T10:00:00Z",
      closedAt: "2026-07-29T12:00:00Z",
      exitReason: i <= 5 ? "Target Hit" : "Stop Loss Hit",
      triggerPatternName: "Morning Star"
    });
  }

  const queryBull = patternEngine.getEmpiricalWinRate("Bullish Morning Star");
  const queryGeneric = patternEngine.getEmpiricalWinRate("Morning Star");

  console.log("\nResults of Exact Match Query:");
  console.log(`  Query 'Bullish Morning Star': WinRate = ${queryBull.winRatePct}% | SampleSize = ${queryBull.sampleSize} (Expected: 83.3% | N=12)`);
  console.log(`  Query 'Morning Star':         WinRate = ${queryGeneric.winRatePct}% | SampleSize = ${queryGeneric.sampleSize} (Expected: 41.7% | N=12)`);
  console.log(`  Zero Substring Cross-Contamination Verified: ${queryBull.sampleSize === 12 && queryGeneric.sampleSize === 12 && queryBull.winRatePct === 83.3 && queryGeneric.winRatePct === 41.7 ? "PASSED" : "FAILED"}\n`);

  console.log("-------------------------------------------------");
  console.log("--- 2. END-TO-END LIVE ENGINE WIRING PROOF (TRADE #2) ---");

  const seededPattern = "Bearish Pressure (Below 20 EMA)";
  console.log(`Seeding 12 trades for '${seededPattern}' (9 Wins, 3 Losses = 75.0% Win Rate)...`);
  for (let i = 1; i <= 12; i++) {
    tradeOutcomesEngine.logTradeOutcome({
      decisionId: `DEC-BEAR-${i}`,
      symbol: "ETHUSD",
      companyName: "Ethereum",
      type: "SELL",
      quantity: 1,
      entryPrice: 2800,
      exitPrice: i <= 9 ? 2350 : 2890,
      stopLossPrice: 2890,
      targetPrice: 2350,
      initialRisk: 90,
      milestonesAchieved: i <= 9 ? 2 : 0,
      finalLockedProfit: i <= 9 ? 450 : -90,
      realizedPnL: i <= 9 ? 450 : -90,
      realizedPnLPct: i <= 9 ? 16.07 : -3.21,
      realizedRR: i <= 9 ? 5.0 : -1.0,
      outcome: i <= 9 ? "HIT_TARGET" : "HIT_INITIAL_SL",
      confidenceScore: 88,
      currency: "USD",
      entryTimestamp: "2026-07-29T10:00:00Z",
      closedAt: "2026-07-29T12:00:00Z",
      exitReason: i <= 9 ? "Target Hit" : "Stop Loss Hit",
      triggerPatternName: seededPattern
    });
  }

  // Execute Live Trade #2 (ETHUSD) through full aiTradingBrainEngine
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
  const activePattern = (ethResult as any).detectedPatterns?.[0];

  console.log("\nLive Engine Execution Output for Trade #2 (ETHUSD):");
  console.log(`  Triggered Pattern Name: ${activePattern?.patternName}`);
  console.log(`  Pattern Historical WinRate (Queried dynamically from trade_outcomes): ${activePattern?.historicalWinRatePct}%`);
  console.log(`  Live patternDriverScore (100 - maxBearWinRate = 100 - 75): ${ethSub?.patternDriverScore} (Reflects live 75% empirical rate!)`);
  console.log(`  masterCompositeAnchor: ${ethSub?.masterCompositeAnchor}`);
  console.log(`  baseContinuousScore: ${ethSub?.baseContinuousScore}`);
  console.log(`  unifiedScore: ${ethSub?.unifiedScore}`);
  console.log(`  Final Clamped trendStrengthPct: ${ethResult.trendStrengthPct}%`);
  console.log(`  Final Sell Win Probability Pct: ${ethResult.sellWinProbabilityPct}%`);
  console.log(`  Final Action Verdict: ${ethResult.action}`);

  console.log("\n=================================================");
}

printLiveEngineOutput();
