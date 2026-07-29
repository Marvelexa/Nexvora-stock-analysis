import { aiTradingBrainEngine } from "../lib/aiTradingBrainV1.js";

function printLiveEngineOutput() {
  console.log("=================================================");
  console.log("🔥 OPTION 1 IMPLEMENTED — ZERO DOUBLE COUNTING");
  console.log("=================================================\n");

  console.log("--- EFFECTIVE WEIGHT TABLE (INTENTIONAL ORTHOGONAL WEIGHTS) ---");
  console.log("1. Master Composite Anchor (60% Weight of Final Score):");
  console.log("   - Al Brooks Price Action (40% of Tech): 60% * 70% * 40% = 16.80%");
  console.log("   - ICT / SMC Order Blocks (25% of Tech): 60% * 70% * 25% = 10.50%");
  console.log("   - Volume Spread Analysis (20% of Tech):  60% * 70% * 20% =  8.40%");
  console.log("   - Multi-Timeframe (15% of Tech):         60% * 70% * 15% =  6.30%");
  console.log("   - News Sentiment Score (20% of Anchor):  60% * 20%       = 12.00%");
  console.log("   - Fundamental Score (5% of Anchor):      60% *  5%       =  3.00%");
  console.log("   - Open Interest Score (5% of Anchor):    60% *  5%       =  3.00%");
  console.log("   Subtotal Master Anchor:                                  = 60.00%\n");

  console.log("2. Micro-Candle Continuous Technicals (40% Weight of Final Score):");
  console.log("   - Candlestick Patterns & VCP (15% of Base): 40% * 15%   =  6.00%");
  console.log("   - Relative Strength Index (23.8% of Base): 40% * 23.8% =  9.52%");
  console.log("   - EMA Trend Distance (23.8% of Base):     40% * 23.8% =  9.52%");
  console.log("   - Candle Body Momentum (20.4% of Base):   40% * 20.4% =  8.16%");
  console.log("   - Volume Spread Delta (17.0% of Base):    40% * 17.0% =  6.80%");
  console.log("   Subtotal Continuous Technicals:                          = 40.00%\n");

  console.log("TOTAL SYSTEM EFFECTIVE WEIGHT SUM: 60.00% + 40.00%          = 100.00%\n");

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

  console.log("-------------------------------------------------");
  console.log("--- TRADE #1: BTCUSD (BULLISH INTRADAY) ---");
  console.log("1. Master Composite Category Score Derivation:");
  console.log(`  Tech Score (70%): ${btcSub?.techScore} -> Contribution: ${(btcSub!.techScore * 0.70).toFixed(2)}`);
  console.log(`  Sent Score (20%): ${btcSub?.sentScore} -> Contribution: ${(btcSub!.sentScore * 0.20).toFixed(2)}`);
  console.log(`  Fund Score (5%): ${btcSub?.fundScore} -> Contribution: ${(btcSub!.fundScore * 0.05).toFixed(2)}`);
  console.log(`  OI Score (5%): ${btcSub?.oiScore} -> Contribution: ${(btcSub!.oiScore * 0.05).toFixed(2)}`);
  console.log(`  masterCompositeAnchor = ${btcSub?.masterCompositeAnchor}`);

  console.log("\n2. Micro-Candle Technical Sub-Score Derivation:");
  console.log(`  patternDriverScore (15%): ${btcSub?.patternDriverScore} -> ${ (btcSub!.patternDriverScore * 0.15).toFixed(2) }`);
  console.log(`  rsiContribution (23.8%): ${btcSub?.rsiContribution} -> ${ (btcSub!.rsiContribution * 0.238).toFixed(2) }`);
  console.log(`  emaContribution (23.8%): ${btcSub?.emaContribution} -> ${ (btcSub!.emaContribution * 0.238).toFixed(2) }`);
  console.log(`  candleContribution (20.4%): ${btcSub?.candleContribution} -> ${ (btcSub!.candleContribution * 0.204).toFixed(2) }`);
  console.log(`  volContribution (17.0%): ${btcSub?.volContribution} -> ${ (btcSub!.volContribution * 0.170).toFixed(2) }`);
  console.log(`  baseContinuousScore = ${btcSub?.baseContinuousScore}`);

  console.log("\n3. SINGLE UNIFIED DECISION BLENDING FORMULA:");
  console.log(`  Formula: unifiedScore = round((masterCompositeAnchor * 0.60) + (baseContinuousScore * 0.40) + tickMomentumBonus)`);
  console.log(`  Calculation: (${btcSub?.masterCompositeAnchor} * 0.60) + (${btcSub?.baseContinuousScore} * 0.40) + (${btcSub?.tickMomentumBonus})`);
  console.log(`             = ${(btcSub!.masterCompositeAnchor * 0.60).toFixed(2)} + ${(btcSub!.baseContinuousScore * 0.40).toFixed(2)} + ${btcSub?.tickMomentumBonus}`);
  console.log(`  unifiedScore = ${btcSub?.unifiedScore}`);
  console.log(`  Clamped trendStrengthPct [5, 95] = ${btcResult.trendStrengthPct}%`);

  console.log("\n4. Final Decision & Probability Verdict Driven By Unified Score:");
  console.log(`  Buy Win Probability Pct: ${btcResult.buyWinProbabilityPct}%`);
  console.log(`  Sell Win Probability Pct: ${btcResult.sellWinProbabilityPct}%`);
  console.log(`  Action Verdict: ${btcResult.action}`);
  console.log(`  Stop Loss: $${btcResult.stopLoss}`);
  console.log(`  Target 1 (5.0R): $${btcResult.target1}`);

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
  console.log(`  Tech Score (70%): ${ethSub?.techScore} -> Contribution: ${(ethSub!.techScore * 0.70).toFixed(2)}`);
  console.log(`  Sent Score (20%): ${ethSub?.sentScore} -> Contribution: ${(ethSub!.sentScore * 0.20).toFixed(2)}`);
  console.log(`  Fund Score (5%): ${ethSub?.fundScore} -> Contribution: ${(ethSub!.fundScore * 0.05).toFixed(2)}`);
  console.log(`  OI Score (5%): ${ethSub?.oiScore} -> Contribution: ${(ethSub!.oiScore * 0.05).toFixed(2)}`);
  console.log(`  masterCompositeAnchor = ${ethSub?.masterCompositeAnchor}`);

  console.log("\n2. Micro-Candle Technical Sub-Score Derivation:");
  console.log(`  patternDriverScore (35%): ${ethSub?.patternDriverScore} -> ${ (ethSub!.patternDriverScore * 0.35).toFixed(2) }`);
  console.log(`  rsiContribution (18.2%): ${ethSub?.rsiContribution} -> ${ (ethSub!.rsiContribution * 0.182).toFixed(2) }`);
  console.log(`  emaContribution (18.2%): ${ethSub?.emaContribution} -> ${ (ethSub!.emaContribution * 0.182).toFixed(2) }`);
  console.log(`  candleContribution (15.6%): ${ethSub?.candleContribution} -> ${ (ethSub!.candleContribution * 0.156).toFixed(2) }`);
  console.log(`  volContribution (13.0%): ${ethSub?.volContribution} -> ${ (ethSub!.volContribution * 0.130).toFixed(2) }`);
  console.log(`  baseContinuousScore = ${ethSub?.baseContinuousScore}`);

  console.log("\n3. SINGLE UNIFIED DECISION BLENDING FORMULA:");
  console.log(`  Formula: unifiedScore = round((masterCompositeAnchor * 0.60) + (baseContinuousScore * 0.40) + tickMomentumBonus)`);
  console.log(`  Calculation: (${ethSub?.masterCompositeAnchor} * 0.60) + (${ethSub?.baseContinuousScore} * 0.40) + (${ethSub?.tickMomentumBonus})`);
  console.log(`             = ${(ethSub!.masterCompositeAnchor * 0.60).toFixed(2)} + ${(ethSub!.baseContinuousScore * 0.40).toFixed(2)} + ${ethSub?.tickMomentumBonus}`);
  console.log(`  unifiedScore = ${ethSub?.unifiedScore}`);
  console.log(`  Clamped trendStrengthPct [5, 95] = ${ethResult.trendStrengthPct}%`);

  console.log("\n4. Final Decision & Probability Verdict Driven By Unified Score:");
  console.log(`  Buy Win Probability Pct: ${ethResult.buyWinProbabilityPct}%`);
  console.log(`  Sell Win Probability Pct: ${ethResult.sellWinProbabilityPct}%`);
  console.log(`  Action Verdict: ${ethResult.action}`);
  console.log(`  Stop Loss: $${ethResult.stopLoss}`);
  console.log(`  Target 1 (5.0R): $${ethResult.target1}`);

  console.log("\n=================================================");
}

printLiveEngineOutput();
