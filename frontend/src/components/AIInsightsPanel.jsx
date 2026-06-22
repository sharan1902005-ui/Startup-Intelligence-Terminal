import { Brain, CheckCircle2 } from "lucide-react";
import DashboardCard from "./DashboardCard";

export default function AIInsightsPanel({ insights, outcome }) {
  return (
    <DashboardCard className="p-5" delay={0.12}>
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-[#f0a448]" />
        <h2 className="text-lg font-semibold text-[#f1f3f8]">AI Analysis</h2>
      </div>
      <div className="mt-4 space-y-3">
        {insights.map((insight) => (
          <div key={insight} className="flex gap-3 rounded-lg border-[0.5px] border-[#2c3447] bg-[#141927] p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#f0a448]" />
            <p className="text-sm leading-6 text-[#8089a3]">{insight}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-[#141927] p-3">
        <p className="text-xs uppercase tracking-wide text-[#8089a3]">Outcome</p>
        <p className="mt-1 text-lg font-semibold text-[#f1f3f8]">Likely {outcome}</p>
      </div>
    </DashboardCard>
  );
}
