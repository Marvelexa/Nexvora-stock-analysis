import { aiTradingBrainEngine } from "../lib/aiTradingBrainV1.js";

function printLiveEngineOutput() {
  console.log("=================================================");
  console.log("📊 FULL INTERMEDIATE SUB-SCORES END-TO-END CHAIN");
  console.log("=================================================\n");

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
  console.log("Symbol:", btcResult.symbol);
  console.log("Current Price:", btcResult.currentPrice);
  console.log("\n[Technical Sub-Components]");
  console.log("  Al Brooks Pressure Score:", btcResult.alBrooks.pressureScore);
  console.log("  SMC Score:", btcResult.smc.smcScore);
  console.log("  Calculated patternDriverScore = (88 * 0.60) + (68 * 0.40):", btcSub?.patternDriverScore);
  console.log("  RSI Contribution:", btcSub?.rsiContribution);
  console.log("  EMA Trend Dist Contribution:", btcSub?.emaContribution);
  console.log("  Candle Body Contribution:", btcSub?.candleContribution);
  console.log("  Volume Spread Delta Contribution:", btcSub?.volContribution);
  console.log("  Base Continuous Technical Score:", btcSub?.baseContinuousScore);
  console.log("  Micro-Tick Momentum Bonus:", btcSub?.tickMomentumBonus);
  console.log("  Continuous Technical Score (Base + Bonus):", btcSub?.continuousScore);
  console.log("  Final Clamped Trend Strength Pct [5, 95]:", btcResult.trendStrengthPct);

  console.log("\n[Master Composite Category Scores & Weights]");
  console.log(`  Tech Score (70%): ${btcSub?.techScore} -> Contribution: ${(btcSub!.techScore * 0.70).toFixed(2)}`);
  console.log(`  Sent Score (20%): ${btcSub?.sentScore} -> Contribution: ${(btcSub!.sentScore * 0.20).toFixed(2)}`);
  console.log(`  Fund Score (5%): ${btcSub?.fundScore} -> Contribution: ${(btcSub!.fundScore * 0.05).toFixed(2)}`);
  console.log(`  OI Score (5%): ${btcSub?.oiScore} -> Contribution: ${(btcSub!.oiScore * 0.05).toFixed(2)}`);
  console.log("  Composite Sum:", btcSub?.compositeScore);

  console.log("\n[Final Verdict & Probabilities]");
  console.log("  Buy Win Probability Pct:", btcResult.buyWinProbabilityPct);
  console.log("  Sell Win Probability Pct:", btcResult.sellWinProbabilityPct);
  console.log("  Action Verdict:", btcResult.action);
  console.log("  Stop Loss:", btcResult.stopLoss);
  console.log("  Target 1 (5.0R):", btcResult.target1);
  console.log("  RR Ratio:", btcResult.riskRewardRatio);

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
  console.log("Symbol:", ethResult.symbol);
  console.log("Current Price:", ethResult.currentPrice);
  console.log("\n[Technical Sub-Components]");
  console.log("  Al Brooks Pressure Score:", ethResult.alBrooks.pressureScore);
  console.log("  SMC Score:", ethResult.smc.smcScore);
  console.log("  Calculated patternDriverScore = (12 * 0.60) + (25 * 0.40):", ethSub?.patternDriverScore);
  console.log("  RSI Contribution:", ethSub?.rsiContribution);
  console.log("  EMA Trend Dist Contribution:", ethSub?.emaContribution);
  console.log("  Candle Body Contribution:", ethSub?.candleContribution);
  console.log("  Volume Spread Delta Contribution:", ethSub?.volContribution);
  console.log("  Base Continuous Technical Score:", ethSub?.baseContinuousScore);
  console.log("  Micro-Tick Momentum Bonus:", ethSub?.tickMomentumBonus);
  console.log("  Continuous Technical Score (Base + Bonus):", ethSub?.continuousScore);
  console.log("  Final Clamped Trend Strength Pct [5, 95]:", ethResult.trendStrengthPct);

  console.log("\n[Master Composite Category Scores & Weights]");
  console.log(`  Tech Score (70%): ${ethSub?.techScore} -> Contribution: ${(ethSub!.techScore * 0.70).toFixed(2)}`);
  console.log(`  Sent Score (20%): ${ethSub?.sentScore} -> Contribution: ${(ethSub!.sentScore * 0.20).toFixed(2)}`);
  console.log(`  Fund Score (5%): ${ethSub?.fundScore} -> Contribution: ${(ethSub!.fundScore * 0.05).toFixed(2)}`);
  console.log(`  OI Score (5%): ${ethSub?.oiScore} -> Contribution: ${(ethSub!.oiScore * 0.05).toFixed(2)}`);
  console.log("  Composite Sum:", ethSub?.compositeScore);

  console.log("\n[Final Verdict & Probabilities]");
  console.log("  Buy Win Probability Pct:", ethResult.buyWinProbabilityPct);
  console.log("  Sell Win Probability Pct:", ethResult.sellWinProbabilityPct);
  console.log("  Action Verdict:", ethResult.action);
  console.log("  Stop Loss:", ethResult.stopLoss);
  console.log("  Target 1 (5.0R):", ethResult.target1);
  console.log("  RR Ratio:", ethResult.riskRewardRatio);

  console.log("\n=================================================");
}

printLiveEngineOutput();
