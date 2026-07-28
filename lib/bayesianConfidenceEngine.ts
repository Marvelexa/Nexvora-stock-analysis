/**
 * Production-Grade Bayesian Confidence Engine
 * Implements multi-source Bayesian Updating to calculate a statistically grounded Posterior Probability:
 * P(Win | E_Tech, E_Mem, E_Fund, E_Sent) = Prior * Likelihood_Tech * Likelihood_Mem * Likelihood_Fund
 */

export interface BayesianUpdatingReport {
  priorWinProbPct: number;
  likelihoodRatioTech: number;
  likelihoodRatioMemory: number;
  likelihoodRatioFundamental: number;
  posteriorWinProbPct: number;
  bayesianEdgePct: number;
  formulaDescription: string;
}

export class BayesianConfidenceEngine {

  /**
   * Calculate Posterior Win Probability by updating prior with multi-source evidence likelihoods
   */
  public calculatePosterior(
    priorWinProbPct: number = 50.0,
    techScore: number = 70,
    marketMemoryWinRatePct: number = 65,
    fundamentalScore: number = 60,
    newsSentimentScore: number = 65
  ): BayesianUpdatingReport {
    const prior = Math.min(0.90, Math.max(0.10, priorWinProbPct / 100));

    // Convert evidence scores to likelihood ratios P(E | Win) / P(E | Loss)
    const lrTech = Math.min(3.0, Math.max(0.33, techScore / (100 - techScore || 1)));
    const lrMem = Math.min(3.0, Math.max(0.33, marketMemoryWinRatePct / (100 - marketMemoryWinRatePct || 1)));
    const lrFund = Math.min(2.5, Math.max(0.40, fundamentalScore / (100 - fundamentalScore || 1)));

    // Combined Odds Updating
    const priorOdds = prior / (1 - prior);
    const posteriorOdds = priorOdds * lrTech * lrMem * lrFund;
    const posteriorP = posteriorOdds / (1 + posteriorOdds);

    const posteriorWinProbPct = Number((posteriorP * 100).toFixed(2));
    const edgePct = Number((posteriorWinProbPct - priorWinProbPct).toFixed(2));

    return {
      priorWinProbPct,
      likelihoodRatioTech: Number(lrTech.toFixed(3)),
      likelihoodRatioMemory: Number(lrMem.toFixed(3)),
      likelihoodRatioFundamental: Number(lrFund.toFixed(3)),
      posteriorWinProbPct,
      bayesianEdgePct: edgePct,
      formulaDescription: "Bayesian Posterior: P(Win|Evidence) = Prior * LR_Tech * LR_Mem * LR_Fund"
    };
  }
}

export const bayesianConfidenceEngine = new BayesianConfidenceEngine();
