import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import AIInsightsPanel from "../components/AIInsightsPanel";
import FundingForm, { SAMPLE_STARTUPS } from "../components/FundingForm";
import MetricsStrip from "../components/MetricsStrip";
import ModelSignals from "../components/ModelSignals";
import PredictionCard from "../components/PredictionCard";
import ProbabilityBreakdown from "../components/ProbabilityBreakdown";
import ReportButton from "../components/ReportButton";
import SimilarStartupCard from "../components/SimilarStartupCard";
import TimelineChart from "../components/TimelineChart";
import { predictStartup } from "../services/api";

const PLACEHOLDER_SIMILAR = [
  {
    name: "Dropbox",
    similarity: 92.4,
    description: "File collaboration platform with fast early funding acceleration.",
  },
  {
    name: "Slack",
    similarity: 89.1,
    description: "B2B workflow company with strong follow-on round cadence.",
  },
  {
    name: "Canva",
    similarity: 86.7,
    description: "Design platform with durable capital efficiency signals.",
  },
];

const ROUND_LABELS = ["Seed", "Series A", "Series B", "Series C", "Series D", "Grant", "Angel", "Debt"];
const NEXT_STAGE = ["Series A", "Series B", "Series C", "Series D", "Series E", "Seed Extension", "Series A", "Debt Extension"];
const BASE_RATES = {
  0: 42,
  1: 58,
  2: 68,
  3: 74,
  4: 78,
  5: 35,
  6: 38,
  7: 31,
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function normalizePredictionResponse(result) {
  const rawConfidence = Number(result?.confidence ?? 0);
  const confidence = rawConfidence <= 1 ? rawConfidence * 100 : rawConfidence;

  return {
    ...result,
    confidence: Number(confidence.toFixed(2)),
    similar_startups: result?.similar_startups || result?.similarStartups || [],
  };
}

export default function Home({ initialSample = null }) {
  const [rounds, setRounds] = useState(SAMPLE_STARTUPS.Airbnb.map((round) => ({ ...round })));
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const similarStartups = prediction?.similar_startups?.length ? prediction.similar_startups : rounds.length ? PLACEHOLDER_SIMILAR : [];

  const metrics = useMemo(() => {
    const totalFunding = rounds.reduce((sum, round) => sum + Number(round.amount || 0), 0);
    const totalDays = rounds.reduce((sum, round) => sum + Number(round.days_since_last_round || 0), 0);
    const dailyVelocity = totalFunding / Math.max(totalDays, 1);
    const velocity = dailyVelocity > 100000 ? "High" : dailyVelocity > 20000 ? "Medium" : "Early";

    return {
      totalFunding,
      totalFundingLabel: currencyFormatter.format(totalFunding),
      roundCount: rounds.length,
      velocity,
      dailyVelocity,
      avgGap: totalDays / Math.max(rounds.length - 1, 1),
      avgGapLabel: `${Math.round(totalDays / Math.max(rounds.length - 1, 1))} Days`,
    };
  }, [rounds]);

  const vitals = useMemo(() => {
    const latestRound = rounds[rounds.length - 1];
    const latestRoundType = Number(latestRound?.round_type || 0);
    const baselineRate = BASE_RATES[latestRoundType] ?? 45;
    const baseline = `vs ${baselineRate}% base rate for ${ROUND_LABELS[latestRoundType] || "this stage"} startups`;

    const amounts = rounds.map((round) => Number(round.amount || 0));
    const gaps = rounds.slice(1).map((round) => Number(round.days_since_last_round || 0));
    const avgGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
    const firstAmount = amounts[0] || 0;
    const lastAmount = amounts[amounts.length - 1] || 0;
    const growthMultiple = firstAmount > 0 ? lastAmount / firstAmount : 0;

    let explanation = "Funding velocity + round timing";
    if (rounds.length >= 3 && avgGap > 0 && avgGap <= 260 && growthMultiple >= 5) {
      explanation = "Rapid round timing with strong funding growth";
    } else if (avgGap >= 420) {
      explanation = "Long funding gaps raise shutdown risk";
    } else if (growthMultiple < 1.5 && rounds.length >= 2) {
      explanation = "Follow-on funding is relatively flat";
    } else if (metrics.totalFunding > 10000000) {
      explanation = "Large cumulative funding supports survival signal";
    }

    const confidence = Number(prediction?.confidence || 0);
    const survivalProbability = prediction
      ? prediction.prediction === "Shutdown"
        ? Math.max(0, 100 - confidence)
        : confidence
      : null;
    const probabilities = prediction ? buildProbabilities(prediction.prediction, confidence) : null;
    const nextFundingStage = NEXT_STAGE[latestRoundType] || `Round ${rounds.length + 1}`;

    return {
      baseline,
      explanation: prediction?.explanation || explanation,
      survivalProbability,
      riskScore: prediction ? Math.round(100 - (survivalProbability ?? 0)) : null,
      reasons: buildReasons(rounds, metrics, explanation),
      insights: buildInsights(rounds, metrics, explanation),
      positiveSignals: buildPositiveSignals(rounds, metrics),
      riskSignals: buildRiskSignals(rounds, metrics),
      probabilities,
      nextFundingStage,
    };
  }, [metrics.totalFunding, prediction, rounds]);

  const projection = useMemo(() => buildProjection(rounds, vitals.survivalProbability), [rounds, vitals.survivalProbability]);

  const loadSample = (name) => {
    setRounds(SAMPLE_STARTUPS[name].map((round) => ({ ...round })));
    setPrediction(null);
    setError("");
  };

  useEffect(() => {
    if (initialSample && SAMPLE_STARTUPS[initialSample]) {
      loadSample(initialSample);
    }
  }, [initialSample]);

  const handlePredict = async () => {
    const sanitizedRounds = rounds.map((round, index) => ({
      amount: Number(round.amount),
      days_since_last_round: Number(round.days_since_last_round || 0),
      round_number: index + 1,
      round_type: Number(round.round_type || 0),
    }));

    if (!sanitizedRounds.length) {
      toast.error("Add at least one funding round.");
      setError("Add at least one funding round.");
      setPrediction(null);
      return;
    }

    if (sanitizedRounds.some((round) => !Number.isFinite(round.amount) || round.amount <= 0)) {
      toast.error("Add a funding amount for every round.");
      setError("Add a funding amount for every round.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      console.log("[Home] predict payload", { rounds: sanitizedRounds });
      const result = await predictStartup({ rounds: sanitizedRounds });
      const normalizedResult = normalizePredictionResponse(result);
      console.log("[Home] predict result", normalizedResult);
      setPrediction(normalizedResult);
      toast.success("Prediction Ready");
    } catch (error) {
      const message = error?.response?.data?.detail || error?.message || "Prediction failed. Check that the backend is running.";
      setError(message);
      toast.error("Prediction Failed");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#161b29] text-[#f1f3f8]">
      <div className="border-b-[0.5px] border-[#2c3447] bg-[#141927]/80 px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-[#8089a3]">Startup Intelligence Terminal</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#f1f3f8]">Will It Survive?</h1>
          </div>
          <p className="text-sm text-[#8089a3]">Funding trajectory analysis · LSTM prediction · Similarity search</p>
        </div>
      </div>

      <div id="analysis-dashboard" className="mx-auto grid w-full max-w-7xl gap-5 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <FundingForm rounds={rounds} setRounds={setRounds} onPredict={handlePredict} loading={loading} onLoadSample={loadSample} />
          {error ? (
            <div className="rounded-lg border-[0.5px] border-red-400/40 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
          <MetricsStrip metrics={metrics} />
          <TimelineChart rounds={rounds} projection={projection} />
        </div>

        <div className="space-y-5">
          <PredictionCard prediction={prediction} metrics={metrics} vitals={vitals} projection={projection} />
          {prediction ? (
            <>
              <ProbabilityBreakdown probabilities={vitals.probabilities} />
              <AIInsightsPanel insights={vitals.insights} outcome={prediction.prediction} />
              <ModelSignals positiveSignals={vitals.positiveSignals} riskSignals={vitals.riskSignals} />
              <ReportButton prediction={prediction} metrics={metrics} vitals={vitals} similarStartups={similarStartups} />
            </>
          ) : null}

          <section className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[#f1f3f8]">Most Similar Historical Companies</h2>
              <p className="mt-1 text-sm text-[#8089a3]">Nearest neighbors from learned startup embeddings.</p>
            </div>

            {similarStartups.length ? (
              <div className="grid gap-3">
                {similarStartups.map((startup) => (
                  <SimilarStartupCard key={startup.name} startup={startup} />
                ))}
              </div>
            ) : (
              <div className="rounded-lg border-[0.5px] border-dashed border-[#2c3447] p-6 text-center text-sm text-[#8089a3]">
                Similar companies will appear after the model generates a forecast.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function buildProbabilities(outcome, confidence) {
  const primary = Math.round(confidence);
  const remainder = Math.max(0, 100 - primary);
  const probabilities = {
    Growing: Math.round(remainder * 0.55),
    Acquired: Math.round(remainder * 0.3),
    Shutdown: Math.round(remainder * 0.15),
  };
  probabilities[outcome] = primary;

  const drift = 100 - Object.values(probabilities).reduce((sum, value) => sum + value, 0);
  probabilities.Growing += drift;
  return probabilities;
}

function buildReasons(rounds, metrics, fallback) {
  const amounts = rounds.map((round) => Number(round.amount || 0));
  const gaps = rounds.slice(1).map((round) => Number(round.days_since_last_round || 0));
  const avgGap = gaps.length ? gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length : 0;
  const first = amounts[0] || 0;
  const last = amounts[amounts.length - 1] || 0;
  const growthMultiple = first > 0 ? last / first : 0;
  const reasons = [];

  if (metrics.totalFunding > 10000000) reasons.push("Large cumulative capital base");
  if (avgGap > 0 && avgGap <= 260) reasons.push("Rapid round timing");
  if (growthMultiple >= 5) reasons.push("Strong follow-on funding growth");
  if (avgGap >= 420) reasons.push("Extended gap between financing events");
  if (metrics.dailyVelocity > 100000) reasons.push("High funding velocity");

  return reasons.length ? reasons.slice(0, 3) : [fallback];
}

function buildInsights(rounds, metrics, fallback) {
  const amounts = rounds.map((round) => Number(round.amount || 0));
  const first = amounts[0] || 1;
  const last = amounts[amounts.length - 1] || first;
  const multiple = Math.max(1, last / first);
  const cadence = metrics.avgGap <= 260 ? "stronger than average" : "slower than top-quartile startups";

  return [
    `Funding increased ${multiple.toFixed(1)}x over ${rounds.length} rounds`,
    `Funding cadence is ${cadence}`,
    metrics.dailyVelocity > 100000 ? "Capital acceleration remains positive" : "Capital velocity remains moderate",
    fallback || "Round timing resembles successful startups",
  ];
}

function buildPositiveSignals(rounds, metrics) {
  const signals = ["Funding Velocity"];
  if (rounds.length >= 3) signals.push("Consistent Funding Cadence");
  if (metrics.totalFunding > 10000000) signals.push("Cumulative Capital");
  signals.push("Round Growth Rate");
  return signals;
}

function buildRiskSignals(rounds, metrics) {
  const signals = [];
  if (metrics.avgGap > 420) signals.push("Long Gaps Between Rounds");
  if (metrics.totalFunding < 1000000) signals.push("Limited Capital Base");
  if (rounds.length < 3) signals.push("Short Funding History");
  return signals.length ? signals : ["Market And Execution Risk"];
}

function buildProjection(rounds, survivalProbability) {
  const totalFunding = rounds.reduce((sum, round) => sum + Number(round.amount || 0), 0);
  const confidence = survivalProbability ?? 50;
  const multiplier = confidence >= 80 ? 1.34 : confidence >= 60 ? 1.18 : 0.92;
  const base = totalFunding || 500000;

  return [
    { label: "Now", value: base },
    { label: "+6m", value: base * multiplier },
    { label: "+12m", value: base * multiplier * (confidence >= 70 ? 1.22 : 1.02) },
    { label: "+18m", value: base * multiplier * (confidence >= 70 ? 1.48 : 0.94) },
  ];
}
