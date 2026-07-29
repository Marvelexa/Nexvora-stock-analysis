import { aiTradingBrainEngine } from "../lib/aiTradingBrainV1.js";
import { CandlestickPatternEngine } from "../lib/candlestickPatternEngine.js";
import { tradeOutcomesEngine } from "../lib/tradeOutcomesEngine.js";
import { paperTradingEngine } from "../lib/paperTradingEngine.js";

function printLiveEngineOutput() {
  console.log("=================================================");
  console.log("🔥 REAL WRITE-SIDE PRODUCTION FLOW VERIFICATION");
  console.log("=================================================\n");

  const patternEngine = new CandlestickPatternEngine();

  // 1. Live Production Flow with Trigger Pattern Name
  console.log("--- 1. FULL PRODUCTION FLOW: OPEN & CLOSE POSITION WITH TRIGGER PATTERN ---");
  const patternName = "Quasimodo (QM Level) Liquidity Hunt";
  
  const openRes = paperTradingEngine.openPosition(
    "BTCUSD",
    "Bitcoin",
    "BUY",
    1,
    65000,
    64000,
    67500,
    "USD",
    true, // forceOverride
    patternName // triggerPatternName
  );

  console.log(`Position Opened via paperTradingEngine: ${openRes.message}`);
  console.log(`  Stored triggerPatternName on Open Position: ${openRes.position?.triggerPatternName}`);

  const closeRes = paperTradingEngine.closePosition(openRes.position!.id, 67500, "HIT_TARGET");
  console.log(`Position Closed via paperTradingEngine: ${closeRes.message}`);

  const loggedRecord = tradeOutcomesEngine.getTradeOutcomes()[0];
  console.log("\nPersisted trade_outcomes Record Inspection:");
  console.log(`  Record ID: ${loggedRecord.id}`);
  console.log(`  Symbol: ${loggedRecord.symbol}`);
  console.log(`  Outcome: ${loggedRecord.outcome}`);
  console.log(`  Persisted triggerPatternName: '${loggedRecord.triggerPatternName}' (Expected: '${patternName}')`);
  console.log(`  Write-Side Attribution Verification: ${loggedRecord.triggerPatternName === patternName ? "PASSED" : "FAILED"}\n`);

  console.log("-------------------------------------------------");
  // 2. Production Flow WITHOUT Trigger Pattern (Neutral Baseline Case)
  console.log("--- 2. PRODUCTION FLOW WITHOUT TRIGGER PATTERN (NEUTRAL BASELINE CASE) ---");
  const openNoPat = paperTradingEngine.openPosition(
    "ETHUSD",
    "Ethereum",
    "SELL",
    1,
    2800,
    2890,
    2350,
    "USD",
    true // forceOverride, no pattern passed
  );

  console.log(`Position Opened (No Pattern): ${openNoPat.message}`);
  console.log(`  Stored triggerPatternName on Open Position: ${openNoPat.position?.triggerPatternName ?? "undefined (omitted)"}`);

  const closeNoPat = paperTradingEngine.closePosition(openNoPat.position!.id, 2350, "HIT_TARGET");
  console.log(`Position Closed (No Pattern): ${closeNoPat.message}`);

  const loggedNoPatRecord = tradeOutcomesEngine.getTradeOutcomes()[0];
  console.log("\nPersisted trade_outcomes Record Inspection (No Pattern):");
  console.log(`  Record ID: ${loggedNoPatRecord.id}`);
  console.log(`  Symbol: ${loggedNoPatRecord.symbol}`);
  console.log(`  Persisted triggerPatternName: ${loggedNoPatRecord.triggerPatternName ?? "undefined (omitted)"}`);
  console.log(`  Zero-Pollution Exclusion Verification: ${loggedNoPatRecord.triggerPatternName === undefined ? "PASSED (Excluded from pattern sample queries)" : "FAILED"}\n`);

  console.log("=================================================");
}

printLiveEngineOutput();
