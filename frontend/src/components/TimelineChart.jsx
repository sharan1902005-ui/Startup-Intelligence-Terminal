import { useState } from "react";
import { motion } from "framer-motion";

const ROUND_LABELS = ["Seed", "A", "B", "C", "D", "Grant", "Angel", "Debt"];
const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

export default function TimelineChart({ rounds, projection }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const width = 760;
  const height = 260;
  const paddingX = 42;
  const chartEndX = projection?.length ? width - 250 : width - paddingX;
  const maxAmount = Math.max(...rounds.map((round) => Number(round.amount || 0)), 1);
  const step = rounds.length > 1 ? (chartEndX - paddingX) / (rounds.length - 1) : 0;

  const points = rounds.map((round, index) => {
    const amount = Number(round.amount || 0);
    const previousAmount = index > 0 ? Number(rounds[index - 1].amount || 0) : 0;
    const growth = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;
    const x = rounds.length > 1 ? paddingX + index * step : width / 2;
    const y = height - 54 - (amount / maxAmount) * 154;
    return { x, y, amount, growth, round };
  });

  const polyline = points
    .flatMap((point, index) => {
      if (index === 0) return [`${point.x},${height - 54}`, `${point.x},${point.y}`];
      return [`${point.x - step * 0.35},${height - 54}`, `${point.x},${point.y}`];
    })
    .join(" ");

  const active = activeIndex !== null ? points[activeIndex] : null;
  const projectionStart = points[points.length - 1];
  const futurePoints = projectionStart && projection?.length
    ? projection.slice(1).map((point, index) => ({
        x: projectionStart.x + (index + 1) * 72,
        y: Math.max(30, projectionStart.y - (index + 1) * 18),
        label: point.label,
        value: point.value,
      }))
    : [];
  const futureLine = projectionStart
    ? [projectionStart, ...futurePoints].map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
    : "";

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-[0.5px] border-[#2c3447] bg-[#1d2436] p-5"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#f1f3f8]">Funding pulse</h2>
          <p className="mt-1 text-sm text-[#8089a3]">Round labels, growth jumps, and capital cadence.</p>
        </div>
      </div>

      <div className="relative rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-80 w-full" role="img" aria-label="Interactive funding pulse chart">
          <line x1="24" y1={height - 54} x2={width - 20} y2={height - 54} stroke="#2c3447" strokeWidth="0.5" />
          <polyline fill="none" stroke="#f0a448" strokeLinecap="round" strokeLinejoin="miter" strokeWidth="2" points={polyline} />
          {futureLine ? <path d={futureLine} fill="none" stroke="#f0a448" strokeDasharray="7 7" strokeLinecap="round" strokeWidth="2" opacity="0.7" /> : null}
          {points.map((point, index) => (
            <g key={`${point.round.round_number}-${index}`} onMouseEnter={() => setActiveIndex(index)} onMouseLeave={() => setActiveIndex(null)}>
              <circle cx={point.x} cy={point.y} r={activeIndex === index ? 6 : 4} fill="#f0a448" />
              <text x={point.x} y={height - 25} fill="#8089a3" fontFamily="JetBrains Mono, monospace" fontSize="10" textAnchor="middle">
                {ROUND_LABELS[Number(point.round.round_type)] || `R${point.round.round_number}`}
              </text>
              <text x={point.x} y={height - 8} fill={point.growth >= 0 ? "#f0a448" : "#fca5a5"} fontFamily="JetBrains Mono, monospace" fontSize="9" textAnchor="middle">
                {index === 0 ? "base" : `${point.growth >= 0 ? "+" : ""}${Math.round(point.growth)}%`}
              </text>
            </g>
          ))}
          {futurePoints.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="3" fill="#161b29" stroke="#f0a448" strokeWidth="2" />
              <text x={point.x} y={height - 25} fill="#8089a3" fontFamily="JetBrains Mono, monospace" fontSize="10" textAnchor="middle">
                {point.label}
              </text>
            </g>
          ))}
        </svg>

        {active ? (
          <div
            className="pointer-events-none absolute rounded-lg border-[0.5px] border-[#2c3447] bg-[#1d2436] p-3 shadow-2xl"
            style={{
              left: `${Math.min(72, Math.max(8, (active.x / width) * 100))}%`,
              top: `${Math.max(8, (active.y / height) * 100 - 6)}%`,
            }}
          >
            <p className="font-mono-vitals text-sm text-[#f1f3f8]">{currency.format(active.amount)}</p>
            <p className="mt-1 text-xs text-[#8089a3]">
              Round {active.round.round_number} · {ROUND_LABELS[Number(active.round.round_type)]}
            </p>
            <p className="font-mono-vitals mt-1 text-xs text-[#f0a448]">
              {active.round.days_since_last_round} days since last · {active.growth >= 0 ? "+" : ""}
              {Math.round(active.growth)}%
            </p>
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}
