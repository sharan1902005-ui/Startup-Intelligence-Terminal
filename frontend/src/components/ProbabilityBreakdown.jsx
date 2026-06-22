import DashboardCard from "./DashboardCard";

const rows = [
  { key: "Growing", color: "#22c55e" },
  { key: "Acquired", color: "#60a5fa" },
  { key: "Shutdown", color: "#f87171" },
];

export default function ProbabilityBreakdown({ probabilities }) {
  if (!probabilities) return null;

  return (
    <DashboardCard className="p-5" delay={0.08}>
      <h2 className="text-lg font-semibold text-[#f1f3f8]">Outcome Probability</h2>
      <div className="mt-5 space-y-4">
        {rows.map((row) => {
          const value = probabilities[row.key] ?? 0;
          return (
            <div key={row.key}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-[#8089a3]">{row.key}</span>
                <span className="font-mono-vitals text-sm text-[#f1f3f8]">{value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#141927]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${value}%`, backgroundColor: row.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </DashboardCard>
  );
}
