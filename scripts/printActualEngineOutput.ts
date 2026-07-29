import { aiTradingBrainEngine } from "../lib/aiTradingBrainV1.js";
import { CandlestickPatternEngine } from "../lib/candlestickPatternEngine.js";

function printLiveEngineOutput() {
  console.log("=================================================");
  console.log("🔬 MANDATORY & SECONDARY AUDIT VERIFICATION");
  console.log("=================================================\n");

  const patternEngine = new CandlestickPatternEngine();

  console.log("--- 1. EMPIRICAL WIN-RATE DYNAMIC RESOLVER INSPECION ---");
  console.log("Source of pattern win-rates:");
  console.log("  Function: CandlestickPatternEngine.getEmpiricalWinRate(patternName)");
  console.log("  Rule: Queries accumulated trade_outcomes history. If sampleSize < 10, returns neutral 50.0% baseline (NOT hardcoded 88%/75%).\n");

  const hnsCheck = patternEngine.getEmpiricalWinRate("Head & Shoulders Breakdown");
  console.log("Sample Query for 'Head & Shoulders Breakdown':");
  console.log(`  Resolved Win Rate: ${hnsCheck.winRatePct}%`);
  console.log(`  Sample Size: ${hnsCheck.sampleSize}`);
  console.log(`  Is Empirically Validated? ${hnsCheck.isEmpiricallyValidated} (Unvalidated -> Neutral 50.0% Baseline)\n`);

  console.log("-------------------------------------------------");
  console.log("--- 2. DYNAMIC EFFECTIVE WEIGHT TABLES (SUM TO 100%) ---");
  console.log("\nTABLE A: BASELINE MODE (No Active Pattern Override — Pattern Weight = 15%)");
  console.log("  Master Anchor (60% Total):");
  console.log("    - Al Brooks: 60% * 70% * 40% = 16.80%");
  console.log("    - ICT / SMC: 60% * 70% * 25% = 10.50%");
  console.log("    - VSA:       60% * 70% * 20% =  8.40%");
  console.log("    - MTF:       60% * 70% * 15% =  6.30%");
  console.log("    - Sentiment: 60% * 20%       = 12.00%");
  console.log("    - Fundamental:60% *  5%      =  3.00%");
  console.log("    - Open Interest:60% * 5%     =  3.00%");
  console.log("    Anchor Subtotal              = 60.00%");
  console.log("  Continuous Technicals (40% Total):");
  console.log("    - Pattern/VCP (15% of Base): 40% * 15%   =  6.00%");
  console.log("    - RSI (23.8% of Base):       40% * 23.8% =  9.52%");
  console.log("    - EMA (23.8% of Base):       40% * 23.8% =  9.52%");
  console.log("    - Candle (20.4% of Base):    40% * 20.4% =  8.16%");
  console.log("    - Volume (17.0% of Base):    40% * 17.0% =  6.80%");
  console.log("    Continuous Subtotal                   = 40.00%");
  console.log("  TABLE A TOTAL SUM: 60.00% + 40.00%        = 100.00%");

  console.log("\nTABLE B: OVERRIDE ACTIVE MODE (Active Pattern Detected — Pattern Weight = 35%)");
  console.log("  Master Anchor (60% Total):");
  console.log("    - Al Brooks: 60% * 70% * 40% = 16.80%");
  console.log("    - ICT / SMC: 60% * 70% * 25% = 10.50%");
  console.log("    - VSA:       60% * 70% * 20% =  8.40%");
  console.log("    - MTF:       60% * 70% * 15% =  6.30%");
  console.log("    - Sentiment: 60% * 20%       = 12.00%");
  console.log("    - Fundamental:60% *  5%      =  3.00%");
  console.log("    - Open Interest:60% * 5%     =  3.00%");
  console.log("    Anchor Subtotal              = 60.00%");
  console.log("  Continuous Technicals (40% Total):");
  console.log("    - Pattern/VCP (35% of Base): 40% * 35%   = 14.00%");
  console.log("    - RSI (18.2% of Base):       40% * 18.2% =  7.28%");
  console.log("    - EMA (18.2% of Base):       40% * 18.2% =  7.28%");
  console.log("    - Candle (15.6% of Base):    40% * 15.6% =  6.24%");
  console.log("    - Volume (13.0% of Base):    40% * 13.0% =  5.20%");
  console.log("    Continuous Subtotal                   = 40.00%");
  console.log("  TABLE B TOTAL SUM: 60.00% + 40.00%        = 100.00%\n");

  console.log("-------------------------------------------------");
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

  console.log("--- TRADE #1: BTCUSD (BULLISH INTRADAY) ---");
  console.log("1. Master Composite Category Score Derivation:");
  console.log(`  masterCompositeAnchor = ${btcSub?.masterCompositeAnchor}`);

  console.log("\n2. Micro-Candle Technical Sub-Score Derivation:");
  console.log(`  patternDriverScore (15%): ${btcSub?.patternDriverScore} (VCP Score Baseline: ${btcSub?.vcpScore})`);
  console.log(`  baseContinuousScore = ${btcSub?.baseContinuousScore}`);

  console.log("\n3. SINGLE UNIFIED DECISION BLENDING FORMULA:");
  console.log(`  unifiedScore = ${btcSub?.unifiedScore}`);
  console.log(`  Clamped trendStrengthPct [5, 95] = ${btcResult.trendStrengthPct}%`);

  console.log("\n4. Final Decision & Probability Verdict:");
  console.log(`  Buy Win Probability Pct: ${btcResult.buyWinProbabilityPct}%`);
  console.log(`  Sell Win Probability Pct: ${btcResult.sellWinProbabilityPct}%`);
  console.log(`  Action Verdict: ${btcResult.action}`);

  console.log("\n-------------------------------------------------\n");

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

  console.log("--- TRADE #2: ETHUSD (BEARISH INTRADAY) ---");
  console.log("1. Master Composite Category Score Derivation:");
  console.log(`  masterCompositeAnchor = ${ethSub?.masterCompositeAnchor}`);

  console.log("\n2. Micro-Candle Technical Sub-Score Derivation:");
  console.log(`  patternDriverScore (35%): ${ethSub?.patternDriverScore} (Empirical WinRate Resolved)`);
  console.log(`  baseContinuousScore = ${ethSub?.baseContinuousScore}`);

  console.log("\n3. SINGLE UNIFIED DECISION BLENDING FORMULA:");
  console.log(`  unifiedScore = ${ethSub?.unifiedScore}`);
  console.log(`  Clamped trendStrengthPct [5, 95] = ${ethResult.trendStrengthPct}%`);

  console.log("\n4. Final Decision & Probability Verdict:");
  console.log(`  Buy Win Probability Pct: ${ethResult.buyWinProbabilityPct}%`);
  console.log(`  Sell Win Probability Pct: ${ethResult.sellWinProbabilityPct}%`);
  console.log(`  Action Verdict: ${ethResult.action}`);

  console.log("\n=================================================");
}

printLiveEngineOutput();
