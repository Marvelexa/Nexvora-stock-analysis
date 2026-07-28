/**
 * Production-Grade Monte Carlo Portfolio Simulation Engine
 * Simulates 10,000+ portfolio path iterations by bootstrapping historical trade return distributions.
 * Computes Probability of Ruin %, Expected CAGR %, Worst Drawdown %, Median Drawdown %, and 95th/5th Percentiles.
 */

export interface MonteCarloReport {
  symbol: string;
  totalSimulationsCount: number;
  tradeSequenceLength: number;
  initialCapital: number;
  
  probabilityOfRuinPct: number; // % paths where drawdown reached > 50%
  expectedCagrPct: number;      // Median final CAGR
  worstCaseCagrPct: number;     // 5th percentile worst path
  bestCaseCagrPct: number;      // 95th percentile best path
  
  medianDrawdownPct: number;
  worstDrawdownPct: number;     // 95th percentile max drawdown
  
  medianFinalCapital: number;
  fifthPercentileCapital: number;
  ninetyFifthPercentileCapital: number;
}

export class MonteCarloEngine {

  /**
   * Run 10,000+ Monte Carlo Portfolio Path Simulations
   */
  public runMonteCarloSimulations(
    symbol: string,
    tradeReturnPcts: number[] = [2.5, -1.2, 3.8, -1.5, 4.2, -0.8, 1.9, -1.1, 5.0, -2.0],
    simulationsCount: number = 10000,
    tradesPerPath: number = 100,
    initialCapital: number = 100000,
    ruinThresholdPct: number = 50.0
  ): MonteCarloReport {
    const returnsPool = tradeReturnPcts.length > 0 ? tradeReturnPcts : [2.0, -1.0, 3.0, -1.5];
    const finalCapitals: number[] = [];
    const maxDrawdowns: number[] = [];
    let ruinCount = 0;

    for (let sim = 0; sim < simulationsCount; sim++) {
      let equity = initialCapital;
      let peak = initialCapital;
      let pathMaxDrawdownAmount = 0;
      let pathMaxDrawdownPct = 0;

      for (let t = 0; t < tradesPerPath; t++) {
        // Random bootstrap selection from return pool
        const randomIndex = Math.floor(Math.random() * returnsPool.length);
        const returnPct = returnsPool[randomIndex];

        equity += equity * (returnPct / 100);

        if (equity > peak) {
          peak = equity;
        }

        const ddAmount = peak - equity;
        const ddPct = (ddAmount / peak) * 100;
        if (ddPct > pathMaxDrawdownPct) {
          pathMaxDrawdownPct = ddPct;
          pathMaxDrawdownAmount = ddAmount;
        }

        // Ruin check: Drawdown > 50%
        if (ddPct >= ruinThresholdPct) {
          ruinCount++;
          break;
        }
      }

      finalCapitals.push(equity);
      maxDrawdowns.push(pathMaxDrawdownPct);
    }

    // Sort final capitals and drawdowns for percentile calculations
    finalCapitals.sort((a, b) => a - b);
    maxDrawdowns.sort((a, b) => a - b);

    const medianCap = finalCapitals[Math.floor(simulationsCount * 0.50)];
    const cap5th = finalCapitals[Math.floor(simulationsCount * 0.05)];
    const cap95th = finalCapitals[Math.floor(simulationsCount * 0.95)];

    const medianDD = maxDrawdowns[Math.floor(simulationsCount * 0.50)];
    const worstDD = maxDrawdowns[Math.floor(simulationsCount * 0.95)]; // 95th percentile worst drawdown

    const probabilityOfRuinPct = Number(((ruinCount / simulationsCount) * 100).toFixed(2));
    const expectedCagrPct = Number((((medianCap / initialCapital) - 1) * 100).toFixed(2));
    const worstCaseCagrPct = Number((((cap5th / initialCapital) - 1) * 100).toFixed(2));
    const bestCaseCagrPct = Number((((cap95th / initialCapital) - 1) * 100).toFixed(2));

    return {
      symbol,
      totalSimulationsCount: simulationsCount,
      tradeSequenceLength: tradesPerPath,
      initialCapital,
      probabilityOfRuinPct,
      expectedCagrPct,
      worstCaseCagrPct,
      bestCaseCagrPct,
      medianDrawdownPct: Number(medianDD.toFixed(2)),
      worstDrawdownPct: Number(worstDD.toFixed(2)),
      medianFinalCapital: Number(medianCap.toFixed(2)),
      fifthPercentileCapital: Number(cap5th.toFixed(2)),
      ninetyFifthPercentileCapital: Number(cap95th.toFixed(2))
    };
  }
}

export const monteCarloEngine = new MonteCarloEngine();
