import { motion } from "framer-motion";
import { AlertTriangle, Gauge, Layers, LineChart, TrendingUp } from "lucide-react";

const outcomeStyles = {
  Shutdown: "text-red-300 bg-red-500/10 border-red-500/30",
  Acquired: "text-[#f0a448] bg-[#f0a448]/10 border-[#f0a448]/40",
  Growing: "text-[#f0a448] bg-[#f0a448]/10 border-[#f0a448]/40",
};

export default function PredictionCard({ prediction, metrics, vitals, projection }) {
  if (!prediction) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border-[0.5px] border-dashed border-[#2c3447] bg-[#1d2436] p-6"
      >
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <svg width="170" height="120" viewBox="0 0 170 120" aria-hidden="true">
            <rect x="18" y="20" width="134" height="76" rx="10" fill="#141927" stroke="#2c3447" strokeWidth="0.5" />
            <path d="M30 66 L48 66 L56 45 L70 84 L84 52 L96 66 L118 66 L126 42 L140 66" fill="none" stroke="#f0a448" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="134" cy="34" r="7" fill="#f0a448" opacity="0.9" />
          </svg>
          <h2 className="mt-3 text-2xl font-semibold text-[#f1f3f8]">Awaiting investment vitals</h2>
          <p className="mt-2 text-sm leading-6 text-[#8089a3]">
            Enter funding rounds or load a sample startup to generate outcome probability, risk, comparable companies, and trajectory projection.
          </p>
        </div>
      </motion.section>
    );
  }

  const style = outcomeStyles[prediction.prediction] || outcomeStyles.Growing;
  const confidence = Number(prediction.confidence || 0);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] p-5"
    >
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className={`rounded-xl border-[0.5px] p-5 ${style}`}>
          <p className="text-sm uppercase tracking-wide opacity-80">Predicted Outcome</p>
          <h2 className="mt-2 text-4xl font-semibold">{prediction.prediction}</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Score label="Confidence" value={`${confidence}%`} />
            <Score label="Risk" value={`${vitals?.riskScore ?? 0}%`} icon={AlertTriangle} />
            <Score label="Health" value={`${Math.round(vitals?.survivalProbability ?? confidence)}`} />
            <Score label="Next Stage" value={vitals?.nextFundingStage || "Series A"} compact />
          </div>
        </div>

        <div className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-5">
          <ConfidenceGauge value={confidence} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric icon={TrendingUp} label="Total Funding" value={metrics.totalFundingLabel} />
        <Metric icon={Layers} label="Funding Rounds" value={metrics.roundCount} />
        <Metric icon={Gauge} label="Funding Velocity" value={metrics.velocity} />
      </div>

      <div className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-4">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-[#f0a448]" />
          <h3 className="text-base font-semibold text-[#f1f3f8]">AI explanation</h3>
        </div>
        <p className="mt-3 text-sm font-medium text-[#f1f3f8]">{vitals?.explanation}</p>
        <div className="mt-3 grid gap-2">
          {vitals?.reasons?.map((reason) => (
            <div key={reason} className="rounded-lg border-[0.5px] border-[#2c3447] bg-[#1d2436] px-3 py-2 text-sm text-[#8089a3]">
              {reason}
            </div>
          ))}
        </div>
        <p className="font-mono-vitals mt-3 text-xs text-[#f0a448]">{vitals?.baseline}</p>
      </div>

      <ProjectionChart projection={projection} />
    </motion.section>
  );
}

function ConfidenceGauge({ value }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-5">
      <div className="relative h-28 w-28 shrink-0">
        <svg className="-rotate-90" width="112" height="112" viewBox="0 0 112 112">
          <circle cx="56" cy="56" r={radius} fill="none" stroke="#2c3447" strokeWidth="8" />
          <circle
            cx="56"
            cy="56"
            r={radius}
            fill="none"
            stroke="#f0a448"
            strokeLinecap="round"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono-vitals text-2xl font-semibold text-[#f1f3f8]">{Math.round(value)}%</span>
          <span className="text-[10px] uppercase tracking-wide text-[#8089a3]">confidence</span>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-[#f1f3f8]">Signal strength</h3>
        <p className="mt-2 text-sm leading-6 text-[#8089a3]">Composite probability from funding size, round cadence, velocity, and learned historical trajectory embeddings.</p>
      </div>
    </div>
  );
}

function ProjectionChart({ projection }) {
  const width = 360;
  const height = 150;
  const max = Math.max(...projection.map((point) => point.value), 1);
  const points = projection.map((point, index) => {
    const x = 26 + index * ((width - 52) / (projection.length - 1));
    const y = height - 28 - (point.value / max) * 92;
    return { ...point, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#141927] p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#f1f3f8]">Historical trajectory projection</h3>
        <span className="font-mono-vitals text-xs text-[#f0a448]">18m outlook</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-40 w-full">
        <path d={path} fill="none" stroke="#f0a448" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4" fill="#f0a448" />
            <text x={point.x} y={height - 8} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#8089a3">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Score({ label, value, icon: Icon, compact = false }) {
  return (
    <div className="rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] p-3">
      <div className="flex items-center gap-1 text-xs text-[#8089a3]">
        {Icon ? <Icon className="h-3 w-3" /> : null}
        {label}
      </div>
      <p className={`font-mono-vitals mt-2 font-semibold text-[#f1f3f8] ${compact ? "text-sm" : "text-xl"}`}>{value}</p>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] p-4">
      <div className="flex items-center gap-2 text-[#8089a3]">
        <Icon className="h-4 w-4 text-[#f0a448]" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="font-mono-vitals mt-3 text-2xl font-semibold text-[#f1f3f8]">{value}</p>
    </div>
  );
}
